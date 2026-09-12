"""
Production HTTPS Email Verification Provider using Resend Email API
Dispatches transactional OTP emails over HTTPS (port 443) to avoid cloud SMTP socket restrictions.
Enforces cryptographically secure OTP generation, SHA-256 hash storage, idempotency,
and strict sanitization of all credentials and provider errors.
"""
import os
import time
import secrets
import logging
import hashlib
from typing import Dict, Any, Optional
import requests
from django.conf import settings
from .base import VerificationProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger('monvex.security.resend')

class ResendEmailProvider(VerificationProvider):
    """
    Production transactional email provider using Resend's REST API.
    API Documentation: https://resend.com/docs/api-reference/emails/send-email
    """

    DEFAULT_API_URL = "https://api.resend.com/emails"
    DEFAULT_FROM_EMAIL = "MONVEX <onboarding@resend.dev>"
    DEFAULT_TIMEOUT = 10

    def __init__(self):
        raw_key = getattr(settings, 'RESEND_API_KEY', os.getenv('RESEND_API_KEY', '')).strip().strip('\'"')
        self.api_key = raw_key
        self.from_email = getattr(settings, 'RESEND_FROM_EMAIL', os.getenv('RESEND_FROM_EMAIL', self.DEFAULT_FROM_EMAIL)).strip()
        self.api_url = getattr(settings, 'RESEND_API_URL', os.getenv('RESEND_API_URL', self.DEFAULT_API_URL)).strip()
        self.timeout = int(getattr(settings, 'RESEND_TIMEOUT', os.getenv('RESEND_TIMEOUT', self.DEFAULT_TIMEOUT)))

    def _hash_code(self, code: str) -> str:
        return hashlib.sha256(code.strip().encode('utf-8')).hexdigest()

    def send_code(self, destination: str, channel: str = "email", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        dest_clean = destination.strip().lower()
        if not dest_clean or '@' not in dest_clean:
            raise ProviderError(
                code="INVALID_DESTINATION",
                message="A valid email address is required for verification."
            )

        meta = metadata or {}
        purpose = meta.get('purpose', 'REGISTRATION')
        username = meta.get('username', '').strip()
        request_id = meta.get('request_id', f"req_{secrets.token_hex(4)}")

        # Cryptographically secure 6-digit numeric OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"
        otp_hash = self._hash_code(raw_otp)

        # Ensure API key is configured
        if not self.api_key:
            logger.error(f"[{request_id}] RESEND_API_KEY is not configured in backend environment.")
            raise ProviderError(
                code="OTP_DELIVERY_FAILED",
                message="We couldn't send the verification code right now. Please try again in a few moments."
            )

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
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }}
    .headline {{
      font-size: 18px;
      font-weight: 700;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 8px;
    }}
    .subhead {{
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.6;
      margin-bottom: 24px;
    }}
    .code-box {{
      background-color: #030712;
      border: 2px dashed #38BDF8;
      border-radius: 14px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #38BDF8;
      display: block;
      margin-left: 10px;
    }}
    .warning-box {{
      background-color: #1C1917;
      border-left: 4px solid #F59E0B;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      font-size: 12px;
      color: #D6D3D1;
      line-height: 1.5;
      margin-top: 24px;
    }}
    .footer {{
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #1F2937;
      text-align: center;
      font-size: 11px;
      color: #64748B;
      line-height: 1.6;
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
      <div class="badge">Security Transmission</div>
      <div class="brand-title">MONVEX</div>
      <div class="brand-subtitle">Financial Intelligence Platform</div>
    </div>

    <h1 class="headline">{greeting}</h1>
    <p class="subhead">{subhead}</p>

    <div class="code-box">
      <span class="otp-code">{raw_otp}</span>
    </div>

    <div class="warning-box">
      <strong>Security Notice:</strong> This verification code expires in <strong>10 minutes</strong>. For your security, never share this code with anyone. MONVEX staff will never ask for your verification code.
    </div>

    <div class="footer">
      This is an automated security transmission from <strong>MONVEX</strong>.<br>
      Please do not reply directly to this email.
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
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "MONVEX-Production/1.0",
            # Resend Idempotency-Key guarantees no duplicate sends on retries
            "Idempotency-Key": f"resend_{request_id}_{otp_hash[:16]}"
        }

        payload = {
            "from": self.from_email,
            "to": [dest_clean],
            "subject": subject,
            "html": html_content,
            "text": plain_text
        }

        # Dispatch with 1 safe transient retry for timeouts or 5xx responses
        max_attempts = 2
        resend_email_id = None

        for attempt in range(1, max_attempts + 1):
            try:
                response = requests.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                    timeout=self.timeout
                )

                if response.status_code in (200, 201):
                    resp_data = response.json()
                    resend_email_id = resp_data.get('id', f"resend_{secrets.token_hex(8)}")
                    logger.info(
                        f"[{request_id}] OTP email successfully dispatched via Resend HTTPS API to {dest_clean[:2]}*** "
                        f"(resend_id={resend_email_id}, attempt={attempt})"
                    )
                    break

                # Handle HTTP 401 (Authentication failure - invalid API key)
                if response.status_code == 401:
                    logger.error(
                        f"[{request_id}] Resend API authentication failed (HTTP 401). "
                        "Verify RESEND_API_KEY in Render environment."
                    )
                    raise ProviderError(
                        code="OTP_DELIVERY_FAILED",
                        message="We couldn't send the verification code right now. Please try again in a few moments."
                    )

                # Handle HTTP 429 (Rate limiting)
                if response.status_code == 429:
                    logger.warning(f"[{request_id}] Resend API rate limited (HTTP 429).")
                    raise ProviderError(
                        code="OTP_DELIVERY_FAILED",
                        message="We couldn't send the verification code right now. Please try again in a few moments."
                    )

                # Handle HTTP 422 (Unprocessable entity - invalid sender domain, etc.)
                if response.status_code == 422:
                    try:
                        err_body = response.json()
                        err_msg = err_body.get('message', 'Unprocessable Entity')
                    except Exception:
                        err_msg = response.text[:200]
                    logger.error(f"[{request_id}] Resend API validation rejected payload (HTTP 422): {err_msg}")
                    raise ProviderError(
                        code="OTP_DELIVERY_FAILED",
                        message="We couldn't send the verification code right now. Please try again in a few moments."
                    )

                # Transient server errors (500, 502, 503, 504)
                if response.status_code >= 500:
                    logger.warning(
                        f"[{request_id}] Resend API returned transient error (HTTP {response.status_code}) on attempt {attempt}/{max_attempts}."
                    )
                    if attempt < max_attempts:
                        time.sleep(0.5)
                        continue
                    raise ProviderError(
                        code="OTP_DELIVERY_FAILED",
                        message="We couldn't send the verification code right now. Please try again in a few moments."
                    )

                # Any other unexpected 4xx status
                logger.error(f"[{request_id}] Resend API error (HTTP {response.status_code}): {response.text[:200]}")
                raise ProviderError(
                    code="OTP_DELIVERY_FAILED",
                    message="We couldn't send the verification code right now. Please try again in a few moments."
                )

            except requests.exceptions.Timeout as te:
                logger.warning(f"[{request_id}] Resend API request timed out on attempt {attempt}/{max_attempts}: {te}")
                if attempt < max_attempts:
                    time.sleep(0.5)
                    continue
                raise ProviderError(
                    code="OTP_DELIVERY_FAILED",
                    message="We couldn't send the verification code right now. Please try again in a few moments."
                )
            except requests.exceptions.RequestException as re:
                logger.error(f"[{request_id}] Resend API network error on attempt {attempt}/{max_attempts}: {re}")
                if attempt < max_attempts:
                    time.sleep(0.5)
                    continue
                raise ProviderError(
                    code="OTP_DELIVERY_FAILED",
                    message="We couldn't send the verification code right now. Please try again in a few moments."
                )

        if not resend_email_id:
            raise ProviderError(
                code="OTP_DELIVERY_FAILED",
                message="We couldn't send the verification code right now. Please try again in a few moments."
            )

        return {
            "provider_verification_id": f"resend_{resend_email_id}",
            "otp_hash": otp_hash,
            "raw_otp": raw_otp,
            "status": "pending",
            "channel": "email",
            "destination": dest_clean,
            "provider": "resend"
        }

    def check_code(self, destination: str, code: str, provider_verification_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Database-backed check handled by VerificationService via timing-safe hash comparison.
        """
        return {
            "submitted_hash": self._hash_code(code),
            "provider_status": "check_delegated_to_database"
        }

    def cancel_verification(self, destination: str, provider_verification_id: Optional[str] = None) -> bool:
        return True

    def normalize_provider_error(self, exc: Exception) -> ProviderError:
        return ProviderError(
            code="OTP_DELIVERY_FAILED",
            message="We couldn't send the verification code right now. Please try again in a few moments."
        )
