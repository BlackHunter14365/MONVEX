# MONVEX V3.3 — Production Observability, Reliability & Financial Integrity Audit

> **Document Type:** Production Observability Forensic Audit & System Telemetry Baseline  
> **Target Release:** MONVEX Enterprise v3.3  
> **Audit Date:** August 25, 2026  
> **Status:** AUDITED & BASELINED

---

## 1. System Request Path & Observability Mapping

```
[ Client Applications ]
  ├── Next.js Web App (React 18 / TanStack Query v5)
  ├── Tauri Windows Desktop App (Rust native wrapper + Webview2)
  └── Flutter Android App (Dart HTTP Client / Secure Storage)
         │
         ▼ [HTTPS Request + Authorization: Bearer <JWT>]
[ Render Ingress & Load Balancer ]
  ├── TLS 1.3 Termination & HSTS Enforcement
  └── Reverse Proxy Header: HTTP_X_FORWARDED_PROTO
         │
         ▼ [HTTP / ASGI / WSGI]
[ Django Web Gateway ]
  ├── 1. CorsMiddleware (`corsheaders`)
  ├── 2. SecurityDefenseMiddleware (`apps.security` — SQLi, XSS, Traversal, Command Injection WAF)
  ├── 3. SecurityMiddleware (`django.middleware.security`)
  ├── 4. WhiteNoiseMiddleware (`whitenoise.storage.CompressedManifestStaticFilesStorage`)
  ├── 5. SessionMiddleware & AuthenticationMiddleware
  └── 6. Custom Request Correlation Middleware [To Be Added in V3.3]
         │
         ▼ [Django REST Framework Routing]
[ DRF API Layer (`monvex.exceptions.custom_exception_handler`) ]
  ├── Throttling (Anon: 120/min, User: 1200/hr)
  ├── JWT Authentication & Blacklist Check
  └── Domain ViewSets (`/api/v1/auth/`, `/api/v1/transactions/`, `/api/v1/budgets/`, `/api/v1/goals/`, `/api/v1/analytics/`, `/api/v1/ai/`)
         │
         ▼ [Domain Business Services]
[ Domain Logic Layer (`backend/services/`) ]
  ├── `FinanceService` (Calculates cashflow, burn rate, account balances via Python `Decimal`)
  ├── `BudgetService` (Computes budget adherence and category utilization)
  ├── `DebtService` / `NetWorthService` / `WhyExplainerService`
  └── `FinancialAgentOrchestrator` (AI Copilot intent classification & multi-turn state)
         │
         ├──► [PostgreSQL Database (dj-database-url / Django ORM)]
         │      ├── Strict Multi-Tenant Scoping (`user=request.user`)
         │      ├── Connection Pool & Health Checks (`conn_max_age=600`, `conn_health_checks=True`)
         │      └── Transaction Tables, Budgets, Goals, Security Logs, AI Sessions
         │
         └──► [AI Intelligence Layer (`GeminiClient` & `MONVEXTools`)]
                ├── Google GenAI SDK (`gemini-2.0-flash` with Function Calling)
                ├── Pre-execution Regex Jailbreak Interceptor (10 attack signatures)
                └── Deterministic Fallback Engine (Zero-downtime offline math)
```

---

## 2. Forensic Audit Matrix Across System Layers

| Layer / Component | Existing Logging & Telemetry | Existing Error Handling | Existing Health / Probes | Identified Telemetry Gaps | Sensitive Information Risks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Next.js Web Client** | Console warnings; Toast notification dispatcher. | `catch` blocks in query hooks; standard API error mapping. | Next.js build-time static route validation. | Missing end-to-end `X-Request-ID` header injection in client requests. | Risk of logging sensitive JWT tokens in browser console (Mitigated: tokens in `localStorage` without debug logging). |
| **Tauri Desktop Client** | `println!` / `eprintln!` navigation logging. | Navigation guard intercepts `localhost`/`127.0.0.1`. | Native window initialization event. | No structured telemetry dispatch to backend. | Zero secret exposure in native binary. |
| **Flutter Mobile Client** | None in production; debug prints in dev. | `ApiException` wrapping; token clearance on 401. | App startup connectivity check. | Missing client device platform metadata (`X-Client-Platform`). | Tokens stored securely in `FlutterSecureStorage`. |
| **Django Ingress & WAF** | `SecurityAuditLog` records blocked SQLi, XSS, Path Traversal, Command Injection. | Rejects with 403 `HOSTILE_PAYLOAD_BLOCKED` and incident UUID. | `/health/` (uptime), `/ready/` (DB ping `SELECT 1;`). | No unified request correlation ID spanning from ingress to DB. | Sensitive passwords/keys are stripped prior to audit logging. |
| **DRF Exception Handler** | Logs unhandled 500 exceptions with `logger.error(..., exc_info=True)`. | `custom_exception_handler` formats 400, 401, 403, 404, 429, 500 into standard JSON. | Standard DRF exception wrapping. | Errors do not include the active `request_id` in response payload. | Stack traces and SQL queries are strictly hidden from clients. |
| **PostgreSQL Database** | Default Django database logging (`django.db.backends`). | Database exceptions wrapped by DRF. | `readiness_check` executes `SELECT 1;`. | No execution time tracking or query count metric attached to response headers. | Raw query parameters must not be dumped into unauthenticated logs. |
| **AI Orchestrator & Gemini** | `tools_used`, `tool_activity`, `citations`, `data` recorded in `ConversationMessage`. | Fallback to `deterministic_fallback_reasoner` on API error/missing key. | Model availability check (`GeminiClient.is_configured()`). | Missing explicit AI turn duration, prompt token estimates, and AI request correlation ID. | Prompt text contains user financial queries; must remain strictly tenant-isolated. |
| **Financial Integrity** | `Decimal` arithmetic across all financial services. | Invariant violations handled at service boundary. | Aggregation metrics in `/api/v1/analytics/summary/`. | No automated financial invariant verification engine (e.g. Net Worth = Assets - Liabilities). | Invariants must be audited without altering customer records. |

---

## 3. Request Correlation & Tracing Blueprint

To satisfy Phase 2 requirements, MONVEX will introduce a non-invasive Request Correlation Middleware:

1. **Header Identification:** Checks incoming `X-Request-ID` or `X-Correlation-ID`. If absent, generates a cryptographically secure UUIDv4 (`req_<uuid>`).
2. **Context Binding:** Attaches `request.request_id` to the Django request object and thread context.
3. **Response Propagation:** Attaches `X-Request-ID: <id>` and `X-Response-Time-Ms: <duration>` to every HTTP response.
4. **AI Linkage:** Every AI interaction turn generates an `ai_request_id` (`ai_<uuid>`) intrinsically tied to the parent `request_id`.
5. **Error Enrichment:** All DRF error responses include `"request_id": "<id>"` in the error payload for client-to-server correlation without exposing internal traces.

---

## 4. Error Taxonomy Standardization

| Error Code | HTTP Status | Meaning & Scenario | Safe Client Message |
| :--- | :--- | :--- | :--- |
| `AUTHENTICATION_ERROR` | 401 | Missing, expired, or malformed JWT token. | "Your session has expired. Please sign in again." |
| `AUTHORIZATION_ERROR` | 403 | Attempting to access another tenant's resource. | "You do not have permission to access this financial record." |
| `VALIDATION_ERROR` | 400 | Invalid payload, negative amount, missing fields. | Detailed field-level validation messages. |
| `NOT_FOUND` | 404 | Transaction, budget, goal, or account not found. | "The requested resource was not found." |
| `RATE_LIMIT_EXCEEDED` | 429 | Exceeded 120/min anon or 1200/hr user quota. | "Request limit exceeded. Please wait a moment." |
| `AI_PROVIDER_ERROR` | 503 / Fallback | Gemini API unreachable or timeout. | Transparently switches to Deterministic Reasoner. |
| `TOOL_EXECUTION_ERROR` | 422 | Tool calculation error with invalid parameters. | "Unable to calculate financial projection with current parameters." |
| `FINANCIAL_INVARIANT_ERROR` | 400 / Audit | Invariant failure detected during verification. | "Financial calculation inconsistency detected. Telemetry recorded." |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server exception. | "A critical server error occurred. Reference Request ID: <id>." |

---

## 5. Security & Sensitive Data Redaction Rules

1. **Zero Logging of Credentials:** Never log `password`, `token`, `refresh_token`, `otp`, `secret_key`, or `gemini_api_key`.
2. **Header Redaction:** Strip `Authorization`, `Cookie`, and `Set-Cookie` from telemetry logs.
3. **Financial Payload Privacy:** Do not dump raw transaction lists or bank account numbers to console/standard out. Use aggregate metadata (e.g. `tx_count=12, total=₹45,000`).
4. **Tenant Segregation:** All log queries and audit trail lookups must filter on `user_id`.
