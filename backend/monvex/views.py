"""
Production Health Check & Readiness Endpoints
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
        'version': '1.0.0',
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
