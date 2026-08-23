# MONVEX Authentication OTP & Email Verification Implementation Plan

## 1. Current State & Architecture Analysis

### Current Backend Stack:
- **Framework**: Django 5.2.x with Django REST Framework (DRF).
- **Authentication**: `rest_framework_simplejwt` issuing standard JWT access and refresh tokens.
- **Current User Model**: Django built-in `User` mapped 1-to-1 with `apps.authentication.models.Profile`.
- **Current Auth Endpoints**:
  - `POST /api/v1/auth/register/` (creates user, stores plaintext OTP in Profile model, returns response).
  - `POST /api/v1/auth/verify-otp/` (verifies OTP stored in Profile, issues JWT).
  - `POST /api/v1/auth/resend-otp/` (generates new OTP in Profile).
  - `GET /api/v1/auth/inbox-simulator/` (simulation store).
  - `POST /api/v1/auth/login/` (SimpleJWT token obtain pair).
  - `GET /api/v1/auth/me/` (profile information).

### Deficiencies in Current Implementation:
1. **No Provider-Backed Verification**: OTPs are generated and validated locally instead of delegating to a real transactional provider like Twilio Verify.
2. **State Storage Vulnerability**: Plaintext OTP was stored in the `Profile` database record.
3. **No VerificationSession Model**: No dedicated session model tracking attempt counts, resend counts, IP hashes, expiry timestamps, or verification lifecycles.
4. **Missing Explicit User Lifecycle States**: Users lacked explicit `status` (`PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DISABLED`) and `email_verified` tracking.
5. **No Cooldown & Attempt Throttling Engine**: Resend cooldowns, max attempts (5), and session lockouts (`LOCKED`) were not enforced at the service level.
6. **No Provider Adapter Abstraction**: Custom logic was coupled to views rather than behind a pluggable `VerificationProvider` interface.

---

## 2. Proposed System Architecture

```
                       Frontend (Next.js / Tauri / Flutter)
                                        │
                                        ▼
                            Django REST API Views
                        (/api/v1/auth/verification/*)
                                        │
                                        ▼
                           VerificationService Layer
                    (Handles rate-limiting, session state,
                     atomic transactions, security checks)
                                        │
                                        ▼
                            Provider Adapter Layer
                        (VerificationProvider Interface)
                           ┌────────────┴────────────┐
                           ▼                         ▼
                  TwilioVerifyProvider      ConsoleVerificationProvider
                   (Production Mode)             (DEBUG Mode only)
                           │
                           ▼
                  Twilio Verify Engine
                           │
                           ▼
                  User Email (Real OTP)
```

---

## 3. Database Changes & Model Design

### A. Update `Profile` Model ([`backend/apps/authentication/models.py`](file:///d:/MONVEX/backend/apps/authentication/models.py)):
- Add `status`: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DISABLED` (default: `PENDING_VERIFICATION`).
- Add `email_verified`: `BooleanField(default=False)`.
- Remove plaintext `otp_code` and `otp_created_at` fields.

### B. New `VerificationSession` Model:
```python
class VerificationSession(models.Model):
    PURPOSE_CHOICES = [
        ('EMAIL_SIGNUP', 'Email Signup'),
        ('PASSWORD_RESET', 'Password Reset'),
        ('EMAIL_CHANGE', 'Email Change'),
        ('SENSITIVE_ACTION', 'Sensitive Action'),
    ]
    CHANNEL_CHOICES = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('EXPIRED', 'Expired'),
        ('LOCKED', 'Locked'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_sessions', null=True, blank=True)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES, default='EMAIL_SIGNUP')
    channel = models.CharField(max_length=16, choices=CHANNEL_CHOICES, default='EMAIL')
    destination = models.CharField(max_length=255) # normalized email or phone
    provider = models.CharField(max_length=32, default='twilio')
    provider_verification_id = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='PENDING')
    attempt_count = models.PositiveIntegerField(default=0)
    resend_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    ip_address_hash = models.CharField(max_length=64, blank=True, default='')
    user_agent_hash = models.CharField(max_length=64, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 4. Provider Adapter Layer Design

### Files to Create:
1. `backend/services/providers/base.py`:
   - `class VerificationProvider(ABC)`
   - Methods: `send_code`, `check_code`, `cancel_verification`, `normalize_provider_error`.
2. `backend/services/providers/twilio_verify.py`:
   - `class TwilioVerifyProvider(VerificationProvider)`:
   - Uses `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_VERIFY_SERVICE_SID`.
   - Dispatches real OTP verification requests to Twilio Verify v2 API.
3. `backend/services/providers/console_provider.py`:
   - `class ConsoleVerificationProvider(VerificationProvider)`:
   - Development mock adapter strictly guarded by `settings.DEBUG == True`.
   - Throws `ProviderUnavailableError` if called in production (`DEBUG=False`).
4. `backend/services/providers/__init__.py`: Factory function `get_verification_provider()`.

---

## 5. Verification Service Layer Design

### File to Create:
`backend/services/verification_service.py`:
- `start_email_verification(user, email, purpose, request_context)`:
  - Normalizes email, cleans up stale unverified sessions, checks rate limits.
  - Calls `provider.send_code(email, channel='email')`.
  - Creates `VerificationSession` record with 10-minute expiry and `resend_after=60`.
  - Returns sanitized `{ success: true, verification_id, email_masked, expires_in, resend_after }`.
- `check_email_verification(verification_id, code, request_context)`:
  - Validates session existence, status (`PENDING`), expiration, and attempt count (`< 5`).
  - Calls `provider.check_code(destination, code, provider_verification_id)`.
  - If approved:
    - Atomically updates `session.status = 'VERIFIED'`, `session.verified_at = now()`.
    - Updates `user.is_active = True`, `profile.status = 'ACTIVE'`, `profile.email_verified = True`.
    - Initializes fresh categories & starting balance via `UserInitService`.
    - Issues SimpleJWT tokens (`RefreshToken.for_user(user)`).
    - Returns `{ success: true, message, data: { access, refresh, user } }`.
  - If rejected:
    - Increments `session.attempt_count += 1`.
    - If `attempt_count >= 5` $\to$ sets `session.status = 'LOCKED'`.
    - Returns standardized `{ success: false, code: "INVALID_OTP", message, attempts_remaining }`.
- `resend_email_verification(verification_id, request_context)`:
  - Enforces 60-second cooldown from `session.last_sent_at`.
  - Enforces maximum 5 resends per session.
  - Calls `provider.send_code`.
  - Updates `session.last_sent_at = now()`, `session.resend_count += 1`.
  - Returns `{ success: true, message, resend_after: 60 }`.

---

## 6. API Endpoints & Standardized Error Envelope

### Endpoints:
- `POST /api/v1/auth/register/` (Registration $\to$ creates pending user & starts verification)
- `POST /api/v1/auth/verification/send/` (Send / restart verification)
- `POST /api/v1/auth/verification/check/` (Check code $\to$ activates account & returns JWT)
- `POST /api/v1/auth/verification/resend/` (Resend verification code with cooldown)
- `POST /api/v1/auth/login/` (JWT token issuance guarded by `email_verified == True`)

### Standardized Error Codes:
- `INVALID_OTP`
- `OTP_EXPIRED`
- `TOO_MANY_ATTEMPTS`
- `RESEND_COOLDOWN`
- `RESEND_LIMIT`
- `VERIFICATION_NOT_FOUND`
- `ALREADY_VERIFIED`
- `ACCOUNT_NOT_VERIFIED`
- `PROVIDER_UNAVAILABLE`
- `RATE_LIMITED`

---

## 7. Frontend Architecture & UX

### Files to Update:
- `web/src/app/register/page.tsx`:
  - Production-ready 6-digit numeric input with single source of truth, auto-advance, backspace handling, paste support.
  - Explicit UI states: `IDLE`, `SENDING`, `CODE_SENT`, `VERIFYING`, `VERIFIED`, `INVALID_CODE`, `EXPIRED`, `RATE_LIMITED`, `NETWORK_ERROR`, `SERVER_ERROR`, `ALREADY_VERIFIED`.
  - Cooldown timer (60s), disabled button during cooldown, masked email indicator (`d***@gmail.com`).
  - On approval: stores tokens in `AuthContext`, shows welcome toast, redirects to `/dashboard`.
- `web/src/lib/api.ts`:
  - `register(userData)`
  - `sendVerification(email)`
  - `checkVerification(verification_id, code)`
  - `resendVerification(verification_id)`

---

## 8. Test Plan

Comprehensive test suite in `backend/tests/test_verification_system.py`:
1. Registration creates user in `PENDING_VERIFICATION` state with `email_verified=False`.
2. Verification session is created and provider `send_code` is invoked.
3. Raw OTP is never exposed in any API response.
4. Correct OTP verifies session, activates user (`ACTIVE`), sets `email_verified=True`, and issues JWT.
5. Incorrect OTP returns `INVALID_OTP` and decrements `attempts_remaining`.
6. 5 incorrect attempts locks the session (`LOCKED`) and returns `TOO_MANY_ATTEMPTS`.
7. Expired verification sessions return `OTP_EXPIRED`.
8. Resend within 60 seconds returns `RESEND_COOLDOWN` (HTTP 429).
9. More than 5 resends returns `RESEND_LIMIT` (HTTP 429).
10. Unverified users cannot log in via `auth/login/` (returns `ACCOUNT_NOT_VERIFIED`).
11. Unverified registration usernames/emails can be reclaimed if abandoned.
12. Verified users cannot register again (returns duplicate error).
13. Provider failure returns `PROVIDER_UNAVAILABLE` without leaking credentials.
14. Security logging does not contain secrets or plaintext OTPs.
