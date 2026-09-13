"""
MONVEX Production Notification & Security Dispatch Service
Handles Email & SMS One-Time Passcode (OTP) delivery and In-App Mail Dispatch Store
"""
import os
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('monvex.notifications')

class NotificationService:

    @staticmethod
    def mask_email(email: str) -> str:
        if not email or '@' not in email:
            return ""
        user, domain = email.split('@', 1)
        if len(user) <= 2:
            masked_user = user[0] + "***"
        else:
            masked_user = user[:2] + "***" + user[-1]
        return f"{masked_user}@{domain}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        if not phone:
            return ""
        clean = phone.strip()
        if len(clean) <= 4:
            return "****"
        return clean[:3] + " " + "*" * (len(clean) - 6) + clean[-3:]

    @classmethod
    def send_email_notification(cls, email: str, subject: str, message: str, html_message: str = "") -> bool:
        """
        Dispatches transactional email notifications.
        """
        from apps.authentication.models import EmailDispatch
        try:
            EmailDispatch.objects.create(
                recipient_email=email,
                subject=subject,
                body_text=message,
                body_html=html_message or message
            )
        except Exception as e:
            logger.error(f"Failed to record EmailDispatch: {e}")

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'MONVEX <monvexfinance@gmail.com>'),
                recipient_list=[email],
                html_message=html_message or None,
                fail_silently=True
            )
            logger.info(f"Notification email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email notification to {email}: {e}")
            return False
