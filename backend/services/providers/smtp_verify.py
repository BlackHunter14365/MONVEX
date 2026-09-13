"""
MONVEX SMTP Verification Provider
Provider adapter integrating MONVEX verification sessions with the SMTP transport engine.
Separates verification business logic from email message generation and delivery transport.
"""
import secrets
import hashlib
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from .base import VerificationProvider, ProviderError, ProviderUnavailableError
from services.email import EmailTemplateService, SmtpTransport

logger = logging.getLogger('monvex.security.smtp')


class SmtpVerifyProvider(VerificationProvider):
    """
    Verification provider for transactional SMTP email delivery.
    """

    def _hash_code(self, code: str) -> str:
        return hashlib.sha256(code.strip().encode('utf-8')).hexdigest()

    def send_code(
        self,
        destination: str,
        channel: str = "email",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        dest_clean = destination.strip().lower()
        meta = metadata or {}
        purpose = meta.get('purpose', 'REGISTRATION')
        username = meta.get('username', '').strip()
        request_id = meta.get('request_id', f"smtp_{secrets.token_hex(4)}")

        # Use pre-generated raw_otp and otp_hash if passed in metadata, else generate cryptographically
        raw_otp = meta.get('raw_otp')
        otp_hash = meta.get('otp_hash')

        if not raw_otp:
            # 6-digit cryptographically secure numeric code
            raw_otp = f"{secrets.randbelow(900000) + 100000}"
            otp_hash = self._hash_code(raw_otp)
        elif not otp_hash:
            otp_hash = self._hash_code(raw_otp)

        config = SmtpTransport.get_smtp_config()
        sender_email = config.get('from_email') or 'MONVEX <security@monvex.ai>'

        # Render template
        email_content = EmailTemplateService.render_otp_email(
            purpose=purpose,
            raw_otp=raw_otp,
            username=username,
            expiry_minutes=10,
            sender_email=sender_email,
        )

        # Dispatch via robust SMTP transport (with controlled transient retry and error classification)
        SmtpTransport.send_email(
            to_email=dest_clean,
            subject=email_content['subject'],
            body_text=email_content['plain_text'],
            body_html=email_content['html_content'],
            request_id=request_id,
            from_email=config.get('from_email'),
        )

        provider_vid = f"smtp_vid_{secrets.token_hex(8)}"

        return {
            "provider_verification_id": provider_vid,
            "otp_hash": otp_hash,
            "raw_otp": raw_otp,
            "status": "pending",
            "channel": "email",
            "destination": dest_clean,
            "provider": "smtp",
        }

    def check_code(
        self,
        destination: str,
        code: str,
        provider_verification_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Database-backed hash comparison is handled authoritatively by VerificationService.
        """
        submitted_hash = self._hash_code(code)
        return {
            "submitted_hash": submitted_hash,
            "provider_status": "check_delegated_to_database",
        }

    def cancel_verification(
        self,
        destination: str,
        provider_verification_id: Optional[str] = None,
    ) -> bool:
        return True

    def normalize_provider_error(self, exc: Exception) -> ProviderError:
        if isinstance(exc, ProviderError):
            return exc
        error_code, summary, _ = SmtpTransport.classify_smtp_error(exc)
        return ProviderError(
            code="OTP_DELIVERY_FAILED",
            message="We couldn't send the verification code right now. Please try again shortly.",
            details={"error_code": error_code, "detail": summary}
        )
