"""
MONVEX Verification Service
Authoritative business logic for OTP session lifecycle, rate limiting, attempt throttling,
request correlation tracking, and atomic account activation.
"""
import os
import secrets
import hashlib
import logging
from datetime import timedelta
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import VerificationSession, Profile
from apps.authentication.serializers import UserSerializer
from services.providers import get_verification_provider
from services.providers.base import ProviderError, ProviderUnavailableError
from services.user_init_service import UserInitService

logger = logging.getLogger('monvex.security.verification')

class VerificationService:

    EXPIRY_SECONDS = int(os.getenv('OTP_EXPIRY_SECONDS', 600))
    COOLDOWN_SECONDS = int(os.getenv('OTP_RESEND_COOLDOWN_SECONDS', 60))
    MAX_ATTEMPTS = int(os.getenv('OTP_MAX_ATTEMPTS', 5))
    MAX_RESENDS = int(os.getenv('OTP_MAX_RESENDS', 5))

    @staticmethod
    def mask_email(email: str) -> str:
        if not email or '@' not in email:
            return ""
        user_part, domain = email.strip().lower().split('@', 1)
        if len(user_part) <= 2:
            masked_user = user_part[0] + "***"
        else:
            masked_user = user_part[:2] + "***" + user_part[-1]
        return f"{masked_user}@{domain}"

    @staticmethod
    def hash_value(value: Optional[str]) -> str:
        if not value:
            return ""
        return hashlib.sha256(value.strip().encode('utf-8')).hexdigest()

    @classmethod
    def start_email_verification(
        cls,
        user: Optional[User],
        email: str,
        purpose: str = "EMAIL_SIGNUP",
        channel: str = "EMAIL",
        request_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        clean_email = email.strip().lower()
        context = request_context or {}
        req_id = f"otp_{secrets.token_hex(4)}"

        logger.info(f"[{req_id}] OTP_SEND_REQUESTED: destination={cls.mask_email(clean_email)} purpose={purpose}")

        # If user is already active and verified, reject duplicate verification session
        if user and getattr(user, 'profile', None) and user.profile.email_verified and user.profile.status == 'ACTIVE':
            logger.warning(f"[{req_id}] User {user.username} is already verified. Aborting.")
            return {
                "success": True,
                "code": "ALREADY_VERIFIED",
                "message": "This email account is already verified."
            }

        # Cancel previous pending sessions for this destination & purpose
        VerificationSession.objects.filter(
            destination__iexact=clean_email,
            purpose=purpose,
            status='PENDING'
        ).update(status='CANCELLED')

        provider = get_verification_provider()
        provider_identifier = getattr(settings, 'OTP_PROVIDER', os.getenv('OTP_PROVIDER', 'twilio')).lower()

        # Dispatch code via managed provider
        try:
            dispatch_result = provider.send_code(
                destination=clean_email,
                channel=channel.lower(),
                metadata={"purpose": purpose, "username": user.username if user else "", "request_id": req_id}
            )
        except ProviderError as pe:
            logger.error(f"[{req_id}] OTP_SEND_FAILED: Provider error ({pe.code}): {pe.message}")
            raise pe
        except Exception as e:
            logger.error(f"[{req_id}] OTP_SEND_FAILED: Unexpected provider failure: {e}")
            raise ProviderError(code="OTP_PROVIDER_ERROR", message=f"Verification provider error: {str(e)}")

        now = timezone.now()
        expires_at = now + timedelta(seconds=cls.EXPIRY_SECONDS)

        session = VerificationSession.objects.create(
            user=user,
            purpose=purpose,
            channel=channel.upper(),
            destination=clean_email,
            provider=provider_identifier,
            provider_verification_id=dispatch_result.get('provider_verification_id', ''),
            status='PENDING',
            attempt_count=0,
            resend_count=0,
            expires_at=expires_at,
            last_sent_at=now,
            ip_address_hash=cls.hash_value(context.get('ip')),
            user_agent_hash=cls.hash_value(context.get('user_agent')),
            metadata={"source": "api_registration", "request_id": req_id}
        )

        logger.info(f"[{req_id}] OTP_SEND_SUCCESS: Created VerificationSession {session.id} (expires in {cls.EXPIRY_SECONDS}s)")

        return {
            "success": True,
            "message": "Verification code requested. Check your inbox.",
            "verification_id": str(session.id),
            "email_masked": cls.mask_email(clean_email),
            "expires_in": cls.EXPIRY_SECONDS,
            "resend_after": cls.COOLDOWN_SECONDS
        }

    @classmethod
    def check_email_verification(
        cls,
        verification_id: str,
        code: str,
        request_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        clean_code = str(code).strip()
        session = VerificationSession.objects.filter(id=verification_id).first()
        req_id = f"otp_chk_{secrets.token_hex(4)}"

        if not session:
            logger.warning(f"[{req_id}] Verification check failed: Session {verification_id} not found.")
            return {
                "success": False,
                "code": "VERIFICATION_NOT_FOUND",
                "message": "Verification session not found or has expired."
            }

        if session.status == 'VERIFIED':
            return {
                "success": True,
                "code": "ALREADY_VERIFIED",
                "message": "This email has already been verified."
            }

        if session.status == 'LOCKED' or session.attempt_count >= cls.MAX_ATTEMPTS:
            logger.warning(f"[{req_id}] Verification check rejected: Session {session.id} is LOCKED.")
            return {
                "success": False,
                "code": "TOO_MANY_ATTEMPTS",
                "message": "Maximum verification attempts exceeded. Please restart verification."
            }

        if session.is_expired():
            session.status = 'EXPIRED'
            session.save(update_fields=['status', 'updated_at'])
            logger.info(f"[{req_id}] Session {session.id} expired at {session.expires_at}.")
            return {
                "success": False,
                "code": "OTP_EXPIRED",
                "message": "The verification code has expired. Please request a new code."
            }

        provider = get_verification_provider()

        try:
            check_result = provider.check_code(
                destination=session.destination,
                code=clean_code,
                provider_verification_id=session.provider_verification_id
            )
        except ProviderError as pe:
            logger.error(f"[{req_id}] Provider error checking code for session {session.id}: {pe.code} {pe.message}")
            raise pe
        except Exception as e:
            logger.error(f"[{req_id}] Unexpected error during verification check: {e}")
            raise ProviderError(code="OTP_PROVIDER_ERROR", message="Verification service is temporarily unavailable. Please try again.")

        if check_result.get('approved', False):
            # Authoritative Success -> Atomic Account Activation
            with transaction.atomic():
                session.status = 'VERIFIED'
                session.verified_at = timezone.now()
                session.save(update_fields=['status', 'verified_at', 'updated_at'])

                user = session.user
                if user:
                    user.is_active = True
                    user.save(update_fields=['is_active'])

                    profile, _ = Profile.objects.get_or_create(user=user)
                    profile.status = 'ACTIVE'
                    profile.email_verified = True
                    profile.is_verified = True
                    profile.save(update_fields=['status', 'email_verified', 'is_verified', 'updated_at'])

                    # Seed isolated categories and starting transactions
                    UserInitService.initialize_fresh_user_account(user)

                    # Issue production JWT access & refresh tokens
                    refresh = RefreshToken.for_user(user)
                    user_data = UserSerializer(user).data

                    logger.info(f"[{req_id}] OTP_VERIFY_SUCCESS: Session {session.id} VERIFIED. User {user.username} activated.")

                    return {
                        "success": True,
                        "message": "Email verified successfully.",
                        "data": {
                            "access": str(refresh.access_token),
                            "refresh": str(refresh),
                            "user": user_data
                        }
                    }
                else:
                    return {
                        "success": True,
                        "message": "Verification code verified successfully."
                    }
        else:
            # Code rejected
            session.attempt_count += 1
            session.last_attempt_at = timezone.now()

            if session.attempt_count >= cls.MAX_ATTEMPTS:
                session.status = 'LOCKED'
                session.save(update_fields=['attempt_count', 'last_attempt_at', 'status', 'updated_at'])
                logger.warning(f"[{req_id}] OTP_VERIFY_FAILED: Session {session.id} LOCKED after {session.attempt_count} attempts.")
                return {
                    "success": False,
                    "code": "TOO_MANY_ATTEMPTS",
                    "message": "Maximum verification attempts reached. Session is now locked."
                }

            session.save(update_fields=['attempt_count', 'last_attempt_at', 'updated_at'])
            remaining = max(0, cls.MAX_ATTEMPTS - session.attempt_count)
            logger.info(f"[{req_id}] OTP_VERIFY_FAILED: Invalid code attempt ({session.attempt_count}/{cls.MAX_ATTEMPTS}) for session {session.id}")

            return {
                "success": False,
                "code": "INVALID_OTP",
                "message": "The code is incorrect. Please try again.",
                "attempts_remaining": remaining
            }

    @classmethod
    def resend_email_verification(
        cls,
        verification_id: str,
        request_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        session = VerificationSession.objects.filter(id=verification_id).first()
        req_id = f"otp_rsd_{secrets.token_hex(4)}"

        if not session:
            return {
                "success": False,
                "code": "VERIFICATION_NOT_FOUND",
                "message": "Verification session not found."
            }

        if session.status == 'VERIFIED':
            return {
                "success": True,
                "code": "ALREADY_VERIFIED",
                "message": "Email is already verified."
            }

        # Check Resend Cooldown
        seconds_left = session.seconds_until_resend(cls.COOLDOWN_SECONDS)
        if seconds_left > 0:
            logger.info(f"[{req_id}] Resend rejected: Cooldown active ({seconds_left}s remaining) for session {session.id}")
            return {
                "success": False,
                "code": "RESEND_COOLDOWN",
                "message": f"Please wait {seconds_left} seconds before requesting a new code.",
                "retry_after": seconds_left
            }

        # Check Resend Limits
        if session.resend_count >= cls.MAX_RESENDS:
            logger.warning(f"[{req_id}] Resend rejected: Limit ({cls.MAX_RESENDS}) reached for session {session.id}")
            return {
                "success": False,
                "code": "RESEND_LIMIT",
                "message": "Maximum resend attempts reached for this session."
            }

        provider = get_verification_provider()

        try:
            dispatch_result = provider.send_code(
                destination=session.destination,
                channel=session.channel.lower(),
                metadata={"purpose": session.purpose, "username": session.user.username if session.user else "", "request_id": req_id}
            )
        except ProviderError as pe:
            logger.error(f"[{req_id}] Resend provider error for session {session.id}: {pe.code} {pe.message}")
            raise pe
        except Exception as e:
            logger.error(f"[{req_id}] Unexpected error during resend: {e}")
            raise ProviderError(code="OTP_PROVIDER_ERROR", message=f"Verification provider error: {str(e)}")

        now = timezone.now()
        session.resend_count += 1
        session.last_sent_at = now
        session.expires_at = now + timedelta(seconds=cls.EXPIRY_SECONDS)
        session.status = 'PENDING'
        if dispatch_result.get('provider_verification_id'):
            session.provider_verification_id = dispatch_result['provider_verification_id']
        session.save(update_fields=['resend_count', 'last_sent_at', 'expires_at', 'status', 'provider_verification_id', 'updated_at'])

        logger.info(f"[{req_id}] OTP_SEND_SUCCESS: Resent code for session {session.id} (resend #{session.resend_count})")

        return {
            "success": True,
            "message": "A new verification code has been sent. Check your inbox.",
            "resend_after": cls.COOLDOWN_SECONDS
        }
