"""
Management Command: test_otp_provider
Diagnoses the configured verification provider (Twilio / SMTP / Console) and tests real dispatch.
NEVER prints the raw OTP passcode.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from services.providers import get_verification_provider
from services.providers.base import ProviderError, ProviderUnavailableError
from services.verification_service import VerificationService

class Command(BaseCommand):
    help = "Tests real OTP provider connectivity and dispatch for a specified email destination without printing secrets."

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Destination email address to test verification dispatch')
        parser.add_argument('--channel', type=str, default='email', help='Channel (email or sms)')

    def handle(self, *args, **options):
        destination = options['email'].strip().lower()
        channel = options['channel'].strip().lower()
        masked_dest = VerificationService.mask_email(destination)

        self.stdout.write(self.style.MIGRATE_HEADING("=" * 45))
        self.stdout.write(self.style.MIGRATE_HEADING("       MONVEX OTP PROVIDER TEST"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 45))

        # Check provider initialization
        try:
            provider = get_verification_provider()
            provider_name = provider.__class__.__name__
        except Exception as e:
            self.stdout.write(self.style.ERROR("Result: FAILED"))
            self.stdout.write(self.style.ERROR(f"Provider initialization error: {str(e)}"))
            return

        self.stdout.write(f"Provider: {provider_name}")
        self.stdout.write(f"Channel: {channel}")
        self.stdout.write(f"Destination: {masked_dest}")
        self.stdout.write("-" * 45)

        try:
            result = provider.send_code(
                destination=destination,
                channel=channel,
                metadata={"purpose": "DIAGNOSTIC_TEST", "request_id": "diag_test"}
            )
            self.stdout.write(self.style.SUCCESS("Result: SUCCESS"))
            self.stdout.write(f"Status: {result.get('status', 'pending')}")
            if result.get('provider_verification_id'):
                self.stdout.write(f"Provider Verification SID: {result.get('provider_verification_id')}")
        except ProviderError as pe:
            self.stdout.write(self.style.ERROR("Result: FAILED"))
            self.stdout.write(self.style.ERROR(f"Provider error code: {pe.code}"))
            self.stdout.write(self.style.ERROR(f"Provider message: {pe.message}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR("Result: FAILED"))
            self.stdout.write(self.style.ERROR(f"Unexpected error: {str(e)}"))
