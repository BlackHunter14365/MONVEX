"""
Session Management and Token Lifecycle Utilities.
Provides server-side tracking, device fingerprinting, and session isolation.
"""
import logging
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import UserSession, SecurityAuditLog

logger = logging.getLogger('monvex.security')

AUTH_COOKIE_NAME = getattr(settings, 'JWT_AUTH_COOKIE', 'monvex_refresh_token')


def get_client_ip(request):
    """Safely extracts client IP address handling reverse-proxies and forwarding headers."""
    if not request:
        return '127.0.0.1'
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def parse_device_name(user_agent: str) -> str:
    """Parses user agent into a friendly, non-sensitive device label."""
    if not user_agent:
        return 'Web Browser (Active)'
    ua_lower = user_agent.lower()
    if 'android' in ua_lower or 'iphone' in ua_lower or 'mobile' in ua_lower:
        return 'Mobile Device'
    elif 'edg' in ua_lower:
        return 'Microsoft Edge'
    elif 'chrome' in ua_lower:
        return 'Chrome Browser'
    elif 'firefox' in ua_lower:
        return 'Firefox Browser'
    elif 'safari' in ua_lower:
        return 'Safari Browser'
    return 'Web Browser (Active)'


def issue_session_tokens(user, request=None, device_name=None):
    """
    Creates an authoritative UserSession and generates SimpleJWT Refresh and Access tokens
    with the session_id embedded into both token payloads.
    """
    ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
    resolved_device = device_name or parse_device_name(user_agent)

    session = UserSession.objects.create(
        user=user,
        ip_address=ip,
        user_agent=user_agent[:255],
        device_name=resolved_device,
        is_active=True
    )

    refresh = RefreshToken.for_user(user)
    refresh['session_id'] = str(session.id)
    session.refresh_jti = refresh.get('jti', '')

    access = refresh.access_token
    access['session_id'] = str(session.id)
    session.access_jti = access.get('jti', '')

    session.save(update_fields=['refresh_jti', 'access_jti'])
    return session, refresh, access


def resolve_current_session(request, user):
    """
    Resolves the caller's active UserSession from the request context.
    Checks access token session_id, refresh cookie/payload, or access token jti.
    If no registered session exists, registers the current session on-the-fly.
    """
    # 1. Check access token session_id claim
    auth_token = getattr(request, 'auth', None)
    if auth_token and hasattr(auth_token, 'payload'):
        sid = auth_token.payload.get('session_id')
        if sid:
            session = UserSession.objects.filter(id=sid, user=user, is_active=True).first()
            if session:
                return session

    # 2. Check refresh cookie or body refresh token
    cookie_refresh = request.COOKIES.get(AUTH_COOKIE_NAME) if hasattr(request, 'COOKIES') else None
    body_refresh = request.data.get('refresh') if hasattr(request, 'data') and isinstance(request.data, dict) else None
    raw_refresh = cookie_refresh or body_refresh

    if raw_refresh:
        try:
            parsed = RefreshToken(raw_refresh)
            sid = parsed.payload.get('session_id')
            if sid:
                session = UserSession.objects.filter(id=sid, user=user, is_active=True).first()
                if session:
                    return session
            jti = parsed.payload.get('jti')
            if jti:
                session = UserSession.objects.filter(refresh_jti=jti, user=user, is_active=True).first()
                if session:
                    return session
        except Exception:
            pass

    # 3. Check access token jti
    if auth_token and hasattr(auth_token, 'payload'):
        jti = auth_token.payload.get('jti')
        if jti:
            session = UserSession.objects.filter(access_jti=jti, user=user, is_active=True).first()
            if session:
                return session

    # 4. Fallback: Check if user has an existing active session from the same IP
    ip = get_client_ip(request)
    session = UserSession.objects.filter(user=user, ip_address=ip, is_active=True).first()
    if session:
        return session

    # 5. Bootstrap new active session for this caller
    user_agent = request.META.get('HTTP_USER_AGENT', '') if hasattr(request, 'META') else ''
    new_session = UserSession.objects.create(
        user=user,
        ip_address=ip,
        user_agent=user_agent[:255],
        device_name=parse_device_name(user_agent),
        is_active=True
    )
    if auth_token and hasattr(auth_token, 'payload'):
        new_session.access_jti = auth_token.payload.get('jti', '')
        new_session.save(update_fields=['access_jti'])

    return new_session


def revoke_other_sessions(user, current_session, request=None) -> int:
    """
    Revokes all sessions belonging to the user except the current session.
    - Blacklists all other outstanding refresh tokens via SimpleJWT.
    - Sets is_active=False on all other UserSession records.
    - Creates an authoritative SecurityAuditLog record.
    Returns the count of other sessions revoked.
    """
    ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''

    with transaction.atomic():
        # 1. Identify other active sessions in the registry
        other_sessions = UserSession.objects.filter(user=user, is_active=True).exclude(id=current_session.id)
        other_sessions_count = other_sessions.count()

        now = timezone.now()
        other_sessions.update(is_active=False, revoked_at=now)

        # 2. Blacklist all other outstanding refresh tokens
        other_tokens = OutstandingToken.objects.filter(user=user)
        if current_session.refresh_jti:
            other_tokens = other_tokens.exclude(jti=current_session.refresh_jti)

        blacklisted_count = 0
        for tok in other_tokens:
            _, created = BlacklistedToken.objects.get_or_create(token=tok)
            if created:
                blacklisted_count += 1

        revoked_count = max(other_sessions_count, blacklisted_count)

        # 3. Log audit event
        SecurityAuditLog.objects.create(
            user=user,
            event_type='SESSION_REVOKED',
            severity='WARNING' if revoked_count > 0 else 'INFO',
            source_ip=ip,
            user_agent=user_agent[:255],
            endpoint='/api/v1/security/revoke-sessions/',
            description=(
                f"User revoked {revoked_count} other active device session(s). "
                f"Current session {current_session.id} preserved."
            ),
            metadata={
                "current_session_id": str(current_session.id),
                "revoked_count": revoked_count,
                "other_sessions_count": other_sessions_count,
                "blacklisted_tokens_count": blacklisted_count,
            }
        )

    logger.info(f"User {user.username} revoked {revoked_count} other sessions; preserved {current_session.id}")
    return revoked_count
