# MONVEX Render Production Release Checklist & Verification Ledger

> **Platform:** Render Web Services & Neon Serverless PostgreSQL  
> **Release Target:** Production V2.0  
> **Evaluation Date:** October 2026  

---

## 1. Executive Summary & Release Status

| Pillar | Status | Notes |
| :--- | :--- | :--- |
| **Code & Build Readiness** | **PASS** | Next.js standalone build clean, Django `--deploy` check 0 issues, 180 tests passed. |
| **Blueprint & Infrastructure As Code** | **PASS** | [`render.yaml`](file:///d:/MONVEX/render.yaml) fully configured for dual web services + external Neon DB. |
| **Database Architecture Compatibility** | **PASS** | `dj-database-url` configured with `conn_max_age=600`, health checks enabled, `sslmode=require` supported. |
| **Live Cloud Deployment Execution** | **PENDING OPERATOR ACTIONS** | Requires Render dashboard login & Neon connection string input by the operator. |

---

## 2. Verification Evidence Ledger

| Item # | Verification Check | Target / Component | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **V-01** | Next.js Standalone Build | `web` | `npm run build` generates `.next/standalone` without errors | Standalone server output generated cleanly | **PASS** |
| **V-02** | Frontend Security Vulnerabilities | `web` | `npm audit` shows 0 high/critical vulnerabilities | Clean audit after `source-map-js` upgrade | **PASS** |
| **V-03** | Public Route Single-Click Navigation | `web` | 24 public legal & marketing links load without login redirect | 24/24 verified via Playwright headless browser | **PASS** |
| **V-04** | Django Production Security Checks | `backend` | `python manage.py check --deploy` passes with 0 issues | `System check identified no issues (0 silenced)` | **PASS** |
| **V-05** | Production SECRET_KEY Guard | `backend` | Insecure/default SECRET_KEY halts startup when `DEBUG=False` | `ImproperlyConfigured` raised as expected | **PASS** |
| **V-06** | Production DATABASE_URL Guard | `backend` | Missing DATABASE_URL halts startup when `DEBUG=False` | `ImproperlyConfigured` raised as expected | **PASS** |
| **V-07** | Backend Core Unit Tests | `backend/apps` | All application unit tests pass | 72 / 72 tests passed | **PASS** |
| **V-08** | Backend Integration & Security Tests | `backend/tests` | All security, auth, cookie & transaction tests pass | 108 / 108 tests passed (Total: 180 passing tests) | **PASS** |
| **V-09** | WhiteNoise Static Files Collection | `backend` | `python manage.py collectstatic --no-input` bundles assets | Succeeded with 154 files collected & hashed | **PASS** |
| **V-10** | Liveness Probe Endpoint | `backend/monvex/urls.py` | `GET /health/` returns `200 OK` | Endpoint implemented and verified | **PASS** |
| **V-11** | Readiness Probe Endpoint | `backend/monvex/urls.py` | `GET /health/ready/` verifies database socket connection | Endpoint implemented and verified | **PASS** |
| **V-12** | Render Blueprint File Syntax | Root `render.yaml` | Valid YAML declaring backend, frontend, and external DB | Syntax verified with Node parser and YAML validator | **PASS** |
| **V-13** | Redundant Render DB Elimination | Root `render.yaml` | No unwanted Render PostgreSQL instances created | Removed `databases:` block, preserving Neon DB | **PASS** |
| **V-14** | Live Render Service Provisioning | Render Cloud Platform | Services spun up and live on `.onrender.com` | Requires operator credentials and Render account access | **PENDING OPERATOR ACTIONS** |
| **V-15** | Live Neon Production Database Migration | Neon Console | Database migrations applied to live production tables | To be executed upon Render service deployment | **PENDING OPERATOR ACTIONS** |

---

## 3. Pre-Deployment Operator Checklist

Before launching the deployment on Render, ensure you have completed the following prerequisites:

- [ ] **Git Repository:**
  - [ ] All code changes committed to `main` branch.
  - [ ] No `.env` or sensitive credential files tracked in Git (`git ls-files .env*` returns only `.env.example`).
  - [ ] Latest commits pushed to GitHub / GitLab.
- [ ] **Neon PostgreSQL Database:**
  - [ ] Active Neon project created at [console.neon.tech](https://console.neon.tech/).
  - [ ] Connection string copied (Format: `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).
  - [ ] `sslmode=require` query parameter confirmed.
- [ ] **Third-Party Credentials:**
  - [ ] Google Gemini API key obtained from [aistudio.google.com](https://aistudio.google.com/).
  - [ ] Gmail App Password generated for `monvexfinance@gmail.com` (16 characters, no spaces).
  - [ ] *(Optional)* Google OAuth Client ID & Client Secret configured for production redirect URI.

---

## 4. Deployment Execution Steps

Follow these steps in the [Render Dashboard](https://dashboard.render.com/):

### Phase 1: Blueprint Deployment
- [ ] 1. Log in to Render and click **New +** → **Blueprint**.
- [ ] 2. Select the **MONVEX** repository and branch `main`.
- [ ] 3. Fill in the prompted environment variable secrets:
  - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
  - `GEMINI_API_KEY`: *(Your Google Gemini API key)*
  - `EMAIL_HOST_PASSWORD`: *(Your Gmail App Password)*
- [ ] 4. Click **Apply Blueprint**.

### Phase 2: Build & Migration Monitoring
- [ ] 5. Monitor `monvex-backend` build log:
  - Verify Python 3.12 environment is initialized.
  - Verify `pip install -r requirements.txt` succeeds.
  - Verify `collectstatic` runs with 0 errors.
  - Verify `preDeployCommand: python manage.py migrate --no-input` completes all database migrations on Neon.
  - Verify Gunicorn starts on `0.0.0.0:$PORT`.
- [ ] 6. Monitor `monvex-web` build log:
  - Verify Node.js 20.14 environment is initialized.
  - Verify `npm ci` installs clean dependencies.
  - Verify `npm run build` outputs standalone artifacts.
  - Verify `npm start` binds to `$PORT`.

---

## 5. Post-Deployment Verification & Smoke Test Protocol

Once both services show **Live** in Render, execute the following smoke tests:

### Step 1: Automated Health Checks
Execute in your terminal or browser:
```bash
# 1. Backend Liveness Probe
curl -I https://monvex-backend.onrender.com/health/
# Expected: HTTP/1.1 200 OK

# 2. Backend Database Readiness Probe
curl -i https://monvex-backend.onrender.com/health/ready/
# Expected: HTTP/1.1 200 OK, {"status": "ready", "database": "connected"}
```

### Step 2: Django Superuser Setup
- [ ] In Render Dashboard → `monvex-backend` → **Shell**, run:
  ```bash
  python manage.py createsuperuser
  ```
- [ ] Log in at `https://monvex-backend.onrender.com/admin/` and verify the administration interface renders correctly with CSS/JS styles.

### Step 3: Frontend Client Verification
- [ ] Open `https://monvex-web.onrender.com` in an incognito window.
- [ ] Click through public pages (`/privacy-policy`, `/terms-of-service`, `/security-overview`, `/about`, `/contact`). Verify instant loading without redirection.
- [ ] Register a new test user account at `/register`.
- [ ] Verify that welcome email / OTP is sent via Gmail SMTP.
- [ ] Complete login at `/login`.
- [ ] Check browser Developer Tools (Network tab):
  - Verify `POST /api/v1/auth/login/` returns `200 OK` with JWT tokens.
  - Verify `GET /api/v1/dashboard/overview/` loads financial widgets.
- [ ] Create a test transaction at `/transactions` and verify it displays immediately in the list and updates the balance.
- [ ] Open `/ai` (AI Financial Copilot), send a test prompt, and verify response generated by Gemini API.

---

## 6. Rollback & Disaster Recovery Protocol

If any critical issue arises during deployment:

1. **Service Rollback:**
   - In Render Dashboard, navigate to the affected service.
   - Go to **Deploys** → Select previous working deploy → Click **Rollback to this deploy**.
   - Render immediately points traffic back to the prior stable release.
2. **Database Rollback:**
   - In Neon Console, use the **Point-in-Time Restore** feature or branch history to restore data to pre-migration state if an errant schema modification occurred.
