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
