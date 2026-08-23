from rest_framework import serializers
from .models import ContactSubmission, SecurityAuditLog
from services.contact_service import ContactService

class SecurityAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityAuditLog
        fields = ['id', 'user', 'event_type', 'severity', 'source_ip', 'user_agent', 'endpoint', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']

class ContactSubmissionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(min_length=2, max_length=150, error_messages={
        'required': 'Please enter your name.',
        'blank': 'Please enter your name.',
        'min_length': 'Name must be at least 2 characters long.',
        'max_length': 'Name cannot exceed 150 characters.'
    })
    email = serializers.EmailField(error_messages={
        'required': 'Please enter your email address.',
        'blank': 'Please enter your email address.',
        'invalid': 'Please enter a valid email address.'
    })
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    message = serializers.CharField(min_length=10, max_length=5000, error_messages={
        'required': 'Please enter a message.',
        'blank': 'Please enter a message.',
        'min_length': 'Message must be at least 10 characters long.',
        'max_length': 'Message cannot exceed 5000 characters.'
    })

    class Meta:
        model = ContactSubmission
        fields = ['id', 'name', 'email', 'phone', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_phone(self, value):
        import re
        if value:
            phone_clean = re.sub(r'[\s\-\(\)]', '', value)
            if not re.match(r'^\+?[0-9]{7,15}$', phone_clean):
                raise serializers.ValidationError("Please enter a valid phone number.")
        return value

    def validate(self, attrs):
        is_valid, sanitized, errors = ContactService.validate_submission(attrs)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return sanitized


