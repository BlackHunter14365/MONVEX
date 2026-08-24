"""
MONVEX Request Correlation & Performance Telemetry Middleware
Attaches unique request_id and measures server response duration across all HTTP requests.
"""
import time
import uuid
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('monvex.request')

class RequestCorrelationMiddleware(MiddlewareMixin):
    """
    Assigns or preserves a unique X-Request-ID header for every incoming HTTP request.
    Injects request_id into threadlocal/request object and logs performance metrics.
    """

    def process_request(self, request):
        request.start_time = time.perf_counter()

        # 1. Resolve or generate Request ID
        req_id = (
            request.META.get('HTTP_X_REQUEST_ID')
            or request.META.get('HTTP_X_CORRELATION_ID')
            or f"req_{uuid.uuid4().hex[:16]}"
        )
        request.request_id = req_id

        # 2. Extract Client Metadata safely
        client_platform = request.META.get('HTTP_X_CLIENT_PLATFORM', 'web')
        request.client_platform = client_platform

        return None

    def process_response(self, request, response):
        # 1. Calculate duration
        start_time = getattr(request, 'start_time', None)
        duration_ms = 0.0
        if start_time:
            duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # 2. Attach Correlation Headers
        req_id = getattr(request, 'request_id', f"req_{uuid.uuid4().hex[:16]}")
        response['X-Request-ID'] = req_id
        response['X-Response-Time-Ms'] = str(duration_ms)

        # 3. Log Performance Telemetry (Skip static assets)
        path = request.path
        if not path.startswith('/static/') and not path.startswith('/media/'):
            status_code = response.status_code
            method = request.method
            user_repr = getattr(request, 'user', None)
            user_id = user_repr.id if user_repr and user_repr.is_authenticated else 'anonymous'

            logger.info(
                f"[{req_id}] {method} {path} -> {status_code} ({duration_ms}ms) | user={user_id}"
            )

            # 4. Feed thread-safe rolling metrics aggregator
            try:
                from services.metrics_service import metrics_collector
                client_platform = getattr(request, 'client_platform', 'web')
                metrics_collector.record_request(
                    method=method,
                    path=path,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    client_platform=client_platform,
                )
            except Exception:
                pass

        return response
