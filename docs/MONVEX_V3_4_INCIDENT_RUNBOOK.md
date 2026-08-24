# MONVEX V3.4 Incident Response & Observability Runbook

## 1. Incident Severity Definitions

| Severity | Definition | Target SLA | Notification Channel |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core API outage, database down, financial invariant violation, data breach | `< 15 minutes` | PagerDuty / Telegram Critical Alerts |
| **SEV-2 (High)** | AI Copilot degraded, elevated 5xx error rate (>5%), high P99 latency (>3s) | `< 45 minutes` | DevOps Escalation Channel |
| **SEV-3 (Medium)** | Non-critical UI glitch, background reporting delay | `< 4 hours` | Issue Tracker |
| **SEV-4 (Low)** | Minor cosmetic or documentation adjustment | `< 24 hours` | Standard Sprint Backlog |

## 2. Real-Time Telemetry & Health Probes

### Primary Endpoints
- **Health Check**: `GET https://monvex-backend.onrender.com/health/`
  - Expected: `200 OK`, `{"status": "healthy"}`
  - Response Header: `X-Defense-Shield: MONVEX-WAF-2.4`
- **Observability Status**: `GET https://monvex-backend.onrender.com/api/v1/observability/status/`
  - Expected: `200 OK`, real-time sliding window stats (error rates, P50/P95/P99 latencies, AI intent metrics, security intercept totals).

### Key Metrics to Monitor
1. **Error Rates**: `error_rate_5xx_pct` must remain `< 1.0%`.
2. **Latencies**: `p95_latency_ms` must remain `< 500ms` for API endpoints.
3. **Financial Invariants**: `financial_integrity_violations` must be `0`.
4. **Security Blocks**: Spikes in `security_threats_blocked` indicate active penetration or scrapers.

## 3. Triage & Remediation Procedures

### Runbook A: 5xx Error Rate Spike
1. Inspect live telemetry at `/api/v1/observability/status/`.
2. Check Render backend runtime logs: `render logs -s monvex-backend`.
3. Verify PostgreSQL database connection pool:
   ```bash
   python manage.py check --database default
   ```
4. If memory threshold exceeded, trigger service restart on Render.

### Runbook B: Financial Invariant Breach
1. Run non-mutating watchdog diagnosis:
   ```bash
   python -c "from services.financial_integrity_service import FinancialIntegrityService; print(FinancialIntegrityService.run_all_invariant_audits())"
   ```
2. Identify offending user ID or ledger entry.
3. Audit transaction logs to isolate mathematical or rounding anomaly.

### Runbook C: AI Copilot Outage or High Latency
1. Check Gemini API upstream connectivity or quota status.
2. The orchestrator automatically routes to the **Deterministic Fallback Engine** (`GeminiClient.deterministic_fallback_reasoner`) with 0 downtime for users.\n