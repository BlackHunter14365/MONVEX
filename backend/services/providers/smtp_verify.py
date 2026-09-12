"""
Transactional SMTP / Direct Email Verification Provider
Generates a cryptographically secure OTP, hashes it for database storage, and dispatches
a branded transactional HTML email via Django's configured email backend (Gmail SMTP).
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

    def __init__(self):
        self.host_user = getattr(settings, 'EMAIL_HOST_USER', os.getenv('EMAIL_HOST_USER', 'monvexfinance@gmail.com')).strip()
        self.host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', os.getenv('EMAIL_HOST_PASSWORD', '')).strip()
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'MONVEX <monvexfinance@gmail.com>').strip()

    def _hash_code(self, code: str) -> str:
        return hashlib.sha256(code.strip().encode('utf-8')).hexdigest()

    def send_code(self, destination: str, channel: str = "email", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        dest_clean = destination.strip().lower()
        meta = metadata or {}
        purpose = meta.get('purpose', 'REGISTRATION')
        username = meta.get('username', '').strip()

        # Generate cryptographically secure 6-digit numeric OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"
        otp_hash = self._hash_code(raw_otp)

        is_login = purpose == 'LOGIN'
        subject = "MONVEX Login Verification Code" if is_login else "Verify your MONVEX account"
        headline = "Verify Your Identity" if is_login else "Verify Your Email"
        subhead = (
            "Use the following verification code to authorize your MONVEX sign-in:"
            if is_login else
            "Use the following verification code to complete your MONVEX registration:"
        )
        greeting = f"Hello {username}," if username else "Hello,"

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B0F19;
      color: #E2E8F0;
      margin: 0;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }}
    .container {{
      max-width: 480px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1F2937;
      border-radius: 20px;
      padding: 36px 28px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }}
    .brand-header {{
      text-align: center;
      margin-bottom: 28px;
    }}
    .brand-title {{
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #FFFFFF;
      margin: 0;
    }}
    .brand-subtitle {{
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #94A3B8;
      margin-top: 4px;
    }}
    .badge {{
      display: inline-block;
      background-color: #1E293B;
      border: 1px solid #334155;
      color: #38BDF8;
      border-radius: 9999px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }}
    .headline {{
      font-size: 20px;
      font-weight: 700;
      color: #F8FAFC;
      margin: 0 0 12px 0;
      text-align: center;
    }}
    .greeting {{
      font-size: 14px;
      font-weight: 600;
      color: #CBD5E1;
      margin: 0 0 8px 0;
    }}
    .info-text {{
      font-size: 13px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 24px 0;
    }}
    .otp-card {{
      background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%);
      border: 1px solid #3730A3;
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-code {{
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #38BDF8;
      text-shadow: 0 0 24px rgba(56, 189, 248, 0.35);
      margin: 0;
    }}
    .otp-caption {{
      font-size: 11px;
      color: #94A3B8;
      margin-top: 8px;
      font-weight: 500;
    }}
    .warning-box {{
      background-color: #181E2E;
      border-left: 3px solid #F59E0B;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      color: #FDE68A;
      margin: 20px 0;
    }}
    .footer {{
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #1F2937;
      font-size: 11px;
      line-height: 1.5;
      color: #64748B;
      text-align: center;
    }}
    .footer a {{
      color: #38BDF8;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <h1 class="brand-title">MONVEX</h1>
      <div class="brand-subtitle">Financial Intelligence Platform</div>
    </div>

    <div style="text-align: center;">
      <span class="badge">{purpose}</span>
    </div>

    <h2 class="headline">{headline}</h2>
    <p class="greeting">{greeting}</p>
    <p class="info-text">{subhead}</p>

    <div class="otp-card">
      <div class="otp-code">{raw_otp}</div>
      <div class="otp-caption">One-Time Verification Passcode</div>
    </div>

    <div class="warning-box">
      <strong>Security Notice:</strong> This verification code expires in <strong>10 minutes</strong>. For your security, never share this code with anyone. MONVEX staff will never ask for your verification code.
    </div>

    <div class="footer">
      This is an automated security transmission from <strong>MONVEX</strong>.<br>
      Sent from <a href="mailto:{self.host_user}">{self.host_user}</a> &bull; Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>"""

        plain_text = (
            f"MONVEX — {headline}\n\n"
            f"{greeting}\n\n"
            f"{subhead}\n\n"
            f"VERIFICATION CODE: {raw_otp}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"For your security, never share this code with anyone.\n\n"
            f"MONVEX Security Team\n"
            f"Sent from: {self.host_user}\n"
        )

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=self.from_email,
                to=[dest_clean]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"OTP email dispatched successfully via SMTP to {dest_clean[:2]}***")

            return {
                "provider_verification_id": f"smtp_vid_{secrets.token_hex(8)}",
                "otp_hash": otp_hash,
                "raw_otp": raw_otp,
                "status": "pending",
                "channel": "email",
                "destination": dest_clean,
                "provider": "smtp"
            }
        except Exception as e:
            logger.error(f"Failed to dispatch verification email via SMTP to {dest_clean[:2]}***: {e}")
            raise ProviderError(
                code="OTP_DELIVERY_FAILED",
                message="We couldn't send the verification code right now. Please try again in a few moments."
            )

    def check_code(self, destination: str, code: str, provider_verification_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Database-backed check handled by VerificationService.
        """
        submitted_hash = self._hash_code(code)
        return {
            "submitted_hash": submitted_hash,
            "provider_status": "check_delegated_to_database"
        }

    def cancel_verification(self, destination: str, provider_verification_id: Optional[str] = None) -> bool:
        return True

    def normalize_provider_error(self, exc: Exception) -> ProviderError:
        return ProviderError(code="OTP_PROVIDER_ERROR", message=str(exc))
