"""
Comprehensive Unit & API Tests for MONVEX Email OTP Authentication System
Covers Registration OTP, Two-Stage Login OTP, SHA-256 Hashing, Replay Prevention,
Attempt Throttling, Expiration, and Resend Cooldown.
"""
import hashlib
from datetime import timedelta
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.utils import timezone
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Profile, VerificationSession
from services.verification_service import VerificationService

@override_settings(
    AUTH_REQUIRE_EMAIL_VERIFICATION=True,
    OTP_PROVIDER='smtp',
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='MONVEX <monvexfinance@gmail.com>',
    EMAIL_HOST_USER='monvexfinance@gmail.com',
    DEBUG=True
)
class ProductionAuthOTPTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        mail.outbox = []

    def test_registration_flow_and_hash_storage(self):
        payload = {
            'username': 'rahul_sharma',
            'email': 'rahul@example.com',
            'phone_number': '+91 9876543210',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'currency': 'INR',
            'monthly_income': 85000.00
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertIn('verification_id', res.data)
        self.assertEqual(res.data['email_masked'], 'ra***l@example.com')
        self.assertEqual(res.data['expires_in'], 600)
        self.assertEqual(res.data['resend_after'], 60)

        # 1. User created unverified
        user = User.objects.get(username='rahul_sharma')
        self.assertFalse(user.is_active)
        self.assertFalse(user.profile.email_verified)
        self.assertEqual(user.profile.status, 'PENDING_VERIFICATION')

        # 2. Database stores SHA-256 hash, NOT raw plaintext OTP
        session = VerificationSession.objects.get(id=res.data['verification_id'])
        self.assertEqual(session.status, 'PENDING')
        self.assertEqual(session.purpose, 'REGISTRATION')
        self.assertEqual(len(session.otp_hash), 64) # SHA-256 hex digest length
        self.assertIsNone(session.used_at)
        self.assertEqual(session.attempt_count, 0)
        self.assertEqual(session.max_attempts, 5)

        # 3. Email was dispatched via official sender
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ['rahul@example.com'])
        self.assertEqual(sent_email.from_email, 'MONVEX <monvexfinance@gmail.com>')
        self.assertIn('Verify your MONVEX account', sent_email.subject)

        # Extract the 6-digit code from email body
        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', sent_email.body)
        self.assertIsNotNone(match)
        raw_code = match.group(1)

        # Confirm hash in DB matches SHA-256 of extracted raw code
        expected_hash = hashlib.sha256(raw_code.encode('utf-8')).hexdigest()
        self.assertEqual(session.otp_hash, expected_hash)

        # 4. Successful Verification activates account and issues tokens
        verify_res = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': str(session.id),
            'code': raw_code
        }, format='json')

        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data['success'])
        self.assertIn('access', verify_res.data)
        self.assertIn('refresh', verify_res.data)

        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.profile.email_verified)
        self.assertEqual(user.profile.status, 'ACTIVE')

        session.refresh_from_db()
        self.assertEqual(session.status, 'VERIFIED')
        self.assertIsNotNone(session.used_at)

        # 5. Anti-Replay: Attempting to verify the same session again must fail
        replay_res = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': str(session.id),
            'code': raw_code
        }, format='json')
        self.assertEqual(replay_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(replay_res.data['success'])
        self.assertEqual(replay_res.data['code'], 'ALREADY_VERIFIED')

    def test_attempt_throttling_and_lockout(self):
        # Create user and start registration verification
        user = User.objects.create_user(username='test_throttle', email='throttle@example.com', password='Password123!')
        otp_resp = VerificationService.start_email_verification(user=user, email=user.email, purpose='REGISTRATION')
        vid = otp_resp['verification_id']

        # Attempt 1 to 4: Wrong code returns INVALID_OTP and attempts remaining
        for attempt in range(1, 5):
            res = self.client.post('/api/v1/auth/register/verify-otp/', {
                'verification_id': vid,
                'code': '000000'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(res.data['success'])
            self.assertEqual(res.data['code'], 'INVALID_OTP')
            self.assertEqual(res.data['attempts_remaining'], 5 - attempt)

        # Attempt 5: Exceeds max attempts, session is LOCKED
        res5 = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': '000000'
        }, format='json')
        self.assertEqual(res5.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res5.data['code'], 'TOO_MANY_ATTEMPTS')

        session = VerificationSession.objects.get(id=vid)
        self.assertEqual(session.status, 'LOCKED')
        self.assertEqual(session.attempt_count, 5)

    def test_expired_otp_rejection(self):
        user = User.objects.create_user(username='test_expire', email='expire@example.com', password='Password123!')
        otp_resp = VerificationService.start_email_verification(user=user, email=user.email, purpose='REGISTRATION')
        vid = otp_resp['verification_id']

        # Artificially age the session beyond 10 minutes
        session = VerificationSession.objects.get(id=vid)
        session.expires_at = timezone.now() - timedelta(minutes=1)
        session.save(update_fields=['expires_at'])

        res = self.client.post('/api/v1/auth/register/verify-otp/', {
            'verification_id': vid,
            'code': '123456'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'OTP_EXPIRED')

    def test_resend_cooldown_and_invalidation(self):
        user = User.objects.create_user(username='test_cooldown', email='cooldown@example.com', password='Password123!')
        otp_resp = VerificationService.start_email_verification(user=user, email=user.email, purpose='REGISTRATION')
        vid = otp_resp['verification_id']
        session = VerificationSession.objects.get(id=vid)
        initial_hash = session.otp_hash

        # Attempting resend immediately (< 60s cooldown)
        res_fail = self.client.post('/api/v1/auth/register/resend-otp/', {
            'verification_id': vid
        }, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res_fail.data['code'], 'RESEND_COOLDOWN')

        # Fast forward last_sent_at by 65 seconds
        session.last_sent_at = timezone.now() - timedelta(seconds=65)
        session.save(update_fields=['last_sent_at'])

        # Resend succeeds after cooldown
        res_ok = self.client.post('/api/v1/auth/register/resend-otp/', {
            'verification_id': vid
        }, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertTrue(res_ok.data['success'])

        # Check that old hash was replaced and attempt count reset
        session.refresh_from_db()
        self.assertNotEqual(session.otp_hash, initial_hash)
        self.assertEqual(session.resend_count, 1)
        self.assertEqual(session.attempt_count, 0)

    def test_two_stage_login_flow(self):
        # Create an active, verified user
        user = User.objects.create_user(
            username='monvex_trader',
            email='trader@monvex.com',
            password='MasterPassword123!'
        )
        user.is_active = True
        user.save()
        user.profile.status = 'ACTIVE'
        user.profile.email_verified = True
        user.profile.save()

        # Stage 1: Valid credentials request LOGIN OTP
        login_stage1 = self.client.post('/api/v1/auth/login/', {
            'identifier': 'monvex_trader',
            'password': 'MasterPassword123!'
        }, format='json')

        self.assertEqual(login_stage1.status_code, status.HTTP_200_OK)
        self.assertTrue(login_stage1.data['success'])
        self.assertTrue(login_stage1.data['requires_otp'])
        self.assertIn('verification_id', login_stage1.data)
        self.assertNotIn('access', login_stage1.data) # NO JWT tokens at Stage 1

        vid = login_stage1.data['verification_id']
        session = VerificationSession.objects.get(id=vid)
        self.assertEqual(session.purpose, 'LOGIN')

        # Check email was dispatched with login subject
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn('MONVEX Login Verification Code', sent_email.subject)
        self.assertEqual(sent_email.to, ['trader@monvex.com'])

        import re
        match = re.search(r'VERIFICATION CODE:\s*(\d{6})', sent_email.body)
        self.assertIsNotNone(match)
        login_code = match.group(1)

        # Stage 2: Submit valid login OTP
        login_stage2 = self.client.post('/api/v1/auth/login/verify-otp/', {
            'verification_id': vid,
            'code': login_code
        }, format='json')

        self.assertEqual(login_stage2.status_code, status.HTTP_200_OK)
        self.assertTrue(login_stage2.data['success'])
        self.assertIn('access', login_stage2.data)
        self.assertIn('refresh', login_stage2.data)
        self.assertEqual(login_stage2.data['user']['username'], 'monvex_trader')

        # Anti-Replay: used login OTP cannot be reused
        replay_login = self.client.post('/api/v1/auth/login/verify-otp/', {
            'verification_id': vid,
            'code': login_code
        }, format='json')
        self.assertEqual(replay_login.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(replay_login.data['success'])

    def test_invalid_login_credentials_returns_generic_error(self):
        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'nonexistent_user',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(res.data['success'])
        self.assertEqual(res.data['message'], 'Invalid username/email or password.')
        self.assertEqual(len(mail.outbox), 0)


@override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=False, DEBUG=True)
class SimplifiedAuthTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_simplified_registration_and_direct_jwt(self):
        payload = {
            'username': 'drix',
            'email': 'drix@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'currency': 'INR',
            'monthly_income': 75000.00
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['success'])
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'drix')

        user = User.objects.get(username='drix')
        self.assertTrue(user.is_active)
        self.assertEqual(user.profile.status, 'ACTIVE')

    def test_login_with_username_or_email(self):
        User.objects.create_user(
            username='johndoe',
            email='john@example.com',
            password='SecretPassword123!'
        )

        # Login with username
        res1 = self.client.post('/api/v1/auth/login/', {
            'identifier': 'johndoe',
            'password': 'SecretPassword123!'
        }, format='json')
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.data['success'])
        self.assertIn('access', res1.data)

        # Login with email (case insensitive)
        res2 = self.client.post('/api/v1/auth/login/', {
            'identifier': 'JOHN@example.com',
            'password': 'SecretPassword123!'
        }, format='json')
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.data['success'])
        self.assertIn('access', res2.data)

    def test_invalid_credentials_error_message(self):
        User.objects.create_user(
            username='user_a',
            email='a@example.com',
            password='SecretPassword123!'
        )

        # Wrong password
        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'user_a',
            'password': 'WrongPassword!'
        }, format='json')
        self.assertEqual(res.status_code, 401)
        self.assertIn('Invalid username/email or password', str(res.data))

    def test_logout_endpoint(self):
        user = User.objects.create_user(
            username='logout_user',
            email='logout@example.com',
            password='SecretPassword123!'
        )
        login_res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'logout_user',
            'password': 'SecretPassword123!'
        }, format='json')
        refresh = login_res.data['refresh']

        logout_res = self.client.post('/api/v1/auth/logout/', {
            'refresh': refresh
        }, format='json')
        self.assertEqual(logout_res.status_code, 200)
        self.assertTrue(logout_res.data['success'])
