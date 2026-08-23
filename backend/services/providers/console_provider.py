"""
Development Console Verification Provider
Strictly allowed ONLY when settings.DEBUG == True.
Fails fast with ProviderUnavailableError if called in production.
"""
import random
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from .base import VerificationProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger('monvex.security.console')

class ConsoleVerificationProvider(VerificationProvider):

    # In-memory store for dev verification checks: destination -> code
    _dev_store = {}

    def __init__(self):
        if not getattr(settings, 'DEBUG', False):
            raise ProviderUnavailableError("ConsoleVerificationProvider is strictly forbidden in production mode.")
        logger.warning("[SECURITY NOTICE] Running ConsoleVerificationProvider in DEBUG mode. Do not use in production.")

    def send_code(self, destination: str, channel: str = "email", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        otp = str(random.randint(100000, 999999))
        self._dev_store[destination.strip().lower()] = otp
        vid = f"console_vid_{random.randint(1000, 9999)}"

        logger.info(f"[DEV DISPATCH] Verification code for {destination}: [ {otp} ]")

        return {
            "provider_verification_id": vid,
            "status": "pending",
            "channel": channel,
            "destination": destination,
            "provider": "console",
            "dev_code": otp # available internally to test runners
        }

    def check_code(self, destination: str, code: str, provider_verification_id: Optional[str] = None) -> Dict[str, Any]:
        dest_clean = destination.strip().lower()
        expected = self._dev_store.get(dest_clean)

        if not expected:
            return {"approved": False, "status": "invalid", "provider_status": "not_found"}

        is_approved = (code.strip() == expected)
        if is_approved:
            # Clear on successful check
            self._dev_store.pop(dest_clean, None)

        return {
            "approved": is_approved,
            "status": "approved" if is_approved else "invalid",
            "provider_status": "approved" if is_approved else "pending"
        }

    def cancel_verification(self, destination: str, provider_verification_id: Optional[str] = None) -> bool:
        self._dev_store.pop(destination.strip().lower(), None)
        return True

    def normalize_provider_error(self, exc: Exception) -> ProviderError:
        return ProviderError(code="PROVIDER_ERROR", message=str(exc))
