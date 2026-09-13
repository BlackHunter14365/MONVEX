"""
Management Command: test_otp_provider
Diagnoses the configured verification provider and executes a live test dispatch.
Never prints raw OTP codes or passwords.
"""
import socket
from django.core.management.base import BaseCommand
from django.conf import settings
from services.providers import get_verification_provider
from services.providers.base import ProviderError, ProviderUnavailableError
from services.verification_service import VerificationService
from services.email import SmtpTransport


class Command(BaseCommand):
    help = "Diagnoses SMTP configuration, tests host resolution, and executes a test OTP dispatch without exposing secrets."

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Destination email address to test verification dispatch')
        parser.add_argument('--channel', type=str, default='email', help='Channel (email or sms)')

    def handle(self, *args, **options):
        destination = options['email'].strip().lower()
        channel = options['channel'].strip().lower()
        masked_dest = VerificationService.mask_email(destination)

        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60))
        self.stdout.write(self.style.MIGRATE_HEADING("       MONVEX SMTP & OTP PROVIDER DIAGNOSTIC"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60))

        # 1. Inspect SMTP Configuration
        smtp_cfg = SmtpTransport.get_smtp_config()
        is_valid, err_msg = SmtpTransport.validate_configuration(strict_production=False)

        masked_user = VerificationService.mask_email(smtp_cfg['user']) if smtp_cfg['user'] else "NOT CONFIGURED"
        has_pwd = "SET (LENGTH: %d)" % len(smtp_cfg['password']) if smtp_cfg['password'] else "MISSING"

        self.stdout.write(f"SMTP Host:      {smtp_cfg['host'] or 'MISSING'}")
        self.stdout.write(f"SMTP Port:      {smtp_cfg['port']}")
        self.stdout.write(f"SSL Enabled:    {smtp_cfg['use_ssl']}")
        self.stdout.write(f"TLS Enabled:    {smtp_cfg['use_tls']}")
        self.stdout.write(f"Timeout:        {smtp_cfg['timeout']}s")
        self.stdout.write(f"Auth User:      {masked_user}")
        self.stdout.write(f"Auth Password:  {has_pwd}")
        self.stdout.write(f"From Address:   {smtp_cfg['from_email']}")
        self.stdout.write("-" * 60)

        if not is_valid:
            self.stdout.write(self.style.ERROR(f"Configuration Warning: {err_msg}"))

        # 2. Test DNS Resolution
        if smtp_cfg['host']:
            try:
                ip_addr = socket.gethostbyname(smtp_cfg['host'])
                self.stdout.write(self.style.SUCCESS(f"DNS Resolution: Host '{smtp_cfg['host']}' resolves to {ip_addr}"))
            except Exception as de:
                self.stdout.write(self.style.ERROR(f"DNS Resolution FAILED for '{smtp_cfg['host']}': {de}"))
        self.stdout.write("-" * 60)

        # 3. Test Provider Dispatch
        try:
            provider = get_verification_provider()
            provider_name = provider.__class__.__name__
        except Exception as e:
            self.stdout.write(self.style.ERROR("Result: FAILED"))
            self.stdout.write(self.style.ERROR(f"Provider initialization error: {str(e)}"))
            return

        self.stdout.write(f"Active Provider: {provider_name}")
        self.stdout.write(f"Target Channel:  {channel}")
        self.stdout.write(f"Target Address:  {masked_dest}")
        self.stdout.write("-" * 60)
        self.stdout.write("Initiating test dispatch...")

        try:
            result = provider.send_code(
                destination=destination,
                channel=channel,
                metadata={"purpose": "DIAGNOSTIC_TEST", "request_id": "diag_test"}
            )
            self.stdout.write(self.style.SUCCESS("Result: SUCCESS (OTP email dispatched successfully via SMTP)"))
            self.stdout.write(f"Status: {result.get('status', 'pending')}")
            if result.get('provider_verification_id'):
                self.stdout.write(f"Verification SID: {result.get('provider_verification_id')}")
        except ProviderError as pe:
            self.stdout.write(self.style.ERROR("Result: FAILED"))
            self.stdout.write(self.style.ERROR(f"Provider Error Code: {pe.code}"))
            self.stdout.write(self.style.ERROR(f"Provider Message:    {pe.message}"))
            if pe.details:
                self.stdout.write(self.style.ERROR(f"Technical Details:   {pe.details}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR("Result: FAILED"))
            self.stdout.write(self.style.ERROR(f"Unexpected Exception: {str(e)}"))

        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60))
