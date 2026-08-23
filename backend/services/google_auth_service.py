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
                'name': id_info.get('name', ''),
                'given_name': id_info.get('given_name', ''),
                'family_name': id_info.get('family_name', ''),
                'picture': id_info.get('picture', ''),
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
        sub = claims['sub']
        email = claims['email']
        given_name = claims.get('given_name', '')
        family_name = claims.get('family_name', '')
        picture = claims.get('picture', '')

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
            username = cls.generate_unique_username(email=email, name=claims.get('name', ''))
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
