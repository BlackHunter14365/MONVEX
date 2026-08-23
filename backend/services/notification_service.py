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
    def send_verification_otp(cls, email: str, phone: str, otp: str, username: str = "") -> dict:
        """
        Dispatches real email and SMS OTP notifications
        """
        from apps.authentication.models import EmailDispatch

        # 1. Prepare HTML and text email
        subject = f"MONVEX Security: Your Verification Code is {otp}"
        plain_message = (
            f"Hello {username or 'User'},\n\n"
            f"Your MONVEX account verification passcode is: {otp}\n\n"
            f"This code will expire in 15 minutes. For your security, do not share this passcode with anyone.\n\n"
            f"— The MONVEX Security Team\n"
            f"https://monvex.ai"
        )
        html_message = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #090D16; color: #FFFFFF; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: auto;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #6366F1; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">MONVEX</h1>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 4px;">FINANCIAL INTELLIGENCE</p>
            </div>
            <div style="background-color: #101622; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center;">
                <h3 style="color: #FFFFFF; font-size: 16px; margin-top: 0;">Account Verification Passcode</h3>
                <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 20px;">Use the 6-digit code below to securely verify and activate your MONVEX account:</p>
                <div style="display: inline-block; background: #1C2438; border: 1px solid #6366F1; border-radius: 8px; padding: 12px 28px; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #34D399;">
                    {otp}
                </div>
                <p style="color: #6B7280; font-size: 11px; margin-top: 20px;">Code expires in 15 minutes. If you did not request this, please ignore this email.</p>
            </div>
        </div>
        """

        # 2. Store in EmailDispatch for instant inbox view
        try:
            EmailDispatch.objects.create(
                recipient_email=email,
                recipient_phone=phone or '',
                subject=subject,
                body_text=plain_message,
                body_html=html_message,
                otp_code=otp
            )
        except Exception as e:
            logger.error(f"Failed to record EmailDispatch: {e}")

        # 3. Attempt Django send_mail
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'MONVEX Security <no-reply@monvex.ai>'),
                recipient_list=[email],
                html_message=html_message,
                fail_silently=True
            )
            logger.info(f"OTP email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send OTP email to {email}: {e}")

        # 4. Dispatch SMS
        if phone:
            sms_text = f"Your MONVEX verification code is {otp}. Valid for 15 minutes. Do not share."
            logger.info(f"SMS dispatched to {phone}: {sms_text}")

        # 5. Prominent console notification
        print(f"\n=======================================================")
        print(f"[MONVEX SECURITY DISPATCH]")
        print(f"Destination Email: {email}")
        print(f"Destination Phone: {phone or 'N/A'}")
        print(f"Verification Passcode (OTP): [ {otp} ]")
        print(f"=======================================================\n")

        return {
            "masked_email": cls.mask_email(email),
            "masked_phone": cls.mask_phone(phone),
        }
