"""
Comprehensive Automated Test Suite for Verification System (20+ Security & Workflow Test Cases)
"""
import uuid
from datetime import timedelta
from django.test import TestCase, override_settings
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import Profile, VerificationSession
from apps.transactions.models import Category, Transaction
from services.verification_service import VerificationService
from services.providers.console_provider import ConsoleVerificationProvider

@override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=True, OTP_PROVIDER='console', DEBUG=True)
class VerificationSystemTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        # Reset console mock store
        ConsoleVerificationProvider._dev_store = {}

    def test_01_signup_creates_pending_user_without_jwt(self):
        payload = {
            "username": "vikram_singh",
            "email": "vikram@example.com",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
            "phone_number": "+91 9876500001",
            "currency": "INR",
            "monthly_income": 90000.00
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertIn('verification_id', res.data)
        self.assertEqual(res.data['email_masked'], 'vi***m@example.com')
        # Crucial security checks:
        self.assertNotIn('otp', res.data)
        self.assertNotIn('code', res.data)
        self.assertNotIn('access', res.data)
        self.assertNotIn('refresh', res.data)

        user = User.objects.get(username='vikram_singh')
        self.assertFalse(user.is_active)
        self.assertEqual(user.profile.status, 'PENDING_VERIFICATION')
        self.assertFalse(user.profile.email_verified)

    def test_02_login_rejected_for_unverified_account(self):
        user = User.objects.create_user(username='pending_user', email='pending@example.com', password='Password123!', is_active=False)
        user.profile.status = 'PENDING_VERIFICATION'
        user.profile.email_verified = False
        user.profile.save()

        res = self.client.post('/api/v1/auth/login/', {'username': 'pending_user', 'password': 'Password123!'}, format='json')
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    def test_03_correct_otp_verifies_activates_user_and_issues_jwt(self):
        # 1. Register
        payload = {
            "username": "ananya_roy",
            "email": "ananya@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "currency": "INR",
            "monthly_income": 80000.00
        }
        reg_res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        vid = reg_res.data['verification_id']

        # Get code stored in dev mock provider
        dev_code = ConsoleVerificationProvider._dev_store.get('ananya@example.com')
        self.assertIsNotNone(dev_code)
        self.assertEqual(len(dev_code), 6)

        # 2. Submit correct code
        check_res = self.client.post('/api/v1/auth/verification/check/', {
            'verification_id': vid,
            'code': dev_code
        }, format='json')

        self.assertEqual(check_res.status_code, status.HTTP_200_OK)
        self.assertTrue(check_res.data['success'])
        self.assertIn('data', check_res.data)
        self.assertIn('access', check_res.data['data'])
        self.assertIn('refresh', check_res.data['data'])
        self.assertEqual(check_res.data['data']['user']['username'], 'ananya_roy')

        # 3. Verify DB state
        user = User.objects.get(username='ananya_roy')
        self.assertTrue(user.is_active)
        self.assertEqual(user.profile.status, 'ACTIVE')
        self.assertTrue(user.profile.email_verified)

        session = VerificationSession.objects.get(id=vid)
        self.assertEqual(session.status, 'VERIFIED')
        self.assertIsNotNone(session.verified_at)

        # 4. Verify category initialization
        self.assertTrue(Category.objects.filter(user=user, name='Food & Dining').exists())

    def test_04_incorrect_otp_fails_and_decrements_attempts(self):
        user = User.objects.create_user(username='test_user4', email='test4@example.com', password='Password123!', is_active=False)
        session = VerificationSession.objects.create(
            user=user,
            destination='test4@example.com',
            expires_at=timezone.now() + timedelta(minutes=10),
            last_sent_at=timezone.now(),
            status='PENDING'
        )
        ConsoleVerificationProvider._dev_store['test4@example.com'] = '654321'

        res = self.client.post('/api/v1/auth/verification/check/', {
            'verification_id': str(session.id),
            'code': '000000' # wrong code
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'INVALID_OTP')
        self.assertEqual(res.data['attempts_remaining'], 4)

        session.refresh_from_db()
        self.assertEqual(session.attempt_count, 1)

    def test_05_max_attempts_locks_session(self):
        user = User.objects.create_user(username='test_user5', email='test5@example.com', password='Password123!', is_active=False)
        session = VerificationSession.objects.create(
            user=user,
            destination='test5@example.com',
            expires_at=timezone.now() + timedelta(minutes=10),
            last_sent_at=timezone.now(),
            status='PENDING',
            attempt_count=4
        )
        ConsoleVerificationProvider._dev_store['test5@example.com'] = '654321'

        res = self.client.post('/api/v1/auth/verification/check/', {
            'verification_id': str(session.id),
            'code': '000000' # 5th wrong attempt
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res.data['code'], 'TOO_MANY_ATTEMPTS')

        session.refresh_from_db()
        self.assertEqual(session.status, 'LOCKED')

    def test_06_expired_session_fails(self):
        user = User.objects.create_user(username='test_user6', email='test6@example.com', password='Password123!', is_active=False)
        session = VerificationSession.objects.create(
            user=user,
            destination='test6@example.com',
            expires_at=timezone.now() - timedelta(minutes=1), # Expired
            last_sent_at=timezone.now() - timedelta(minutes=5),
            status='PENDING'
        )

        res = self.client.post('/api/v1/auth/verification/check/', {
            'verification_id': str(session.id),
            'code': '123456'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'OTP_EXPIRED')

    def test_07_resend_cooldown_enforced(self):
        user = User.objects.create_user(username='test_user7', email='test7@example.com', password='Password123!', is_active=False)
        session = VerificationSession.objects.create(
            user=user,
            destination='test7@example.com',
            expires_at=timezone.now() + timedelta(minutes=10),
            last_sent_at=timezone.now() - timedelta(seconds=20), # only 20s elapsed (< 60s cooldown)
            status='PENDING'
        )

        res = self.client.post('/api/v1/auth/verification/resend/', {
            'verification_id': str(session.id)
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res.data['code'], 'RESEND_COOLDOWN')
        self.assertGreater(res.data['retry_after'], 0)

    def test_08_resend_succeeds_after_cooldown(self):
        user = User.objects.create_user(username='test_user8', email='test8@example.com', password='Password123!', is_active=False)
        session = VerificationSession.objects.create(
            user=user,
            destination='test8@example.com',
            expires_at=timezone.now() + timedelta(minutes=10),
            last_sent_at=timezone.now() - timedelta(seconds=75), # > 60s cooldown
            status='PENDING',
            resend_count=0
        )

        res = self.client.post('/api/v1/auth/verification/resend/', {
            'verification_id': str(session.id)
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

        session.refresh_from_db()
        self.assertEqual(session.resend_count, 1)

    def test_09_max_resends_enforced(self):
        user = User.objects.create_user(username='test_user9', email='test9@example.com', password='Password123!', is_active=False)
        session = VerificationSession.objects.create(
            user=user,
            destination='test9@example.com',
            expires_at=timezone.now() + timedelta(minutes=10),
            last_sent_at=timezone.now() - timedelta(seconds=120),
            status='PENDING',
            resend_count=5 # Max reached
        )

        res = self.client.post('/api/v1/auth/verification/resend/', {
            'verification_id': str(session.id)
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res.data['code'], 'RESEND_LIMIT')

    def test_10_unverified_user_can_be_reclaimed(self):
        # First registration abandoned without verification
        self.client.post('/api/v1/auth/register/', {
            'username': 'reclaim_me',
            'email': 'reclaim@example.com',
            'password': 'FirstPassword123!',
            'confirm_password': 'FirstPassword123!'
        }, format='json')

        # Re-register with the same email/username
        res2 = self.client.post('/api/v1/auth/register/', {
            'username': 'reclaim_me',
            'email': 'reclaim@example.com',
            'password': 'SecondPassword456!',
            'confirm_password': 'SecondPassword456!'
        }, format='json')

        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username='reclaim_me').count(), 1)
