"""
Test Suite: CORS Error Response Verification
Verifies that Access-Control-Allow-Origin: https://monvex-web.onrender.com and
Access-Control-Allow-Credentials: true are strictly present on all HTTP responses,
specifically covering 400, 401, 403, 404, 429, 500, and 503 status codes.
"""
from datetime import timedelta
from unittest.mock import patch
from django.utils import timezone
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import VerificationSession
from services.providers.base import ProviderUnavailableError


@override_settings(
    DEBUG=False,
    CORS_ALLOWED_ORIGINS=['https://monvex-web.onrender.com', 'tauri://localhost'],
    CORS_ALLOWED_ORIGIN_REGEXES=[],
    ALLOWED_HOSTS=['testserver', 'localhost', '127.0.0.1', 'monvex-backend.onrender.com', '.onrender.com'],
    AUTH_REQUIRE_EMAIL_VERIFICATION=True,
)
class CorsSecurityHardeningTestCase(TestCase):
    ORIGIN = 'https://monvex-web.onrender.com'

    def setUp(self):
        self.client = APIClient()

    def _assert_cors_headers(self, response):
        self.assertEqual(
            response.headers.get('Access-Control-Allow-Origin'),
            self.ORIGIN,
            f'Response status {response.status_code} missing Access-Control-Allow-Origin header'
        )
        self.assertEqual(
            response.headers.get('Access-Control-Allow-Credentials'),
            'true',
            f'Response status {response.status_code} missing Access-Control-Allow-Credentials header'
        )

    def test_01_options_preflight_authorized_origin(self):
        resp = self.client.options(
            '/api/v1/auth/register/',
            HTTP_ORIGIN=self.ORIGIN,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type,x-client-platform'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self._assert_cors_headers(resp)

    def test_02_options_preflight_unauthorized_wildcard_rejected(self):
        unauthorized_origin = 'https://malicious-attacker.onrender.com'
        resp = self.client.options(
            '/api/v1/auth/register/',
            HTTP_ORIGIN=unauthorized_origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST'
        )
        self.assertIsNone(resp.headers.get('Access-Control-Allow-Origin'))

    def test_03_http_400_validation_error_includes_cors(self):
        resp = self.client.post(
            '/api/v1/auth/register/',
            {},
            format='json',
            HTTP_ORIGIN=self.ORIGIN
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self._assert_cors_headers(resp)

    def test_04_http_401_unauthorized_includes_cors(self):
        resp = self.client.post(
            '/api/v1/auth/login/',
            {'identifier': 'nonexistent_user', 'password': 'BadPassword123!'},
            format='json',
            HTTP_ORIGIN=self.ORIGIN
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self._assert_cors_headers(resp)

    def test_05_http_403_forbidden_includes_cors(self):
        user = User.objects.create_user(username='disabled_user', email='dis@example.com', password='Password123!')
        user.is_active = False
        user.save()

        with override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=False):
            resp = self.client.post(
                '/api/v1/auth/login/',
                {'identifier': 'disabled_user', 'password': 'Password123!'},
                format='json',
                HTTP_ORIGIN=self.ORIGIN
            )
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
            self._assert_cors_headers(resp)

    def test_06_http_404_not_found_includes_cors(self):
        resp = self.client.get(
            '/api/v1/auth/verification/status/?verification_id=00000000-0000-0000-0000-000000000000',
            HTTP_ORIGIN=self.ORIGIN
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self._assert_cors_headers(resp)

    def test_07_http_429_rate_limit_includes_cors(self):
        user = User.objects.create_user(username='rate_user', email='rate@example.com', password='Password123!')
        now = timezone.now()
        session = VerificationSession.objects.create(
            user=user,
            destination='rate@example.com',
            purpose='REGISTRATION',
            otp_hash='a' * 64,
            expires_at=now + timedelta(minutes=10),
            last_sent_at=now
        )
        resp = self.client.post(
            '/api/v1/auth/register/resend-otp/',
            {'verification_id': str(session.id)},
            format='json',
            HTTP_ORIGIN=self.ORIGIN
        )
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self._assert_cors_headers(resp)

    def test_08_http_503_service_unavailable_includes_cors(self):
        with patch('services.verification_service.VerificationService.start_email_verification') as mock_start:
            mock_start.side_effect = ProviderUnavailableError('SMTP host down')
            resp = self.client.post(
                '/api/v1/auth/register/',
                {
                    'username': 'smtp_fail_user',
                    'email': 'fail@example.com',
                    'password': 'ValidPassword123!'
                },
                format='json',
                HTTP_ORIGIN=self.ORIGIN
            )
            self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self._assert_cors_headers(resp)

    def test_09_http_500_server_error_includes_cors(self):
        with patch('apps.authentication.views.CustomLoginView.post') as mock_post:
            mock_post.side_effect = RuntimeError('Simulated internal unhandled exception')
            resp = self.client.post(
                '/api/v1/auth/login/',
                {'identifier': 'crash_user', 'password': 'Password123!'},
                format='json',
                HTTP_ORIGIN=self.ORIGIN
            )
            self.assertEqual(resp.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self._assert_cors_headers(resp)
