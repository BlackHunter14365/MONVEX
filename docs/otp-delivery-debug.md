# MONVEX OTP Delivery End-to-End Debugging Report

## 1. Current OTP Flow
1. **Frontend Request**: User fills signup form (`username`, `email`, `phone_number`, `password`, `confirm_password`) on Next.js (`/register`) and submits.
2. **API Endpoint**: Frontend issues `POST /api/v1/auth/register/` to Django REST Framework backend.
3. **View Layer**: `RegisterView.post()` validates `RegisterSerializer`, creates a pending `User` (`is_active=False`, `email_verified=False`), and invokes `VerificationService.start_email_verification()`.
4. **Service Layer**: `VerificationService.start_email_verification()` normalizes email, queries `get_verification_provider()`, and invokes `provider.send_code()`.
5. **Provider Adapter**:
   - `get_verification_provider()` evaluates `settings.OTP_PROVIDER`.
   - Default was falling back to `ConsoleVerificationProvider` when `DEBUG=True` or `TwilioVerifyProvider` without credentials.
6. **Session & Response**: `VerificationSession` is created with status `PENDING`, 10-minute expiry, and returned to client as `{ success: true, verification_id: "...", email_masked: "...", resend_after: 60 }`.

---

## 2. Provider Being Used
- **Active Provider**: `TwilioVerifyProvider` (when `OTP_PROVIDER=twilio`) or `ConsoleVerificationProvider` (when `DEBUG=True`).
- **Target Real Provider**: `TwilioVerifyProvider` calling Twilio Verify v2 REST API (`https://verify.twilio.com/v2/Services/{VerifyServiceSid}/Verifications`).

---

## 3. Exact Endpoints Being Called
- Signup & Verification Start: `POST /api/v1/auth/register/`
- Verification Send: `POST /api/v1/auth/verification/send/`
- Verification Check: `POST /api/v1/auth/verification/check/`
- Verification Resend: `POST /api/v1/auth/verification/resend/`

---

## 4. Environment Variables Expected
For Twilio Verify Provider:
- `TWILIO_ACCOUNT_SID`: Account Identifier (starts with `AC...`)
- `TWILIO_API_KEY`: API Key SID (starts with `SK...`) or Account SID
- `TWILIO_API_SECRET`: API Secret or Auth Token
- `TWILIO_VERIFY_SERVICE_SID`: Twilio Verify Service SID (starts with `VA...`)
- `OTP_PROVIDER`: Set to `twilio`

For SMTP / Direct Email Provider:
- `EMAIL_HOST`: e.g. `smtp.gmail.com` / `smtp.sendgrid.net`
- `EMAIL_PORT`: `587`
- `EMAIL_HOST_USER`: Dispatcher email (e.g. `your-sender@gmail.com`)
- `EMAIL_HOST_PASSWORD`: Application-specific password
- `DEFAULT_FROM_EMAIL`: `MONVEX Security <your-sender@gmail.com>`

---

## 5. Current Provider Response & Error Handling (Audit Findings)

### Critical Flaw 1: Silent Mocking in DEBUG Mode
In `backend/services/providers/twilio_verify.py` lines 38–46:
```python
if not self.service_sid or not self.account_sid or not self.api_secret:
    if settings.DEBUG:
        logger.warning("[TwilioVerifyProvider] Twilio credentials missing in DEBUG mode. Mocking dispatch.")
        return {
            "provider_verification_id": "mock_twilio_vid_" + destination[:4],
            "status": "pending",
            "channel": channel,
            "destination": destination
        }
```
**Impact**: When environment variables were missing, the provider returned a mock payload with `status="pending"` instead of failing loudly. The frontend received a success response, but no actual HTTP dispatch was ever made to Twilio or the user's inbox!

### Critical Flaw 2: Missing Twilio Credentials in Runtime Environment
`backend/.env` contained only `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `DB_ENGINE`, `GEMINI_API_KEY`.
`TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, and `TWILIO_VERIFY_SERVICE_SID` were not set in the active `.env`.

### Critical Flaw 3: Lack of Fail-Fast Validation and Correlation IDs
When provider initialization or network dispatch failed, errors were not tracked with a unified request correlation ID (`request_id=otp_...`), making it difficult to trace why a real email didn't arrive.

---

## 6. Where the Delivery Fails
The chain broke at the **Provider Adapter Layer (`TwilioVerifyProvider.send_code`)**:
Because credentials were not configured in `.env`, the adapter took the `settings.DEBUG` mock branch, returned fake success, and never transmitted the request to Twilio Verify servers or the SMTP network.

---

## 7. Proposed Fix & Architectural Enhancements

1. **Remove Silent Mocking**: Eliminate the silent fallback in `TwilioVerifyProvider`. If credentials are missing, raise `OTP_PROVIDER_CONFIGURATION_ERROR` immediately and fail loudly.
2. **Safe Diagnostic Environment Verifier**: Implement safe runtime diagnostics in startup and management commands that check whether `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, and `TWILIO_VERIFY_SERVICE_SID` are configured without printing secrets.
3. **Structured Management Diagnostic Tool**: Build `python manage.py test_otp_provider <email>` to test real provider connectivity, channel configuration, and API responses directly from the terminal without printing OTP secrets.
4. **Resilient Provider Suite**: Support both `TwilioVerifyProvider` and `SmtpVerifyProvider` (for direct transactional SMTP sending via Gmail/SendGrid/SES) with authoritative verification lifecycle and audit logging.
5. **Request Correlation Tracking**: Add `request_id` (e.g. `otp_xxxx`) to log events (`OTP_SEND_REQUESTED`, `OTP_PROVIDER_REQUEST`, `OTP_PROVIDER_RESPONSE`, `OTP_SEND_SUCCESS`, `OTP_SEND_FAILED`).
6. **Precise Frontend Status**: Update frontend copy to distinguish "Verification code requested. Check your inbox." from confirmation of delivery, and display human-friendly provider configuration errors when keys are unconfigured.
