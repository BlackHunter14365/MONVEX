"""
Google Authentication & Identity Resolution Service
Enterprise-grade Google Identity Services verification and account lifecycle management for MONVEX.
"""
import logging
import uuid
import re
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from apps.authentication.models import GoogleIdentity, Profile
from services.user_init_service import UserInitService

logger = logging.getLogger(__name__)

class GoogleAuthError(Exception):
    def __init__(self, message: str, code: str = 'INVALID_GOOGLE_CREDENTIAL'):
        super().__init__(message)
        self.message = message
        self.code = code

class GoogleAuthService:

    @classmethod
    def verify_google_token(cls, credential_token: str) -> dict:
        """
        Cryptographically verifies Google ID Token using official Google public keys.
        Extracts verified claims (sub, email, name, picture, email_verified).
        """
        if not credential_token or not isinstance(credential_token, str):
            raise GoogleAuthError("Google credential token is missing or malformed.", code="MISSING_CREDENTIAL")

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)

        try:
            # Verify OAuth2 ID Token using Google Auth library
            # If client_id is set, validates audience; otherwise validates signature
            id_info = id_token.verify_oauth2_token(
                credential_token,
                google_requests.Request(),
                audience=client_id if client_id else None
            )

            # Enforce verified issuer
            issuer = id_info.get('iss', '')
            if issuer not in ['accounts.google.com', 'https://accounts.google.com']:
                raise GoogleAuthError("Invalid token issuer.", code="INVALID_ISSUER")

            sub = id_info.get('sub')
            email = id_info.get('email', '').strip().lower()
            email_verified = id_info.get('email_verified', False)

            if not sub:
                raise GoogleAuthError("Google token missing required subject ID.", code="MISSING_SUBJECT")

            if not email:
                raise GoogleAuthError("Google token missing email address.", code="MISSING_EMAIL")

            return {
                'sub': str(sub),
                'email': email,
                'email_verified': bool(email_verified),
                'name': (id_info.get('name') or '').strip(),
                'given_name': (id_info.get('given_name') or '').strip(),
                'family_name': (id_info.get('family_name') or '').strip(),
                'picture': (id_info.get('picture') or '').strip(),
            }

        except ValueError as ve:
            logger.warning(f"Google ID token verification failed: {ve}")
            raise GoogleAuthError(f"Invalid Google credential: {str(ve)}", code="INVALID_TOKEN")
        except Exception as e:
            if isinstance(e, GoogleAuthError):
                raise
            logger.error(f"Unexpected error during Google token verification: {e}")
            raise GoogleAuthError("Failed to verify Google identity credential.", code="VERIFICATION_FAILED")

    @classmethod
    def generate_unique_username(cls, email: str, name: str = '') -> str:
        """
        Generates a clean, unique alphanumeric username based on email/name.
        """
        base = email.split('@')[0].strip().lower()
        clean = re.sub(r'[^a-zA-Z0-9_]', '_', base)
        if not clean or len(clean) < 3:
            clean = f"user_{clean}"

        candidate = clean[:25]
        if not User.objects.filter(username__iexact=candidate).exists():
            return candidate

        for _ in range(10):
            suffix = str(uuid.uuid4().hex[:4])
            candidate = f"{clean[:20]}_{suffix}"
            if not User.objects.filter(username__iexact=candidate).exists():
                return candidate

        return f"user_{uuid.uuid4().hex[:8]}"

    @classmethod
    def resolve_or_create_user(cls, claims: dict, request_context: dict = None) -> dict:
        """
        Authoritative identity resolution:
        1. If GoogleIdentity exists -> Authenticate existing user.
        2. If User with email exists but no GoogleIdentity -> Return ACCOUNT_LINKING_REQUIRED.
        3. If no user exists -> Create new user with clean financial categories.
        """
        sub = str(claims.get('sub', '')).strip()
        email = str(claims.get('email', '')).strip().lower()
        given_name = str(claims.get('given_name') or '').strip()
        family_name = str(claims.get('family_name') or '').strip()
        picture = str(claims.get('picture') or '').strip()
        name = str(claims.get('name') or '').strip()

        if not given_name and name:
            parts = name.split(' ', 1)
            given_name = parts[0]
            if len(parts) > 1 and not family_name:
                family_name = parts[1]

        # -------------------------------------------------------------
        # BRANCH 1: Existing Google Identity
        # -------------------------------------------------------------
        existing_identity = GoogleIdentity.objects.filter(
            provider='google',
            provider_subject=sub
        ).select_related('user').first()

        if existing_identity:
            user = existing_identity.user

            if not user.is_active:
                raise GoogleAuthError("This MONVEX account has been disabled.", code="ACCOUNT_DISABLED")

            # Update identity telemetry
            existing_identity.last_login_at = timezone.now()
            if picture and existing_identity.picture_url != picture:
                existing_identity.picture_url = picture
                existing_identity.save(update_fields=['last_login_at', 'picture_url', 'updated_at'])
            else:
                existing_identity.save(update_fields=['last_login_at', 'updated_at'])

            # Sync avatar with profile if not already set
            try:
                profile = getattr(user, 'profile', None)
                if profile and picture and not profile.avatar_url:
                    profile.avatar_url = picture
                    profile.save(update_fields=['avatar_url', 'updated_at'])
            except Exception:
                pass

            refresh = RefreshToken.for_user(user)
            return {
                "success": True,
                "action": "LOGIN",
                "is_new_user": False,
                "user": user,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }

        # -------------------------------------------------------------
        # BRANCH 2: Existing Password User with Same Email -> Link Flow
        # -------------------------------------------------------------
        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user:
            return {
                "success": False,
                "code": "ACCOUNT_LINKING_REQUIRED",
                "message": (
                    "An existing MONVEX account with this email address already exists. "
                    "Please verify your password to securely link your Google account."
                ),
                "email": email,
                "provider": "google",
                "provider_subject": sub,
            }

        # -------------------------------------------------------------
        # BRANCH 3: New User Registration
        # -------------------------------------------------------------
        with transaction.atomic():
            username = cls.generate_unique_username(email=email, name=name)
            user = User.objects.create(
                username=username,
                email=email,
                first_name=given_name,
                last_name=family_name,
                is_active=True
            )
            user.set_unusable_password()
            user.save()

            # Ensure verified active profile
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.email_verified = True
            profile.is_verified = True
            profile.status = 'ACTIVE'
            if picture and not profile.avatar_url:
                profile.avatar_url = picture
            profile.save()

            # Bind Google Identity
            GoogleIdentity.objects.create(
                user=user,
                provider='google',
                provider_subject=sub,
                email=email,
                given_name=given_name,
                family_name=family_name,
                picture_url=picture,
                last_login_at=timezone.now()
            )

            # Initialize fresh financial profile (categories only, NO fake transactions/budgets)
            UserInitService.initialize_fresh_user_account(user)

        refresh = RefreshToken.for_user(user)
        return {
            "success": True,
            "action": "REGISTER",
            "is_new_user": True,
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    @classmethod
    def link_google_account(cls, claims: dict, password: str, request_context: dict = None) -> dict:
        """
        Securely links a verified Google Identity to an existing password account
        after strict password credential verification.
        """
        sub = claims['sub']
        email = claims['email']

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise GoogleAuthError("No MONVEX account associated with this email address.", code="USER_NOT_FOUND")

        if not user.is_active:
            raise GoogleAuthError("This account is currently disabled.", code="ACCOUNT_DISABLED")

        if not user.check_password(password):
            raise GoogleAuthError("Incorrect password for existing MONVEX account.", code="INVALID_PASSWORD")

        with transaction.atomic():
            identity, created = GoogleIdentity.objects.get_or_create(
                provider='google',
                provider_subject=sub,
                defaults={
                    'user': user,
                    'email': email,
                    'given_name': claims.get('given_name', ''),
                    'family_name': claims.get('family_name', ''),
                    'picture_url': claims.get('picture', ''),
                    'last_login_at': timezone.now()
                }
            )

            if not created and identity.user != user:
                raise GoogleAuthError("This Google account is already linked to a different MONVEX account.", code="CONFLICT")

            identity.last_login_at = timezone.now()
            identity.save(update_fields=['last_login_at', 'updated_at'])

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.email_verified = True
            profile.is_verified = True
            profile.status = 'ACTIVE'
            profile.save()

        refresh = RefreshToken.for_user(user)
        return {
            "success": True,
            "action": "LINKED_AND_LOGGED_IN",
            "is_new_user": False,
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
