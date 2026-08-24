import re
import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .models import SecurityAuditLog

logger = logging.getLogger('monvex.security')

# Threat patterns for real-time WAF & Intrusion Prevention
SQLI_PATTERN = re.compile(
    r"(?i)(\bUNION\s+(?:ALL\s+)?SELECT\b|'\s*OR\s*'?\d+'?\s*=\s*'?\d+|;\s*DROP\s+TABLE|/\*.*?\*/|\bxp_cmdshell\b|\bWAITFOR\s+DELAY\b|'\s*OR\s*'1'='1|'\s*--)",
    re.IGNORECASE
)

XSS_PATTERN = re.compile(
    r"(?i)(<script[\s>]|javascript\s*:|onerror\s*=|onload\s*=|document\.cookie|<iframe[\s>]|<svg[\s>]|eval\s*\(|alert\s*\()",
    re.IGNORECASE
)

TRAVERSAL_PATTERN = re.compile(
    r"(\.\./\.\./|\.\.\\\.\.\\|/etc/passwd|/etc/shadow|\\win\.ini|/proc/self)",
    re.IGNORECASE
)

CMD_INJECTION_PATTERN = re.compile(
    r"(?i)(;\s*(?:cat|chmod|wget|curl|netcat|nc|bash|sh|powershell|cmd\.exe|rm|id|whoami)\b|\|\s*(?:cat|chmod|wget|curl|netcat|nc|bash|sh|powershell|cmd\.exe|rm|id|whoami)\b|`\s*(?:cat|chmod|wget|curl|netcat|nc|bash|sh|powershell|cmd\.exe|rm|id|whoami)\b)",
    re.IGNORECASE
)

PROTOTYPE_POLLUTION_PATTERN = re.compile(
    r"(__proto__|constructor\.prototype)",
    re.IGNORECASE
)


class SecurityDefenseMiddleware(MiddlewareMixin):
    """
    MONVEX Enterprise Web Application Firewall (WAF) & Intrusion Prevention.
    Inspects all incoming requests for malicious SQLi, XSS, Path Traversal, and Command Injection.
    """

    def process_request(self, request):
        # 1. Skip static or admin internal asset routes
        path = request.path
        if path.startswith('/static/') or path.startswith('/media/'):
            return None

        # 2. Extract Client IP and User Agent
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # 3. Inspect Query Parameters
        query_string = request.META.get('QUERY_STRING', '')
        threat_type = self._detect_threat(query_string)

        # 4. Inspect Request Body (if text/JSON)
        if not threat_type and request.body:
            try:
                # Inspect first 64KB
                body_sample = request.body[:65536].decode('utf-8', errors='ignore')
                threat_type = self._detect_threat(body_sample)
            except Exception:
                pass

        # 5. Handle Hostile Attack Vector
        if threat_type:
            user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

            log_entry = SecurityAuditLog.objects.create(
                user=user,
                event_type='INJECTION_BLOCKED',
                severity='CRITICAL',
                source_ip=ip,
                user_agent=user_agent[:255],
                endpoint=path[:255],
                description=f"Blocked hostile {threat_type} payload targeting {path}",
                metadata={
                    "threat_type": threat_type,
                    "method": request.method,
                    "query_string": query_string[:500],
                }
            )

            logger.warning(f"[SECURITY SHIELD ALERT] Hostile {threat_type} intercepted from {ip} on {path} [Incident #{log_entry.id}]")

            try:
                from services.metrics_service import metrics_collector
                metrics_collector.record_security_event(threat_type=threat_type)
            except Exception:
                pass

            return JsonResponse({
                "success": False,
                "error": "HOSTILE_PAYLOAD_BLOCKED",
                "code": "SECURITY_THREAT_INTERCEPTED",
                "message": f"MONVEX Cyber Shield intercepted a hostile {threat_type} payload. The incident has been recorded and blocked.",
                "incident_id": str(log_entry.id),
                "shield": "MONVEX_WAF_V2.4"
            }, status=403)

        return None

    def process_response(self, request, response):
        # Attach Active Defense Security Headers
        response['X-Defense-Shield'] = 'MONVEX-WAF-2.4'
        response['X-Security-Audit'] = 'Active-ZeroTrust'
        return response

    def _detect_threat(self, raw_input: str) -> str:
        if not raw_input:
            return ""

        if SQLI_PATTERN.search(raw_input):
            return "SQL_INJECTION"
        if XSS_PATTERN.search(raw_input):
            return "CROSS_SITE_SCRIPTING_XSS"
        if TRAVERSAL_PATTERN.search(raw_input):
            return "PATH_TRAVERSAL"
        if CMD_INJECTION_PATTERN.search(raw_input):
            return "COMMAND_INJECTION"
        if PROTOTYPE_POLLUTION_PATTERN.search(raw_input):
            return "PROTOTYPE_POLLUTION"

        return ""
