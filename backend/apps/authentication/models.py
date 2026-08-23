"""
Authentication & Verification Session Models
Enterprise multi-platform verification architecture for MONVEX.
"""
import uuid
import hashlib
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Profile(models.Model):
    STATUS_CHOICES = [
        ('PENDING_VERIFICATION', 'Pending Verification'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('DISABLED', 'Disabled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='PENDING_VERIFICATION')
    email_verified = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False) # legacy sync field
    currency = models.CharField(max_length=10, default='INR')
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    savings_target_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    theme = models.CharField(max_length=20, default='dark')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Sync legacy is_verified with email_verified
        if self.email_verified:
            self.is_verified = True
            if self.status == 'PENDING_VERIFICATION':
                self.status = 'ACTIVE'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profile for {self.user.username} [{self.status}] (Verified: {self.email_verified})"

class VerificationSession(models.Model):
    PURPOSE_CHOICES = [
        ('EMAIL_SIGNUP', 'Email Signup'),
        ('PASSWORD_RESET', 'Password Reset'),
        ('EMAIL_CHANGE', 'Email Change'),
        ('SENSITIVE_ACTION', 'Sensitive Action'),
    ]
    CHANNEL_CHOICES = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('EXPIRED', 'Expired'),
        ('LOCKED', 'Locked'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_sessions', null=True, blank=True)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES, default='EMAIL_SIGNUP')
    channel = models.CharField(max_length=16, choices=CHANNEL_CHOICES, default='EMAIL')
    destination = models.CharField(max_length=255) # normalized email or phone
    provider = models.CharField(max_length=32, default='twilio')
    provider_verification_id = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='PENDING')
    attempt_count = models.PositiveIntegerField(default=0)
    resend_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    ip_address_hash = models.CharField(max_length=64, blank=True, default='')
    user_agent_hash = models.CharField(max_length=64, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['destination', 'status']),
            models.Index(fields=['user', 'purpose', 'status']),
        ]

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def seconds_until_resend(self, cooldown_seconds: int = 60) -> int:
        elapsed = (timezone.now() - self.last_sent_at).total_seconds()
        remaining = int(cooldown_seconds - elapsed)
        return max(0, remaining)

    def __str__(self):
        return f"VerificationSession {self.id} for {self.destination} [{self.status}]"

class EmailDispatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_email = models.EmailField()
    recipient_phone = models.CharField(max_length=20, blank=True, default='')
    subject = models.CharField(max_length=255)
    body_text = models.TextField()
    body_html = models.TextField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Email to {self.recipient_email} at {self.created_at}"

class GoogleIdentity(models.Model):
    """
    Federated Google Identity record linking a verified Google Account (sub) to a canonical MONVEX User.
    Enforces a unique constraint on (provider, provider_subject) to prevent duplicate bindings.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='google_identities')
    provider = models.CharField(max_length=32, default='google')
    provider_subject = models.CharField(max_length=255, db_index=True)
    email = models.EmailField(blank=True, default='')
    given_name = models.CharField(max_length=150, blank=True, default='')
    family_name = models.CharField(max_length=150, blank=True, default='')
    picture_url = models.URLField(max_length=1024, blank=True, default='')
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'provider_subject'],
                name='unique_google_provider_subject'
            )
        ]
        indexes = [
            models.Index(fields=['provider', 'provider_subject']),
            models.Index(fields=['user', 'provider']),
        ]

    def __str__(self):
        return f"GoogleIdentity ({self.provider_subject}) -> User: {self.user.username}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

