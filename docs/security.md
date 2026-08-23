# MONVEX Security & Isolation Specification

## 1. Multi-Tenant Data Isolation
- Every database query and service layer function requires the authenticated `user` instance.
- Django ORM queries must explicitly filter by `user=request.user` at all times. Global unbounded querysets (`Model.objects.all()`) in API views are strictly prohibited.
- Custom Django model manager or scoped querysets ensure multi-tenant safety.

## 2. Authentication & Session Management
- Stateless JSON Web Tokens (JWT) via `djangorestframework-simplejwt`.
- Access tokens have short TTLs (e.g., 15–30 minutes) and Refresh tokens are stored with secure rotation.
- Password hashing uses Argon2 or PBKDF2 with high iteration counts.

## 3. Sandboxing AI & External Integrations
- LLM prompts are isolated from direct DB access.
- Controlled tools sanitize inputs, validate types against Pydantic/dataclass schemas, and enforce ownership checks before executing backend service calls.
- API keys (Gemini API, database credentials, secret keys) are injected exclusively through environment variables and never logged or committed.

## 4. Input Sanitization & Auditability
- All natural language and OCR inputs are sanitized against SQL injection, XSS, and command injection attacks.
- High-impact events (password changes, bulk deletions, financial settings changes) write immutable audit log records.
