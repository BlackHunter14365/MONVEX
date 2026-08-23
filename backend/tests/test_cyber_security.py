from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.security.models import SecurityAuditLog


class CyberSecuritySystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sec_admin',
            email='sec_admin@monvex.local',
            password='HardenedPassword123!@#'
        )
        self.client.force_authenticate(user=self.user)

    def test_sql_injection_blocked_by_waf(self):
        """Test WAF intercepts and blocks hostile SQLi query with 403 Forbidden"""
        response = self.client.get('/api/v1/transactions/?category=UNION SELECT 1,2,3--')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json().get('error'), 'HOSTILE_PAYLOAD_BLOCKED')
        self.assertEqual(response.json().get('code'), 'SECURITY_THREAT_INTERCEPTED')

        # Verify audit log recorded
        log = SecurityAuditLog.objects.filter(event_type='INJECTION_BLOCKED').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.severity, 'CRITICAL')
        self.assertEqual(log.metadata.get('threat_type'), 'SQL_INJECTION')

    def test_xss_injection_blocked_by_waf(self):
        """Test WAF intercepts and blocks script payload with 403 Forbidden"""
        response = self.client.post('/api/v1/transactions/', {
            "amount": 100,
            "description": "<script>alert(document.cookie)</script>",
            "category": "General"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json().get('code'), 'SECURITY_THREAT_INTERCEPTED')

        log = SecurityAuditLog.objects.filter(event_type='INJECTION_BLOCKED').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.metadata.get('threat_type'), 'CROSS_SITE_SCRIPTING_XSS')

    def test_path_traversal_blocked(self):
        """Test WAF blocks path traversal attempts"""
        response = self.client.get('/api/v1/analytics/summary/?file=../../etc/passwd')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_security_overview_endpoint(self):
        """Test /api/v1/security/overview/ returns active defense shields and metrics"""
        response = self.client.get('/api/v1/security/overview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data.get('health_score'), 98)
        self.assertEqual(data.get('security_status'), 'Enterprise Hardened')
        self.assertGreaterEqual(len(data.get('shields', [])), 5)

    def test_security_audit_logs_list(self):
        """Test /api/v1/security/logs/ returns paginated audit events"""
        SecurityAuditLog.objects.create(
            user=self.user,
            event_type='AUTH_SUCCESS',
            severity='INFO',
            source_ip='127.0.0.1',
            description='Test login event'
        )
        response = self.client.get('/api/v1/security/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.json().get('results', [])), 1)

    def test_vulnerability_self_scan(self):
        """Test /api/v1/security/scan/ performs live diagnostic scan with 100% score"""
        response = self.client.post('/api/v1/security/scan/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get('passed'))
        self.assertEqual(data.get('overall_score'), '100%')
        self.assertEqual(data.get('total_tests'), 6)
        self.assertEqual(data.get('failed_tests'), 0)

    def test_revoke_all_sessions(self):
        """Test /api/v1/security/revoke-sessions/ invalidates tokens and logs event"""
        response = self.client.post('/api/v1/security/revoke-sessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get('success'))

        log = SecurityAuditLog.objects.filter(event_type='SESSION_REVOKED').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.severity, 'WARNING')
