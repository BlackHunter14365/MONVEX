"""
Standardized Enterprise API Exception Handling for MONVEX
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('monvex.api')

def custom_exception_handler(exc, context):
    """
    Transforms all DRF exceptions into a uniform production JSON structure:
    {
        "success": false,
        "error": {
            "code": "VALIDATION_ERROR",
            "status": 400,
            "message": "...",
            "request_id": "req_...",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)
    request = context.get('request') if isinstance(context, dict) else None
    request_id = getattr(request, 'request_id', None) or 'req_system'

    if response is not None:
        error_code = 'API_ERROR'
        if response.status_code == 400:
            error_code = 'VALIDATION_ERROR'
        elif response.status_code == 401:
            error_code = 'AUTHENTICATION_REQUIRED'
        elif response.status_code == 403:
            error_code = 'PERMISSION_DENIED'
        elif response.status_code == 404:
            error_code = 'NOT_FOUND'
        elif response.status_code == 429:
            error_code = 'RATE_LIMIT_EXCEEDED'

        # Extract message
        message = 'An error occurred while processing your request.'
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = str(response.data['detail'])
            elif 'error' in response.data and isinstance(response.data['error'], str):
                message = response.data['error']
            elif 'non_field_errors' in response.data:
                message = ' '.join([str(e) for e in response.data['non_field_errors']])
            else:
                # Find first field error (e.g. email: "...", otp: "...")
                field_errors = []
                for field, errs in response.data.items():
                    if isinstance(errs, list):
                        field_errors.append(f"{field}: {' '.join([str(e) for e in errs])}")
                    elif isinstance(errs, str):
                        field_errors.append(f"{field}: {errs}")
                if field_errors:
                    message = field_errors[0]
        elif isinstance(response.data, list):
            message = ' '.join([str(e) for e in response.data])

        custom_data = {
            'success': False,
            'error': {
                'code': error_code,
                'status': response.status_code,
                'message': message,
                'request_id': request_id,
                'details': response.data,
            }
        }
        response.data = custom_data
    else:
        # Unhandled 500 server errors
        logger.error(f"[{request_id}] Unhandled Exception: {str(exc)}", exc_info=True)
        response = Response(
            {
                'success': False,
                'error': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'status': 500,
                    'message': f'A critical server error occurred. Reference Request ID: {request_id}',
                    'request_id': request_id,
                    'details': None,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
