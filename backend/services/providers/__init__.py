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
from .resend_verify import ResendEmailProvider

logger = logging.getLogger('monvex.security')

def get_verification_provider() -> VerificationProvider:
    provider_name = getattr(
        settings,
        'OTP_PROVIDER',
        getattr(settings, 'EMAIL_PROVIDER', os.getenv('OTP_PROVIDER', os.getenv('EMAIL_PROVIDER', 'resend')))
    ).strip().lower()

    # Generic 'email' or 'resend' routes to Resend HTTPS Email API
    if provider_name in ['resend', 'email']:
        return ResendEmailProvider()
    elif provider_name == 'console':
        if not getattr(settings, 'DEBUG', False):
            logger.warning("Console verification provider requested in production mode (DEBUG=False). Falling back to ResendEmailProvider.")
            return ResendEmailProvider()
        return ConsoleVerificationProvider()
    elif provider_name == 'smtp':
        # Render container environments block outbound SMTP sockets (ports 25, 465, 587)
        if not getattr(settings, 'DEBUG', False):
            logger.warning(
                "SMTP provider requested in production mode (DEBUG=False). "
                "Render blocks outbound SMTP networking (Errno 101). Routing via ResendEmailProvider."
            )
            return ResendEmailProvider()
        return SmtpVerifyProvider()
    elif provider_name == 'twilio':
        if not getattr(settings, 'TWILIO_ACCOUNT_SID', '') or not getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', ''):
            logger.warning("Twilio credentials missing. Falling back to ResendEmailProvider.")
            return ResendEmailProvider()
        return TwilioVerifyProvider()
    else:
        # Default in production is Resend HTTPS Email API
        return ResendEmailProvider()
