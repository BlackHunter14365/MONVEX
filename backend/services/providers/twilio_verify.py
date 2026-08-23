"""
Twilio Verify v2 Provider Implementation
Authoritative integration with Twilio Verify v2 REST API.
Fails loudly if credentials are not properly configured.
"""
import os
import json
import logging
import base64
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, Optional
from django.conf import settings
from .base import VerificationProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger('monvex.security.twilio')

class TwilioVerifyProvider(VerificationProvider):

    def __init__(self):
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', os.getenv('TWILIO_ACCOUNT_SID', '')).strip()
        self.api_key = (
            getattr(settings, 'TWILIO_API_KEY', '') or 
            os.getenv('TWILIO_API_KEY', '') or 
            self.account_sid
        ).strip()
        self.api_secret = (
            getattr(settings, 'TWILIO_API_SECRET', '') or 
            os.getenv('TWILIO_API_SECRET', '') or 
            getattr(settings, 'TWILIO_AUTH_TOKEN', '') or 
            os.getenv('TWILIO_AUTH_TOKEN', '')
        ).strip()
        self.service_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', os.getenv('TWILIO_VERIFY_SERVICE_SID', '')).strip()

        # Log safe diagnostics (NEVER print raw secrets)
        logger.info(
            f"[Twilio Diagnostic] ACCOUNT_SID: {'configured' if self.account_sid else 'missing'} | "
            f"API_KEY: {'configured' if self.api_key else 'missing'} | "
            f"API_SECRET: {'configured' if self.api_secret else 'missing'} | "
            f"VERIFY_SERVICE_SID: {'configured' if self.service_sid else 'missing'}"
        )

        missing_keys = []
        if not self.account_sid:
            missing_keys.append("TWILIO_ACCOUNT_SID")
        if not self.api_secret:
            missing_keys.append("TWILIO_API_SECRET / TWILIO_AUTH_TOKEN")
        if not self.service_sid:
            missing_keys.append("TWILIO_VERIFY_SERVICE_SID")

        if missing_keys:
            error_msg = f"Twilio Verify provider configuration incomplete. Missing: {', '.join(missing_keys)}."
            logger.error(error_msg)
            raise ProviderError(
                code="OTP_PROVIDER_CONFIGURATION_ERROR",
                message=error_msg
            )

    def _get_auth_header(self) -> str:
        creds = f"{self.api_key}:{self.api_secret}"
        encoded = base64.b64encode(creds.encode('utf-8')).decode('utf-8')
        return f"Basic {encoded}"

    def send_code(self, destination: str, channel: str = "email", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Dispatches verification code via Twilio Verify v2 REST API.
        """
        dest_clean = destination.strip().lower()
        metadata = metadata or {}
        req_id = metadata.get('request_id', 'req_unknown')

        logger.info(f"[{req_id}] OTP_PROVIDER_REQUEST: Dispatching to destination {dest_clean[:2]}*** via Twilio Verify (channel={channel})")

        url = f"https://verify.twilio.com/v2/Services/{self.service_sid}/Verifications"
        data = {
            'To': dest_clean,
            'Channel': channel.lower(),
        }
        encoded_data = urllib.parse.urlencode(data).encode('utf-8')

        req = urllib.request.Request(url, data=encoded_data, method='POST')
        req.add_header('Authorization', self._get_auth_header())
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_body = json.loads(response.read().decode('utf-8'))
                provider_sid = resp_body.get('sid', '')
                provider_status = resp_body.get('status', 'pending')
                logger.info(f"[{req_id}] OTP_PROVIDER_RESPONSE: status={provider_status} sid={provider_sid}")
                return {
                    "provider_verification_id": provider_sid,
                    "status": provider_status,
                    "channel": channel,
                    "destination": dest_clean,
                    "provider": "twilio"
                }
        except urllib.error.HTTPError as e:
            error_payload = {}
            try:
                error_payload = json.loads(e.read().decode('utf-8'))
            except Exception:
                pass
            twilio_code = error_payload.get('code')
            twilio_msg = error_payload.get('message', str(e))
            logger.error(f"[{req_id}] OTP_SEND_FAILED: Twilio HTTP {e.code} | Code: {twilio_code} | Msg: {twilio_msg}")
            raise self.normalize_provider_error(e, error_payload)
        except Exception as e:
            logger.error(f"[{req_id}] OTP_SEND_FAILED: Network connection to Twilio Verify failed: {e}")
            raise ProviderUnavailableError(f"Unable to reach Twilio Verify API: {str(e)}")

    def check_code(self, destination: str, code: str, provider_verification_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Checks verification code validity via Twilio Verify v2 VerificationCheck.
        """
        dest_clean = destination.strip().lower()
        url = f"https://verify.twilio.com/v2/Services/{self.service_sid}/VerificationCheck"
        data = {
            'To': dest_clean,
            'Code': code.strip(),
        }
        encoded_data = urllib.parse.urlencode(data).encode('utf-8')

        req = urllib.request.Request(url, data=encoded_data, method='POST')
        req.add_header('Authorization', self._get_auth_header())
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_body = json.loads(response.read().decode('utf-8'))
                provider_status = resp_body.get('status', '')
                is_approved = (provider_status == 'approved')
                logger.info(f"Twilio Verify check result for {dest_clean[:2]}***: status={provider_status} approved={is_approved}")
                return {
                    "approved": is_approved,
                    "status": "approved" if is_approved else "invalid",
                    "provider_status": provider_status
                }
        except urllib.error.HTTPError as e:
            error_payload = {}
            try:
                error_payload = json.loads(e.read().decode('utf-8'))
            except Exception:
                pass
            logger.error(f"Twilio check error: {e.code} {error_payload}")
            raise self.normalize_provider_error(e, error_payload)
        except Exception as e:
            logger.error(f"Network error checking Twilio Verify code: {e}")
            raise ProviderUnavailableError("Unable to verify code with Twilio Verify provider.")

    def cancel_verification(self, destination: str, provider_verification_id: Optional[str] = None) -> bool:
        if not provider_verification_id or not self.service_sid:
            return False
        url = f"https://verify.twilio.com/v2/Services/{self.service_sid}/Verifications/{provider_verification_id}"
        data = urllib.parse.urlencode({'Status': 'canceled'}).encode('utf-8')
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('Authorization', self._get_auth_header())
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return response.status == 200
        except Exception:
            return False

    def normalize_provider_error(self, exc: Exception, payload: Optional[Dict[str, Any]] = None) -> ProviderError:
        payload = payload or {}
        twilio_code = payload.get('code')
        message = payload.get('message', str(exc))

        if twilio_code == 60202:
            return ProviderError(code="TOO_MANY_ATTEMPTS", message="Max check attempts reached on Twilio Verify. Please request a new code.")
        elif twilio_code == 60203:
            return ProviderError(code="RESEND_LIMIT", message="Max send attempts reached for this email destination.")
        elif twilio_code == 60200:
            return ProviderError(code="INVALID_PARAMETER", message="Invalid email address format.")
        elif twilio_code == 20404:
            return ProviderError(code="VERIFICATION_NOT_FOUND", message="No active verification session found on Twilio Verify.")
        elif twilio_code == 60212:
            return ProviderError(code="EMAIL_CHANNEL_NOT_CONFIGURED", message="Twilio Verify Service is missing email integration (SendGrid).")
        return ProviderError(code="OTP_PROVIDER_ERROR", message=f"Twilio Verify Error ({twilio_code}): {message}")
