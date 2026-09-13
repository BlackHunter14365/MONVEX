"""
MONVEX Verification Provider Factory
Central registry and factory for OTP delivery providers.
SMTP is the primary and required production email transport.
Resend dependencies have been completely removed.
"""
import os
import logging
from django.conf import settings
from .base import VerificationProvider, ProviderError, ProviderUnavailableError
from .smtp_verify import SmtpVerifyProvider
from .console_provider import ConsoleVerificationProvider
from .twilio_verify import TwilioVerifyProvider

logger = logging.getLogger('monvex.security')


def get_verification_provider() -> VerificationProvider:
    """
    Resolves the configured verification provider instance.
    Defaults to SmtpVerifyProvider in all environments.
    ConsoleVerificationProvider is strictly blocked when DEBUG=False.
    """
    raw_provider = getattr(
        settings,
        'OTP_PROVIDER',
        getattr(settings, 'EMAIL_PROVIDER', os.getenv('OTP_PROVIDER', os.getenv('EMAIL_PROVIDER', 'smtp')))
    )
    provider_name = (raw_provider or 'smtp').strip().lower()

    if provider_name == 'console':
        if not getattr(settings, 'DEBUG', False):
            logger.error("ConsoleVerificationProvider was requested in production mode (DEBUG=False). Silent console fallbacks are forbidden.")
            raise ProviderUnavailableError("Console verification provider is disabled in production environments.")
        return ConsoleVerificationProvider()

    elif provider_name == 'twilio':
        if not getattr(settings, 'TWILIO_ACCOUNT_SID', '') or not getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', ''):
            logger.warning("Twilio credentials missing. Falling back to SmtpVerifyProvider.")
            return SmtpVerifyProvider()
        return TwilioVerifyProvider()

    else:
        # Default and primary provider is SmtpVerifyProvider
        return SmtpVerifyProvider()
