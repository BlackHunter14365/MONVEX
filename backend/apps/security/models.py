import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


def compute_audit_hash(prev_hash: str, entry_id: str, event_type: str, severity: str, source_ip: str, created_at_str: str, description: str) -> str:
    """
    Computes a canonical SHA-256 hash across tamper-evident audit record fields.
    """
    canonical_payload = f"{prev_hash}|{entry_id}|{event_type}|{severity}|{source_ip}|{created_at_str}|{description}"
    return hashlib.sha256(canonical_payload.encode('utf-8')).hexdigest()


class SecurityAuditLog(models.Model):
    EVENT_CHOICES = [
        ('AUTH_SUCCESS', 'Authentication Success'),
        ('AUTH_FAILED', 'Authentication Failure'),
        ('INJECTION_BLOCKED', 'Hostile Injection Intercepted'),
        ('BRUTE_FORCE_ATTEMPT', 'Brute Force Attack Detected'),
        ('TOKEN_ROTATED', 'JWT Token Rotation'),
        ('SESSION_REVOKED', 'Session Revocation Triggered'),
        ('VULNERABILITY_SCAN', 'Automated Security Self-Audit'),
        ('SCAN_INITIATED', 'Security Scan Initiated'),
        ('SCAN_COMPLETED', 'Security Scan Completed'),
        ('SCAN_FAILED', 'Security Scan Failed'),
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
    prev_hash = models.CharField(max_length=64, blank=True, default='')
    hash = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['event_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['hash']),
        ]

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if not self.id:
            self.id = uuid.uuid4()
        if not self.prev_hash:
            last_entry = SecurityAuditLog.objects.exclude(id=self.id).exclude(hash='').order_by('-created_at', '-id').first()
            self.prev_hash = last_entry.hash if last_entry else '0' * 64

        super().save(*args, **kwargs)

        if is_new or not self.hash:
            timestamp_str = self.created_at.isoformat() if self.created_at else ''
            self.hash = compute_audit_hash(
                self.prev_hash,
                str(self.id),
                self.event_type,
                self.severity,
                self.source_ip,
                timestamp_str,
                self.description
            )
            SecurityAuditLog.objects.filter(id=self.id).update(hash=self.hash)

    def __str__(self):
        return f"[{self.severity}] {self.event_type} - {self.source_ip} @ {self.created_at}"


def verify_audit_log_chain(user=None):
    """
    Verifies the cryptographic integrity of the audit log hash chain.
    Returns status, count of verified blocks, and any tampering detection details.
    """
    qs = SecurityAuditLog.objects.exclude(hash='').order_by('created_at', 'id')
    if user:
        qs = qs.filter(user=user)

    expected_prev = '0' * 64
    verified_count = 0

    for entry in qs:
        # For the first element in the stream, align expected_prev with its declared anchor
        if verified_count == 0:
            expected_prev = entry.prev_hash

        # 1. Verify link to previous block
        if entry.prev_hash != expected_prev:
            return {
                'valid': False,
                'broken_id': str(entry.id),
                'reason': 'PREVIOUS_HASH_CHAIN_MISMATCH',
                'verified_count': verified_count
            }

        # 2. Verify payload hash integrity
        timestamp_str = entry.created_at.isoformat() if entry.created_at else ''
        computed_hash = compute_audit_hash(
            entry.prev_hash,
            str(entry.id),
            entry.event_type,
            entry.severity,
            entry.source_ip,
            timestamp_str,
            entry.description
        )
        if entry.hash != computed_hash:
            return {
                'valid': False,
                'broken_id': str(entry.id),
                'reason': 'HASH_PAYLOAD_TAMPERED',
                'verified_count': verified_count
            }

        expected_prev = entry.hash
        verified_count += 1

    return {
        'valid': True,
        'verified_count': verified_count
    }


class UserSession(models.Model):
    """
    Authoritative server-side session registry.
    Maps authenticated user device logins to JWT token JTIs with instant revocation capabilities.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_sessions')
    session_key = models.CharField(max_length=255, blank=True, default='')
    refresh_jti = models.CharField(max_length=255, blank=True, default='', db_index=True)
    access_jti = models.CharField(max_length=255, blank=True, default='', db_index=True)
    ip_address = models.CharField(max_length=64, default='127.0.0.1')
    user_agent = models.TextField(blank=True, default='')
    device_name = models.CharField(max_length=150, default='Web Browser')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['refresh_jti']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        status = 'ACTIVE' if self.is_active else 'REVOKED'
        return f"[{status}] Session {self.id} ({self.device_name} - {self.user.username})"


class SecurityScan(models.Model):
    """
    Persisted execution snapshot of automated multi-vector security scans.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='security_scans')
    score = models.FloatField(default=100.0)
    status = models.CharField(max_length=20, default='COMPLETED')
    passed_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    warning_count = models.IntegerField(default=0)
    unknown_count = models.IntegerField(default=0)
    duration_ms = models.IntegerField(default=0)
    results = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"Scan {self.id} - Score: {self.score}% ({self.status}) @ {self.created_at}"


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
