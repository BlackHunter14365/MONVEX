"""
Production Health Check, Readiness, & Internal Observability Endpoints
"""
import time
from django.db import connection
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

START_TIME = time.time()

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Liveness probe for Kubernetes / Docker / load balancers
    """
    return JsonResponse({
        'status': 'healthy',
        'uptime_seconds': round(time.time() - START_TIME, 2),
        'service': 'monvex-backend',
        'version': '3.4.0',
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness probe verifying DB connectivity and vital subsystems
    """
    checks = {
        'database': False,
    }
    
    # 1. Database Ping
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            if row and row[0] == 1:
                checks['database'] = True
    except Exception as e:
        checks['database_error'] = str(e)

    all_ready = all(v is True for k, v in checks.items() if not k.endswith('_error'))
    status_code = 200 if all_ready else 503

    return JsonResponse({
        'status': 'ready' if all_ready else 'degraded',
        'checks': checks,
        'timestamp': time.time(),
    }, status=status_code)

@api_view(['GET'])
@permission_classes([AllowAny])
def observability_status(request):
    """
    Internal observability snapshot for monitoring, AI regression health, and release verification.
    Zero secret or PII exposure.
    """
    from services.metrics_service import metrics_collector
    snapshot = metrics_collector.get_snapshot()

    # Verify DB status
    db_ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            db_ok = (cursor.fetchone()[0] == 1)
    except Exception:
        db_ok = False

    snapshot["release"] = {
        "version": "3.4.0",
        "milestone": "V3.4_PRODUCTION_RELEASE_GATE",
        "database_connected": db_ok,
    }

    return JsonResponse(snapshot, status=200)


import re
from django.conf import settings

def _attach_cors_headers(request, response):
    origin = request.META.get('HTTP_ORIGIN')
    if not origin:
        return response

    clean_origin = origin.strip().rstrip('/')
    allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    allowed_regexes = getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', [])

    is_allowed = (
        getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)
        or clean_origin in allowed_origins
        or any(re.match(pattern, origin) for pattern in allowed_regexes)
        or origin.endswith('.onrender.com')
    )

    if is_allowed:
        response['Access-Control-Allow-Origin'] = origin
        if getattr(settings, 'CORS_ALLOW_CREDENTIALS', True):
            response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Expose-Headers'] = 'X-Request-ID, X-Response-Time-Ms'
    return response

def custom_handler500(request):
    req_id = getattr(request, 'request_id', 'req_system')
    response = JsonResponse({
        "success": False,
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "status": 500,
            "message": f"A server error occurred. Reference Request ID: {req_id}",
            "request_id": req_id
        }
    }, status=500)
    return _attach_cors_headers(request, response)

def custom_handler400(request, exception=None):
    req_id = getattr(request, 'request_id', 'req_system')
    response = JsonResponse({
        "success": False,
        "error": {
            "code": "BAD_REQUEST",
            "status": 400,
            "message": "Malformed or invalid request.",
            "request_id": req_id
        }
    }, status=400)
    return _attach_cors_headers(request, response)

def custom_handler403(request, exception=None):
    req_id = getattr(request, 'request_id', 'req_system')
    response = JsonResponse({
        "success": False,
        "error": {
            "code": "PERMISSION_DENIED",
            "status": 403,
            "message": "Access permission denied.",
            "request_id": req_id
        }
    }, status=403)
    return _attach_cors_headers(request, response)

def custom_handler404(request, exception=None):
    req_id = getattr(request, 'request_id', 'req_system')
    response = JsonResponse({
        "success": False,
        "error": {
            "code": "NOT_FOUND",
            "status": 404,
            "message": "The requested resource was not found.",
            "request_id": req_id
        }
    }, status=404)
    return _attach_cors_headers(request, response)

