# MONVEX Deployment Architecture & Environment Specification

> **Dossier Document:** 12  
> **Source Verification Status:** `[V-SRC]` & `[V-CFG]`  
> **Academic Chapter Mapping:** Chapter 3.4, Chapter 5.1  

---

## 1. Hosting Architecture Overview

MONVEX is configured for cloud deployment on **Render** (Cloud Application Platform) paired with **Neon Serverless PostgreSQL**.

Infrastructure is defined as code via the root [`render.yaml`](file:///d:/MONVEX/render.yaml) Blueprint, deploying two decoupled web services:
1. **`monvex-backend`:** Django REST Framework API with Gunicorn WSGI application server and WhiteNoise static file hosting.
2. **`monvex-web`:** Next.js 14 Standalone SSR web application running on Node.js 20.14 runtime.

---

## 2. Infrastructure as Code: Render Blueprint (`render.yaml`)

### 2.1 Backend Web Service Configuration
* **Service Type:** Web Service (`type: web`).
* **Name:** `monvex-backend`.
* **Runtime:** `python` (Version 3.12.10).
* **Root Directory:** `backend`.
* **Build Command:**
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input
  ```
* **Pre-Deploy Command (Zero-Downtime Migrations):**
  ```bash
  python manage.py migrate --no-input
  ```
* **Start Command:**
  ```bash
  gunicorn monvex.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
  ```
* **Health Check Path:** `/health/`.
* **Auto-Deploy:** Enabled on Git push to `main` / `master`.

### 2.2 Frontend Web Service Configuration
* **Service Type:** Web Service (`type: web`).
* **Name:** `monvex-web`.
* **Runtime:** `node` (Version 20.14.0).
* **Root Directory:** `web`.
* **Build Command:**
  ```bash
  npm ci && npm run build
  ```
* **Start Command:**
  ```bash
  npm start
  ```
* **Health Check:** Default Render HTTP response check.

---

## 3. Database Architecture: Neon Serverless PostgreSQL

* **Hosting Provider:** Neon Cloud (`https://neon.tech`).
* **Database Engine:** PostgreSQL 16.
* **Connection String Architecture:**
  `DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db-name>?sslmode=require`
* **Connection Pooling:** Uses PgBouncer serverless connection pooler on port `6543` for high-concurrency web requests; direct port `5432` for schema migrations.
* **Django Integration:** `dj-database-url` configured with:
  - `conn_max_age = 600` (reusable TCP connections).
  - `conn_health_checks = True` (tests socket connectivity before query execution).

---

## 4. Container Architecture (Dockerfiles)

Both subsystems provide multi-stage, unprivileged production Dockerfiles:

### 4.1 Frontend Dockerfile (`web/Dockerfile`)
* **Stage 1 (deps):** `node:20-alpine` runs `npm ci` with `libc6-compat`.
* **Stage 2 (builder):** Compiles standalone output with `npm run build`.
* **Stage 3 (runner):** Minimal unprivileged `nextjs` user (`uid: 1001`), copies `.next/standalone` and `.next/static`, exposes port `3000`, starts `node server.js`.

### 4.2 Backend Dockerfile (`backend/Dockerfile`)
* **Stage 1 (builder):** `python:3.12-slim` installs `build-essential`, `libpq-dev`, and wheels.
* **Stage 2 (runner):** `python:3.12-slim` installs runtime `libpq5`, creates unprivileged `monvex` user (`uid: 1000`), executes `entrypoint.sh` (running migrations, `collectstatic`, and Gunicorn).

---

## 5. Environment Variable Reference (Variable Names Only)

> [!CAUTION]
> In strict accordance with security and academic integrity guidelines, zero secrets, API keys, database passwords, or private tokens are displayed. Only variable names and their functional purposes are documented.

### 5.1 Backend Environment Variables (`monvex-backend`)
* `DEBUG`: Boolean flag (`False` in production).
* `SECRET_KEY`: Cryptographic signing secret.
* `ALLOWED_HOSTS`: Permitted hostnames (e.g., `.onrender.com,localhost`).
* `DATABASE_URL`: Neon PostgreSQL connection URI with `?sslmode=require`.
* `CORS_ALLOWED_ORIGINS`: Whitelist of browser origins (e.g., `https://monvex-web.onrender.com`).
* `CSRF_TRUSTED_ORIGINS`: Whitelist of trusted POST/PUT origins.
* `GEMINI_API_KEY`: API key for Google Gemini AI Copilot.
* `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID.
* `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret.
* `EMAIL_BACKEND`: Django mail engine (`django.core.mail.backends.smtp.EmailBackend`).
* `EMAIL_HOST`: SMTP server hostname (`smtp.gmail.com`).
* `EMAIL_PORT`: SMTP port (`465` SSL).
* `EMAIL_USE_SSL`: Boolean SSL flag (`True`).
* `EMAIL_HOST_USER`: Mailbox username (`monvexfinance@gmail.com`).
* `EMAIL_HOST_PASSWORD`: Application-specific SMTP password.
* `PYTHON_VERSION`: Runtime version specification (`3.12.10`).

### 5.2 Frontend Environment Variables (`monvex-web`)
* `NODE_VERSION`: Node runtime specification (`20.14.0`).
* `NEXT_PUBLIC_API_URL`: Base URL for Django REST API endpoints (e.g., `https://monvex-backend.onrender.com/api/v1`).
* `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Client ID for Google Identity sign-in button.

---

## 6. Deployment Verification & Operator Action Ledger

| Deployment Check | Expected State | Current Verified State | Status |
| :--- | :--- | :--- | :---: |
| **Blueprint Specification** | Root `render.yaml` valid | Validated via Node parser | **PASS** |
| **Database Migration Hook** | `preDeployCommand` configured | Injected into Blueprint | **PASS** |
| **Reverse Proxy Header** | `HTTP_X_FORWARDED_PROTO` set | Configured in `settings.py` | **PASS** |
| **Health Probe Endpoint** | `/health/` returns HTTP 200 | Implemented and verified | **PASS** |
| **Readiness Probe Endpoint** | `/ready/` checks DB socket | Implemented and verified | **PASS** |
| **Live Render Cloud Provisioning**| Services running on Render | Requires operator login | **PENDING OPERATOR ACTIONS** |
| **Live Neon Production Migration**| Tables created on live Neon | Executed upon cloud deploy | **PENDING OPERATOR ACTIONS** |
