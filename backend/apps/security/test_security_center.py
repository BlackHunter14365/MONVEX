"""
MONVEX Automated Test Suite: Cyber Defense & Security Center
Validates:
1. Unauthenticated rejection across all security endpoints.
2. Real security scanner execution and evidence-backed scoring.
3. Multi-session tracking and server-side revocation.
4. Preserving current session while revoking other sessions.
5. Invalidation of revoked refresh tokens and revoked access tokens.
6. Multi-tenant / cross-user session isolation.
7. Cryptographic audit log hash chaining and tamper detection.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from apps.security.models import SecurityAuditLog, UserSession, SecurityScan, verify_audit_log_chain
from apps.security.session_utils import issue_session_tokens, revoke_other_sessions


class SecurityCenterTestSuite(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='sec_analyst_1',
            email='analyst1@monvex.com',
            password='ComplexPassword123!'
        )
        self.user2 = User.objects.create_user(
            username='sec_analyst_2',
            email='analyst2@monvex.com',
            password='ComplexPassword456!'
        )

        # Issue active session for User 1
        self.session1_a, self.refresh1_a, self.access1_a = issue_session_tokens(
            self.user1, device_name='Analyst Desktop'
        )

    def test_01_unauthenticated_requests_rejected(self):
        """Unauthenticated requests to all security endpoints must be rejected with 401."""
        endpoints = [
            ('GET', '/api/v1/security/overview/'),
            ('GET', '/api/v1/security/logs/'),
            ('POST', '/api/v1/security/scan/'),
            ('POST', '/api/v1/security/revoke-sessions/'),
        ]
        for method, ep in endpoints:
            if method == 'GET':
                resp = self.client.get(ep)
            else:
                resp = self.client.post(ep)
            self.assertEqual(
                resp.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {ep} failed to enforce authentication."
            )

    def test_02_security_scan_execution_and_findings(self):
        """Authenticated security scan executes real checks without fabricated results."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.access1_a)}')
        resp = self.client.post('/api/v1/security/scan/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.json()
        self.assertTrue(data['success'])
        self.assertIn('scan_id', data)
        self.assertEqual(data['total_tests'], 13)
        self.assertGreaterEqual(data['score'], 0)
        self.assertLessEqual(data['score'], 100)
        self.assertTrue(len(data['results']) == 13)

        # Verify discrete real checks
        check_ids = [r['id'] for r in data['results']]
        self.assertIn('CHK-DEBUG', check_ids)
        self.assertIn('CHK-SECRET-KEY', check_ids)
        self.assertIn('CHK-CSRF-PROTECTION', check_ids)
        self.assertIn('CHK-TOKEN-ROTATION', check_ids)
        self.assertIn('CHK-WAF-INTRUSION-PREVENTION', check_ids)
        self.assertIn('CHK-AUDIT-PERSISTENCE', check_ids)

        # Verify zero secret leakage
        raw_text = str(data)
        self.assertNotIn('ComplexPassword', raw_text)

        # Verify DB persistence
        scan_id = data['scan_id']
        self.assertTrue(SecurityScan.objects.filter(id=scan_id).exists())
        self.assertTrue(SecurityAuditLog.objects.filter(event_type='VULNERABILITY_SCAN').exists())

    def test_03_revoke_other_sessions_with_single_session(self):
        """Revoking when only one session exists returns a clean 0-count without error."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.access1_a)}')
        resp = self.client.post('/api/v1/security/revoke-sessions/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['revoked_count'], 0)
        self.assertIn('No other active sessions', data['message'])

        # Current session remains valid
        overview_resp = self.client.get('/api/v1/security/overview/')
        self.assertEqual(overview_resp.status_code, status.HTTP_200_OK)

    def test_04_revoke_other_sessions_multi_device(self):
        """
        Multiple active sessions belonging to the same user:
        Revoking from Session A invalidates Session B & C while preserving Session A.
        """
        # Create 2 other sessions for User 1 (simulating phone and tablet)
        session1_b, refresh1_b, access1_b = issue_session_tokens(
            self.user1, device_name='iPhone 15 Pro'
        )
        session1_c, refresh1_c, access1_c = issue_session_tokens(
            self.user1, device_name='Android Tablet'
        )

        self.assertEqual(UserSession.objects.filter(user=self.user1, is_active=True).count(), 3)

        # Session A calls revoke-sessions
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.access1_a)}')
        resp = self.client.post('/api/v1/security/revoke-sessions/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(data['revoked_count'], 2)

        # Verify DB states
        self.session1_a.refresh_from_db()
        session1_b.refresh_from_db()
        session1_c.refresh_from_db()

        self.assertTrue(self.session1_a.is_active)
        self.assertFalse(session1_b.is_active)
        self.assertFalse(session1_c.is_active)
        self.assertIsNotNone(session1_b.revoked_at)
        self.assertIsNotNone(session1_c.revoked_at)

        # Verify SimpleJWT blacklisted tokens
        self.assertTrue(
            BlacklistedToken.objects.filter(token__jti=session1_b.refresh_jti).exists()
        )
        self.assertTrue(
            BlacklistedToken.objects.filter(token__jti=session1_c.refresh_jti).exists()
        )
        self.assertFalse(
            BlacklistedToken.objects.filter(token__jti=self.session1_a.refresh_jti).exists()
        )

        # Test Session B attempting refresh token usage -> rejected 401
        refresh_client = APIClient()
        refresh_resp = refresh_client.post('/api/v1/auth/token/refresh/', data={'refresh': str(refresh1_b)})
        self.assertEqual(refresh_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test Session B access token rejected on protected endpoint
        b_client = APIClient()
        b_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access1_b)}')
        b_resp = b_client.get('/api/v1/security/overview/')
        self.assertEqual(b_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test Session A still functions smoothly
        a_resp = self.client.get('/api/v1/security/overview/')
        self.assertEqual(a_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(a_resp.json()['session_isolation']['status'], 'Single Active Session')

    def test_05_cross_user_isolation(self):
        """Revoking sessions for User 1 does NOT affect User 2's sessions."""
        session2, refresh2, access2 = issue_session_tokens(
            self.user2, device_name='User 2 Laptop'
        )

        # User 1 revokes other sessions
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.access1_a)}')
        self.client.post('/api/v1/security/revoke-sessions/')

        # User 2 session must remain completely active and valid
        session2.refresh_from_db()
        self.assertTrue(session2.is_active)

        user2_client = APIClient()
        user2_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access2)}')
        u2_resp = user2_client.get('/api/v1/security/overview/')
        self.assertEqual(u2_resp.status_code, status.HTTP_200_OK)

    def test_06_audit_log_hash_chain_integrity(self):
        """Verifies cryptographic SHA-256 hash chaining and tamper detection."""
        # Initial chain verification
        initial_check = verify_audit_log_chain()
        self.assertTrue(initial_check['valid'])

        # Create multiple log entries
        log1 = SecurityAuditLog.objects.create(
            user=self.user1,
            event_type='AUTH_SUCCESS',
            severity='INFO',
            source_ip='192.168.1.10',
            description='Test login event 1'
        )
        log2 = SecurityAuditLog.objects.create(
            user=self.user1,
            event_type='TOKEN_ROTATED',
            severity='INFO',
            source_ip='192.168.1.10',
            description='Test token rotated event 2'
        )

        # Hash chain must be valid
        check_after = verify_audit_log_chain()
        self.assertTrue(check_after['valid'])
        self.assertEqual(log2.prev_hash, log1.hash)

        # Simulate adversarial tamper: mutate log1's description directly in DB without recalculating hash
        SecurityAuditLog.objects.filter(id=log1.id).update(description='Adversarial Tampered Description')

        # Chain verification must now detect the tampering
        tamper_check = verify_audit_log_chain()
        self.assertFalse(tamper_check['valid'])
        self.assertEqual(tamper_check['reason'], 'HASH_PAYLOAD_TAMPERED')

    def test_07_security_overview_structure(self):
        """Security overview returns all required evidence-backed cards and shields."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.access1_a)}')
        resp = self.client.get('/api/v1/security/overview/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.json()
        self.assertIn('health_score', data)
        self.assertIn('perimeter_defense', data)
        self.assertIn('session_isolation', data)
        self.assertIn('defense_health_score', data)
        self.assertIn('audit_stream', data)
        self.assertIn('shields', data)
        self.assertIn('active_sessions', data)
        self.assertIn('recent_audit_logs', data)

        self.assertEqual(len(data['shields']), 6)
        self.assertEqual(data['session_isolation']['status'], 'Single Active Session')
