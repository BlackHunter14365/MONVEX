"""
Unit & API Tests for User Registration and Provider Verification Suite
"""
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Profile, VerificationSession

@override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=True, OTP_PROVIDER='console', DEBUG=True)
class AuthOTPTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_registration_and_otp_dispatch(self):
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
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['success'])
        self.assertIn('verification_id', res.data)
        self.assertEqual(res.data['email_masked'], 'ra***l@example.com')
        self.assertNotIn('dev_otp', res.data)

        user = User.objects.get(username='rahul_sharma')
        self.assertEqual(user.email, 'rahul@example.com')
        self.assertFalse(user.profile.email_verified)
        self.assertEqual(user.profile.status, 'PENDING_VERIFICATION')

    def test_unverified_registration_is_reusable(self):
        payload1 = {
            'username': 'temp_user',
            'email': 'temp@example.com',
            'phone_number': '+91 1111111111',
            'password': 'InitialPassword123!',
            'confirm_password': 'InitialPassword123!',
            'currency': 'INR',
            'monthly_income': 50000.00
        }
        res1 = self.client.post('/api/v1/auth/register/', payload1, format='json')
        self.assertEqual(res1.status_code, 201)

        payload2 = {
            'username': 'temp_user',
            'email': 'temp@example.com',
            'phone_number': '+91 9999999999',
            'password': 'NewPassword456!',
            'confirm_password': 'NewPassword456!',
            'currency': 'INR',
            'monthly_income': 60000.00
        }
        res2 = self.client.post('/api/v1/auth/register/', payload2, format='json')
        self.assertEqual(res2.status_code, 201)

        users = User.objects.filter(username='temp_user')
        self.assertEqual(users.count(), 1)

    def test_verified_user_cannot_be_overwritten(self):
        user = User.objects.create_user(username='locked_user', email='locked@example.com', password='Password123!')
        user.profile.status = 'ACTIVE'
        user.profile.email_verified = True
        user.profile.save()

        payload = {
            'username': 'locked_user',
            'email': 'locked@example.com',
            'password': 'AnotherPassword123!',
            'confirm_password': 'AnotherPassword123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('already taken', str(res.data))

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
        self.assertEqual(res.status_code, 400)
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
