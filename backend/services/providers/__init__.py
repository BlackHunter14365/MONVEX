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
        os.getenv('OTP_PROVIDER', 'twilio')
    ).strip().lower()

    if provider_name == 'console':
        if not getattr(settings, 'DEBUG', False):
            raise ProviderError(code="OTP_PROVIDER_CONFIGURATION_ERROR", message="Console verification provider is disallowed in production mode.")
        return ConsoleVerificationProvider()
    elif provider_name in ['smtp', 'email']:
        return SmtpVerifyProvider()
    elif provider_name == 'twilio':
        return TwilioVerifyProvider()
    else:
        # Default to Twilio Verify
        return TwilioVerifyProvider()
