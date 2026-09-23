from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.authentication.models import GoogleIdentity, Profile
from services.google_auth_service import GoogleAuthService

class GoogleAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_google_login_missing_credential(self):
        response = self.client.post('/api/v1/auth/google/', {}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_google_login_invalid_credential_fails_gracefully(self):
        response = self.client.post('/api/v1/auth/google/', {
            'credential': 'invalid.jwt.token.string'
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_resolve_or_create_new_google_user(self):
        claims = {
            'sub': 'google_sub_101',
            'email': 'new_google_user@monvex.com',
            'email_verified': True,
            'given_name': 'Google',
            'family_name': 'Tester',
            'picture': 'https://lh3.googleusercontent.com/a/test_pic',
        }
        res = GoogleAuthService.resolve_or_create_user(claims)
        self.assertTrue(res['success'])
        self.assertTrue(res['is_new_user'])
        self.assertIn('access', res)
        self.assertIn('refresh', res)
        
        user = User.objects.get(email='new_google_user@monvex.com')
        self.assertEqual(user.first_name, 'Google')
        self.assertEqual(user.last_name, 'Tester')
        self.assertTrue(GoogleIdentity.objects.filter(user=user, provider_subject='google_sub_101').exists())

    def test_resolve_existing_google_user(self):
        claims = {
            'sub': 'google_sub_202',
            'email': 'returning_user@monvex.com',
            'email_verified': True,
            'given_name': 'Returning',
            'family_name': 'User',
            'picture': '',
        }
        # First creation
        res1 = GoogleAuthService.resolve_or_create_user(claims)
        self.assertTrue(res1['is_new_user'])
        
        # Second login
        res2 = GoogleAuthService.resolve_or_create_user(claims)
        self.assertTrue(res2['success'])
        self.assertFalse(res2['is_new_user'])
        self.assertEqual(res2['action'], 'LOGIN')
        self.assertIn('access', res2)

    def test_resolve_existing_password_user_requires_linking(self):
        User.objects.create_user(
            username='password_user',
            email='password_user@monvex.com',
            password='Password123!'
        )
        claims = {
            'sub': 'google_sub_303',
            'email': 'password_user@monvex.com',
            'email_verified': True,
        }
        res = GoogleAuthService.resolve_or_create_user(claims)
        self.assertFalse(res['success'])
        self.assertEqual(res['code'], 'ACCOUNT_LINKING_REQUIRED')

    def test_resolve_user_with_null_claims(self):
        """Ensure claims with None for family_name and picture do not cause IntegrityError."""
        claims = {
            'sub': 'google_sub_404_nulls',
            'email': 'null_claims@monvex.com',
            'email_verified': True,
            'name': 'Cher',
            'given_name': None,
            'family_name': None,
            'picture': None,
        }
        res = GoogleAuthService.resolve_or_create_user(claims)
        self.assertTrue(res['success'])
        self.assertTrue(res['is_new_user'])
        user = User.objects.get(email='null_claims@monvex.com')
        self.assertEqual(user.first_name, 'Cher')
        self.assertEqual(user.last_name, '')
        identity = GoogleIdentity.objects.get(provider_subject='google_sub_404_nulls')
        self.assertEqual(identity.picture_url, '')

    def test_google_login_database_error_handling(self):
        """Ensure database errors during Google login return 503 instead of masking as 400."""
        from unittest.mock import patch
        from django.db import OperationalError
        with patch('services.google_auth_service.GoogleAuthService.verify_google_token', return_value={'sub': '1', 'email': 'a@b.com', 'email_verified': True}):
            with patch('services.google_auth_service.GoogleAuthService.resolve_or_create_user', side_effect=OperationalError('DB unreachable')):
                res = self.client.post('/api/v1/auth/google/', {'credential': 'valid.token.string'}, format='json')
                self.assertEqual(res.status_code, 503)
                self.assertEqual(res.data['code'], 'DATABASE_ERROR')
