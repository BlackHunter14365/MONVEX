# MONVEX Authentication Simplification & User Isolation Specification

## 1. Executive Summary
This document establishes the simplified authentication architecture and strict multi-tenant user data isolation policy for MONVEX. 

To streamline onboarding while maintaining enterprise security:
- The OTP email verification requirement is decoupled into an environment-controlled feature flag: `AUTH_REQUIRE_EMAIL_VERIFICATION=false`.
- Authentication follows standard secure credentials verification: **Registration $\to$ Secure Password Hashing $\to$ JWT Generation $\to$ Strict User-Isolated Workspace**.
- The existing OTP verification engine (`VerificationService`, `VerificationSession`, `TwilioVerifyProvider`, `SmtpVerifyProvider`, `EmailDispatch`) remains completely intact and isolated in the codebase, ready for zero-downtime reactivation when `AUTH_REQUIRE_EMAIL_VERIFICATION=true`.
- All active demo login buttons, hardcoded demo mock sessions, and automatic demo account logins are eliminated from normal production runtime.
- Multi-tenant data isolation is strictly audited and enforced across all database queries and endpoints to prevent Insecure Direct Object References (IDOR).

---

## 2. Current vs. Simplified Authentication Architecture

```
[FUTURE / OTP MODE (AUTH_REQUIRE_EMAIL_VERIFICATION=true)]
Register (POST /api/v1/auth/register/)
   │
   ▼
User created with is_active=False, Profile status='PENDING_VERIFICATION'
   │
   ▼
VerificationService starts OTP session & dispatches email (Twilio / SMTP)
   │
   ▼
User enters 6-digit OTP (POST /api/v1/auth/verification/check/)
   │
   ▼
Account activated & JWT Tokens issued


[ACTIVE SIMPLIFIED MODE (AUTH_REQUIRE_EMAIL_VERIFICATION=false)]
Register (POST /api/v1/auth/register/)
   │
   ▼
User created with is_active=True, Profile status='ACTIVE', password hashed with PBKDF2/Argon2
   │
   ▼
Direct JWT Tokens issued (access & refresh) + Authenticated User payload
   │
   ▼
Immediate redirection to clean, isolated Executive Dashboard
```

---

## 3. Configuration & Feature Flag Matrix

| Variable Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Boolean | `False` | When `False`, registration creates active accounts and issues JWTs directly without dispatching OTP. When `True`, OTP is strictly enforced. |
| `OTP_PROVIDER` | String | `smtp` | Configured provider adapter (`smtp` / `twilio` / `console`). |

---

## 4. User Data Isolation & IDOR Prevention Architecture

Every resource model in MONVEX is strictly bound to `User`:

```
User (PK)
  ├── Profile (OneToOne: user)
  ├── Transaction (ForeignKey: user)
  ├── RecurringPayment (ForeignKey: user)
  ├── Category (ForeignKey: user, or is_system_default=True)
  ├── Budget (ForeignKey: user)
  ├── SavingsGoal (ForeignKey: user)
  │     └── GoalContribution (ForeignKey: goal [where goal.user == request.user])
  ├── AnomalyEvent (ForeignKey: user)
  ├── AIInteraction (ForeignKey: user)
  ├── AIInsight (ForeignKey: user)
  └── VerificationSession (ForeignKey: user)
```

### Strict Query Scoping Rules:
1. **No Unbounded Queries**: All queryset evaluations in API views and domain services (`FinanceService`, `ForecastService`, `BudgetService`, `TransactionService`, `AICopilotService`) must explicitly filter by `user=request.user`.
2. **IDOR Hardening**: Detail, update, and delete endpoints for transactions, budgets, goals, and recurring payments use `get_object_or_404(Model, pk=pk, user=request.user)` or `get_queryset().filter(user=request.user)`. Accessing another user's entity returns **404 Not Found** with zero information leakage.
3. **Fresh Workspace Invariant**: Newly registered users initialize with ₹0 liquid balance, 0 transactions, 0 active budgets, and 0 goals. No hardcoded or demo data is seeded into normal production accounts.

---

## 5. Files to Modify vs. Files to Preserve

### Files to Modify:
- [`backend/monvex/settings.py`](file:///d:/MONVEX/backend/monvex/settings.py): Add `AUTH_REQUIRE_EMAIL_VERIFICATION` flag.
- [`backend/.env.example`](file:///d:/MONVEX/backend/.env.example): Document `AUTH_REQUIRE_EMAIL_VERIFICATION=false`.
- [`backend/apps/authentication/serializers.py`](file:///d:/MONVEX/backend/apps/authentication/serializers.py): Update `RegisterSerializer` to respect the flag and create active users when disabled.
- [`backend/apps/authentication/views.py`](file:///d:/MONVEX/backend/apps/authentication/views.py):
  - `RegisterView`: Return JWT tokens immediately if `AUTH_REQUIRE_EMAIL_VERIFICATION=False`, or return verification response if `True`.
  - `CustomLoginView` & `CustomTokenObtainPairSerializer`: Validate password and account active status without blocking unverified emails when flag is `False`.
  - Add `LogoutView` (`POST /api/v1/auth/logout/`).
- [`web/src/app/register/page.tsx`](file:///d:/MONVEX/web/src/app/register/page.tsx): Direct single-step registration when verification is off, auto-logging into dashboard.
- [`web/src/app/login/page.tsx`](file:///d:/MONVEX/web/src/app/login/page.tsx): Removed demo login button and demo account autofill.
- [`web/src/context/AuthContext.tsx`](file:///d:/MONVEX/web/src/context/AuthContext.tsx): Complete session and cache clearance upon logout.
- [`web/src/lib/api.ts`](file:///d:/MONVEX/web/src/lib/api.ts): Support direct registration JWTs and logout endpoint.

### Files to Preserve (for future OTP activation):
- `backend/services/verification_service.py`
- `backend/services/providers/` (`base.py`, `twilio_verify.py`, `smtp_verify.py`, `__init__.py`)
- `backend/apps/authentication/models.py` (`VerificationSession`, `EmailDispatch`)
- `backend/apps/authentication/management/commands/test_otp_provider.py`
