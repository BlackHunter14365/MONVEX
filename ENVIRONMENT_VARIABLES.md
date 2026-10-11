# MONVEX Environment Variables Reference Document

> **Confidentiality:** PUBLIC REFERENCE — Zero Live Credentials Stored Here.  
> **Rule:** Real secrets must NEVER be committed to Git. Only harmless placeholders are documented below.

---

## 1. Categorization Matrix

| Classification | Meaning | Security Rule |
| :--- | :--- | :--- |
| `[SERVER-ONLY]` | Consumed only by Django backend / container runtime. | **MUST NOT** be exposed to browser or prefixed with `NEXT_PUBLIC_`. |
| `[PUBLIC]` | Consumed by client browser or Tauri desktop shell. | Safe to embed in public client bundles. |

---

## 2. Backend Environment Variables (`backend/.env`)

| Variable | Scope | Status | Purpose | Harmless Example / Format |
| :--- | :--- | :--- | :--- | :--- |
| `SECRET_KEY` | `[SERVER-ONLY]` | **Required** | Django cryptographic signing key for sessions, CSRF, and signers. | `django-insecure-prod-key-xyz-min-50-characters` |
| `DEBUG` | `[SERVER-ONLY]` | **Required** | Toggles production debug mode. **MUST BE `False` IN PROD**. | `False` |
| `ALLOWED_HOSTS` | `[SERVER-ONLY]` | **Required** | Host/domain names that this Django backend can serve. | `monvex-backend.onrender.com,api.monvex.app` |
| `DATABASE_URL` | `[SERVER-ONLY]` | **Required** | PostgreSQL connection URL with SSL mode enabled. | `postgresql://user:pass@ep-cluster.neon.tech/monvex_db?sslmode=require` |
| `CORS_ALLOWED_ORIGINS` | `[SERVER-ONLY]` | **Required** | Comma-separated list of web origins permitted for cross-origin API calls. | `https://monvex-web.onrender.com,tauri://localhost` |
| `CSRF_TRUSTED_ORIGINS` | `[SERVER-ONLY]` | **Required** | Comma-separated list of trusted origins for CSRF POST verification. | `https://monvex-web.onrender.com,https://monvex-backend.onrender.com` |
| `EMAIL_BACKEND` | `[SERVER-ONLY]` | Optional | Django email backend class. | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `[SERVER-ONLY]` | Optional | SMTP host for OTP verification emails. | `smtp.gmail.com` |
| `EMAIL_PORT` | `[SERVER-ONLY]` | Optional | SMTP port (465 for SSL, 587 for TLS). | `465` |
| `EMAIL_USE_SSL` | `[SERVER-ONLY]` | Optional | Use SSL connection for port 465. | `True` |
| `EMAIL_USE_TLS` | `[SERVER-ONLY]` | Optional | Use STARTTLS for port 587. | `False` |
| `EMAIL_HOST_USER` | `[SERVER-ONLY]` | Optional | Email username / address sending OTP emails. | `monvexfinance@gmail.com` |
| `EMAIL_HOST_PASSWORD` | `[SERVER-ONLY]` | Optional | App-specific password or API token for SMTP. | `abcd-efgh-ijkl-mnop` |
| `DEFAULT_FROM_EMAIL` | `[SERVER-ONLY]` | Optional | Display name and email for outgoing emails. | `MONVEX <monvexfinance@gmail.com>` |
| `GEMINI_API_KEY` | `[SERVER-ONLY]` | Optional | Google GenAI API Key for AI Copilot reasoning. | `AIzaSyD-harmless-placeholder-key` |
| `GOOGLE_CLIENT_ID` | `[SERVER-ONLY]` | Optional | Google OAuth 2.0 Web Client ID. | `1068232450695-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `[SERVER-ONLY]` | Optional | Google OAuth 2.0 Client Secret for token exchange. | `GOCSPX-harmless-placeholder-secret` |

---

## 3. Web Frontend Environment Variables (`web/.env.local` / `web/.env.production`)

| Variable | Scope | Status | Purpose | Harmless Example / Format |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `[PUBLIC]` | **Required** | Absolute URL to the Django API root (ending with `/api/v1`). | `https://monvex-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`| `[PUBLIC]` | Optional | Google OAuth Web Client ID for Google Identity Services SDK. | `1068232450695-xxx.apps.googleusercontent.com` |
| `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL` | `[PUBLIC]` | Optional | Direct download URL for Windows desktop installer. | `https://github.com/BlackHunter14365/MONVEX/releases/download/v2.1.0/MONVEX-Setup.exe` |
| `BACKEND_INTERNAL_URL` | `[SERVER-ONLY]` | Optional | Internal network URL for Docker server-side rewrites. | `http://backend:8000/api/` |

---

## 4. Security Verification Checklist

* [x] No live secrets committed to repository (`git ls-files \| grep .env` checked).
* [x] `.env*` excluded in `.gitignore` with only `.env.example` whitelisted.
* [x] `SECRET_KEY` guarded against dev fallback in production mode.
* [x] `GEMINI_API_KEY` and `GOOGLE_CLIENT_SECRET` strictly excluded from `NEXT_PUBLIC_` variables.
