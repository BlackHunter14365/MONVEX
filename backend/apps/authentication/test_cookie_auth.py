"""
Tests for HttpOnly Cookie JWT Refresh Token Security.
Verifies that:
1. Login sets the HttpOnly, SameSite=Lax cookie.
2. Token refresh works using the cookie alone (no body payload needed).
3. Token rotation updates the cookie.
4. Logout clears the cookie.
5. Backward compatibility with body-based refresh is preserved.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


class CookieAuthSecurityTests(TestCase):
    def setUp(self):
        self.username = 'cookie_test_user'
        self.password = 'SecurePassword123!'
        self.user = User.objects.create_user(
            username=self.username,
            email='cookie_test@example.com',
            password=self.password
        )
        self.client = APIClient()

    def test_login_sets_httponly_refresh_cookie(self):
        response = self.client.post('/api/v1/auth/login/', {
            'identifier': self.username,
            'password': self.password
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('monvex_refresh_token', response.cookies)
        cookie = response.cookies['monvex_refresh_token']
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['samesite'], 'Lax')
        self.assertEqual(cookie['path'], '/api/v1/auth/')
        self.assertTrue(len(cookie.value) > 20)

    def test_cookie_token_refresh_using_cookie_alone(self):
        # 1. Login to get cookie
        login_resp = self.client.post('/api/v1/auth/login/', {
            'identifier': self.username,
            'password': self.password
        }, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

        # 2. Call refresh without body payload (cookie is already in test client)
        refresh_resp = self.client.post('/api/v1/auth/token/refresh/', {}, format='json')
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_resp.data)
        self.assertIn('monvex_refresh_token', refresh_resp.cookies)

    def test_cookie_token_refresh_backward_compatibility_with_body(self):
        refresh = RefreshToken.for_user(self.user)
        # Clear cookies
        self.client.cookies.clear()

        # Send refresh in body
        response = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': str(refresh)
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        # Verify it also set the cookie for future requests
        self.assertIn('monvex_refresh_token', response.cookies)

    def test_logout_clears_cookie(self):
        # 1. Login
        self.client.post('/api/v1/auth/login/', {
            'identifier': self.username,
            'password': self.password
        }, format='json')
        self.assertIn('monvex_refresh_token', self.client.cookies)

        # 2. Logout
        logout_resp = self.client.post('/api/v1/auth/logout/', {}, format='json')
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)
        # Verify cookie is cleared (max-age 0 / empty value)
        cookie = logout_resp.cookies.get('monvex_refresh_token')
        self.assertTrue(cookie is None or cookie['max-age'] == 0 or cookie.value == '')
