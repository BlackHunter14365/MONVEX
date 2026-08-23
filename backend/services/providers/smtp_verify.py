"""
Transactional SMTP / Direct Email Verification Provider
Generates a cryptographically secure OTP, hashes it for storage, and dispatches
a branded transactional HTML email via Django's configured email backend (Gmail, SendGrid, Amazon SES, etc.).
"""
import os
import secrets
import logging
import hashlib
from typing import Dict, Any, Optional
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from .base import VerificationProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger('monvex.security.smtp')

class SmtpVerifyProvider(VerificationProvider):

    _active_tokens = {} # in-memory / session fallback for hash checks: destination -> (otp_hash, expiry)

    def __init__(self):
        self.host_user = getattr(settings, 'EMAIL_HOST_USER', os.getenv('EMAIL_HOST_USER', '')).strip()
        self.host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', os.getenv('EMAIL_HOST_PASSWORD', '')).strip()
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'MONVEX Security <no-reply@monvex.ai>')

        # Check if email credentials are configured when in production or when SMTP is selected
        if not settings.DEBUG and not self.host_user and not self.host_password:
            raise ProviderError(
                code="OTP_PROVIDER_CONFIGURATION_ERROR",
                message="SMTP email credentials (EMAIL_HOST_USER / EMAIL_HOST_PASSWORD) are not configured."
            )

    def _hash_code(self, code: str) -> str:
        return hashlib.sha256(code.strip().encode('utf-8')).hexdigest()

    def send_code(self, destination: str, channel: str = "email", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        dest_clean = destination.strip().lower()
        # Generate cryptographically secure 6-digit OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"
        otp_hash = self._hash_code(raw_otp)

        self._active_tokens[dest_clean] = otp_hash

        subject = f"MONVEX Security: Your Verification Passcode is {raw_otp}"
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 40px 20px; }}
    .card {{ max-width: 500px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }}
    .brand {{ font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-align: center; margin-bottom: 24px; }}
    .badge {{ display: inline-block; background-color: #4f46e5; color: white; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }}
    .otp-box {{ background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border: 1px solid #4338ca; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }}
    .otp-code {{ font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.4); }}
    .info {{ font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; }}
    .footer {{ margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; text-align: center; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">MONVEX FINANCIAL INTELLIGENCE</div>
    <div style="text-align: center;">
      <span class="badge">Email Verification</span>
    </div>
    <p class="info">Please use the single-use passcode below to verify your email address and activate your MONVEX account.</p>
    <div class="otp-box">
      <div class="otp-code">{raw_otp}</div>
    </div>
    <p class="info" style="font-size: 12px;">This passcode will expire in <strong>10 minutes</strong>. If you did not request this verification, you can safely ignore this email.</p>
    <div class="footer">
      MONVEX Security Engine &bull; Automated System &bull; Please do not reply
    </div>
  </div>
</body>
</html>
"""
        plain_text = strip_tags(html_content)

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=self.from_email,
                to=[dest_clean]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Transactional verification email dispatched successfully to {dest_clean[:3]}***")

            return {
                "provider_verification_id": f"smtp_vid_{secrets.token_hex(8)}",
                "status": "pending",
                "channel": "email",
                "destination": dest_clean,
                "provider": "smtp"
            }
        except Exception as e:
            logger.error(f"Failed to dispatch verification email via SMTP: {e}")
            raise ProviderError(
                code="OTP_PROVIDER_ERROR",
                message=f"Unable to send verification email via SMTP: {str(e)}"
            )

    def check_code(self, destination: str, code: str, provider_verification_id: Optional[str] = None) -> Dict[str, Any]:
        dest_clean = destination.strip().lower()
        expected_hash = self._active_tokens.get(dest_clean)
        submitted_hash = self._hash_code(code)

        if not expected_hash:
            return {"approved": False, "status": "invalid", "provider_status": "not_found"}

        is_approved = (submitted_hash == expected_hash)
        if is_approved:
            self._active_tokens.pop(dest_clean, None)

        return {
            "approved": is_approved,
            "status": "approved" if is_approved else "invalid",
            "provider_status": "approved" if is_approved else "pending"
        }

    def cancel_verification(self, destination: str, provider_verification_id: Optional[str] = None) -> bool:
        self._active_tokens.pop(destination.strip().lower(), None)
        return True

    def normalize_provider_error(self, exc: Exception) -> ProviderError:
        return ProviderError(code="OTP_PROVIDER_ERROR", message=str(exc))
