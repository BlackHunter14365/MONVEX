import uuid
from django.db import models
from django.contrib.auth.models import User


class SecurityAuditLog(models.Model):
    EVENT_CHOICES = [
        ('AUTH_SUCCESS', 'Authentication Success'),
        ('AUTH_FAILED', 'Authentication Failure'),
        ('INJECTION_BLOCKED', 'Hostile Injection Intercepted'),
        ('BRUTE_FORCE_ATTEMPT', 'Brute Force Attack Detected'),
        ('TOKEN_ROTATED', 'JWT Token Rotation'),
        ('SESSION_REVOKED', 'Session Revocation Triggered'),
        ('VULNERABILITY_SCAN', 'Automated Security Self-Audit'),
        ('SUSPICIOUS_ACTIVITY', 'Suspicious Anomaly Detected'),
        ('PROFILE_UPDATED', 'Security Profile Updated'),
        ('CARD_UNLOCKED', 'Card State Modification'),
    ]

    SEVERITY_CHOICES = [
        ('INFO', 'Informational'),
        ('WARNING', 'Warning / Threat Alert'),
        ('CRITICAL', 'Critical Attack Vector Blocked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='security_audit_logs')
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES, default='AUTH_SUCCESS')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='INFO')
    source_ip = models.CharField(max_length=64, default='127.0.0.1')
    user_agent = models.TextField(blank=True, default='')
    endpoint = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['event_type']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.event_type} - {self.source_ip} @ {self.created_at}"


class ContactSubmission(models.Model):
    """
    Stores authenticated or public contact inquiries submitted from the landing page.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, default='')
    message = models.TextField()
    source_ip = models.CharField(max_length=64, default='127.0.0.1')
    user_agent = models.TextField(blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['email']),
            models.Index(fields=['source_ip', '-created_at']),
        ]

    def __str__(self):
        return f"Contact from {self.name} <{self.email}> at {self.created_at}"

