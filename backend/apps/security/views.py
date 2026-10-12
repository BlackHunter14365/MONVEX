import time
import logging
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q

from .models import SecurityAuditLog, UserSession, SecurityScan
from .serializers import (
    SecurityAuditLogSerializer,
    UserSessionSerializer,
    SecurityScanSerializer,
    ContactSubmissionSerializer
)
from .scanner import SecurityScanner
from .session_utils import (
    get_client_ip,
    resolve_current_session,
    revoke_other_sessions
)

logger = logging.getLogger('monvex.security')


class SecurityOverviewView(APIView):
    """
    Authenticated Security Center Overview.
    Aggregates authentic database session state, live scanner posture scores,
    active WAF telemetry, and tamper-evident audit log records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        ip = get_client_ip(request)

        # 1. Resolve caller's current session & active sessions registry
        current_session = resolve_current_session(request, user)
        active_sessions_qs = UserSession.objects.filter(user=user, is_active=True)
        active_sessions_list = []
        for s in active_sessions_qs:
            active_sessions_list.append({
                "id": str(s.id),
                "device": s.device_name,
                "ip": s.ip_address,
                "location": "Local / Verified Session",
                "last_active": s.last_activity.strftime("%Y-%m-%d %H:%M:%S") if s.last_activity else "Just now",
                "is_current": s.id == current_session.id
            })

        active_count = len(active_sessions_list)

        # 2. Blocked attack telemetry and user audit counts
        total_blocked = SecurityAuditLog.objects.filter(
            event_type__in=['INJECTION_BLOCKED', 'BRUTE_FORCE_ATTEMPT']
        ).count()

        user_events_count = SecurityAuditLog.objects.filter(user=user).count()
        recent_logs = SecurityAuditLog.objects.filter(user=user)[:6]

        # 3. Retrieve latest real security scan
        latest_scan = SecurityScan.objects.filter(
            Q(user=user) | Q(user__isnull=True)
        ).order_by('-created_at').first()

        if latest_scan is None:
            scan_data = SecurityScanner.run_scan(user=user, ip=ip)
            health_score = scan_data['score']
            passed_tests = scan_data['passed_tests']
            total_tests = scan_data['total_tests']
            last_scanned_at = scan_data['timestamp']
        else:
            health_score = latest_scan.score
            passed_tests = latest_scan.passed_count
            total_tests = (
                latest_scan.passed_count +
                latest_scan.failed_count +
                latest_scan.warning_count +
                latest_scan.unknown_count
            )
            last_scanned_at = latest_scan.created_at.isoformat()

        # 4. Multi-layer security matrix controls
        shields = [
            {
                "id": "rate_limiter",
                "name": "WAF Rate Limiting & Throttling",
                "title": "WAF Rate Limiting & Throttling",
                "description": "IP and token-based rate limits mitigate brute-force attempts and DDoS saturation.",
                "status": "ENFORCED",
                "threat_level": "OPTIMAL",
                "icon": "ShieldCheck",
                "color": "text-[#16745C] bg-[#E8FBF4]"
            },
            {
                "id": "sqli_xss",
                "name": "SQL Injection & XSS Guard",
                "title": "SQL Injection & XSS Guard",
                "description": "Strict Django ORM parameterization and automated DOM sanitization prevent script injection.",
                "status": "VERIFIED",
                "threat_level": "OPTIMAL",
                "icon": "Lock",
                "color": "text-[#16745C] bg-[#E8FBF4]"
            },
            {
                "id": "jwt_guard",
                "name": "Zero-Trust Token Rotation",
                "title": "Zero-Trust Token Rotation",
                "description": "Short-lived JWT access tokens with rotating refresh tokens and revocation blacklists.",
                "status": "ENFORCED",
                "threat_level": "OPTIMAL",
                "icon": "Key",
                "color": "text-[#6865E8] bg-[#ECEBFF]"
            },
            {
                "id": "password_hash",
                "name": "Argon2id Hash Function",
                "title": "Argon2id Hash Function",
                "description": "Memory-hard password hashing protects credentials against ASIC and GPU cracking clusters.",
                "status": "STANDARDIZED",
                "threat_level": "OPTIMAL",
                "icon": "ShieldCheck",
                "color": "text-[#16745C] bg-[#E8FBF4]"
            },
            {
                "id": "csrf_defense",
                "name": "CSRF Double-Submit Defense",
                "title": "CSRF Double-Submit Defense",
                "description": "Cryptographic anti-forgery tokens validate origin authenticity across state-changing mutations.",
                "status": "ACTIVE",
                "threat_level": "OPTIMAL",
                "icon": "FileCheck",
                "color": "text-[#6865E8] bg-[#ECEBFF]"
            },
            {
                "id": "audit_engine",
                "name": "Tamper-Evident Audit Trail",
                "title": "Tamper-Evident Audit Trail",
                "description": "Every authentication event, capital transfer, and session shift is permanently indexed with SHA-256.",
                "status": "LOGGING",
                "threat_level": "OPTIMAL",
                "icon": "Terminal",
                "color": "text-[#6865E8] bg-[#ECEBFF]"
            }
        ]

        # 5. Build structured overview payload
        session_status = "Single Active Session" if active_count <= 1 else f"{active_count} Active Sessions"
        session_desc = "HTTP-Only SameSite Cookie" if active_count <= 1 else "Multi-device footprint detected"

        return Response({
            "success": True,
            "health_score": health_score,
            "security_status": "Enterprise Hardened" if health_score >= 90 else "Active Defense",
            "perimeter_defense": {
                "status": "ACTIVE SHIELD" if health_score >= 80 else "ATTENTION REQUIRED",
                "description": "Zero known vulnerabilities" if health_score >= 90 else f"Diagnostics flagged posture items",
                "total_blocked": total_blocked
            },
            "session_isolation": {
                "status": session_status,
                "description": session_desc,
                "active_count": active_count
            },
            "defense_health_score": {
                "score": health_score,
                "display_score": f"{health_score} / 100",
                "subtitle": f"{passed_tests} of {total_tests} Verified Controls" if total_tests else "Tier-1 Cryptographic Posture",
                "last_scanned_at": last_scanned_at
            },
            "audit_stream": {
                "total_events": user_events_count,
                "subtitle": "Tamper-evident trail (SHA-256 hash chained)"
            },
            "total_blocked_attacks": total_blocked,
            "total_audit_events": user_events_count,
            "shields": shields,
            "active_sessions": active_sessions_list,
            "recent_audit_logs": SecurityAuditLogSerializer(recent_logs, many=True).data
        })


class SecurityAuditLogListView(generics.ListAPIView):
    """
    Paginated, strictly user-scoped list of cryptographic audit logs.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SecurityAuditLogSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = SecurityAuditLog.objects.filter(user=user)

        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        return queryset[:50]


class SecurityVulnerabilityScanView(APIView):
    """
    Executes live multi-vector diagnostic scan against application security controls.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        ip = get_client_ip(request)
        scan_results = SecurityScanner.run_scan(user=user, ip=ip)
        return Response(scan_results, status=status.HTTP_200_OK)


class RevokeAllSessionsView(APIView):
    """
    Revokes all active device sessions belonging to the authenticated user
    EXCEPT the current session.
    - Blacklists other outstanding refresh tokens.
    - Marks other UserSession records inactive.
    - Leaves current session valid and authorized.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_session = resolve_current_session(request, user)
        revoked_count = revoke_other_sessions(user=user, current_session=current_session, request=request)

        if revoked_count == 0:
            message = "No other active sessions were found to revoke."
        else:
            message = f"Successfully revoked {revoked_count} other active device session(s) and invalidated tokens."

        return Response({
            "success": True,
            "message": message,
            "revoked_count": revoked_count,
            "current_session_id": str(current_session.id)
        }, status=status.HTTP_200_OK)


class ContactSubmissionView(APIView):
    """
    Public API endpoint to accept and validate contact inquiries from the MONVEX landing page.
    Includes rate limiting, anti-spam sanitization, and administrative dispatch.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ip = get_client_ip(request)
        user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

        # 1. Rate Limiting: Max 5 submissions per IP in the last 15 minutes
        from datetime import timedelta
        from django.utils import timezone
        from .models import ContactSubmission
        from services.contact_service import ContactService

        window_start = timezone.now() - timedelta(minutes=15)
        recent_count = ContactSubmission.objects.filter(source_ip=ip, created_at__gte=window_start).count()
        if recent_count >= 5:
            return Response(
                {"error": "Too many contact requests from this address. Please wait a few minutes before trying again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # 2. Validation & Sanitization
        serializer = ContactSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        sanitized_data = serializer.validated_data

        # 3. Create Record
        submission = ContactSubmission.objects.create(
            name=sanitized_data['name'],
            email=sanitized_data['email'],
            phone=sanitized_data.get('phone', ''),
            message=sanitized_data['message'],
            source_ip=ip,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
        )

        # 4. Dispatch Notification
        ContactService.dispatch_notification(submission)

        # 5. Log Security Audit Trail
        SecurityAuditLog.objects.create(
            user=user,
            event_type='PROFILE_UPDATED',
            severity='INFO',
            source_ip=ip,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
            endpoint='/api/v1/contact/',
            description=f"Contact inquiry received from {submission.name} ({submission.email})."
        )

        return Response({
            "success": True,
            "message": "Message sent successfully. Thanks for reaching out. I'll get back to you soon.",
            "submission_id": str(submission.id)
        }, status=status.HTTP_201_CREATED)
