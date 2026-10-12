# MONVEX SECURITY LIMITATIONS & THREAT MODEL BOUNDARIES
**Subsystem:** Cyber Defense & Security Center (`/security`)  
**Specification:** Technical Limitations, Residual Risks & Non-Claims  
**Classification:** Core Security Engineering Documentation  
**Version:** 3.4.0  

---

## 1. Scope & Honest Threat Model

In accordance with MONVEX Engineering Directives, this document explicitly articulates the boundaries, assumptions, and known technical limitations of the implemented security controls. No protection is exaggerated or claimed beyond verified server-side enforcement.

---

## 2. Identified Limitations & Residual Risk Register

### 2.1 Cryptographic Hash Chain Storage Boundary
- **Implemented Protection:** Every `SecurityAuditLog` entry is linked via an append-only SHA-256 cryptographic hash chain ($H_i = \text{SHA256}(H_{i-1} \,\|\, \text{payload}_i)$). The verification utility `verify_audit_log_chain()` detects any record tampering (`HASH_PAYLOAD_TAMPERED`) or deleted rows (`PREVIOUS_HASH_CHAIN_MISMATCH`).
- **Limitation:** The hash chain resides within the application's primary relational database (SQLite locally, PostgreSQL/Neon in production).
- **Residual Risk:** An attacker who achieves full superuser DBA access (direct database root credentials) could theoretically truncate tables or recalculate the entire chain forward from an arbitrary point.
- **Recommended Hardening:** For absolute non-repudiation, stream audit records in real-time to external immutable storage (e.g., AWS S3 with Object Lock in Compliance Mode, Datadog Cloud SIEM, or a dedicated syslog collector).

### 2.2 Device Fingerprinting Heuristics
- **Implemented Protection:** `UserSession` records track client IP addresses, User-Agent strings, and friendly device categories (e.g., "Chrome Browser", "Mobile Device").
- **Limitation:** User-Agent strings are supplied by client HTTP headers and can be spoofed or duplicated across multiple physical devices using identical browser versions.
- **Residual Risk:** Device names provide operational recognition for users, but cannot serve as cryptographic proofs of physical hardware identity.
- **Recommended Hardening:** Integrate WebAuthn (FIDO2) hardware-backed device credentials or client TLS certificate binding for high-security enterprise deployments.

### 2.3 Diagnostic Scanner Scope
- **Implemented Protection:** `SecurityScanner` executes 13 real, automated checks against the application's runtime configuration, middleware stack, CORS settings, cookie attributes, database health, and token rotation rules.
- **Limitation:** The scanner operates strictly from an internal diagnostic perspective. It does not perform active, external dynamic vulnerability scanning (DAST) or automated penetration testing against live third-party financial aggregators or payment gateways.
- **Residual Risk:** Passing all 13 internal checks indicates adherence to baseline configuration and application hardening standards, but does not guarantee the complete absence of unknown application business-logic vulnerabilities.

### 2.4 Distributed Edge Caching and Microsecond Token Propagation
- **Implemented Protection:** `SessionAwareJWTAuthentication` queries `UserSession.is_active` on every authenticated request, guaranteeing instant access token rejection when a session is revoked.
- **Limitation:** In massive multi-region distributed deployments, database replica lag (if read replicas are used without write-through pinning) could introduce a multi-millisecond window before replica databases reflect the revocation status.
- **Residual Risk:** Currently negligible as MONVEX utilizes centralized primary database read-write routing for all security authentication queries.
