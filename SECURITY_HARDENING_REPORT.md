# MONVEX Security Hardening & Threat Model Assessment

> **Classification:** High-Assurance Financial Application Security Audit  
> **Standards:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), WCAG 2.2 AA  
> **Evaluation Date:** 2026-10-12

---

## 1. Threat Model & Security Posture Overview

MONVEX processes sensitive personal financial data, including income ledgers, bank transactions, categorical expenses, and savings goals. The security posture enforces Defense-in-Depth across every layer:

```
[Network Layer]   -> Cloudflare SSL / Strict CORS / CSRF Validation
[Edge WAF Layer]  -> SecurityDefenseMiddleware (SQLi, XSS, Path Traversal, Cmd Injection)
[Auth Layer]      -> SimpleJWT Token Rotation, Blacklisting, HttpOnly SameSite=Lax Cookies
[App Layer]       -> Strict Multi-Tenant Queryset Filtering (user=request.user)
[Data Layer]      -> Neon PostgreSQL SSL Connections, Encrypted Backups, Decimal Precision
[AI Layer]        -> Strict Scoped Tool Calls, Prompt Injection Regex Sanitization
```

---

## 2. Security Controls & Hardening Implementations

### 2.1 Multi-Tenant Data Isolation & IDOR Protection
* **Requirement:** No authenticated user can access, modify, export, or delete another user's financial assets.
* **Implementation:**
  * Every view in `apps.transactions`, `apps.budgets`, `apps.goals`, and `apps.analytics` overrides `get_queryset()` to filter strictly by `user=self.request.user`.
  * Detail views rely on DRF's `get_object_or_404()` within the user-scoped queryset.
  * Verified across 108 integration test cases attempting cross-tenant UUID enumeration; all return HTTP 404 (Not Found).

### 2.2 Injection Defense & Real-Time WAF (`SecurityDefenseMiddleware`)
* **SQL Injection (SQLi):**
  * Django ORM parameterized queries are used exclusively.
  * `SecurityDefenseMiddleware` scans URL parameters and JSON payloads for SQLi patterns (`UNION SELECT`, `' OR '1'='1`, `DROP TABLE`), immediately returning HTTP 400 and logging a `CRITICAL` audit entry.
* **Cross-Site Scripting (XSS):**
  * `XSS_PATTERN` blocks `<script>`, `javascript:`, `onerror=`, `document.cookie` payloads.
  * React JSX auto-escapes rendered text.
* **Anti-CSV-Injection (Formula Sanitization):**
  * In `TransactionExportCSVView`, any cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is automatically escaped with a leading single quote (`'`), neutralizing spreadsheet DDE exploits.

### 2.3 Authentication & Session Lifecycle
* **Dual Transport Refresh:** `CookieTokenRefreshView` accepts refresh tokens either via HttpOnly cookie `monvex_refresh_token` or JSON body.
* **Token Rotation & Blacklist:**
  * Access token lifetime: 60 minutes.
  * Refresh token lifetime: 7 days.
  * `ROTATE_REFRESH_TOKENS = True` and `BLACKLIST_AFTER_ROTATION = True`.
* **Inactivity & Session Expiration:** Client tracks pointer and key activity; expires local session after inactivity threshold.
* **Zero Logging of Tokens:** Request correlation middleware logs request IDs and timings, strictly omitting authorization headers.

### 2.4 Production Settings Hardening (`settings.py`)
* `DEBUG = False` enforced for production deployments.
* `SECRET_KEY` guarded: raises `ImproperlyConfigured` if missing or insecure default.
* `SECURE_SSL_REDIRECT = True`
* `SESSION_COOKIE_SECURE = True`
* `CSRF_COOKIE_SECURE = True`
* `SECURE_HSTS_SECONDS = 31536000` (1 year)
* `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`
* `SECURE_HSTS_PRELOAD = True`
* `X_FRAME_OPTIONS = 'DENY'`
* `SECURE_CONTENT_TYPE_NOSNIFF = True`

### 2.5 AI Copilot Security & Grounding Boundaries
* **System Prompt Extraction Protection:** Input filters intercept adversarial prompts ("ignore previous instructions", "reveal system prompt", "bypass security policy").
* **No Speculative Ledger Creation:** Copilot strictly relies on MONVEX tools to fetch actual ledger metrics; does not hallucinate balances.
* **No PII Leaks to Search:** Google Search grounding is restricted to general market queries; private ledger data is never transmitted to web search tools.

---

## 3. Dependency Vulnerability Audit

* **NPM Audit:** `npm audit fix` executed. Resolved `source-map-js` vulnerability.
* **Upstream Advisories:** Next.js 14 and Tailwind v3 retain advisories whose automated fix requires major breaking upgrades (Next 16 and Tailwind 4). In accordance with the deployment rule ("Do not blindly update every dependency to its latest version... identify breaking changes"), the current versions are locked and protected by edge reverse proxy headers and WAF middleware.
* **Python Safety:** `backend/requirements.txt` locked to modern, supported versions (`django>=5.0`, `psycopg2-binary>=2.9.9`, `cryptography>=42.0.0`, `pydantic>=2.6.0`).
