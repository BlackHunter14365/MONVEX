"""
MONVEX SMTP Transport Engine
Production-grade SMTP delivery transport with configuration validation, credential sanitization,
structured error classification, and controlled transient retry logic.
"""
import os
import ssl
import time
import socket
import smtplib
import logging
from typing import Dict, Any, Optional, Tuple
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from services.providers.base import ProviderError

logger = logging.getLogger('monvex.security.smtp')


class SmtpConfigurationError(Exception):
    """Raised when SMTP environment settings are invalid or missing."""
    pass


class SmtpTransport:
    """
    Manages robust SMTP email delivery using Django's SMTP backend.
    Enforces credential sanitization, error classification, and controlled single retry for transient failures.
    """

    TRANSIENT_ERROR_CODES = {
        'SMTP_TIMEOUT',
        'SMTP_NETWORK_ERROR',
        'SMTP_CONNECTION_FAILED',
    }

    @staticmethod
    def sanitize_credential(value: Optional[str], strip_spaces: bool = False) -> str:
        """
        Safely normalizes configuration strings by stripping accidental wrapping quotes
        and leading/trailing whitespace.
        For Google App Passwords, optionally removes display spaces.
        """
        if not value:
            return ""
        cleaned = str(value).strip().strip('\'"')
        if strip_spaces:
            cleaned = cleaned.replace(" ", "")
        return cleaned

    @classmethod
    def get_smtp_config(cls) -> Dict[str, Any]:
        """
        Extracts and sanitizes the active SMTP configuration from settings and environment.
        """
        host = cls.sanitize_credential(getattr(settings, 'EMAIL_HOST', os.getenv('EMAIL_HOST', '')))
        raw_port = getattr(settings, 'EMAIL_PORT', os.getenv('EMAIL_PORT', 465))
        try:
            port = int(raw_port)
        except (ValueError, TypeError):
            port = 465

        user = cls.sanitize_credential(getattr(settings, 'EMAIL_HOST_USER', os.getenv('EMAIL_HOST_USER', '')))
        # Sanitize app password: strip wrapping quotes, whitespace, and Google app password spaces
        password = cls.sanitize_credential(
            getattr(settings, 'EMAIL_HOST_PASSWORD', os.getenv('EMAIL_HOST_PASSWORD', '')),
            strip_spaces=True
        )

        use_ssl = bool(getattr(settings, 'EMAIL_USE_SSL', False))
        use_tls = bool(getattr(settings, 'EMAIL_USE_TLS', False))

        # Enforce mutual exclusivity
        if use_ssl and use_tls:
            if port == 465:
                use_tls = False
            else:
                use_ssl = False

        raw_timeout = getattr(settings, 'EMAIL_TIMEOUT', os.getenv('EMAIL_TIMEOUT', 10))
        try:
            timeout = int(raw_timeout)
        except (ValueError, TypeError):
            timeout = 10

        from_email = cls.sanitize_credential(
            getattr(
                settings,
                'DEFAULT_FROM_EMAIL',
                os.getenv('DEFAULT_FROM_EMAIL', f'MONVEX <{user}>' if user else 'MONVEX <monvexfinance@gmail.com>')
            )
        )

        return {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "use_ssl": use_ssl,
            "use_tls": use_tls,
            "timeout": timeout,
            "from_email": from_email,
        }

    @classmethod
    def validate_configuration(cls, strict_production: bool = False) -> Tuple[bool, Optional[str]]:
        """
        Validates the SMTP configuration against common misconfigurations.
        If strict_production=True (or DEBUG=False), returns False with an error message
        if credentials or required settings are missing.
        """
        config = cls.get_smtp_config()

        if not config['host']:
            return False, "EMAIL_HOST is not configured."

        if config['port'] not in [25, 465, 587, 2525, 1025]:
            logger.warning(f"Unusual SMTP port configured: {config['port']}.")

        if config['use_ssl'] and config['use_tls']:
            return False, "EMAIL_USE_SSL and EMAIL_USE_TLS are mutually exclusive and cannot both be True."

        if not config['use_ssl'] and not config['use_tls'] and config['port'] in [465, 587]:
            return False, f"Port {config['port']} requires encryption, but both EMAIL_USE_SSL and EMAIL_USE_TLS are False."

        if strict_production:
            backend_class = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
            if backend_class == 'django.core.mail.backends.console.EmailBackend':
                return False, "django.core.mail.backends.console.EmailBackend is forbidden in production mode."
            if not config['user']:
                return False, "EMAIL_HOST_USER is missing in production environment."
            if not config['password']:
                return False, "EMAIL_HOST_PASSWORD is empty or missing in production environment."

        return True, None

    @classmethod
    def classify_smtp_error(cls, exc: Exception) -> Tuple[str, str, bool]:
        """
        Classifies an SMTP-related exception into a structured error code and human-readable message.
        Returns: (error_code, technical_summary, is_transient)
        """
        exc_str = str(exc)
        exc_type = type(exc).__name__

        # 1. Timeout
        if isinstance(exc, (socket.timeout, TimeoutError)):
            return "SMTP_TIMEOUT", f"Connection timed out: {exc_str}", True

        # 2. Authentication failure
        if isinstance(exc, smtplib.SMTPAuthenticationError):
            return "SMTP_AUTH_FAILED", f"SMTP authentication failed: {exc_str}", False

        # 3. TLS / SSL Error
        if isinstance(exc, (ssl.SSLError, ssl.CertificateError)):
            return "SMTP_TLS_ERROR", f"TLS/SSL handshake failed: {exc_str}", False

        # 4. Connection refused / Server disconnected
        if isinstance(exc, (ConnectionRefusedError, smtplib.SMTPServerDisconnected, smtplib.SMTPConnectError)):
            return "SMTP_CONNECTION_FAILED", f"SMTP server connection failed ({exc_type}): {exc_str}", True

        # 5. Network unreachable / DNS failure / OSError
        if isinstance(exc, socket.gaierror):
            return "SMTP_NETWORK_ERROR", f"DNS resolution failed for SMTP host: {exc_str}", True

        if isinstance(exc, OSError):
            # Typical Errno 101 on Render: Network is unreachable
            if getattr(exc, 'errno', None) == 101 or 'Network is unreachable' in exc_str:
                return "SMTP_NETWORK_ERROR", f"Network is unreachable (Errno 101): {exc_str}", True
            return "SMTP_NETWORK_ERROR", f"Socket OS error: {exc_str}", True

        # 6. Delivery / Recipient / Sender rejected
        if isinstance(exc, (smtplib.SMTPSenderRefused, smtplib.SMTPRecipientsRefused, smtplib.SMTPDataError)):
            return "SMTP_DELIVERY_FAILED", f"SMTP rejected message: {exc_str}", False

        # 7. Generic smtplib exception
        if isinstance(exc, smtplib.SMTPException):
            return "SMTP_DELIVERY_FAILED", f"SMTP protocol error ({exc_type}): {exc_str}", False

        # Default fallback
        return "SMTP_DELIVERY_FAILED", f"Unexpected delivery failure ({exc_type}): {exc_str}", False

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: str,
        request_id: str = "",
        from_email: Optional[str] = None,
    ) -> bool:
        """
        Dispatches an email message via the configured SMTP backend with controlled single retry.
        Never leaks passwords, raw stack traces, or internal network topology to caller.
        Raises ProviderError on failure.
        """
        clean_recipient = to_email.strip().lower()
        masked_recipient = clean_recipient[:2] + "***@" + clean_recipient.split('@')[-1] if '@' in clean_recipient else clean_recipient
        req_tag = f"[{request_id}] " if request_id else ""

        # Validate configuration
        is_valid, validation_error = cls.validate_configuration(strict_production=not getattr(settings, 'DEBUG', False))
        if not is_valid:
            logger.error(f"{req_tag}SMTP configuration invalid: {validation_error}")
            raise ProviderError(
                code="OTP_DELIVERY_FAILED",
                message="Email delivery service is currently misconfigured. Please contact support.",
                details={"error_code": "SMTP_CONFIG_ERROR"}
            )

        config = cls.get_smtp_config()
        active_from = from_email or config['from_email']

        # Construct Django Email message
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=active_from,
            to=[clean_recipient]
        )
        msg.attach_alternative(body_html, "text/html")

        # Connection factory using configured parameters
        backend_class = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')

        def _build_connection():
            return get_connection(
                backend=backend_class,
                host=config['host'],
                port=config['port'],
                username=config['user'],
                password=config['password'],
                use_ssl=config['use_ssl'],
                use_tls=config['use_tls'],
                timeout=config['timeout'],
                fail_silently=False
            )

        max_attempts = 2
        last_error_code = "SMTP_DELIVERY_FAILED"
        last_technical_summary = ""

        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(
                    f"{req_tag}SMTP delivery attempt {attempt}/{max_attempts} to {masked_recipient} "
                    f"via {config['host']}:{config['port']} (ssl={config['use_ssl']}, tls={config['use_tls']})"
                )
                conn = _build_connection()
                msg.connection = conn
                msg.send(fail_silently=False)

                logger.info(f"{req_tag}SMTP delivery SUCCEEDED on attempt {attempt} to {masked_recipient}")
                return True

            except Exception as exc:
                error_code, summary, is_transient = cls.classify_smtp_error(exc)
                last_error_code = error_code
                last_technical_summary = summary

                logger.warning(
                    f"{req_tag}SMTP attempt {attempt}/{max_attempts} failed: [{error_code}] {summary}"
                )

                # Non-transient errors (like auth failed) must not be retried
                if not is_transient or attempt >= max_attempts:
                    break

                # Transient failure: wait briefly before retrying with SAME transport
                time.sleep(1.0)

        # All attempts exhausted or non-transient error encountered
        logger.error(
            f"{req_tag}SMTP delivery PERMANENTLY FAILED to {masked_recipient}: "
            f"[{last_error_code}] {last_technical_summary}"
        )

        raise ProviderError(
            code="OTP_DELIVERY_FAILED",
            message="We couldn't send the verification code right now. Please try again shortly.",
            details={
                "error_code": last_error_code,
                "request_id": request_id
            }
        )
