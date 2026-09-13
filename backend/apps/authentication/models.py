"""
Authentication Models
Enterprise authentication and profile architecture for MONVEX.
"""
import uuid
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('DISABLED', 'Disabled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='ACTIVE')
    email_verified = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=True) # legacy sync field
    currency = models.CharField(max_length=10, default='INR')
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    savings_target_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    theme = models.CharField(max_length=20, default='dark')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_url = models.TextField(blank=True, default='')
    avatar_preset = models.CharField(max_length=64, blank=True, default='')
    bio = models.CharField(max_length=500, blank=True, default='')
    preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.email_verified:
            self.is_verified = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profile for {self.user.username} [{self.status}]"

class EmailDispatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_email = models.EmailField()
    recipient_phone = models.CharField(max_length=20, blank=True, default='')
    subject = models.CharField(max_length=255)
    body_text = models.TextField()
    body_html = models.TextField()
    otp_code = models.CharField(max_length=64, blank=True, default='') # Legacy audit field
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

