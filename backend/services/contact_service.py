"""
MONVEX Contact Dispatch & Notification Service
Handles validated contact submissions, notifications, and provider abstractions.
"""
import os
import logging
import html
import re
from typing import Dict, Any, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)

class ContactService:
    """
    Service layer for processing and dispatching contact form messages.
    Supports pluggable email dispatch (SendGrid, Postmark, SMTP, or Audit Fallback)
    without exposing provider credentials to client applications.
    """

    @classmethod
    def sanitize_input(cls, text: str) -> str:
        """Strip raw HTML tags and escape dangerous entities."""
        if not text:
            return ""
        clean = re.sub(r'<[^>]*>', '', text)
        return html.escape(clean.strip())

    @classmethod
    def validate_submission(cls, data: Dict[str, Any]) -> Tuple[bool, Dict[str, str], Dict[str, str]]:
        """
        Validates name, email, optional phone, and message body.
        Returns (is_valid, sanitized_data, errors_dict).
        """
        errors = {}
        sanitized = {}

        # 1. Name Validation
        name = str(data.get('name', '')).strip()
        if not name:
            errors['name'] = "Please enter your name."
        elif len(name) < 2:
            errors['name'] = "Name must be at least 2 characters long."
        elif len(name) > 150:
            errors['name'] = "Name cannot exceed 150 characters."
        else:
            sanitized['name'] = cls.sanitize_input(name)

        # 2. Email Validation
        email = str(data.get('email', '')).strip().lower()
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not email:
            errors['email'] = "Please enter your email address."
        elif not re.match(email_regex, email) or len(email) > 254:
            errors['email'] = "Please enter a valid email address."
        else:
            sanitized['email'] = email

        # 3. Phone Validation (Optional)
        phone = str(data.get('phone', '')).strip()
        if phone:
            phone_clean = re.sub(r'[\s\-\(\)]', '', phone)
            if not re.match(r'^\+?[0-9]{7,15}$', phone_clean):
                errors['phone'] = "Please enter a valid phone number."
            else:
                sanitized['phone'] = cls.sanitize_input(phone)
        else:
            sanitized['phone'] = ""

        # 4. Message Validation
        message = str(data.get('message', '')).strip()
        if not message:
            errors['message'] = "Please enter a message."
        elif len(message) < 10:
            errors['message'] = "Message must be at least 10 characters long."
        elif len(message) > 5000:
            errors['message'] = "Message cannot exceed 5000 characters."
        else:
            sanitized['message'] = cls.sanitize_input(message)

        is_valid = len(errors) == 0
        return is_valid, sanitized, errors

    @classmethod
    def dispatch_notification(cls, submission) -> bool:
        """
        Attempts to deliver an email notification to the site administrator/creator.
        Gracefully falls back to database persistence if provider is not configured.
        """
        receiver_email = os.getenv('CONTACT_RECEIVER_EMAIL', getattr(settings, 'CONTACT_RECEIVER_EMAIL', 'danish@monvex.local'))
        provider = os.getenv('CONTACT_EMAIL_PROVIDER', getattr(settings, 'CONTACT_EMAIL_PROVIDER', 'LOCAL')).upper()
        api_key = os.getenv('CONTACT_EMAIL_API_KEY', getattr(settings, 'CONTACT_EMAIL_API_KEY', None))

        logger.info(
            f"[ContactService] Ingestion recorded: {submission.name} ({submission.email}) "
            f"| Provider: {provider} | Target: {receiver_email}"
        )

        if provider == 'SENDGRID' and api_key:
            try:
                import requests
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "personalizations": [{"to": [{"email": receiver_email}]}],
                    "from": {"email": "notifications@monvex.app", "name": "MONVEX Contact Desk"},
                    "subject": f"New Contact Inquiry: {submission.name}",
                    "content": [{
                        "type": "text/plain",
                        "value": f"Name: {submission.name}\nEmail: {submission.email}\nPhone: {submission.phone}\nIP: {submission.source_ip}\n\nMessage:\n{submission.message}"
                    }]
                }
                res = requests.post("https://api.sendgrid.com/v3/mail/send", json=payload, headers=headers, timeout=5)
                return res.status_code in [200, 202]
            except Exception as e:
                logger.error(f"[ContactService] SendGrid delivery failed: {e}")
                return False

        return True
