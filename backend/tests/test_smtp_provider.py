"""
Comprehensive Unit & Integration Test Suite for MONVEX SMTP-First Custom OTP Engine
Covers:
- Cryptographically secure 6-digit OTP generation & SHA-256 hashing
- Timing-safe verification & replay prevention
- Attempt throttling & locking after 5 failures
- 60s resend cooldown & 5-resend limit enforcement
- Invalidation of previous pending OTP sessions
- Registration OTP flow & atomic user activation
- Two-Stage Login OTP flow & JWT withholding until OTP verification
- Unverified account login redirection to registration verification
- SMTP transport error classification (timeout, network error, auth failed, connection failed)
- Controlled retry strategy (1 retry for transient errors, 0 retries for auth errors)
- Strict HTTP status mapping (503 for transport failure, 429 for rate limit/cooldown)
- Zero external emails sent during test execution (mocked SMTP backend)
"""
import ssl
import time
import socket
import smtplib
import hashlib
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.utils import timezone
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import Profile, VerificationSession
from services.verification_service import VerificationService
from services.providers.smtp_verify import SmtpVerifyProvider
from services.providers.base import ProviderError
from services.email import SmtpTransport, EmailTemplateService


@override_settings(
    AUTH_REQUIRE_EMAIL_VERIFICATION=True,
    EMAIL_PROVIDER='smtp',
    OTP_PROVIDER='smtp',
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_HOST='smtp.gmail.com',
    EMAIL_PORT=465,
    EMAIL_USE_SSL=True,
    EMAIL_USE_TLS=False,
    EMAIL_HOST_USER='monvexfinance@gmail.com',
    EMAIL_HOST_PASSWORD='testapppassword123',
    DEFAULT_FROM_EMAIL='MONVEX <monvexfinance@gmail.com>',
    SERVER_EMAIL='monvexfinance@gmail.com',
    DEBUG=True
)
class SmtpCustomOtpEngineTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        mail.outbox = []
        self.provider = SmtpVerifyProvider()

    # -------------------------------------------------------------------------
    # 1. OTP Generation & Cryptographic Hashing
    # -------------------------------------------------------------------------
    def test_01_otp_generation_and_hashing(self):
        """Verify OTP is exactly 6 digits numeric and SHA-256 hash matches."""
        otp = VerificationService.generate_secure_otp()
        self.assertTrue(otp.isdigit())
        self.assertEqual(len(otp), 6)
        self.assertTrue(100000 <= int(otp) <= 999999)

        otp_hash = VerificationService.hash_otp(otp)
        expected_hash = hashlib.sha256(otp.encode('utf-8')).hexdigest()
        self.assertEqual(otp_hash, expected_hash)
        self.assertEqual(len(otp_hash), 64)

    # -------------------------------------------------------------------------
    # 2. Email Template Rendering
    # -------------------------------------------------------------------------
    def test_02_email_template_rendering(self):
        """Verify dark-theme HTML and plain-text templates render with OTP code."""
        content = EmailTemplateService.render_otp_email(
            purpose='REGISTRATION',
            raw_otp='654321',
            username='alex_trader',
            expiry_minutes=10,
            sender_email='security@monvex.ai'
        )
        self.assertIn('Verify your MONVEX account', content['subject'])
        self.assertIn('654321', content['plain_text'])
        self.assertIn('654321', content['html_content'])
        self.assertIn('10 minutes', content['plain_text'])
        self.assertIn('never share this code', content['plain_text'].lower())
        self.assertIn('MONVEX', content['html_content'])

    # -------------------------------------------------------------------------
    # 3. Successful SMTP Dispatch Simulation
    # -------------------------------------------------------------------------
    def test_03_successful_smtp_dispatch(self):
        """Verify SmtpVerifyProvider dispatches email via Django mail backend."""
        result = self.provider.send_code(
            destination='testuser@example.com',
            channel='email',
            metadata={'purpose': 'REGISTRATION', 'username': 'testuser', 'request_id': 'req_test_03'}
        )
        self.assertEqual(result['status'], 'pending')
        self.assertEqual(result['destination'], 'testuser@example.com')
        self.assertTrue(result['provider_verification_id'].startswith('smtp_vid_'))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['testuser@example.com'])
        self.assertIn('Verify your MONVEX account', mail.outbox[0].subject)

    # -------------------------------------------------------------------------
    # 4. Error Classification & Handling: Timeout with Transient Retry
    # -------------------------------------------------------------------------
    @patch('services.email.smtp_transport.time.sleep', return_value=None)
    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_04_smtp_timeout_transient_retry(self, mock_send, mock_sleep):
        """Verify transient timeout triggers single retry before raising ProviderError."""
        mock_send.side_effect = socket.timeout("timed out connecting to SMTP host")

        with self.assertRaises(ProviderError) as ctx:
            SmtpTransport.send_email(
                to_email='timeout@example.com',
                subject='Test Timeout',
                body_text='Test',
                body_html='<p>Test</p>',
                request_id='req_timeout'
            )

        self.assertEqual(ctx.exception.code, 'OTP_DELIVERY_FAILED')
        self.assertEqual(ctx.exception.details.get('error_code'), 'SMTP_TIMEOUT')
        # Confirms attempt 1 and attempt 2 (retry) were both made
        self.assertEqual(mock_send.call_count, 2)
        mock_sleep.assert_called_once_with(1.0)

    # -------------------------------------------------------------------------
    # 5. Error Classification: Network Unreachable (Errno 101)
    # -------------------------------------------------------------------------
    @patch('services.email.smtp_transport.time.sleep', return_value=None)
    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_05_smtp_network_unreachable_retry(self, mock_send, mock_sleep):
        """Verify OSError Errno 101 is classified as SMTP_NETWORK_ERROR and retried once."""
        err = OSError()
        err.errno = 101
        err.strerror = "Network is unreachable"
        mock_send.side_effect = err

        with self.assertRaises(ProviderError) as ctx:
            SmtpTransport.send_email(
                to_email='netfail@example.com',
                subject='Test Network',
                body_text='Test',
                body_html='<p>Test</p>',
                request_id='req_netfail'
            )

        self.assertEqual(ctx.exception.code, 'OTP_DELIVERY_FAILED')
        self.assertEqual(ctx.exception.details.get('error_code'), 'SMTP_NETWORK_ERROR')
        self.assertEqual(mock_send.call_count, 2)

    # -------------------------------------------------------------------------
    # 6. Error Classification: Authentication Failure (No Retry)
    # -------------------------------------------------------------------------
    @patch('services.email.smtp_transport.time.sleep', return_value=None)
    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_06_smtp_auth_failed_no_retry(self, mock_send, mock_sleep):
        """Verify SMTPAuthenticationError is classified as SMTP_AUTH_FAILED and NOT retried."""
        mock_send.side_effect = smtplib.SMTPAuthenticationError(535, b"5.7.8 Username and Password not accepted.")

        with self.assertRaises(ProviderError) as ctx:
            SmtpTransport.send_email(
                to_email='authfail@example.com',
                subject='Test Auth Fail',
                body_text='Test',
                body_html='<p>Test</p>',
                request_id='req_authfail'
            )

        self.assertEqual(ctx.exception.code, 'OTP_DELIVERY_FAILED')
        self.assertEqual(ctx.exception.details.get('error_code'), 'SMTP_AUTH_FAILED')
        # Non-transient error: must only attempt once!
        self.assertEqual(mock_send.call_count, 1)
        mock_sleep.assert_not_called()

    # -------------------------------------------------------------------------
    # 7. Error Classification: TLS/SSL Handshake Failure
    # -------------------------------------------------------------------------
    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_07_smtp_tls_error_classification(self, mock_send):
        """Verify SSLError is classified as SMTP_TLS_ERROR and not retried."""
        mock_send.side_effect = ssl.SSLError("WRONG_VERSION_NUMBER")

        with self.assertRaises(ProviderError) as ctx:
            SmtpTransport.send_email(
                to_email='tlsfail@example.com',
                subject='Test TLS Fail',
                body_text='Test',
                body_html='<p>Test</p>',
                request_id='req_tlsfail'
            )

        self.assertEqual(ctx.exception.code, 'OTP_DELIVERY_FAILED')
        self.assertEqual(ctx.exception.details.get('error_code'), 'SMTP_TLS_ERROR')
        self.assertEqual(mock_send.call_count, 1)

    # -------------------------------------------------------------------------
    # 8. Delivery Failure Maps to HTTP 503
    # -------------------------------------------------------------------------
    @patch('services.email.smtp_transport.SmtpTransport.send_email')
    def test_08_smtp_failure_maps_to_http_503(self, mock_send_email):
        """Verify registration endpoint maps SMTP transport failure to HTTP 503."""
        mock_send_email.side_effect = ProviderError(
            code="OTP_DELIVERY_FAILED",
            message="We couldn't send the verification code right now. Please try again shortly.",
            details={"error_code": "SMTP_NETWORK_ERROR"}
        )

        payload = {
            'username': 'vikram_singh',
            'email': 'vikram@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertFalse(res.data['success'])
        self.assertEqual(res.data['code'], 'OTP_DELIVERY_FAILED')

    # -------------------------------------------------------------------------
    # 9. Plaintext OTP Never Stored in Database
    # -------------------------------------------------------------------------
    def test_09_plaintext_otp_never_stored_in_database(self):
        """Verify database only stores SHA-256 hash of the OTP code."""
        payload = {
            'username': 'security_tester',
            'email': 'security@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        session = VerificationSession.objects.get(id=res.data['verification_id'])
        self.assertEqual(len(session.otp_hash), 64)

        # Extract sent code from outbox
        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', mail.outbox[0].body)
        self.assertIsNotNone(match)
        raw_code = match.group(1)

        # Raw code must NOT match stored hash directly
        self.assertNotEqual(session.otp_hash, raw_code)
        # But SHA-256 of raw code MUST match stored hash
        self.assertEqual(session.otp_hash, hashlib.sha256(raw_code.encode()).hexdigest())

    # -------------------------------------------------------------------------
    # 10. Registration OTP Flow End-to-End
    # -------------------------------------------------------------------------
    def test_10_registration_otp_flow_end_to_end(self):
        """Verify full registration -> unverified state -> verify code -> activated user + JWT."""
        payload = {
            'username': 'ananya_roy',
            'email': 'ananya@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'currency': 'INR',
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(reg_res.data['requires_otp'])
        vid = reg_res.data['verification_id']

        user = User.objects.get(username='ananya_roy')
        self.assertFalse(user.is_active)
        self.assertFalse(user.profile.email_verified)

        # Extract OTP from email
        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', mail.outbox[0].body)
        raw_otp = match.group(1)

        # Verify OTP
        verify_res = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': raw_otp
        }, format='json')

        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data['success'])
        self.assertIn('access', verify_res.data)
        self.assertIn('refresh', verify_res.data)

        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.profile.email_verified)
        self.assertEqual(user.profile.status, 'ACTIVE')

    # -------------------------------------------------------------------------
    # 11. Two-Stage Login Flow & JWT Withholding
    # -------------------------------------------------------------------------
    def test_11_login_two_stage_jwt_withheld(self):
        """Verify Stage 1 withholds JWT and returns requires_otp, Stage 2 issues JWT."""
        user = User.objects.create_user(username='login_user', email='login_user@example.com', password='Password123!')
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.status = 'ACTIVE'
        profile.email_verified = True
        profile.is_verified = True
        profile.save()

        mail.outbox = []

        # Stage 1: Post credentials
        login_res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'login_user',
            'password': 'Password123!'
        }, format='json')

        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertTrue(login_res.data['requires_otp'])
        self.assertEqual(login_res.data['verification_purpose'], 'LOGIN')
        # Crucial check: JWT tokens MUST NOT be returned in Stage 1!
        self.assertNotIn('access', login_res.data)
        self.assertNotIn('refresh', login_res.data)

        vid = login_res.data['verification_id']

        # Extract login OTP from email
        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', mail.outbox[0].body)
        raw_otp = match.group(1)

        # Stage 2: Submit OTP
        verify_res = self.client.post('/api/v1/auth/login/verify-otp/', {
            'verification_id': vid,
            'code': raw_otp
        }, format='json')

        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data['success'])
        self.assertIn('access', verify_res.data)
        self.assertIn('refresh', verify_res.data)

    # -------------------------------------------------------------------------
    # 12. Unverified Account Login Flow
    # -------------------------------------------------------------------------
    def test_12_unverified_account_login_prompts_registration_otp(self):
        """Verify attempting to log in to an unverified account prompts REGISTRATION verification."""
        user = User.objects.create_user(username='unverified_user', email='unverified@example.com', password='Password123!')
        user.is_active = False
        user.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.status = 'PENDING_VERIFICATION'
        profile.email_verified = False
        profile.save()

        mail.outbox = []
        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'unverified_user',
            'password': 'Password123!'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['requires_otp'])
        self.assertEqual(res.data['verification_purpose'], 'REGISTRATION')
        self.assertIn('verification_id', res.data)

    # -------------------------------------------------------------------------
    # 13. Resend Cooldown Enforcement (60s)
    # -------------------------------------------------------------------------
    def test_13_resend_cooldown_enforcement(self):
        """Verify resend requested within 60s cooldown is rejected with HTTP 429 RESEND_COOLDOWN."""
        payload = {
            'username': 'cooldown_user',
            'email': 'cooldown@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        vid = reg_res.data['verification_id']

        # Immediately request resend
        resend_res = self.client.post('/api/v1/auth/register/resend-otp/', {
            'verification_id': vid
        }, format='json')

        self.assertEqual(resend_res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(resend_res.data['code'], 'RESEND_COOLDOWN')

    # -------------------------------------------------------------------------
    # 14. Resend Limit Enforcement (Max 5)
    # -------------------------------------------------------------------------
    def test_14_resend_limit_enforcement(self):
        """Verify exceeding 5 resends is blocked with HTTP 429 RESEND_LIMIT."""
        payload = {
            'username': 'limit_user',
            'email': 'limit@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        vid = reg_res.data['verification_id']
        session = VerificationSession.objects.get(id=vid)

        session.resend_count = 5
        session.last_sent_at = timezone.now() - timedelta(seconds=120)
        session.save()

        resend_res = self.client.post('/api/v1/auth/register/resend-otp/', {
            'verification_id': vid
        }, format='json')

        self.assertEqual(resend_res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(resend_res.data['code'], 'RESEND_LIMIT')

    # -------------------------------------------------------------------------
    # 15. Attempt Limit Throttling & Session Lockout (5 Failed Attempts)
    # -------------------------------------------------------------------------
    def test_15_attempt_limit_and_session_lockout(self):
        """Verify 5 incorrect attempts lock the verification session."""
        payload = {
            'username': 'lockout_user',
            'email': 'lockout@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        vid = reg_res.data['verification_id']

        # Attempt 1 to 4: returns HTTP 400 with attempts remaining
        for i in range(1, 5):
            res = self.client.post('/api/v1/auth/register/verify-otp/', {
                'verification_id': vid,
                'code': '000000'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(res.data['code'], 'INVALID_OTP')

        # Attempt 5: triggers lockout (HTTP 429 TOO_MANY_ATTEMPTS)
        res_locked = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': '000000'
        }, format='json')
        self.assertEqual(res_locked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res_locked.data['code'], 'TOO_MANY_ATTEMPTS')

        session = VerificationSession.objects.get(id=vid)
        self.assertEqual(session.status, 'LOCKED')

    # -------------------------------------------------------------------------
    # 16. Replay Attack Prevention
    # -------------------------------------------------------------------------
    def test_16_replay_attack_prevention(self):
        """Verify an already verified OTP code cannot be re-used."""
        payload = {
            'username': 'replay_user',
            'email': 'replay@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        vid = reg_res.data['verification_id']

        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', mail.outbox[0].body)
        raw_otp = match.group(1)

        # First verification succeeds
        v1 = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': raw_otp
        }, format='json')
        self.assertEqual(v1.status_code, status.HTTP_200_OK)

        # Second verification attempt fails with ALREADY_VERIFIED
        v2 = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': raw_otp
        }, format='json')
        self.assertEqual(v2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(v2.data['code'], 'ALREADY_VERIFIED')

    # -------------------------------------------------------------------------
    # 17. Expiration Enforcement (10 Minutes)
    # -------------------------------------------------------------------------
    def test_17_otp_expiration_enforcement(self):
        """Verify expired OTP returns OTP_EXPIRED."""
        payload = {
            'username': 'expired_user',
            'email': 'expired@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        vid = reg_res.data['verification_id']

        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', mail.outbox[0].body)
        raw_otp = match.group(1)

        # Simulate expiration
        session = VerificationSession.objects.get(id=vid)
        session.expires_at = timezone.now() - timedelta(seconds=10)
        session.save()

        res = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': raw_otp
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'OTP_EXPIRED')

    # -------------------------------------------------------------------------
    # 18. Invalidation of Older Codes upon New Request
    # -------------------------------------------------------------------------
    def test_18_previous_otp_invalidation(self):
        """Verify requesting a new verification session for the same destination cancels previous pending sessions."""
        email = 'inval@example.com'
        resp1 = VerificationService.start_email_verification(
            user=None,
            email=email,
            purpose='REGISTRATION'
        )
        vid1 = resp1['verification_id']

        resp2 = VerificationService.start_email_verification(
            user=None,
            email=email,
            purpose='REGISTRATION'
        )
        vid2 = resp2['verification_id']

        s1 = VerificationSession.objects.get(id=vid1)
        s2 = VerificationSession.objects.get(id=vid2)

        self.assertEqual(s1.status, 'CANCELLED')
        self.assertIsNotNone(s1.invalidated_at)
        self.assertEqual(s2.status, 'PENDING')
