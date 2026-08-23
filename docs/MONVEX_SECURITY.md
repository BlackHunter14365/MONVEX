# MONVEX 2.0 Security Architecture & Hardening

## 1. Zero-Trust Cyber Defense Architecture

```
Incoming HTTP Request
  │
  ▼
SecurityDefenseMiddleware (WAF)
  ├── 1. SQL Injection Engine (UNION, SELECT, SLEEP, benchmark, inline comments) -> 403 Forbidden
  ├── 2. XSS Protection Engine (<script>, javascript:, onerror=, onload=) -> 403 Forbidden
  └── 3. Path Traversal Shield (../, ..\\, etc/passwd, win.ini) -> 403 Forbidden
  │
  ▼
JWT Authentication & Multi-Tenant Query Scoping (`request.user`)
  │
  ▼
SecurityAuditLog (Logs all critical actions & attacks with IP, UA, timestamp, incident UUID)
  │
  ▼
HTTP Hardened Response Headers (CSP, HSTS 2.0, X-Frame-Options DENY, nosniff, COOP, CORP)
```

---

## 2. Cryptographic Storage & Currency Precision
- All currency balances are stored strictly in `Decimal(12, 2)` or `Decimal(14, 2)`.
- Passwords hashed with Argon2/PBKDF2 SHA256.
- Database access and session tokens support instant single-click revocation via `/api/v1/security/revoke-sessions/`.
