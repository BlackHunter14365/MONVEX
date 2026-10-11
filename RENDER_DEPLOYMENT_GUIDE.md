# MONVEX Render Production Deployment Guide

> **Target Platform:** Render (Cloud Application Platform)  
> **Database:** Neon Serverless PostgreSQL  
> **Architecture:** Decoupled Micro-Services (Next.js 14 Web Service + Django 5 REST API Web Service)  
> **Release Version:** 2.0.0-production

---

## 1. Architecture Overview

MONVEX is architected as two independent Render Web Services connecting to a dedicated Neon Serverless PostgreSQL database over encrypted TLS connections:

```
                            [ USER BROWSER / DESKTOP / MOBILE ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │       MONVEX WEB        │                 │     MONVEX BACKEND      │
          │     (Render Web)        │  REST API Calls │      (Render Web)       │
          │  Next.js 14 Standalone  ├────────────────►│   Django 5 + Gunicorn   │
          │   Node.js 20.14 Runtime │  JWT & Cookies  │    Python 3.12.10       │
          │   monvex-web.onrender   │                 │ monvex-backend.onrender │
          └─────────────────────────┘                 └────────────┬────────────┘
                                                                   │
                                                psycopg2-binary    │ TLS Encrypted
                                                sslmode=require    │ Port 5432/6543
                                                                   ▼
                                                      ┌─────────────────────────┐
                                                      │     Neon PostgreSQL     │
                                                      │    ep-*.neon.tech       │
                                                      │    PostgreSQL 16        │
                                                      └─────────────────────────┘
```

### Service Specifications
| Service | Render Type | Root Dir | Build Command | Pre-Deploy Command | Start Command | Health Check |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **monvex-backend** | Web Service | `backend` | `pip install -r requirements.txt && python manage.py collectstatic --no-input` | `python manage.py migrate --no-input` | `gunicorn monvex.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120` | `/health/` |
| **monvex-web** | Web Service | `web` | `npm ci && npm run build` | *None* | `npm start` | *Render default* |
| **Neon Database** | External | N/A | *External managed serverless DB* | N/A | N/A | Built-in pooling |

---

## 2. Neon PostgreSQL Database Preparation

MONVEX utilizes an external Neon PostgreSQL database rather than Render's managed database, ensuring zero cold-storage lock-in, automated point-in-time recovery, and elastic scaling.

### Step 1: Retrieve Neon Connection String
1. Log in to the [Neon Console](https://console.neon.tech/).
2. Select your MONVEX project and branch (typically `main`).
3. In the **Connection Details** widget, select **Connection string**:
   - For transactional web traffic with high concurrency, select **Pooled connection** (`-pooler` subdomain, port `6543`).
   - For schema migrations and standard direct connection, select **Direct connection** (port `5432`).
4. Ensure the query parameter `?sslmode=require` is present at the end of the connection string.
   ```
   postgresql://monvex_owner:secret_password@ep-cold-shadow-123456-pooler.us-east-2.aws.neon.tech/monvex_db?sslmode=require
   ```

### Step 2: Verify Network Access
Neon databases are accessible globally over TLS. No IP whitelisting is required because Render services utilize dynamic egress IP addresses.

---

## 3. Deployment Method A: Automated Render Blueprint (Recommended)

Render Blueprints declare infrastructure-as-code using the root [`render.yaml`](file:///d:/MONVEX/render.yaml) file.

### Step 1: Push Code to GitHub / GitLab
Ensure all changes are committed and pushed to your production repository branch (e.g., `main`):
```bash
git add render.yaml
git commit -m "chore(render): configure production blueprint with Neon DB"
git push origin main
```

### Step 2: Create Blueprint in Render
1. Navigate to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your Git provider and select the **MONVEX** repository.
4. Render will parse [`render.yaml`](file:///d:/MONVEX/render.yaml) and display the execution plan:
   - Service 1: `monvex-backend` (Python Web Service)
   - Service 2: `monvex-web` (Node Web Service)
5. You will be prompted to supply values for secrets marked with `sync: false`:
   - `DATABASE_URL`: Paste your full Neon PostgreSQL connection string (`postgresql://...`).
   - `GEMINI_API_KEY`: Google Gemini API key for AI Copilot features.
   - `EMAIL_HOST_PASSWORD`: Google App Password or SMTP password for transactional OTP delivery.
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: *(Optional)* Google OAuth credentials.
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: *(Optional)* Client ID for frontend Google button.
6. Click **Apply**.
7. Render will provision both services in parallel, execute builds, run database migrations, and deploy.

---

## 4. Deployment Method B: Manual Dashboard Setup

If you prefer configuring services manually via the Render UI:

### Service 1: `monvex-backend`
1. Click **New +** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Name:** `monvex-backend`
   - **Region:** `Oregon (US West)` (or region closest to your Neon DB)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input
     ```
   - **Pre-Deploy Command:**
     ```bash
     python manage.py migrate --no-input
     ```
   - **Start Command:**
     ```bash
     gunicorn monvex.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
     ```
   - **Plan:** Free or Starter
4. Under **Advanced**:
   - **Health Check Path:** `/health/`
   - **Auto-Deploy:** `Yes`
5. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.12.10`
   - `DJANGO_SETTINGS_MODULE`: `monvex.settings`
   - `DEBUG`: `False`
   - `SECRET_KEY`: *(Generate a secure 50+ character random key)*
   - `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
   - `DATABASE_URL`: `postgresql://user:pass@ep-xyz.neon.tech/monvex_db?sslmode=require`
   - `CORS_ALLOWED_ORIGINS`: `https://monvex-web.onrender.com`
   - `CSRF_TRUSTED_ORIGINS`: `https://monvex-web.onrender.com,https://monvex-backend.onrender.com`
   - `GEMINI_API_KEY`: *(Your Gemini API key)*
   - `EMAIL_BACKEND`: `django.core.mail.backends.smtp.EmailBackend`
   - `EMAIL_PROVIDER`: `smtp`
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `465`
   - `EMAIL_USE_SSL`: `True`
   - `EMAIL_USE_TLS`: `False`
   - `EMAIL_HOST_USER`: `monvexfinance@gmail.com`
   - `EMAIL_HOST_PASSWORD`: *(Your Gmail App Password)*
   - `DEFAULT_FROM_EMAIL`: `MONVEX <monvexfinance@gmail.com>`
   - `SERVER_EMAIL`: `monvexfinance@gmail.com`
6. Click **Create Web Service**.

### Service 2: `monvex-web`
1. Click **New +** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Name:** `monvex-web`
   - **Region:** `Oregon (US West)` (same region as backend)
   - **Branch:** `main`
   - **Root Directory:** `web`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm ci && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Plan:** Free or Starter
4. Under **Environment Variables**, add:
   - `NODE_VERSION`: `20.14.0`
   - `NEXT_PUBLIC_API_URL`: `https://monvex-backend.onrender.com/api/v1`
5. Click **Create Web Service**.

---

## 5. Post-Deployment Initial Setup

### Step 1: Create Django Superuser
To access the Django Administration panel at `https://monvex-backend.onrender.com/admin/`:
1. In the Render Dashboard, open `monvex-backend`.
2. Click the **Shell** tab on the left navigation panel.
3. Run:
   ```bash
   python manage.py createsuperuser
   ```
4. Enter username, email, and a secure password.

### Step 2: Verify Health Endpoints
Open a browser or terminal and test the live endpoints:

1. **Liveness Probe:**
   ```bash
   curl -I https://monvex-backend.onrender.com/health/
   # Expected: HTTP/1.1 200 OK
   # Body: {"status": "healthy", "service": "monvex-api"}
   ```

2. **Readiness Probe (Database Connectivity):**
   ```bash
   curl -i https://monvex-backend.onrender.com/health/ready/
   # Expected: HTTP/1.1 200 OK
   # Body: {"status": "ready", "database": "connected"}
   ```

3. **Frontend Application:**
   Open `https://monvex-web.onrender.com` in your browser:
   - Verify the landing page loads with zero hydration errors.
   - Verify public pages (`/privacy-policy`, `/terms-of-service`, `/security-overview`, `/contact`) open on a single click without authentication redirects.
   - Test user registration and login.
   - Verify JWT access & refresh tokens are received and dashboard widgets render live data.

---

## 6. Custom Domain & Production Hardening

If binding custom domains (e.g., `monvex.com` and `api.monvex.com`):

1. **Render Dashboard:**
   - In `monvex-web` → **Settings** → **Custom Domains**, add `monvex.com` and `www.monvex.com`.
   - In `monvex-backend` → **Settings** → **Custom Domains**, add `api.monvex.com`.
   - Configure DNS CNAME/A records as instructed by Render.

2. **Update Environment Variables:**
   - On `monvex-backend`:
     - Update `ALLOWED_HOSTS`: `api.monvex.com,monvex-backend.onrender.com`
     - Update `CORS_ALLOWED_ORIGINS`: `https://monvex.com,https://www.monvex.com`
     - Update `CSRF_TRUSTED_ORIGINS`: `https://monvex.com,https://www.monvex.com,https://api.monvex.com`
   - On `monvex-web`:
     - Update `NEXT_PUBLIC_API_URL`: `https://api.monvex.com/api/v1`

---

## 7. Render Free Tier Behavior & Production Recommendations

| Aspect | Free Tier | Starter / Paid Tier ($7/mo) |
| :--- | :--- | :--- |
| **Instance Inactivity** | Spins down after 15 min of inactivity. First request takes ~50s to wake up. | Always-on, 0ms wake-up latency. |
| **Outbound Bandwidth** | 100 GB/month included | 100 GB/month included |
| **Build Time** | Max 15 minutes | Max 15 minutes |
| **Custom Domains** | Fully supported with automatic SSL | Fully supported with automatic SSL |

> [!TIP]
> If testing on the Free tier, use an external uptime monitor (such as UptimeRobot or BetterStack) pinging `https://monvex-backend.onrender.com/health/` every 10 minutes to prevent the service from sleeping.

---

## 8. Rollback and Disaster Recovery Protocol

If an unexpected error occurs during a live deployment:

1. **Instant Application Rollback:**
   - In the Render Dashboard, go to the affected service (`monvex-backend` or `monvex-web`).
   - Click **Deploys**.
   - Locate the previous successful deploy and click **Rollback to this deploy**.
   - Render will immediately re-route live traffic to the prior container.

2. **Database Rollback via Neon Point-in-Time Recovery:**
   - If an errant migration affected database state, log into [Neon Console](https://console.neon.tech/).
   - Open **Branches** and create a branch from a timestamp immediately preceding the deployment.
   - Switch the `DATABASE_URL` in Render to the recovered branch connection string.
