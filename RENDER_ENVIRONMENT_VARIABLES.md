# MONVEX Render Production Environment Variables Reference

This document provides the definitive specification of all environment variables required to run MONVEX in production on **Render** with **Neon Serverless PostgreSQL**.

---

## 1. Backend Service (`monvex-backend`)

### 1.1 Core Django & Platform Settings

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `DEBUG` | **Yes** | `False` | Public Config | Must be set to `False` in production. Enabling `True` disables security checks and leaks stack traces. |
| `SECRET_KEY` | **Yes** | *(None)* | **Critical Secret** | Cryptographic signing key. Must be a high-entropy string (50+ chars). In `render.yaml`, Render generates this automatically (`generateValue: true`). |
| `ALLOWED_HOSTS` | **Yes** | `localhost,127.0.0.1` | Public Config | Comma-separated domains allowed to serve requests. Format: `.onrender.com,localhost,127.0.0.1` or custom domain `api.monvex.app`. |
| `PYTHON_VERSION` | **Yes** | `3.12.10` | Public Config | Pin Python version for Render runtime build container. |
| `DJANGO_SETTINGS_MODULE` | **Yes** | `monvex.settings` | Public Config | Root Django settings module path. |
| `PORT` | Render Injected | `10000` | Platform | Render dynamically assigns this port; Gunicorn binds to `0.0.0.0:$PORT`. |

### 1.2 Neon PostgreSQL Database Settings

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | *(None)* | **Critical Secret** | Full connection URI to your external Neon PostgreSQL database cluster. **Must include `?sslmode=require`**.<br>`postgresql://user:pass@ep-xyz.neon.tech/monvex_db?sslmode=require` |

> [!IMPORTANT]
> The Django backend includes an explicit production guard. If `DEBUG=False` and `DATABASE_URL` is omitted, Django halts immediately with an `ImproperlyConfigured` exception to prevent accidental SQLite fallback in production.

### 1.3 CORS & CSRF Network Security

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://monvex-web.onrender.com` | Public Config | Comma-separated list of browser origins permitted to initiate cross-origin requests. Example: `https://monvex-web.onrender.com,https://monvex.app,tauri://localhost` |
| `CSRF_TRUSTED_ORIGINS` | **Yes** | `https://monvex-web.onrender.com` | Public Config | Comma-separated list of trusted origins for unsafe HTTP requests (POST, PUT, DELETE). Must include protocol (`https://`). Example: `https://monvex-web.onrender.com,https://monvex-backend.onrender.com` |
| `SECURE_SSL_REDIRECT` | No | `True` (when `DEBUG=False`) | Public Config | Enforces redirection of all non-HTTPS traffic to HTTPS. Enabled by default in production. |

### 1.4 AI Financial Copilot (Gemini API)

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** (for AI) | *(None)* | **Secret** | Google AI Studio Gemini API key. Powers AI Copilot conversation, receipt OCR analysis, and financial reasoning. |

### 1.5 Transactional Email & Security OTP (SMTP)

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `EMAIL_BACKEND` | No | `django.core.mail.backends.smtp.EmailBackend` | Public Config | Email backend engine. |
| `EMAIL_PROVIDER` | No | `smtp` | Public Config | Engine selector (`smtp` or `dummy`). |
| `EMAIL_HOST` | No | `smtp.gmail.com` | Public Config | SMTP relay hostname. |
| `EMAIL_PORT` | No | `465` | Public Config | SMTP port (`465` for SSL/SMTPS, `587` for TLS). |
| `EMAIL_USE_SSL` | No | `True` (if port 465) | Public Config | Strict SSL flag. |
| `EMAIL_USE_TLS` | No | `False` (if port 465) | Public Config | STARTTLS flag. |
| `EMAIL_HOST_USER` | **Yes** | `monvexfinance@gmail.com` | Public Config | Sender mailbox username / email address. |
| `EMAIL_HOST_PASSWORD` | **Yes** | *(None)* | **Secret** | 16-character Google App Password (not your personal account password). |
| `DEFAULT_FROM_EMAIL` | No | `MONVEX <monvexfinance@gmail.com>` | Public Config | Display name and email appearing in the From header. |
| `SERVER_EMAIL` | No | `monvexfinance@gmail.com` | Public Config | Address used for automated administrative error alerts. |
| `EMAIL_TIMEOUT` | No | `10` | Public Config | Socket timeout in seconds for SMTP transmissions. |

### 1.6 Google OAuth 2.0 SSO (Optional)

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | No | *(None)* | Public Config | OAuth 2.0 Web Client ID generated in Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | No | *(None)* | **Secret** | OAuth 2.0 Client Secret paired with the Web Client ID. |

---

## 2. Frontend Service (`monvex-web`)

| Variable Name | Required | Default Value | Security Level | Description & Format |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_VERSION` | **Yes** | `20.14.0` | Public Config | Pins Node.js runtime version for Next.js 14 builds. |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://monvex-backend.onrender.com/api/v1` | Public Config | Base URL for the Django REST API endpoints accessed by the browser client. Format must include `/api/v1`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | *(None)* | Public Config | Matches backend `GOOGLE_CLIENT_ID` to render the Google SSO button on `/login` and `/register`. |
| `PORT` | Render Injected | `10000` | Platform | Render dynamically assigns this port; Next.js binds via `npm start`. |

---

## 3. Render Blueprint Environment Schema (`render.yaml`)

Below is the canonical snippet representing the environment variable bindings in [`render.yaml`](file:///d:/MONVEX/render.yaml):

```yaml
services:
  - type: web
    name: monvex-backend
    runtime: python
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.10
      - key: DJANGO_SETTINGS_MODULE
        value: monvex.settings
      - key: DEBUG
        value: "False"
      - key: SECRET_KEY
        generateValue: true
      - key: ALLOWED_HOSTS
        value: ".onrender.com,localhost,127.0.0.1"
      - key: DATABASE_URL
        sync: false
      - key: CORS_ALLOWED_ORIGINS
        value: "https://monvex-web.onrender.com"
      - key: CSRF_TRUSTED_ORIGINS
        value: "https://monvex-web.onrender.com,https://monvex-backend.onrender.com"
      - key: GEMINI_API_KEY
        sync: false
      - key: EMAIL_BACKEND
        value: django.core.mail.backends.smtp.EmailBackend
      - key: EMAIL_PROVIDER
        value: "smtp"
      - key: EMAIL_HOST
        value: "smtp.gmail.com"
      - key: EMAIL_PORT
        value: "465"
      - key: EMAIL_USE_SSL
        value: "True"
      - key: EMAIL_USE_TLS
        value: "False"
      - key: EMAIL_HOST_USER
        value: "monvexfinance@gmail.com"
      - key: EMAIL_HOST_PASSWORD
        sync: false
      - key: EMAIL_TIMEOUT
        value: "10"
      - key: DEFAULT_FROM_EMAIL
        value: "MONVEX <monvexfinance@gmail.com>"
      - key: SERVER_EMAIL
        value: "monvexfinance@gmail.com"

  - type: web
    name: monvex-web
    runtime: node
    envVars:
      - key: NODE_VERSION
        value: 20.14.0
      - key: NEXT_PUBLIC_API_URL
        value: "https://monvex-backend.onrender.com/api/v1"
      - key: NEXT_PUBLIC_GOOGLE_CLIENT_ID
        sync: false
```
