"""
Unit & Integration Tests for MONVEX Contact Experience & Backend Pipeline
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.security.models import ContactSubmission, SecurityAuditLog
from services.contact_service import ContactService

class ContactBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.contact_url = "/api/v1/contact/"

    def test_contact_service_sanitization(self):
        """Verify HTML stripping and script tag neutralizing."""
        dirty = "<script>alert('xss')</script>Hello <b>world</b>"
        clean = ContactService.sanitize_input(dirty)
        self.assertNotIn("<script>", clean)
        self.assertNotIn("<b>", clean)
        self.assertIn("Hello world", clean)

    def test_contact_submission_valid(self):
        """Verify valid contact form submission creates record and audit log."""
        payload = {
            "name": "Alex Mercer",
            "email": "alex.mercer@example.com",
            "phone": "+91 9876543210",
            "message": "I would like to inquire about integrating MONVEX financial intelligence APIs."
        }
        response = self.client.post(self.contact_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('success'))
        self.assertIn("Message sent successfully", response.data.get('message'))

        # Verify DB entry
        sub = ContactSubmission.objects.filter(email="alex.mercer@example.com").first()
        self.assertIsNotNone(sub)
        self.assertEqual(sub.name, "Alex Mercer")
        self.assertEqual(sub.phone, "+91 9876543210")

        # Verify Audit Log
        audit = SecurityAuditLog.objects.filter(endpoint="/api/v1/contact/").first()
        self.assertIsNotNone(audit)
        self.assertIn("Alex Mercer", audit.description)

    def test_contact_submission_validation_errors(self):
        """Verify field validation errors for empty/invalid values."""
        # 1. Missing name & invalid email
        payload = {
            "name": "A", # Too short
            "email": "invalid-email-address",
            "phone": "invalid-phone",
            "message": "Short" # Too short
        }
        response = self.client.post(self.contact_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        errors = response.data['errors']
        self.assertIn('name', errors)
        self.assertIn('email', errors)
        self.assertIn('phone', errors)
        self.assertIn('message', errors)

    def test_contact_rate_limiting(self):
        """Verify IP rate limiting triggers after 5 rapid requests."""
        payload = {
            "name": "Tester",
            "email": "tester@example.com",
            "phone": "+1 555-123-4567",
            "message": "Valid test inquiry message that is long enough."
        }
        # First 5 should succeed
        for i in range(5):
            res = self.client.post(self.contact_url, payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # 6th request should hit 429 Too Many Requests
        res_6 = self.client.post(self.contact_url, payload, format='json')
        self.assertEqual(res_6.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
