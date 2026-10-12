# MONVEX SECURITY CONTROL MATRIX & VERIFICATION REGISTER
**Subsystem:** Cyber Defense & Security Center (`/security`)  
**Specification:** Technical Control Mapping, Evidence Register & Audit Assertions  
**Classification:** Core Security Engineering Documentation  
**Version:** 3.4.0  

---

## 1. Overview & Control Mapping Principles

This matrix provides the comprehensive mapping of all security controls displayed on the MONVEX Cyber Defense interface to their concrete implementation classes, runtime configuration parameters, and automated verification tests.

> [!NOTE]
> Control statuses reflect verified system reality. Informal alignment to industry frameworks (e.g., OWASP ASVS, NIST SP 800-63B) represents architectural control mapping, not third-party compliance certification.

---

## 2. Complete Perimeter Security Matrix & Compliance Gates

| Control ID | Control Name | Domain / Category | Status | Enforcement Layer / Component | Automated Verification Method | Verified Evidence (Safe Summary) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CTRL-RATE-LIMIT`** | WAF Rate Limiting & Throttling | Request Protection | `ENFORCED` | Django REST Framework Throttling (`monvex/settings.py`) | `SecurityScanner._execute_check('CHK-RATE-LIMITING')` & `ContactBackendTests.test_contact_rate_limiting` | `AnonRateThrottle` enforced at 120 req/min; `UserRateThrottle` enforced at 1200 req/hr. Contact API rate limit enforced at 5 req/15min. |
| **`CTRL-WAF-INJECTION`** | SQL Injection & XSS Guard | Application Boundary | `VERIFIED` | `apps.security.middleware.SecurityDefenseMiddleware` & Django ORM | `SecurityRegressionGateTestSuite.test_gate_01` to `test_gate_04` | Regex threat engine intercepts hostile SQLi (`UNION SELECT`, `' OR '1'='1`), XSS (`<script>`, `<svg onload>`), Path Traversal (`../../`), and OS Command Injection (`| curl`, `; cat`). Returns HTTP 403 with incident UUID. |
| **`CTRL-TOKEN-ROTATION`** | Zero-Trust Token Rotation | Session Security | `ENFORCED` | `rest_framework_simplejwt.token_blacklist` | `SecurityCenterTestSuite.test_04_revoke_other_sessions_multi_device` | `ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`. Invalidation recorded in `BlacklistedToken` table upon every refresh exchange. |
| **`CTRL-PASSWORD-HASH`** | Argon2 / PBKDF2 Password Hashing | Cryptography | `STANDARDIZED` | Django Authentication Password Hashers (`settings.PASSWORD_HASHERS`) | `SecurityScanner._execute_check('CHK-PASSWORD-HASHING')` | PBKDF2 with SHA-256 and 720,000 iterations (or Argon2id) standard hashing active. Protects passwords against GPU and ASIC dictionary cracking. |
| **`CTRL-CSRF`** | CSRF Double-Submit Defense | Transport & Origin | `ACTIVE` | `django.middleware.csrf.CsrfViewMiddleware` | `SecurityScanner._execute_check('CHK-CSRF-PROTECTION')` | `CsrfViewMiddleware` active in request processing pipeline. Origin authenticity cryptographically validated on mutating requests. |
| **`CTRL-AUDIT-TRAIL`** | Tamper-Evident SHA-256 Audit Trail | Audit & Logging | `LOGGING` | `apps.security.models.SecurityAuditLog` | `apps.security.models.verify_audit_log_chain()` & `SecurityCenterTestSuite.test_06` | Append-only SHA-256 cryptographic hash chain linking each audit event to the previous record's hash. Tamper detection detects modified payload or deleted records. |
| **`CTRL-SESSION-REGISTRY`** | Authoritative Server-Side Session Isolation | Identity & Access | `ENFORCED` | `apps.security.models.UserSession` & `SessionAwareJWTAuthentication` | `SecurityCenterTestSuite.test_04_revoke_other_sessions_multi_device` | Access tokens carry embedded `session_id`. Revoked sessions in the database immediately invalidate access tokens on all API endpoints. |
| **`CTRL-COOKIE-FLAGS`** | Secure Cookie Attribute Enforcement | Client Storage | `ENFORCED` | Django Settings & `authentication/views.py` | `SecurityScanner._execute_check('CHK-SECURE-COOKIES')` | Refresh tokens held in `HttpOnly`, `SameSite=Lax` cookies; `SESSION_COOKIE_HTTPONLY=True`. Prevents JavaScript access to long-lived credentials. |
| **`CTRL-FRAME-GUARD`** | Clickjacking Frame Protection | Client Security | `ENFORCED` | `django.middleware.clickjacking.XFrameOptionsMiddleware` | `SecurityScanner._execute_check('CHK-SECURITY-HEADERS')` | `X-Frame-Options: DENY` header attached. Prevents UI redressing, iframe framing, and clickjacking attacks. |
| **`CTRL-DB-ACID`** | Database Transaction Isolation | Data Integrity | `VERIFIED` | Django ORM & Database Driver (SQLite / PostgreSQL) | `SecurityScanner._execute_check('CHK-DATABASE-INTEGRITY')` | Atomic database transactions wrap registration, session revocation, and financial state transitions. |

---

## 3. Top Security Status Cards Mapping

### 3.1 Perimeter Defense
- **Displayed Status:** `ACTIVE SHIELD` (or `ATTENTION REQUIRED`)
- **Backend Metric Source:** `SecurityOverviewView.perimeter_defense`
- **Criteria:** Evaluates live WAF middleware state (`SecurityDefenseMiddleware`) and total blocked attack count from `SecurityAuditLog`. If critical posture items are flagged, status transitions to `ATTENTION REQUIRED`.

### 3.2 Session Isolation
- **Displayed Status:** `Single Active Session` (or `N Active Sessions`)
- **Backend Metric Source:** `UserSession.objects.filter(user=user, is_active=True).count()`
- **Criteria:** Displays exact server-side active session count for the authenticated user. If > 1 device is registered, warns "Multi-device footprint detected". Clicking "Revoke Other Sessions" deactivates all other sessions and brings count to 1.

### 3.3 Defense Health Score
- **Displayed Status:** `${score} / 100` (e.g., `97.4 / 100`)
- **Backend Metric Source:** `SecurityScan.objects.filter(user=user).latest('created_at').score`
- **Criteria:** Calculated from the 13 discrete runtime checks of `SecurityScanner`. Weighted by check criticality. Zero hardcoding.

### 3.4 Audit Log Stream
- **Displayed Status:** `${total_events} Events Logged`
- **Backend Metric Source:** `SecurityAuditLog.objects.filter(user=user).count()`
- **Criteria:** Accurate count of persisted cryptographic security events scoped strictly to the authenticated user.
