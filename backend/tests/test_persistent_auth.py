"""
Persistent Authentication, Token Rotation, Blacklisting, and Multi-Device Session Tests
"""
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Profile

@override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=False, DEBUG=True)
class PersistentAuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='persistent_user',
            email='persistent@example.com',
            password='ComplexPassword123!'
        )
        self.profile, _ = Profile.objects.get_or_create(user=self.user)
        self.profile.email_verified = True
        self.profile.currency = 'USD'
        self.profile.monthly_income = 90000.00
        self.profile.save()

    def test_login_returns_token_pair_and_profile(self):
        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'persistent_user',
            'password': 'ComplexPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'persistent_user')

    def test_token_refresh_rotates_and_blacklists_old_token(self):
        # 1. Login
        login_res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'persistent_user',
            'password': 'ComplexPassword123!'
        }, format='json')
        refresh_1 = login_res.data['refresh']

        # 2. Refresh token
        refresh_res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_1
        }, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_res.data)
        self.assertIn('refresh', refresh_res.data)

        refresh_2 = refresh_res.data['refresh']
        self.assertNotEqual(refresh_1, refresh_2)

        # 3. Old refresh token must now be blacklisted
        failed_res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_1
        }, format='json')
        self.assertEqual(failed_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 4. New refresh token is active and valid
        valid_res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_2
        }, format='json')
        self.assertEqual(valid_res.status_code, status.HTTP_200_OK)

    def test_manual_logout_blacklists_refresh_token(self):
        login_res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'persistent_user',
            'password': 'ComplexPassword123!'
        }, format='json')
        refresh_token = login_res.data['refresh']

        # Manual logout call
        logout_res = self.client.post('/api/v1/auth/logout/', {
            'refresh': refresh_token
        }, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)
        self.assertTrue(logout_res.data['success'])

        # Attempting refresh with blacklisted token must fail
        refresh_attempt = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_token
        }, format='json')
        self.assertEqual(refresh_attempt.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_multi_device_independent_sessions(self):
        # Device 1 (e.g. Phone)
        res_device1 = self.client.post('/api/v1/auth/login/', {
            'identifier': 'persistent_user',
            'password': 'ComplexPassword123!'
        }, format='json')
        refresh_dev1 = res_device1.data['refresh']

        # Device 2 (e.g. Laptop)
        res_device2 = self.client.post('/api/v1/auth/login/', {
            'identifier': 'persistent_user',
            'password': 'ComplexPassword123!'
        }, format='json')
        refresh_dev2 = res_device2.data['refresh']

        self.assertNotEqual(refresh_dev1, refresh_dev2)

        # Logout Device 1
        self.client.post('/api/v1/auth/logout/', {'refresh': refresh_dev1}, format='json')

        # Device 1 token is blacklisted
        res1 = self.client.post('/api/v1/auth/token/refresh/', {'refresh': refresh_dev1}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_401_UNAUTHORIZED)

        # Device 2 session is untouched and valid!
        res2 = self.client.post('/api/v1/auth/token/refresh/', {'refresh': refresh_dev2}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertIn('access', res2.data)

    def test_invalid_refresh_token_rejected(self):
        res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': 'invalid_or_tampered_token_string'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
