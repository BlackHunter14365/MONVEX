"""
Comprehensive Standard Authentication Test Suite
Verifies standard registration, login, JWT token issuance, refresh, profile access,
and confirms zero OTP or SMTP dependency during authentication.
"""
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from apps.authentication.models import Profile
from apps.transactions.models import Category


@override_settings(DEBUG=True)
class StandardAuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('django.core.mail.send_mail')
    def test_01_registration_success_issues_jwt_immediately(self, mock_send_mail):
        """
        User enters credentials -> Account created immediately -> Valid JWT pair returned.
        Zero email dispatch occurs.
        """
        payload = {
            'username': 'alex_investor',
            'email': 'alex@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'currency': 'USD',
            'monthly_income': 95000.00,
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get('success'))
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['username'], 'alex_investor')

        # Verify user state in DB
        user = User.objects.get(username='alex_investor')
        self.assertTrue(user.is_active)
        self.assertTrue(user.profile.email_verified)
        self.assertTrue(user.profile.is_verified)
        self.assertEqual(user.profile.status, 'ACTIVE')
        self.assertEqual(user.profile.currency, 'USD')

        # Verify default categories seeded
        user_categories = Category.objects.filter(user=user)
        self.assertGreaterEqual(user_categories.count(), 8)

        # Zero email/SMTP dispatch
        mock_send_mail.assert_not_called()

    def test_02_registration_duplicate_username_rejected(self):
        User.objects.create_user(username='existing_user', email='first@example.com', password='Password123!')

        payload = {
            'username': 'existing_user',
            'email': 'second@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_03_registration_duplicate_email_rejected(self):
        User.objects.create_user(username='first_user', email='shared@example.com', password='Password123!')

        payload = {
            'username': 'second_user',
            'email': 'shared@example.com',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_04_registration_password_mismatch_rejected(self):
        payload = {
            'username': 'mismatch_user',
            'email': 'mismatch@example.com',
            'password': 'Password123!',
            'confirm_password': 'DifferentPassword456!',
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('django.core.mail.send_mail')
    def test_05_login_with_username_success(self, mock_send_mail):
        """Standard login via username issues JWT directly without OTP."""
        user = User.objects.create_user(username='john_doe', email='john@example.com', password='MyPassword123!')
        user.profile.email_verified = True
        user.profile.status = 'ACTIVE'
        user.profile.save()

        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'john_doe',
            'password': 'MyPassword123!',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('success'))
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertNotIn('requires_otp', res.data)
        self.assertNotIn('verification_id', res.data)

        # Validate access token
        access_token = AccessToken(res.data['access'])
        self.assertEqual(str(access_token['user_id']), str(user.id))

        # Zero email dispatch
        mock_send_mail.assert_not_called()

    @patch('django.core.mail.send_mail')
    def test_06_login_with_email_success(self, mock_send_mail):
        """Standard login via email issues JWT directly without OTP."""
        user = User.objects.create_user(username='jane_doe', email='jane@example.com', password='MyPassword123!')
        user.profile.email_verified = True
        user.profile.status = 'ACTIVE'
        user.profile.save()

        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'jane@example.com',
            'password': 'MyPassword123!',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('success'))
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        mock_send_mail.assert_not_called()

    def test_07_login_invalid_password_returns_401(self):
        User.objects.create_user(username='valid_user', email='valid@example.com', password='RealPassword123!')

        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'valid_user',
            'password': 'WrongPassword999!',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data.get('code'), 'INVALID_CREDENTIALS')

    def test_08_login_nonexistent_user_returns_401(self):
        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'ghost_user',
            'password': 'Password123!',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data.get('code'), 'INVALID_CREDENTIALS')

    def test_09_login_disabled_user_returns_403(self):
        user = User.objects.create_user(username='banned_user', email='banned@example.com', password='Password123!')
        user.is_active = False
        user.save()

        res = self.client.post('/api/v1/auth/login/', {
            'identifier': 'banned_user',
            'password': 'Password123!',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data.get('code'), 'ACCOUNT_DISABLED')

    def test_10_jwt_token_refresh_lifecycle(self):
        user = User.objects.create_user(username='jwt_user', email='jwt@example.com', password='Password123!')
        refresh = RefreshToken.for_user(user)

        res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': str(refresh),
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_11_jwt_logout_blacklists_refresh_token(self):
        user = User.objects.create_user(username='logout_user', email='logout@example.com', password='Password123!')
        refresh = RefreshToken.for_user(user)

        # Logout
        res = self.client.post('/api/v1/auth/logout/', {
            'refresh': str(refresh),
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Attempting refresh with blacklisted token must fail
        refresh_res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': str(refresh),
        }, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_12_authenticated_user_profile_access(self):
        user = User.objects.create_user(username='profile_user', email='profile@example.com', password='Password123!')
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        res = self.client.get('/api/v1/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'profile_user')
        self.assertEqual(res.data['email'], 'profile@example.com')
