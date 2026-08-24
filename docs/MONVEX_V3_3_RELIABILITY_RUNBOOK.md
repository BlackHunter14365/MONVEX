# MONVEX V3.3 — Production Reliability & Incident Response Runbook

> **Document Type:** Production Operations, SRE & Incident Response Runbook  
> **Release Target:** MONVEX Enterprise v3.3  
> **Date:** August 25, 2026

---

## 1. System Health & Readiness Verification

### Liveness Probe
```bash
curl -i https://monvex-backend.onrender.com/health/
```
**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "uptime_seconds": 12845.2,
  "service": "monvex-backend",
  "version": "1.0.0"
}
```

### Readiness Probe
```bash
curl -i https://monvex-backend.onrender.com/ready/
```
**Expected Response (200 OK):**
```json
{
  "status": "ready",
  "checks": {
    "database": true
  },
  "timestamp": 1724548000.0
}
```

---

## 2. Failure Triage & Graceful Degradation Matrix

| Incident Scenario | Observed Symptom | Automated System Response | Operator Remediation |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database Outage** | `/ready/` returns 503; `database: false` | Requests fail gracefully with `INTERNAL_SERVER_ERROR` and Request ID | Check Render PostgreSQL status; restart connection pool. |
| **Gemini API Outage / Timeout** | AI Chat turns fail upstream | `GeminiClient` switches to **Deterministic Reasoner** (Zero downtime) | Verify `GEMINI_API_KEY` quota and Google Cloud status. |
| **Hostile WAF Attack Vector** | 403 `SECURITY_THREAT_INTERCEPTED` | WAF blocks request and logs incident UUID to `SecurityAuditLog` | Inspect incident ID in Django admin; ban malicious source IP if persistent. |
| **Financial Invariant Mismatch** | Audit returns `status: "WARNING"` | Audit recorded; zero mutation of user records | Inspect transaction ledger for negative amounts or unlinked categories. |
| **Client Session Expiry** | 401 `AUTHENTICATION_REQUIRED` | Web & Mobile clients clear tokens and dispatch `monvex:auth-logout` | Prompt user to sign in with new credentials. |

---

## 3. Production Incident Troubleshooting Workflow

```
1. Customer Reports Error (Provides Request ID e.g. req_8f1a2b3c4d5e)
   │
2. Search Application Logs for [req_8f1a2b3c4d5e]
   │
3. Identify Exact Layer:
   ├── Ingress WAF (Blocked payload?)
   ├── Database (Query timeout or constraint error?)
   ├── AI Reasoner (Fallback triggered?)
   └── DRF Exception (Validation error?)
   │
4. Reproduce Safely in Test Harness:
   └── python manage.py test apps.ai_copilot.test_evaluation
```
