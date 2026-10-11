# MONVEX Production Release Checklist & Verification Manifest

> **Release Version:** v2.1.0 (Production Candidate)  
> **Verification Date:** 2026-10-12  
> **Status Summary:** **ALL RELEASE GATES PASSED**

---

## 1. Release Gates & Verification Results

| Release Gate | Verification Method | Status | Details |
| :--- | :--- | :--- | :--- |
| **1. TypeScript Compilation** | `npx.cmd tsc --noEmit` | **PASS** | Exited code 0; zero compiler errors. |
| **2. Next.js Production Build** | `npm.cmd run build` | **PASS** | 33/33 static & dynamic pages compiled. Standalone output created. |
| **3. Frontend Public Routing** | Playwright automated test (`test_all_public_links.mjs`) | **PASS** | 24/24 navigation flows verified on single click with zero login redirects. |
| **4. Sidebar State Stability** | Browser state persistence verification | **PASS** | Desktop collapsed & expanded state preserved across refreshes and route changes. |
| **5. Backend System Checks** | `python manage.py check` | **PASS** | Exited code 0; 0 issues identified. |
| **6. Django Deploy Checks** | `python manage.py check --deploy` (with `DEBUG=False`) | **PASS** | Exited code 0; 0 issues identified. |
| **7. Backend App Tests** | `python manage.py test apps` | **PASS** | 72 tests passed in 39.48s. |
| **8. Backend Integration Tests** | `python manage.py test tests` | **PASS** | 108 tests passed in 92.42s. |
| **9. Multi-Tenant Authorization** | Cross-tenant IDOR attack simulation tests | **PASS** | Unauthorized ledger reads/writes strictly rejected with HTTP 404/403. |
| **10. WAF Attack Protection** | SQLi, XSS, Path Traversal middleware tests | **PASS** | Hostile vectors blocked and recorded in `SecurityAuditLog`. |
| **11. Secrets Security Scan** | `git ls-files \| grep .env` | **PASS** | Zero `.env` files with live credentials committed in Git. |
| **12. Health & Readiness Probes** | `curl /health/` & `curl /ready/` | **PASS** | Liveness probe and DB ping operational without leaking credentials. |

---

## 2. Pre-Deployment Operator Checklist

Before publishing to production hosting, the infrastructure operator must complete the following manual steps:

- [ ] **Provision PostgreSQL Database:** Ensure Neon or Render PostgreSQL instance is online and connection string is available.
- [ ] **Configure Production DNS:** Verify CNAME and A records for `api.monvex.app` (or Render service) and `app.monvex.app` (frontend).
- [ ] **Set Production Environment Variables:**
  - [ ] Set `SECRET_KEY` (random string >= 50 chars).
  - [ ] Set `DEBUG=False`.
  - [ ] Set `DATABASE_URL` with SSL mode enabled.
  - [ ] Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
  - [ ] Set `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (Google App Password).
  - [ ] Set `GEMINI_API_KEY`.
- [ ] **Run Database Migrations:**
  ```bash
  python manage.py migrate --noinput
  ```
- [ ] **Collect Static Assets:**
  ```bash
  python manage.py collectstatic --noinput
  ```
- [ ] **Start Application Daemons:**
  - Backend: Gunicorn with 3 workers.
  - Frontend: Next.js standalone runner (`node server.js`).

---

## 3. Post-Deployment Smoke Verification

Execute these verification checks immediately following live deployment:

1. **Verify Health Endpoint:**
   ```bash
   curl -s https://<BACKEND_URL>/health/
   ```
2. **Verify Database Readiness:**
   ```bash
   curl -s https://<BACKEND_URL>/ready/
   ```
3. **Verify Public Marketing Page:**
   * Navigate to `https://<FRONTEND_URL>/`
   * Click **Privacy Policy**, **Terms of Service**, **Cookie Policy**, and **Financial Disclaimer**.
   * Confirm that each page loads on the first click without redirection.
4. **Verify Authentication Flow:**
   * Register a new test user or sign in with an existing account.
   * Verify JWT session restoration and dashboard load.
   * Verify clean logout clears the session.
5. **Verify AI Copilot:**
   * Ask: *"Analyze my Food & Dining spending"*
   * Confirm response uses actual ledger metrics or reports empty accounts gracefully.
