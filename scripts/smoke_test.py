#!/usr/bin/env python3
"""
MONVEX V3.4 Non-Destructive Post-Deployment Smoke Test Suite
Executes safe, non-mutating HTTP probes against staging and production endpoints.
Verifies HTTP status codes, security headers, zero secret disclosure, and latency thresholds.
"""
import sys
import time
import json
import urllib.request
import urllib.error

DEFAULT_BACKEND_URL = "https://monvex-backend.onrender.com"
DEFAULT_WEB_URL = "https://monvex-web.onrender.com"

def probe_endpoint(name, url, expected_statuses=(200,), max_latency_ms=3000, required_headers=None):
    t0 = time.time()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "MONVEX-SmokeTest-Probe/3.4"}
    )
    status = 0
    duration_ms = 0.0
    body = ""
    resp_headers = {}

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            duration_ms = (time.time() - t0) * 1000
            body = response.read().decode('utf-8', errors='replace')
            resp_headers = dict(response.headers)
    except urllib.error.HTTPError as e:
        status = e.code
        duration_ms = (time.time() - t0) * 1000
        body = e.read().decode('utf-8', errors='replace')
        resp_headers = dict(e.headers)
    except Exception as e:
        print(f"❌ [{name}] Connection Error: {e} ({url})")
        return False

    is_status_ok = status in expected_statuses
    is_latency_ok = duration_ms <= max_latency_ms

    # Check for secret leakage in body
    leaked_secrets = []
    for sensitive_word in ['SECRET_KEY', 'AWS_SECRET_ACCESS_KEY', 'DATABASE_URL', 'GEMINI_API_KEY', 'PRIVATE KEY']:
        if sensitive_word in body:
            leaked_secrets.append(sensitive_word)

    # Check headers
    missing_headers = []
    if required_headers:
        for rh in required_headers:
            if rh.lower() not in [k.lower() for k in resp_headers.keys()]:
                missing_headers.append(rh)

    if is_status_ok and is_latency_ok and not leaked_secrets and not missing_headers:
        print(f"✅ [{name}] HTTP {status} | {duration_ms:.1f}ms | {url}")
        return True
    else:
        print(f"❌ [{name}] FAILED: Status={status} (expected {expected_statuses}), Latency={duration_ms:.1f}ms (limit {max_latency_ms}ms)")
        if leaked_secrets:
            print(f"   ⚠️ SENSITIVE STRINGS DETECTED: {leaked_secrets}")
        if missing_headers:
            print(f"   ⚠️ MISSING HEADERS: {missing_headers}")
        return False

def run_smoke_tests(backend_base=DEFAULT_BACKEND_URL, web_base=DEFAULT_WEB_URL):
    print("=" * 60)
    print("MONVEX V3.4 Production Smoke Test Suite")
    print(f"Backend Target: {backend_base}")
    print(f"Web Target:     {web_base}")
    print("=" * 60)

    checks = [
        # 1. Health Probe
        ("Backend Health Check", f"{backend_base}/health/", (200,), 3000, ["X-Defense-Shield"]),
        # 2. Public Web Landing
        ("Web Landing UI", web_base, (200,), 4000, None),
        # 3. Observability Status (Sanitized)
        ("Observability Status API", f"{backend_base}/api/v1/observability/status/", (200,), 2500, ["X-Defense-Shield"]),
        # 4. Protected API Route (Unauthenticated 401 check)
        ("Auth Boundary Check", f"{backend_base}/api/v1/accounts/", (401,), 2500, None),
        # 5. WAF Intrusion Block Check
        ("WAF Defense Check", f"{backend_base}/api/v1/transactions/?search=UNION%20SELECT", (403,), 2500, ["X-Defense-Shield"])
    ]

    all_passed = True
    for name, url, statuses, latency_limit, req_hdrs in checks:
        passed = probe_endpoint(name, url, statuses, latency_limit, req_hdrs)
        if not passed:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("🎉 ALL PRODUCTION SMOKE PROBES PASSED!")
        return 0
    else:
        print("🚨 SMOKE TESTS FAILED — Review failing endpoints above.")
        return 1

if __name__ == "__main__":
    backend = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BACKEND_URL
    web = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_WEB_URL
    sys.exit(run_smoke_tests(backend, web))
