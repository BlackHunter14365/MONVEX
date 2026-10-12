"""
Session-Aware JWT Authentication Subsystem.
Extends SimpleJWT to enforce immediate server-side session invalidation.
If an access token carries a session_id claim, verifies that the corresponding
UserSession remains active in the server-side registry. If revoked, immediately rejects the request.
"""
import logging
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import UserSession

logger = logging.getLogger('monvex.security')


class SessionAwareJWTAuthentication(JWTAuthentication):
    """
    Validates standard JWT tokens and verifies active status in the UserSession registry.
    Ensures that when 'Revoke Other Sessions' is executed, all access tokens associated
    with revoked sessions are instantly rejected across all protected endpoints.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, validated_token = result

        session_id = validated_token.payload.get('session_id')
        if session_id:
            try:
                session = UserSession.objects.filter(id=session_id, user=user).first()
                if session is not None and not session.is_active:
                    logger.warning(
                        f"[SESSION ENFORCEMENT] Blocked request for user {user.username} with revoked session ID {session_id} on {request.path}"
                    )
                    raise exceptions.AuthenticationFailed('Session has been revoked or expired.')
            except (ValueError, TypeError):
                pass

        return user, validated_token
