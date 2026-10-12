# MONVEX SECURITY CENTER IMPLEMENTATION PLAN
**Module:** Cyber Defense & Security Center (`/security`)  
**Target Environment:** Local Test & Production-Ready Hardening  
**Standard:** Enterprise Application Security & Zero-Trust Architecture  
**Author:** Principal Security & Full-Stack Engineering Team  

---

## 1. Executive Summary & Objective

This plan outlines the engineering roadmap to transform the **MONVEX Security Center** from a prototype visual interface into a genuinely functional, evidence-backed security management and audit subsystem. 

Every displayed control, score, and state is wired to authentic server-side checks. Client actions such as **"Revoke Other Sessions"** and **"Run Security Scan"** execute authoritative server-side logic with audit logging, zero data fabrication, and rigorous test coverage.

---

## 2. Baseline Architecture & Current State Findings

| Dimension | Observed State | Required Target State |
| :--- | :--- | :--- |
| **Revoke Other Sessions** | `RevokeAllSessionsView` indiscriminately blacklisted all user tokens without isolating the current session or providing immediate access token invalidation. | Identify caller's active session, blacklist only other outstanding refresh tokens, invalidate other session access tokens via server-side session registry, and keep current session usable. |
| **Run Security Scan** | `SecurityVulnerabilityScanView` returned a static, hardcoded JSON array with fabricated 100% pass scores. | Implement `SecurityScanner` engine running 13 real configuration, middleware, header, DB, and token checks; compute weighted health score based strictly on executed checks. |
| **Top 4 Summary Cards** | Hardcoded values in `page.tsx` ("ACTIVE SHIELD", "Single Active Session", "98.5 / 100", static copy). | Derive cards dynamically from backend scan state, real session registry counts, authentic health score, and immutable audit log counts. |
| **Matrix & Compliance Gates** | 6 hardcoded static cards rendered in JSX. | Wire directly to backend `matrix_controls` backed by live runtime checks and middleware inspection. |
| **Audit Logging** | Basic `SecurityAuditLog` without tamper-evident hash chaining; lacked scan event details and session isolation. | Cryptographic SHA-256 hash chaining on all log records with chain verification utility, strictly scoped to authenticated user. |
| **Visual Design** | Clean Aurora Glass / Light Theme with purple accents and rounded cards. | 100% preserved visual fidelity, responsive on desktop and mobile, with added Scan Results breakdown modal. |

---

## 3. Engineering Work Breakdown Structure (WBS)

### Phase 1: Database Models & Migrations
1. **`UserSession` Model (`apps.security.models.py`):**
   - Fields: `id` (UUID), `user` (FK), `session_key` (Char), `refresh_jti` (Char, indexed), `access_jti` (Char, indexed), `ip_address` (Char), `user_agent` (Text), `device_name` (Char), `is_active` (Bool, indexed), `created_at` (DateTime), `last_activity` (DateTime), `revoked_at` (DateTime, nullable).
   - Indexes on `['user', 'is_active']`, `['refresh_jti']`.
2. **`SecurityScan` Model (`apps.security.models.py`):**
   - Fields: `id` (UUID), `user` (FK, nullable), `score` (Float), `status` (Char), `passed_count` (Int), `failed_count` (Int), `warning_count` (Int), `unknown_count` (Int), `duration_ms` (Int), `results` (JSON), `created_at` (DateTime).
3. **`SecurityAuditLog` Enhancements:**
   - Add `prev_hash` (CharField 64) and `hash` (CharField 64) to form an append-only SHA-256 cryptographic hash chain.
   - Implement `compute_hash()` and chain validation function `verify_audit_log_chain()`.

### Phase 2: Authentication & Session Revocation Subsystem
1. **`SessionAwareJWTAuthentication` (`apps.security.authentication.py`):**
   - Subclasses SimpleJWT's `JWTAuthentication`.
   - Validates access token validity. If token contains `session_id`, verifies that `UserSession` is active.
   - If session is revoked (`is_active=False`), raises `AuthenticationFailed('Session has been revoked.')`.
2. **Session Creation & Binding Utility:**
   - Helpers to issue or register sessions during login/token creation, attaching `session_id` to JWT tokens.
3. **`RevokeOtherSessionsView` (`POST /api/v1/security/revoke-sessions/`):**
   - Authenticated user endpoint.
   - Determines caller's current session via `monvex_refresh_token` cookie, body `refresh`, or access token `session_id`.
   - Locates all other active sessions and outstanding refresh tokens belonging to `request.user`.
   - Atomically blacklists all other refresh tokens via SimpleJWT `BlacklistedToken`.
   - Updates other `UserSession` records: `is_active = False`, `revoked_at = timezone.now()`.
   - Current session remains active and usable.
   - Creates authoritative `SecurityAuditLog` event (`SESSION_REVOKED`).
   - Returns `{ success: true, revoked_count: n, message: "..." }`.

### Phase 3: Real Security Scanning Engine
1. **`SecurityScanner` (`apps.security.scanner.py`):**
   - Real, executable checks:
     - `CHK-DEBUG`: Runtime `settings.DEBUG` evaluation.
     - `CHK-SECRET`: Secret key entropy and length evaluation.
     - `CHK-ALLOWED-HOSTS`: Host header injection boundary inspection.
     - `CHK-SECURE-COOKIES`: HttpOnly, Secure, and SameSite cookie attributes.
     - `CHK-CSRF-PROTECTION`: CSRF middleware & origin enforcement.
     - `CHK-CORS-ORIGINS`: Cross-origin resource sharing access lists.
     - `CHK-SECURITY-HEADERS`: X-Frame-Options, X-Content-Type-Options, HSTS, WAF headers.
     - `CHK-TOKEN-ROTATION`: SimpleJWT rotation & blacklisting verification.
     - `CHK-RATE-LIMITING`: DRF throttle classes and threshold rates.
     - `CHK-PASSWORD-HASHING`: Password hasher algorithm and work factor.
     - `CHK-WAF-INTRUSION-PREVENTION`: Active Defense WAF middleware inspection.
     - `CHK-AUDIT-PERSISTENCE`: Immutable audit log engine status.
     - `CHK-DATABASE-INTEGRITY`: Database connection and transaction atomicity.
   - Weighted score calculation (0 - 100%).
   - Persists scan in `SecurityScan` and emits `SecurityAuditLog` (`VULNERABILITY_SCAN`).

### Phase 4: API Endpoints & Serializers
1. Update `SecurityOverviewView`:
   - Returns `health_score`, `perimeter_defense`, `session_isolation`, `audit_stream`, `matrix_controls`, `active_sessions`, `recent_audit_logs`.
   - Derived 100% from real database entities and scanner diagnostics.
2. Update `SecurityVulnerabilityScanView`:
   - Invokes `SecurityScanner.run_scan(user=request.user, ip=ip)`.
   - Returns full scan findings, latency, and breakdown.
3. Update `SecurityAuditLogListView`:
   - Strictly user-scoped or administrative access.
   - Filtering by `severity`, `event_type`.

### Phase 5: Frontend Refinement (`web/src/app/security/page.tsx`)
1. Connect top 4 summary cards to `overview` dynamic properties with graceful fallbacks.
2. Connect Perimeter Security Matrix to `overview.matrix_controls` with live badges (`ENFORCED`, `VERIFIED`, `ACTIVE`, `WARNING`).
3. Scan execution:
   - Run Scan button displays loader, prevents double-clicks.
   - Scan results modal renders detailed check findings (title, category, latency, status badge, safe evidence).
   - Invalidation of security queries to update health score and matrix in real time.
4. Revoke Other Sessions:
   - Confirmation modal with explicit count and warning.
   - Executes revocation, shows honest toast message, updates Session Isolation card.
5. Mobile & Desktop responsive layout preservation.

### Phase 6: Automated Testing & Verification
1. Test suite in `backend/apps/security/tests.py` covering:
   - Unauthenticated rejection on all endpoints.
   - Revocation with no other sessions (clean no-op message).
   - Revocation with multiple other sessions: other sessions revoked, current session unaffected.
   - Revoked refresh tokens rejected at `/api/v1/auth/token/refresh/`.
   - Revoked access tokens rejected at protected endpoints.
   - Other users' sessions completely isolated and unrevoked.
   - Security scanner executes real checks and produces valid scores.
   - Audit log persistence and hash chain integrity verification.
2. Frontend production build test (`npm run build`).
3. Documentation generation in `docs/security-center/`.
