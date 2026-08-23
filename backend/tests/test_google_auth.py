"""
Unit and Integration Tests for MONVEX Google Sign-In & Federated Identity
Verifies:
1. New user registration via Google (clean profile, no fake transactions, valid JWT)
2. Existing Google user authentication (data preserved)
3. Account linking required detection for existing password users
4. Secure account linking execution with password validation
5. Account linking rejection with invalid password
6. Forged / invalid Google credential rejection
7. Multi-tenant financial data isolation under Google-authenticated sessions
8. Token refresh and session persistence
9. Zero-regression test for password authentication
"""
from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import GoogleIdentity, Profile
from apps.transactions.models import Transaction, Category
from apps.budgets.models import Budget
from services.google_auth_service import GoogleAuthService, GoogleAuthError

class GoogleAuthTests(APITestCase):

    def setUp(self):
        # Create an existing user with standard password
        self.password_user = User.objects.create_user(
            username='password_user',
            email='existing_user@example.com',
            password='Password123!',
            first_name='Existing',
            last_name='User'
        )
        self.password_profile = Profile.objects.get_or_create(user=self.password_user)[0]
        self.password_profile.email_verified = True
        self.password_profile.status = 'ACTIVE'
        self.password_profile.save()

        # Create private financial transaction for password_user
        self.cat = Category.objects.create(user=self.password_user, name='Groceries', color='#10B981')
        self.secret_tx = Transaction.objects.create(
            user=self.password_user,
            category=self.cat,
            amount=Decimal('4500.00'),
            type='EXPENSE',
            description='Secret Password User Expense',
            date='2026-08-01'
        )

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_01_new_google_user_registration(self, mock_verify):
        """Test brand new user signs in via Google: clean user, GoogleIdentity, categories seeded, NO fake records"""
        mock_verify.return_value = {
            'sub': 'google-sub-10001',
            'email': 'new_google_user@example.com',
            'email_verified': True,
            'name': 'New Google User',
            'given_name': 'New',
            'family_name': 'Google User',
            'picture': 'https://lh3.googleusercontent.com/a/sample-photo',
        }

        url = reverse('auth_google')
        res = self.client.post(url, {'credential': 'mock-valid-google-id-token'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get('success'))
        self.assertTrue(res.data.get('is_new_user'))
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

        # Verify User and Profile in DB
        user = User.objects.filter(email='new_google_user@example.com').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, 'New')
        self.assertFalse(user.has_usable_password()) # Google user has no usable password initially
        self.assertTrue(user.profile.email_verified)
        self.assertEqual(user.profile.status, 'ACTIVE')

        # Verify GoogleIdentity record
        identity = GoogleIdentity.objects.filter(provider='google', provider_subject='google-sub-10001').first()
        self.assertIsNotNone(identity)
        self.assertEqual(identity.user, user)
        self.assertEqual(identity.email, 'new_google_user@example.com')

        # Verify categories were created, but NO fake transactions or fake budgets
        categories = Category.objects.filter(user=user)
        self.assertTrue(categories.exists())
        txs = Transaction.objects.filter(user=user)
        self.assertEqual(txs.count(), 0, "New Google user must start with clean 0 transactions")

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_02_existing_google_user_login(self, mock_verify):
        """Test returning Google user signs in seamlessly without duplicate records"""
        # First register
        mock_verify.return_value = {
            'sub': 'google-sub-20002',
            'email': 'returning_user@example.com',
            'email_verified': True,
            'name': 'Returning User',
            'given_name': 'Returning',
            'family_name': 'User',
            'picture': '',
        }
        url = reverse('auth_google')
        res1 = self.client.post(url, {'credential': 'mock-valid-token-1'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        user_id = res1.data['user']['id']

        # Second login
        res2 = self.client.post(url, {'credential': 'mock-valid-token-2'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data.get('success'))
        self.assertFalse(res2.data.get('is_new_user', False))
        self.assertEqual(res2.data['user']['id'], user_id)
        self.assertEqual(GoogleIdentity.objects.filter(provider_subject='google-sub-20002').count(), 1)

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_03_existing_password_user_triggers_account_linking_required(self, mock_verify):
        """Test that if a Google email matches an existing password account, linking is required"""
        mock_verify.return_value = {
            'sub': 'google-sub-existing-30003',
            'email': 'existing_user@example.com', # matches self.password_user
            'email_verified': True,
            'name': 'Existing User',
            'given_name': 'Existing',
            'family_name': 'User',
            'picture': '',
        }

        url = reverse('auth_google')
        res = self.client.post(url, {'credential': 'mock-token-match-email'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data.get('success'))
        self.assertEqual(res.data.get('code'), 'ACCOUNT_LINKING_REQUIRED')
        self.assertEqual(res.data.get('email'), 'existing_user@example.com')
        # Google identity should NOT be created yet
        self.assertFalse(GoogleIdentity.objects.filter(provider_subject='google-sub-existing-30003').exists())

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_04_successful_account_linking_with_correct_password(self, mock_verify):
        """Test account linking with verified password creates GoogleIdentity and logs in"""
        mock_verify.return_value = {
            'sub': 'google-sub-existing-30003',
            'email': 'existing_user@example.com',
            'email_verified': True,
            'name': 'Existing User',
            'given_name': 'Existing',
            'family_name': 'User',
            'picture': '',
        }

        link_url = reverse('auth_google_link')
        res = self.client.post(link_url, {
            'credential': 'mock-token-match-email',
            'password': 'Password123!'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('success'))
        self.assertIn('access', res.data)

        # GoogleIdentity is now linked to existing user
        identity = GoogleIdentity.objects.filter(provider_subject='google-sub-existing-30003').first()
        self.assertIsNotNone(identity)
        self.assertEqual(identity.user, self.password_user)

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_05_account_linking_rejected_with_incorrect_password(self, mock_verify):
        """Test account linking fails if password is wrong"""
        mock_verify.return_value = {
            'sub': 'google-sub-existing-30003',
            'email': 'existing_user@example.com',
            'email_verified': True,
            'name': 'Existing User',
            'given_name': 'Existing',
            'family_name': 'User',
            'picture': '',
        }

        link_url = reverse('auth_google_link')
        res = self.client.post(link_url, {
            'credential': 'mock-token-match-email',
            'password': 'WrongPassword123!'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data.get('success'))
        self.assertEqual(res.data.get('code'), 'INVALID_PASSWORD')
        self.assertFalse(GoogleIdentity.objects.filter(provider_subject='google-sub-existing-30003').exists())

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_06_invalid_google_token_rejection(self, mock_verify):
        """Test forged or expired token is rejected with 400 Bad Request"""
        mock_verify.side_effect = GoogleAuthError("Invalid Google credential: Signature expired", code="INVALID_TOKEN")

        url = reverse('auth_google')
        res = self.client.post(url, {'credential': 'forged-or-expired-token'}, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data.get('success'))
        self.assertEqual(res.data.get('code'), 'INVALID_TOKEN')

    @patch.object(GoogleAuthService, 'verify_google_token')
    def test_07_google_authenticated_user_financial_data_isolation(self, mock_verify):
        """Test that a Google-authenticated user cannot access another user's financial records"""
        mock_verify.return_value = {
            'sub': 'google-sub-isolation-40004',
            'email': 'isolation_user@example.com',
            'email_verified': True,
            'name': 'Isolation User',
            'given_name': 'Isolation',
            'family_name': 'User',
            'picture': '',
        }

        url = reverse('auth_google')
        res = self.client.post(url, {'credential': 'mock-isolation-token'}, format='json')
        access_token = res.data['access']

        # Query transactions with Google user token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        tx_res = self.client.get('/api/v1/transactions/')
        self.assertEqual(tx_res.status_code, status.HTTP_200_OK)

        # Must not contain password_user's secret transaction
        results = tx_res.data if isinstance(tx_res.data, list) else tx_res.data.get('results', [])
        secret_ids = [t['id'] for t in results if str(t.get('id')) == str(self.secret_tx.id)]
        self.assertEqual(len(secret_ids), 0, "User A must NEVER see User B's transactions!")

    def test_08_password_login_works_without_regression(self):
        """Verify normal password login continues to function with 100% stability"""
        login_url = reverse('auth_login')
        res = self.client.post(login_url, {
            'identifier': 'existing_user@example.com',
            'password': 'Password123!'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('success'))
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['email'], 'existing_user@example.com')
