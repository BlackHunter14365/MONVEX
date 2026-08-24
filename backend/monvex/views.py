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
