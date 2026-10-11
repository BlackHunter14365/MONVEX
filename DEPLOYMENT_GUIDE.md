# MONVEX Production Deployment Guide

This guide details the step-by-step procedures to deploy the MONVEX system to production environments (Docker, Render, Koyeb, or self-hosted Linux VPS).

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |   Cloudflare / DNS & CDN    |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               | HTTPS                                     | HTTPS
               v                                           v
    +----------------------+                    +----------------------+
    | Next.js Web Frontend |                    | Django 5 Backend API |
    | Node 20 / Standalone |                    | Gunicorn 3 Workers   |
    | Port 3000            |                    | Port 8000            |
    +----------+-----------+                    +----------+-----------+
               |                                           |
               | Bearer JWT / HttpOnly Cookie              | psycopg2
               +------------------------------------------>|
                                                           v
                                                +----------------------+
                                                |   Neon PostgreSQL    |
                                                |   ep-*.neon.tech     |
                                                +----------------------+
```

---

## 2. Prerequisites & Infrastructure Setup

1. **PostgreSQL Database:** Neon Serverless PostgreSQL or Render Managed PostgreSQL (version 16+).
2. **Container Host / PAAS:** Render, Koyeb, AWS ECS, or Docker Compose VM.
3. **Domain & SSL:** Valid domain pointing to your frontend and backend hosts with HTTPS.
4. **Google Cloud Console:**
   * Google OAuth 2.0 Web Client ID for Google SSO.
   * Google Gemini API Key for AI Copilot reasoning.
5. **SMTP Credentials:** Google App Password or transactional email service (SendGrid, Postmark) for email OTP verification.

---

## 3. Environment Configuration

### Backend `.env` (Production)
```bash
# Core Django
DEBUG=False
SECRET_KEY=generate-a-strong-random-key-at-least-50-characters
ALLOWED_HOSTS=monvex-backend.onrender.com,api.monvex.app

# Database
DATABASE_URL=postgresql://user:password@ep-your-cluster.us-east-2.aws.neon.tech/monvex_db?sslmode=require

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://monvex-web.onrender.com,https://monvex.app,tauri://localhost
CSRF_TRUSTED_ORIGINS=https://monvex-web.onrender.com,https://monvex.app,https://monvex-backend.onrender.com

# SMTP Delivery
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_USE_TLS=False
EMAIL_HOST_USER=monvexfinance@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=MONVEX <monvexfinance@gmail.com>

# AI Copilot
GEMINI_API_KEY=AIzaSyYourProductionGeminiApiKey

# Google SSO
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-oauth-secret
```

### Frontend `.env.production`
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://monvex-backend.onrender.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=https://github.com/BlackHunter14365/MONVEX/releases/download/v2.1.0/MONVEX-Setup.exe
```

---

## 4. Deployment Strategy 1: Docker Compose

MONVEX provides production Dockerfiles and a Compose manifest under `deploy/docker-compose.yml`.

### Step 1: Clone and Configure
```bash
git clone https://github.com/BlackHunter14365/MONVEX.git
cd MONVEX/deploy
cp .env.production.example .env
# Edit .env with your real credentials
```

### Step 2: Build and Launch Containers
```bash
docker compose up -d --build
```

### Step 3: Verify Container Health
```bash
docker compose ps
docker compose logs -f backend
```

---

## 5. Deployment Strategy 2: Render.com / PaaS

### Backend Service (Web Service)
* **Environment:** Python 3.12
* **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
* **Start Command:** `gunicorn monvex.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120`
* **Health Check Path:** `/health/`

### Frontend Service (Web Service)
* **Environment:** Node 20
* **Build Command:** `npm ci && npm run build`
* **Start Command:** `npm run start` or `node server.js` (with standalone artifact)
* **Health Check Path:** `/`

---

## 6. Post-Deployment Verification

Execute these verification checks immediately following deployment:

1. **Health Check:**
   ```bash
   curl -i https://monvex-backend.onrender.com/health/
   # Expected: HTTP 200 {"status": "healthy", ...}
   ```
2. **Readiness Check (Database Connectivity):**
   ```bash
   curl -i https://monvex-backend.onrender.com/ready/
   # Expected: HTTP 200 {"status": "ready", "checks": {"database": true}, ...}
   ```
3. **Frontend Health:**
   Visit `https://monvex-web.onrender.com/` in an incognito window. Click on `Privacy Policy`, `Terms of Service`, and `Security Overview`. Verify immediate rendering without redirects to `/login`.
