# MONVEX 2.0 Master Authentication Specification & Google Sign-In Guide

## 1. Authentication Architecture Overview

MONVEX supports two unified, first-class authentication mechanisms:
1. **Password Authentication**: Email/Username + Argon2/PBKDF2 Password.
2. **Google Sign-In**: Official Google Identity Services (GIS) with cryptographically verified ID tokens.

```
USER
 │
 ├──▶ USERNAME/EMAIL + PASSWORD ──┐
 │                                │
 └──▶ "CONTINUE WITH GOOGLE" ─────┼──▶ MONVEX BACKEND AUTH
                                  │    ├── 1. Cryptographic ID Token Verification
                                  │    ├── 2. Identity Resolution (GoogleIdentity)
                                  │    └── 3. JWT Token Generation (Access + Refresh)
                                  ▼
                            MONVEX SESSION
                                  │
                                  ▼
                         FINANCIAL DASHBOARD
                       (WHERE user = request.user)
```

---

## 2. Google Identity Services Setup

### Google Cloud Console Configuration:
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** > **Credentials**.
3. Create an **OAuth 2.0 Client ID** with Application type **Web application**.
4. Configure **Authorized JavaScript origins**:
   - `http://localhost:3000` (Local Frontend Development)
   - `http://127.0.0.1:3000`
   - `https://your-production-domain.com` (Production)
5. Configure **Authorized redirect URIs**:
   - `http://localhost:3000`
   - `http://localhost:8000/api/v1/auth/google/`
   - `https://your-production-domain.com/login`
6. Copy `Client ID` into `GOOGLE_CLIENT_ID` (backend) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend).

---

## 3. Identity Resolution & Account Linking Rules

| Scenario | Condition | System Action | Result |
|---|---|---|---|
| **A. New User** | Neither `GoogleIdentity` nor `User(email)` exists | Creates `User`, `Profile`, `GoogleIdentity`, and standard categories (NO fake data) | Starts with clean empty profile (HTTP 201) |
| **B. Returning Google User** | `GoogleIdentity(provider_subject=sub)` exists | Resolves existing `User`, updates `last_login_at` | Logs in to existing account (HTTP 200) |
| **C. Existing Password User** | `User(email)` exists, but NO `GoogleIdentity` | Returns `ACCOUNT_LINKING_REQUIRED` | Prompts `AccountLinkDialog` (Password verification) |
| **D. Account Linking Verified** | Valid password provided | Binds `GoogleIdentity` to existing user | Logs in, links Google method (HTTP 200) |

---

## 4. API Endpoints

### `POST /api/v1/auth/google/`
- **Request**:
  ```json
  {
    "credential": "<GOOGLE_ID_TOKEN>"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "success": true,
    "action": "LOGIN",
    "is_new_user": false,
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "username": "john_doe",
      "email": "john.doe@gmail.com",
      "has_google_auth": true,
      "has_password_auth": true
    }
  }
  ```
- **Response (Linking Required)**:
  ```json
  {
    "success": false,
    "code": "ACCOUNT_LINKING_REQUIRED",
    "message": "An existing MONVEX account with this email address already exists. Please verify your password to securely link your Google account.",
    "email": "john.doe@gmail.com",
    "provider": "google",
    "provider_subject": "10928371928371"
  }
  ```

### `POST /api/v1/auth/google/link/`
- **Request**:
  ```json
  {
    "credential": "<GOOGLE_ID_TOKEN>",
    "password": "<EXISTING_ACCOUNT_PASSWORD>"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "action": "LINKED_AND_LOGGED_IN",
    "access": "...",
    "refresh": "...",
    "user": { ... }
  }
  ```

---

## 5. Security & Multi-Tenant Data Isolation
- **No Token Decryption on Client**: The backend cryptographically validates the token with Google public keys.
- **Strict Query Scoping**: Every database query is scoped strictly to `user=request.user`. Google identity is only used for authentication; it does not bypass authorization.
- **Audit Logging**: All authentication and linking events are recorded with IP and User-Agent telemetry.
