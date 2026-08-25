# MONVEX Production Hotfix: Authentication CORS Regression Resolution

**Date**: 2026-08-25  
**Severity**: CRITICAL (Production Authentication Blocking)  
**Status**: RESOLVED & VERIFIED (100%)  
**Affected Endpoints**:
- `POST /api/v1/auth/login/` (Manual Login)
- `POST /api/v1/auth/register/` (Manual Registration)
- `POST /api/v1/auth/google/` (Google Identity Services Sign-In)

---

## 1. Incident Summary

Following the introduction of telemetry and request correlation in MONVEX V3.x, authentication requests from the production web frontend (`https://monvex-web.onrender.com`) to the backend (`https://monvex-backend.onrender.com/api/v1`) failed during browser preflight validation with the following error:

```
Access to fetch at 'https://monvex-backend.onrender.com/api/v1/auth/google/' 
from origin 'https://monvex-web.onrender.com' has been blocked by CORS policy: 
Request header field x-request-id is not allowed by Access-Control-Allow-Headers in preflight response.
```

Google Identity Services (GIS) credentials and user credentials were generated successfully on the client side, but the browser halted the HTTP payload dispatch because the backend CORS configuration did not declare `x-request-id` in `Access-Control-Allow-Headers`.

---

## 2. Root Cause Analysis

1. **Request Correlation Header**: `web/src/lib/api/client.ts` generates and dispatches `X-Request-ID` with every HTTP request to enable distributed tracing and performance metrics across the full stack.
2. **Missing Allowed Header Definition**: `django-cors-headers` defaulted to standard HTTP headers (`accept`, `authorization`, `content-type`, `user-agent`, `x-csrftoken`, `x-requested-with`). Custom headers like `x-request-id`, `x-correlation-id`, and `x-client-platform` were omitted from `CORS_ALLOW_HEADERS`.
3. **OPTIONS Preflight Rejection**: For cross-origin requests bearing custom headers, browsers issue an `OPTIONS` preflight request specifying `Access-Control-Request-Headers: x-request-id, content-type`. The backend omitted `x-request-id` from the preflight `Access-Control-Allow-Headers` response, causing the browser to abort the subsequent POST request.

---

## 3. Implemented Fix

### 3.1 Backend CORS Settings (`backend/monvex/settings.py`)

Extended `CORS_ALLOW_HEADERS` with `x-request-id`, `x-correlation-id`, and `x-client-platform` while strictly preserving `default_headers` and explicit origin whitelisting:

```python
from corsheaders.defaults import default_headers

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS', 
        'https://monvex-web.onrender.com,http://localhost:3000,http://127.0.0.1:3000,tauri://localhost'
    ).split(',') if origin.strip()
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

CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CSRF_TRUSTED_ORIGINS', 
        'https://*.onrender.com,https://monvex-web.onrender.com,http://localhost:3000,http://127.0.0.1:3000,tauri://localhost'
    ).split(',') if origin.strip()
]
```

### 3.2 Security & Origin Invariants Preserved
- **No Wildcard Origins in Production**: `CORS_ALLOW_ALL_ORIGINS = False` in production.
- **Explicit Origin Matching**: `https://monvex-web.onrender.com` is explicitly matched. Unauthorized origins receive no `Access-Control-Allow-Origin` header and are strictly blocked by the browser.
- **Request Correlation Intact**: `X-Request-ID` continues to flow through `RequestCorrelationMiddleware` into threadlocal metrics and response headers without degradation.

---

## 4. Verification & Testing

### 4.1 Automated Security Gate Suite (`test_security_gate.py`)
- Added `test_gate_07_cors_preflight_and_request_correlation_headers` to continuously test:
  1. `OPTIONS` preflight on `/api/v1/auth/login/`, `/api/v1/auth/register/`, `/api/v1/auth/google/`.
  2. Verification that `Access-Control-Allow-Headers` returns `x-request-id`.
  3. Verification that unauthorized origins (`https://hostile-site.com`) are rejected.
  4. Verification that `X-Request-ID` and `X-Response-Time-Ms` response headers remain attached.
- **Result**: `7/7 tests passed (100%)`.

### 4.2 End-to-End Authentication Flows
- **Manual Registration (`POST /api/v1/auth/register/`)**: `201 Created` with valid CORS headers and request ID correlation.
- **Manual Login (`POST /api/v1/auth/login/`)**: `200 OK` with JWT tokens returned and CORS headers validated.
- **Google Sign-In (`POST /api/v1/auth/google/`)**: Successfully reached backend verification handler without preflight failure.

### 4.3 AI Benchmark & Test Regression
- **AI Evaluation Benchmark**: `20/20 scenarios passed (100%)`.
- **Full Django Test Suite**: `71/71 tests passed (100%)`.
- **TypeScript & Web Build**: `0 errors`, `24/24 static pages compiled`.

---

## 5. Deployment Instructions

1. Commit and push the backend settings fix.
2. Deploy backend service (`monvex-backend` on Render).
3. Verify live endpoints via browser DevTools:
   - `OPTIONS https://monvex-backend.onrender.com/api/v1/auth/login/` $\rightarrow$ `200 OK` with `x-request-id` in `Access-Control-Allow-Headers`.
