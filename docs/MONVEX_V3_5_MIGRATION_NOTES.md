# MONVEX V3.5 — Migration & Operations Guide

**Document Version**: 3.5.0  
**Release**: MONVEX V3.5.0  
**Date**: 2026-08-25  

---

## 1. Migration Overview
MONVEX V3.5 is a non-breaking, backward-compatible optimization and validation release. All database models, API schemas, and client contracts remain 100% identical to V3.4.

---

## 2. Deployment Instructions

### Backend (Render / Cloud Host):
1. Pull the latest release commit:
   ```bash
   git checkout main && git pull
   ```
2. Apply database migrations (if any pending):
   ```bash
   python manage.py migrate --noinput
   ```
3. Verify observability endpoint:
   ```bash
   curl -I https://monvex-backend.onrender.com/api/v1/observability/status/
   ```

### Web Client (Render / Vercel):
1. Build Next.js 14 bundle:
   ```bash
   npm run build
   ```
2. Verify production routes respond with HTTP 200.

### Desktop & Mobile:
- **Tauri Windows Desktop**: No build changes required (`tauri.conf.json` remains bound to `https://monvex-web.onrender.com`).
- **Flutter Android APK**: Frozen in production-tested status (`monvex.apk`).

---

## 3. Rollback Plan
If an upstream infrastructure error occurs:
1. Revert to git commit `1dfcbe9` (V3.4 release tag).
2. Redeploy backend and web services.
3. Verify `/ready/` returns `{"status": "ready", "checks": {"database": true}}`.
