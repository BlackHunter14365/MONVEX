# MONVEX V3.4 Deployment Verification & Post-Deploy Guide

## 1. Scope & Principles
All deployment verifications in MONVEX V3.4 are strictly **non-destructive**, **read-only**, and executed via automated probes.

## 2. Pre-Deployment Verification Checklist
- [x] Secret scanning verified (0 high-entropy keys in repository).
- [x] Backend unit & isolation test suite passing (66/66 tests).
- [x] Automated AI Release Gate passing (16/16 evaluations).
- [x] Automated Security Regression Gate passing (6/6 WAF checks).
- [x] Frontend TypeScript type check passing (`npx tsc --noEmit`).
- [x] Frontend Next.js production build passing (`npm run build`).
- [x] Mobile Flutter static analysis passing (0 issues).
- [x] Release manifest generated and checksums verified.

## 3. Post-Deployment Verification via Automated Smoke Probes

### Running the Automated Post-Deployment Smoke Test
```bash
python scripts/smoke_test.py https://monvex-backend.onrender.com https://monvex-web.onrender.com
```

### Probes Executed:
1. **Backend Health Probe**:
   - `GET https://monvex-backend.onrender.com/health/`
   - Validates `200 OK`, `X-Defense-Shield` header, latency `< 3000ms`.
2. **Web Public Landing Probe**:
   - `GET https://monvex-web.onrender.com`
   - Validates Next.js SSR / static bundle delivery, latency `< 4000ms`.
3. **Observability Status Probe**:
   - `GET https://monvex-backend.onrender.com/api/v1/observability/status/`
   - Validates live sliding-window telemetry, DB connectivity, 0 secret disclosure.
4. **Auth Boundary Probe**:
   - `GET https://monvex-backend.onrender.com/api/v1/accounts/`
   - Validates `401 Unauthorized` for unauthenticated requests.
5. **WAF Active Defense Probe**:
   - `GET https://monvex-backend.onrender.com/api/v1/transactions/?search=UNION%20SELECT`
   - Validates `403 Forbidden`, hostile payload neutralization.

## 4. Rollback Plan
In the event of an unresolved SEV-1 failure during post-deployment verification:
1. Revert Render deployment to previous stable commit: `git revert HEAD && git push origin main`.
2. Re-verify health status probe within 3 minutes of rollback completion.\n