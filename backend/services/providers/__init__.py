"""
Verification Providers Factory
"""
import os
import logging
from django.conf import settings
from .base import VerificationProvider, ProviderError, ProviderUnavailableError
from .twilio_verify import TwilioVerifyProvider
from .smtp_verify import SmtpVerifyProvider
from .console_provider import ConsoleVerificationProvider

logger = logging.getLogger('monvex.security')

def get_verification_provider() -> VerificationProvider:
    provider_name = getattr(
        settings,
        'OTP_PROVIDER',
        getattr(settings, 'EMAIL_PROVIDER', os.getenv('OTP_PROVIDER', os.getenv('EMAIL_PROVIDER', 'smtp')))
    ).strip().lower()

    if provider_name == 'console':
        if not getattr(settings, 'DEBUG', False):
            logger.warning("Console verification provider requested in production mode. Falling back to SmtpVerifyProvider.")
            return SmtpVerifyProvider()
        return ConsoleVerificationProvider()
    elif provider_name in ['smtp', 'email']:
        return SmtpVerifyProvider()
    elif provider_name == 'twilio':
        if not getattr(settings, 'TWILIO_ACCOUNT_SID', '') or not getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', ''):
            logger.warning("Twilio credentials missing. Falling back to SmtpVerifyProvider.")
            return SmtpVerifyProvider()
        return TwilioVerifyProvider()
    else:
        # Default to SMTP
        return SmtpVerifyProvider()
