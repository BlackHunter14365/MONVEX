"""
Comprehensive Automated Tests for MONVEX Resend HTTPS Email API Provider & OTP Security Architecture

Covers all 12 production test scenarios:
1. Successful Resend API dispatch (mocked 200 response, payload & idempotency validation)
2. API timeout handling (transient retry and safe error normalization)
3. HTTP 401 provider authentication failure handling
4. HTTP 429 provider rate limit handling
5. HTTP 500 provider server failure handling
6. OTP delivery failure returns HTTP 503 with standardized safe JSON payload
7. Plaintext OTP is NEVER stored in database (only 64-char SHA-256 hash)
8. Registration OTP flow remains fully functional end-to-end
9. Two-stage Login OTP flow remains fully functional end-to-end
10. Resend cooldown (60 seconds) is strictly enforced with HTTP 429
11. Resend limit (5 attempts) prevents spam and locks session
12. JWT tokens are NEVER issued before successful OTP verification
"""
import json
import secrets
from datetime import timedelta
from unittest.mock import patch, MagicMock
import requests
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import Profile, VerificationSession
from services.providers.resend_verify import ResendEmailProvider
from services.providers.base import ProviderError
from services.verification_service import VerificationService

@override_settings(
    AUTH_REQUIRE_EMAIL_VERIFICATION=True,
    EMAIL_PROVIDER='resend',
    OTP_PROVIDER='resend',
    RESEND_API_KEY='re_test_dummy_key_12345',
    RESEND_FROM_EMAIL='MONVEX <onboarding@resend.dev>',
    RESEND_TIMEOUT=5,
    DEBUG=True
)
class ResendProviderAndOtpSecurityTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.provider = ResendEmailProvider()

    # -------------------------------------------------------------------------
    # Test 1: Successful Resend API dispatch
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_01_successful_resend_api_dispatch(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": "re_email_success_12345"}
        mock_post.return_value = mock_resp

        result = self.provider.send_code(
            destination="user@example.com",
            channel="email",
            metadata={"purpose": "REGISTRATION", "username": "alex", "request_id": "req_test_01"}
        )

        self.assertEqual(result["provider"], "resend")
        self.assertEqual(result["provider_verification_id"], "resend_re_email_success_12345")
        self.assertEqual(result["status"], "pending")
        self.assertEqual(len(result["otp_hash"]), 64)
        self.assertEqual(len(result["raw_otp"]), 6)
        self.assertTrue(result["raw_otp"].isdigit())

        # Verify HTTPS call headers and payload
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], "https://api.resend.com/emails")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer re_test_dummy_key_12345")
        self.assertIn("Idempotency-Key", kwargs["headers"])
        self.assertEqual(kwargs["json"]["to"], ["user@example.com"])
        self.assertEqual(kwargs["json"]["from"], "MONVEX <onboarding@resend.dev>")
        self.assertIn("Verify your MONVEX account", kwargs["json"]["subject"])
        self.assertIn(result["raw_otp"], kwargs["json"]["html"])

    # -------------------------------------------------------------------------
    # Test 2: API timeout handling (with 1 transient retry)
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.time.sleep', return_value=None)
    @patch('services.providers.resend_verify.requests.post')
    def test_02_api_timeout_handling(self, mock_post, mock_sleep):
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out after 5s")

        with self.assertRaises(ProviderError) as ctx:
            self.provider.send_code("user@example.com")

        self.assertEqual(ctx.exception.code, "OTP_DELIVERY_FAILED")
        self.assertIn("We couldn't send the verification code right now", ctx.exception.message)
        # Verify transient retry was attempted (2 calls total)
        self.assertEqual(mock_post.call_count, 2)

    # -------------------------------------------------------------------------
    # Test 3: HTTP 401 provider authentication failure
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_03_http_401_authentication_failure(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_resp.json.return_value = {"statusCode": 401, "message": "API key is invalid", "name": "invalid_api_key"}
        mock_post.return_value = mock_resp

        with self.assertRaises(ProviderError) as ctx:
            self.provider.send_code("user@example.com")

        self.assertEqual(ctx.exception.code, "OTP_DELIVERY_FAILED")
        self.assertIn("We couldn't send the verification code right now", ctx.exception.message)

    # -------------------------------------------------------------------------
    # Test 4: HTTP 429 provider rate limiting
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_04_http_429_rate_limiting(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.json.return_value = {"statusCode": 429, "message": "Too many requests", "name": "rate_limit_exceeded"}
        mock_post.return_value = mock_resp

        with self.assertRaises(ProviderError) as ctx:
            self.provider.send_code("user@example.com")

        self.assertEqual(ctx.exception.code, "OTP_DELIVERY_FAILED")
        self.assertIn("We couldn't send the verification code right now", ctx.exception.message)

    # -------------------------------------------------------------------------
    # Test 5: HTTP 500 provider server failure (transient retry)
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.time.sleep', return_value=None)
    @patch('services.providers.resend_verify.requests.post')
    def test_05_http_500_provider_failure(self, mock_post, mock_sleep):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal Server Error"
        mock_post.return_value = mock_resp

        with self.assertRaises(ProviderError) as ctx:
            self.provider.send_code("user@example.com")

        self.assertEqual(ctx.exception.code, "OTP_DELIVERY_FAILED")
        self.assertEqual(mock_post.call_count, 2)

    # -------------------------------------------------------------------------
    # Test 6: OTP delivery failure returns HTTP 503 with standardized safe JSON
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_06_otp_delivery_failure_returns_http_503(self, mock_post):
        mock_post.side_effect = requests.exceptions.ConnectionError("Network is unreachable")

        payload = {
            'username': 'fail_test_user',
            'email': 'failtest@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')

        # Must return HTTP 503 Service Unavailable, NEVER 400 Bad Request
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertFalse(res.data['success'])
        self.assertEqual(res.data['code'], 'OTP_DELIVERY_FAILED')
        self.assertIn("We couldn't send the verification code right now", res.data['message'])

    # -------------------------------------------------------------------------
    # Test 7: Plaintext OTP is NEVER stored in database
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_07_plaintext_otp_never_stored_in_database(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": "re_test_hash_check"}
        mock_post.return_value = mock_resp

        payload = {
            'username': 'crypto_user',
            'email': 'crypto@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        session = VerificationSession.objects.get(id=res.data['verification_id'])

        # SHA-256 hash length is exactly 64 hexadecimal characters
        self.assertEqual(len(session.otp_hash), 64)
        # The raw OTP string is NOT stored in any field
        self.assertFalse(hasattr(session, 'raw_otp'))
        self.assertNotIn('otp', session.metadata)

    # -------------------------------------------------------------------------
    # Test 8: Full Registration OTP Flow with Resend
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_08_registration_otp_flow_end_to_end(self, mock_post):
        captured_otp = None

        def fake_send(*args, **kwargs):
            nonlocal captured_otp
            text_body = kwargs["json"]["text"]
            for line in text_body.splitlines():
                if "VERIFICATION CODE:" in line:
                    captured_otp = line.split(":")[-1].strip()
            mock = MagicMock()
            mock.status_code = 200
            mock.json.return_value = {"id": "re_reg_flow_test"}
            return mock

        mock_post.side_effect = fake_send

        # Step 1: Register
        res_reg = self.client.post('/api/v1/auth/register/', {
            'username': 'flow_user',
            'email': 'flow@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }, format='json')

        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        vid = res_reg.data['verification_id']
        self.assertIsNotNone(captured_otp)

        user = User.objects.get(username='flow_user')
        self.assertFalse(user.is_active)
        self.assertFalse(user.profile.email_verified)

        # Step 2: Verify OTP
        res_verify = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': captured_otp
        }, format='json')

        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertTrue(res_verify.data['success'])
        self.assertIn('access', res_verify.data)
        self.assertIn('refresh', res_verify.data)

        # User is now activated and verified
        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.profile.email_verified)
        self.assertEqual(user.profile.status, 'ACTIVE')

    # -------------------------------------------------------------------------
    # Test 9: Two-stage Login OTP Flow with Resend
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_09_login_otp_flow_end_to_end(self, mock_post):
        # Create verified user
        user = User.objects.create_user(username='login_user', email='login@example.com', password='SecurePassword123!')
        user.profile.status = 'ACTIVE'
        user.profile.email_verified = True
        user.profile.save()

        captured_login_otp = None

        def fake_login_send(*args, **kwargs):
            nonlocal captured_login_otp
            text_body = kwargs["json"]["text"]
            for line in text_body.splitlines():
                if "VERIFICATION CODE:" in line:
                    captured_login_otp = line.split(":")[-1].strip()
            mock = MagicMock()
            mock.status_code = 200
            mock.json.return_value = {"id": "re_login_flow_test"}
            return mock

        mock_post.side_effect = fake_login_send

        # Stage 1: Validate credentials -> receives requires_otp
        res_login = self.client.post('/api/v1/auth/login/', {
            'username': 'login_user',
            'password': 'SecurePassword123!'
        }, format='json')

        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertTrue(res_login.data.get('requires_otp'))
        self.assertEqual(res_login.data.get('verification_purpose'), 'LOGIN')
        self.assertNotIn('access', res_login.data)
        vid = res_login.data['verification_id']

        # Stage 2: Verify Login OTP -> receives JWT
        res_otp = self.client.post('/api/v1/auth/login/verify-otp/', {
            'verification_id': vid,
            'code': captured_login_otp
        }, format='json')

        self.assertEqual(res_otp.status_code, status.HTTP_200_OK)
        self.assertTrue(res_otp.data['success'])
        self.assertIn('access', res_otp.data)
        self.assertIn('refresh', res_otp.data)

    # -------------------------------------------------------------------------
    # Test 10: Resend cooldown enforcement (HTTP 429)
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_10_resend_cooldown_enforcement(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": "re_cooldown_test"}
        mock_post.return_value = mock_resp

        res = self.client.post('/api/v1/auth/register/', {
            'username': 'cooldown_user',
            'email': 'cooldown@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }, format='json')
        vid = res.data['verification_id']

        # Immediate resend attempt within 60s cooldown
        res_early = self.client.post('/api/v1/auth/register/resend-otp/', {
            'verification_id': vid
        }, format='json')

        self.assertEqual(res_early.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res_early.data['code'], 'RESEND_COOLDOWN')

    # -------------------------------------------------------------------------
    # Test 11: Resend limit prevents spam (locks session after max resends)
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_11_resend_limit_prevention(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": "re_limit_test"}
        mock_post.return_value = mock_resp

        res = self.client.post('/api/v1/auth/register/', {
            'username': 'limit_user',
            'email': 'limit@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }, format='json')
        vid = res.data['verification_id']

        session = VerificationSession.objects.get(id=vid)
        session.resend_count = 5  # At maximum allowed
        # Advance last_sent_at beyond the 60-second cooldown to test the resend limit gate
        session.last_sent_at = timezone.now() - timedelta(seconds=70)
        session.save(update_fields=['resend_count', 'last_sent_at'])

        res_blocked = self.client.post('/api/v1/auth/register/resend-otp/', {
            'verification_id': vid
        }, format='json')

        self.assertEqual(res_blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res_blocked.data['code'], 'RESEND_LIMIT')

    # -------------------------------------------------------------------------
    # Test 12: JWT tokens are NEVER issued before successful OTP verification
    # -------------------------------------------------------------------------
    @patch('services.providers.resend_verify.requests.post')
    def test_12_jwt_never_issued_before_otp_verification(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": "re_jwt_guard"}
        mock_post.return_value = mock_resp

        # 1. Register
        res_reg = self.client.post('/api/v1/auth/register/', {
            'username': 'guard_user',
            'email': 'guard@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }, format='json')

        # Registration response MUST NOT contain JWT access or refresh tokens
        self.assertNotIn('access', res_reg.data)
        self.assertNotIn('refresh', res_reg.data)
        self.assertTrue(res_reg.data.get('requires_otp'))

        # 2. Direct login attempt with unverified account must be intercepted
        res_login = self.client.post('/api/v1/auth/login/', {
            'username': 'guard_user',
            'password': 'SecurePassword123!'
        }, format='json')

        # Unverified account is redirected to registration verification OTP, NOT issued tokens
        self.assertNotIn('access', res_login.data)
        self.assertNotIn('refresh', res_login.data)
        self.assertTrue(res_login.data.get('requires_otp'))
        self.assertEqual(res_login.data.get('verification_purpose'), 'REGISTRATION')
