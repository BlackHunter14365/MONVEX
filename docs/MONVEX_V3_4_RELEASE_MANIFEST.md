# MONVEX V3.4 Release Manifest Specification

## 1. Overview
The **Release Manifest (`release_manifest.json`)** acts as the cryptographic and operational source of truth for every MONVEX release candidate.

## 2. Release Metadata
- **Release Version**: `v3.4.0`
- **Codename**: `Production-Intelligence-QA-Release-Gate`
- **Release Status**: `PRODUCTION_READY`
- **Baseline Git Commit**: `3b94296` (plus V3.4 release commits)

## 3. Component Architecture & Versions

### Web Frontend
- **Framework**: Next.js 14.2.35 (React 18.3.1)
- **Server State**: TanStack Query v5.66.11
- **Forms & Validation**: React Hook Form 7.54.2 + Zod 3.24.2
- **Client UI State**: Zustand 5.0.3
- **Styling**: Tailwind CSS 3.4.1

### Backend API
- **Framework**: Django 5.2.0 + Django REST Framework 3.16.1
- **Runtime**: Python 3.12 (CPython)
- **Database Engine**: PostgreSQL 16 (Render Managed)
- **AI Intelligence**: Official Google GenAI SDK (`google-genai` 1.66.0) + Deterministic Fallback Engine
- **Telemetry Engine**: Thread-safe Sliding Window Ring Buffer (`MetricsCollector`)

### Native Platforms
- **Windows Desktop**: Tauri v2 WebView2 -> `https://monvex-web.onrender.com`
- **Android Mobile**: Flutter 3.x Native Application (`monvex.apk` - 24.6 MB)

## 4. Quality & Release Gates
1. **Secret Scanning**: 0 exposed keys, tokens, or plaintext secrets.
2. **TypeScript Strict Typecheck**: 0 errors (`npx tsc --noEmit`).
3. **Frontend Production Build**: `npm run build` completed with zero warnings.
4. **Backend Test Suite**: 66/66 tests passed (`manage.py test`).
5. **AI Evaluation Release Gate**: 16/16 tests passed (`test_evaluation.py`).
6. **Security Regression Gate**: 6/6 hostile vector intercepts passed (`test_security_gate.py`).
7. **Financial Integrity Watchdog**: 8 non-mutating accounting invariants validated.

## 5. Artifact Hashes & Checksums
- `monvex.apk` SHA-256: `9559c5d14316d9ecb9b8b609c25f469fa7fbfa4a9b5f54a8eefcbe8a3a1f9746`
- `render.yaml` SHA-256: `a93b4ff02521f7c32bf28a8647ba3736561baad87b3226db2c4c81aef1b831fa`\n