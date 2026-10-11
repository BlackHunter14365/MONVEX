"""
Tests for Native Multi-Factor Authentication (TOTP / 2FA / RFC 6238).
Verifies:
1. MFA setup generation (Base32 secret and otpauth URL).
2. Activation via 6-digit code verification.
3. Rejection of invalid codes.
4. Login challenge when MFA is enabled on an account.
5. Successful login token resolution with mfa_token and valid TOTP code.
6. MFA deactivation.
"""
import pyotp
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Profile


class MFASecurityTests(TestCase):
    def setUp(self):
        self.username = 'mfa_test_user'
        self.password = 'StrongPassword99!'
        self.user = User.objects.create_user(
            username=self.username,
            email='mfa_test@example.com',
            password=self.password
        )
        self.profile = Profile.objects.get_or_create(user=self.user)[0]
        self.client = APIClient()

    def test_mfa_setup_flow(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/auth/mfa/setup/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('secret', response.data)
        self.assertIn('otpauth_url', response.data)

        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_mfa_enabled)
        self.assertEqual(self.profile.mfa_secret, response.data['secret'])

    def test_mfa_verify_activates_two_factor(self):
        self.client.force_authenticate(user=self.user)
        setup_resp = self.client.post('/api/v1/auth/mfa/setup/', {}, format='json')
        secret = setup_resp.data['secret']

        # Generate valid code
        valid_code = pyotp.TOTP(secret).now()
        verify_resp = self.client.post('/api/v1/auth/mfa/verify/', {'code': valid_code}, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_resp.data.get('success'))

        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_mfa_enabled)

    def test_mfa_verify_rejects_wrong_code(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/v1/auth/mfa/setup/', {}, format='json')

        verify_resp = self.client.post('/api/v1/auth/mfa/verify/', {'code': '000000'}, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(verify_resp.data.get('success'))

        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_mfa_enabled)

    def test_login_mfa_challenge_and_completion(self):
        # 1. Enable MFA on user
        secret = pyotp.random_base32()
        self.profile.mfa_secret = secret
        self.profile.is_mfa_enabled = True
        self.profile.save()

        # 2. Attempt standard login -> Must trigger MFA challenge
        self.client.force_authenticate(user=None)
        login_resp = self.client.post('/api/v1/auth/login/', {
            'identifier': self.username,
            'password': self.password
        }, format='json')

        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(login_resp.data.get('mfa_required'))
        self.assertIn('mfa_token', login_resp.data)
        self.assertNotIn('access', login_resp.data)  # Full access withheld

        mfa_token = login_resp.data['mfa_token']

        # 3. Complete MFA login challenge
        valid_code = pyotp.TOTP(secret).now()
        mfa_login_resp = self.client.post('/api/v1/auth/mfa/login/', {
            'mfa_token': mfa_token,
            'code': valid_code
        }, format='json')

        self.assertEqual(mfa_login_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(mfa_login_resp.data.get('success'))
        self.assertIn('access', mfa_login_resp.data)
        self.assertIn('monvex_refresh_token', mfa_login_resp.cookies)

    def test_mfa_disable_flow(self):
        secret = pyotp.random_base32()
        self.profile.mfa_secret = secret
        self.profile.is_mfa_enabled = True
        self.profile.save()

        self.client.force_authenticate(user=self.user)
        valid_code = pyotp.TOTP(secret).now()

        disable_resp = self.client.post('/api/v1/auth/mfa/disable/', {'code': valid_code}, format='json')
        self.assertEqual(disable_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(disable_resp.data.get('success'))

        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_mfa_enabled)
        self.assertEqual(self.profile.mfa_secret, '')
