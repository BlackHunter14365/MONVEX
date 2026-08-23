# MONVEX Authentication & Verification API Specification

## Overview

The MONVEX Authentication and Email Verification system implements a provider-backed, multi-platform verification architecture with state machine enforcement, attempt throttling, cooldown management, and atomic account activation.

---

## State Machine

```
REGISTRATION_STARTED
        │
        ▼
PENDING_VERIFICATION (email_verified=false, is_active=false)
        │
        ▼
     OTP_SENT (VerificationSession status=PENDING)
        │
        ▼
USER_ENTERS_CODE
        │
        ▼
    VERIFYING
   ┌────┼──────────────┐
   ▼    ▼              ▼
SUCCESS INVALID       EXPIRED
   │    │              │
   │    ▼              ▼
   │  RETRY (attempts--) RESEND (subject to 60s cooldown)
   │    │
   │    ▼ (if attempts == 0)
   │  LOCKED (status=LOCKED)
   ▼
ACTIVE (email_verified=true, is_active=true)
   │
   ▼
JWT ISSUED (access_token, refresh_token)
```

---

## Configuration & Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `OTP_PROVIDER` | Active verification provider adapter (`twilio` or `console`) | `twilio` |
| `OTP_CHANNEL` | Default verification channel (`email` or `sms`) | `email` |
| `OTP_EXPIRY_SECONDS` | Verification session lifetime in seconds | `600` (10 minutes) |
| `OTP_RESEND_COOLDOWN_SECONDS` | Minimum seconds between resend requests | `60` |
| `OTP_MAX_ATTEMPTS` | Maximum allowed invalid verification code attempts | `5` |
| `OTP_MAX_RESENDS` | Maximum allowed resends per verification session | `5` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (Production) | `""` |
| `TWILIO_API_KEY` | Twilio API Key or Auth Token (Production) | `""` |
| `TWILIO_API_SECRET` | Twilio API Secret (if using API Key) | `""` |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID (e.g. `VA...`) | `""` |

---

## API Endpoints

### 1. User Registration (`POST /api/v1/auth/register/`)

Initiates user signup, creates a pending account, and starts a verification session with the provider.

#### Request Body:
```json
{
  "username": "alex_monvex",
  "email": "alex@example.com",
  "password": "SecurePassword123!",
  "phone_number": "+91 9876543210",
  "currency": "INR",
  "monthly_income": 75000.00
}
```

#### Success Response (`HTTP 201 Created`):
```json
{
  "success": true,
  "message": "Verification code sent.",
  "verification_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email_masked": "al***@example.com",
  "expires_in": 600,
  "resend_after": 60
}
```

---

### 2. Check Verification Code (`POST /api/v1/auth/verification/check/`)

Verifies the 6-digit OTP code against the verification session.

#### Request Body:
```json
{
  "verification_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "code": "849201"
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "access": "<JWT Access Token>",
    "refresh": "<JWT Refresh Token>",
    "user": {
      "id": 42,
      "username": "alex_monvex",
      "email": "alex@example.com",
      "phone_number": "+91 9876543210",
      "currency": "INR",
      "monthly_income": "75000.00",
      "is_verified": true
    }
  }
}
```

#### Failure Responses:
- **Invalid OTP (`HTTP 400 Bad Request`)**:
  ```json
  {
    "success": false,
    "code": "INVALID_OTP",
    "message": "The code is incorrect. Please try again.",
    "attempts_remaining": 4
  }
  ```
- **Expired Session (`HTTP 400 Bad Request`)**:
  ```json
  {
    "success": false,
    "code": "OTP_EXPIRED",
    "message": "This verification session has expired. Please request a new code."
  }
  ```
- **Session Locked (`HTTP 429 Too Many Requests`)**:
  ```json
  {
    "success": false,
    "code": "TOO_MANY_ATTEMPTS",
    "message": "Maximum verification attempts exceeded. Please restart registration."
  }
  ```

---

### 3. Resend Verification Code (`POST /api/v1/auth/verification/resend/`)

Requests a new OTP code subject to the 60-second cooldown period.

#### Request Body:
```json
{
  "verification_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "success": true,
  "message": "A new verification code has been sent.",
  "resend_after": 60
}
```

#### Cooldown Failure (`HTTP 429 Too Many Requests`):
```json
{
  "success": false,
  "code": "RESEND_COOLDOWN",
  "message": "Please wait before requesting another verification code.",
  "retry_after": 45
}
```

---

### 4. Send / Restart Verification (`POST /api/v1/auth/verification/send/`)

Initiates a fresh verification session for an unverified email address.

#### Request Body:
```json
{
  "email": "alex@example.com"
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "success": true,
  "message": "Verification code sent.",
  "verification_id": "1a2b3c4d-...",
  "email_masked": "al***@example.com",
  "expires_in": 600,
  "resend_after": 60
}
```

---

## Standard Error Codes Reference

| Error Code | HTTP Status | Meaning |
| :--- | :--- | :--- |
| `INVALID_OTP` | `400` | The submitted code does not match the provider record. |
| `OTP_EXPIRED` | `400` | The verification session has passed its expiration window. |
| `TOO_MANY_ATTEMPTS` | `429` | 5 invalid attempts reached; session permanently locked. |
| `RESEND_COOLDOWN` | `429` | Resend was requested before the 60s cooldown elapsed. |
| `RESEND_LIMIT` | `429` | Maximum 5 resends reached for this verification session. |
| `VERIFICATION_NOT_FOUND` | `404` | No verification session found matching the identifier. |
| `ALREADY_VERIFIED` | `200/400` | The email / session has already been verified. |
| `ACCOUNT_NOT_VERIFIED` | `403` | User attempted to log in before verifying email with OTP. |
| `PROVIDER_UNAVAILABLE` | `503` | Upstream provider connection failed or returned an error. |
| `RATE_LIMITED` | `429` | IP or destination rate limit exceeded. |
