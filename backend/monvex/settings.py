"""
MONVEX Django Settings
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'monvex-insecure-dev-key-super-secret-1234567890!@#$%')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

_raw_hosts = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,testserver,.onrender.com,monvex-backend.onrender.com')
ALLOWED_HOSTS = list({
    host.strip().strip('"\'').rstrip('/') for host in _raw_hosts.split(',') if host.strip()
} | {'localhost', '127.0.0.1', 'testserver', '.onrender.com', 'monvex-backend.onrender.com'})


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    # MONVEX Internal Apps
    'apps.authentication',
    'apps.transactions',
    'apps.budgets',
    'apps.goals',
    'apps.analytics',
    'apps.ai_copilot',
    'apps.security',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'monvex.middleware.RequestCorrelationMiddleware',
    'apps.security.middleware.SecurityDefenseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'monvex.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'monvex.wsgi.application'
ASGI_APPLICATION = 'monvex.asgi.application'

# Database configuration: Automatic DATABASE_URL detection for Render PostgreSQL, fallback to SQLite
import dj_database_url

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=not DEBUG if 'sqlite' not in DATABASE_URL else False,
        )
    }
elif os.getenv('DB_ENGINE') == 'postgres':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'monvex_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
elif not DEBUG:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured("DATABASE_URL environment variable must be set in production mode (DEBUG=False).")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'OPTIONS': {
                'timeout': 30,
            },
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB limit
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10MB limit

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration with Throttling & Security
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/minute',
        'user': '1200/hour',
    },
    'EXCEPTION_HANDLER': 'monvex.exceptions.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Simple JWT Configuration with Token Rotation & Blacklist
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Production Security Headers & Reverse Proxy Support
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True') == 'True'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

from corsheaders.defaults import default_headers

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True

def _clean_origin_url(url_str: str) -> str:
    return url_str.strip().strip('"\'').rstrip('/')

_raw_cors = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'https://monvex-web.onrender.com,http://localhost:3000,http://127.0.0.1:3000,tauri://localhost'
)
_base_cors_origins = {
    'https://monvex-web.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'tauri://localhost',
}
CORS_ALLOWED_ORIGINS = list(
    _base_cors_origins | {_clean_origin_url(orig) for orig in _raw_cors.split(',') if _clean_origin_url(orig)}
)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.onrender\.com$",
    r"^http:\/\/localhost(:\d+)?$",
    r"^http:\/\/127\.0\.0\.1(:\d+)?$",
    r"^tauri:\/\/localhost$",
]

CORS_ALLOW_HEADERS = (
    *default_headers,
    "x-request-id",
    "x-correlation-id",
    "x-client-platform",
)

CORS_EXPOSE_HEADERS = (
    "x-request-id",
    "x-response-time-ms",
)

# CSRF Trusted Origins for Secure Production Web Requests
_raw_csrf = os.getenv(
    'CSRF_TRUSTED_ORIGINS',
    'https://*.onrender.com,https://monvex-web.onrender.com,http://localhost:3000,http://127.0.0.1:3000,tauri://localhost'
)
_base_csrf_origins = {
    'https://*.onrender.com',
    'https://monvex-web.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'tauri://localhost',
}
CSRF_TRUSTED_ORIGINS = list(
    _base_csrf_origins | {_clean_origin_url(orig) for orig in _raw_csrf.split(',') if _clean_origin_url(orig)}
)

# Gemini API Config
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Email & OTP Delivery Architecture
EMAIL_PROVIDER = os.getenv('EMAIL_PROVIDER', os.getenv('OTP_PROVIDER', 'resend')).strip().lower()
if EMAIL_PROVIDER == 'email':
    EMAIL_PROVIDER = 'resend'
OTP_PROVIDER = os.getenv('OTP_PROVIDER', EMAIL_PROVIDER).strip().lower()
if OTP_PROVIDER == 'email':
    OTP_PROVIDER = 'resend'

# Resend HTTPS Email API Configuration (Production Default)
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '').strip().strip('\'"')
RESEND_FROM_EMAIL = os.getenv('RESEND_FROM_EMAIL', 'MONVEX <onboarding@resend.dev>').strip()
RESEND_API_URL = os.getenv('RESEND_API_URL', 'https://api.resend.com/emails').strip()
RESEND_TIMEOUT = int(os.getenv('RESEND_TIMEOUT', 10))

# Secondary / Local Development SMTP Configuration
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 465))

# Automatic SSL/TLS protocol resolution with mutual exclusivity enforcement
_raw_ssl = os.getenv('EMAIL_USE_SSL')
_raw_tls = os.getenv('EMAIL_USE_TLS')

if _raw_ssl is not None:
    EMAIL_USE_SSL = _raw_ssl.lower() in ('true', '1', 'yes')
    EMAIL_USE_TLS = False if EMAIL_USE_SSL else (_raw_tls.lower() in ('true', '1', 'yes') if _raw_tls is not None else False)
elif _raw_tls is not None:
    EMAIL_USE_TLS = _raw_tls.lower() in ('true', '1', 'yes')
    EMAIL_USE_SSL = False if EMAIL_USE_TLS else False
else:
    # Port 465 is SMTPS (SSL); Port 587 is STARTTLS (TLS)
    EMAIL_USE_SSL = (EMAIL_PORT == 465)
    EMAIL_USE_TLS = (EMAIL_PORT == 587)

# Strictly ensure mutual exclusivity to avoid Django backend ValueError
if EMAIL_USE_SSL and EMAIL_USE_TLS:
    if EMAIL_PORT == 465:
        EMAIL_USE_TLS = False
    else:
        EMAIL_USE_SSL = False

EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'monvexfinance@gmail.com').strip().strip('\'"')
# Sanitize Google App Password: strip quotes, leading/trailing whitespace, and internal spaces
_raw_email_pwd = os.getenv('EMAIL_HOST_PASSWORD', '').strip().strip('\'"')
EMAIL_HOST_PASSWORD = _raw_email_pwd.replace(' ', '') if _raw_email_pwd else ''

EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', 10))
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', RESEND_FROM_EMAIL)
SERVER_EMAIL = os.getenv('SERVER_EMAIL', os.getenv('EMAIL_HOST_USER', 'monvexfinance@gmail.com'))
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend' if EMAIL_HOST_PASSWORD else 'django.core.mail.backends.console.EmailBackend'
)

# Startup Configuration Validation for Production (DEBUG=False)
if not DEBUG:
    import logging
    _config_logger = logging.getLogger('monvex.startup')
    if OTP_PROVIDER == 'resend':
        if not RESEND_API_KEY:
            _config_logger.warning(
                "CRITICAL CONFIGURATION NOTICE: RESEND_API_KEY is not set in Render environment. "
                "Production OTP dispatches via HTTPS Resend API will fail until RESEND_API_KEY is configured."
            )
        else:
            _config_logger.info(
                f"Production Resend HTTPS Email API configured (sender: {RESEND_FROM_EMAIL})."
            )
    elif OTP_PROVIDER in ['smtp', 'email']:
        if not EMAIL_HOST_PASSWORD:
            _config_logger.warning(
                "CRITICAL CONFIGURATION NOTICE: EMAIL_HOST_PASSWORD is not set in Render environment. "
                "OTP dispatches will fail until EMAIL_HOST_PASSWORD is set."
            )
        else:
            _config_logger.info(
                f"Production SMTP configured with user: monvexfinance@gmail.com (port={EMAIL_PORT}, ssl={EMAIL_USE_SSL}, tls={EMAIL_USE_TLS})"
            )

# Managed OTP Verification Policies
OTP_CHANNEL = os.getenv('OTP_CHANNEL', 'email')
OTP_EXPIRY_SECONDS = int(os.getenv('OTP_EXPIRY_SECONDS', 600))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv('OTP_RESEND_COOLDOWN_SECONDS', 60))
OTP_MAX_ATTEMPTS = int(os.getenv('OTP_MAX_ATTEMPTS', 5))
OTP_MAX_RESENDS = int(os.getenv('OTP_MAX_RESENDS', 5))


# Authentication & Verification Policy Flags
AUTH_REQUIRE_EMAIL_VERIFICATION = os.getenv('AUTH_REQUIRE_EMAIL_VERIFICATION', 'true').lower() in ('true', '1', 'yes')

# Twilio Verify Settings
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_API_KEY = os.getenv('TWILIO_API_KEY', '')
TWILIO_API_SECRET = os.getenv('TWILIO_API_SECRET', '')
TWILIO_VERIFY_SERVICE_SID = os.getenv('TWILIO_VERIFY_SERVICE_SID', '')

# Google OAuth 2.0 / Identity Services Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')




