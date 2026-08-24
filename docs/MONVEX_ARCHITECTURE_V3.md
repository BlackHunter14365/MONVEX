# MONVEX System Architecture Specification (v3.0)

> **Document Type:** System Architecture Blueprint & Operational Specification  
> **Status:** APPROVED & DEPLOYED  
> **Target Version:** MONVEX Enterprise v3.0  
> **Date:** August 25, 2026

---

## 1. Architectural Overview

MONVEX v3.0 introduces a modernized, decoupled architecture across Frontend, Backend, AI Copilot, Desktop, and Mobile clients:

```
                          ┌──────────────────────────┐
                          │   MONVEX Public Web &    │
                          │   Next.js 14 App Router  │
                          └────────────┬─────────────┘
                                       │ (HTTPS / REST / WSS)
                                       ▼
┌──────────────────┐      ┌──────────────────────────┐      ┌──────────────────┐
│  Tauri Desktop   │◄────►│   Django REST Framework  │◄────►│  Flutter Mobile  │
│  Native WebView2 │      │   Multi-Tenant Backend   │      │  Android App     │
└──────────────────┘      └────────────┬─────────────┘      └──────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
         ┌─────────────────────────┐       ┌─────────────────────────┐
         │ PostgreSQL DB (Render)  │       │ Google Gemini 2.5 Pro   │
         │ Neon / Relational Store │       │ Autonomous AI Copilot   │
         └─────────────────────────┘       └─────────────────────────┘
```

---

## 2. Web Application Architecture (`web/`)

- **Framework:** Next.js 14 (App Router) + React 18 LTS
- **Server State Management:** `@tanstack/react-query` v5
  - Centralized `QueryClient` with 2-minute stale time and automated garbage collection.
  - Type-safe Query Key Factory (`queryKeys.ts`).
  - Automatic background refetching and mutation invalidation (`useCreateTransactionMutation`, `useUpdateBudgetMutation`, etc.).
- **Client State Management:** `zustand` v4
  - Ephemeral client-only UI stores (`useUIStore`).
- **Form & Validation Layer:** `react-hook-form` + `zod` (`@hookform/resolvers/zod`)
  - Schema-driven runtime validation (`loginSchema`, `registerSchema`, `transactionSchema`, `budgetSchema`, `goalSchema`, `contactSchema`).
  - Zero re-render overhead with uncontrolled native inputs.
- **Styling & Motion:** Tailwind CSS v3 JIT + `framer-motion` v13 + native CSS keyframe springs.
- **API Client Layer:** Modularized typed API client (`web/src/lib/api/`) with domain separation (`auth`, `transactions`, `budgets`, `goals`, `analytics`, `ai`, `security`).

---

## 3. Backend Architecture (`backend/`)

- **Runtime:** Python 3.12 / Django 5.0 / Django REST Framework 3.15
- **Authentication:** Stateless JWT (`djangorestframework-simplejwt`) with HTTP Bearer authorization and token blacklist rotation.
- **Layered Architecture:**
  1. `Views / ViewSets` (Thin HTTP layer, status codes, route parsing).
  2. `Serializers` (Input validation, field sanitization, model conversion).
  3. `Services` (Core domain business logic: `finance_service.py`, `budget_service.py`, `anomaly_service.py`, `debt_service.py`, `net_worth_service.py`).
  4. `Models` (Django ORM with strict foreign keys, cascade safety, and tenant isolation).
- **Financial Precision:** Strict Python `Decimal` (`ROUND_HALF_UP`) arithmetic for all monetary computations, velocity trackers, and anomaly scoring. Zero floating-point drift.
- **Security Defense Shield:** Active middleware detecting SQLi, XSS, and Path Traversal with automated rate limiting and honeypot intrusion detection.

---

## 4. AI Copilot Architecture (`backend/services/ai/`)

- **SDK:** Official Google GenAI SDK (`google-genai`).
- **Models:** Gemini 2.5 Pro / Gemini 2.5 Flash.
- **Typed Tool Registry:**
  - `tool_get_spending_summary`
  - `tool_detect_anomalies`
  - `tool_deep_category_audit`
  - `tool_evaluate_affordability_advanced`
  - `tool_forecast_cashflow`
  - `tool_simulate_what_if`
  - `tool_explain_why`
- **Tenant Isolation:** Every tool strictly queries `user=request.user` to prevent cross-tenant telemetry exposure.
- **Deterministic Math:** LLM reasons over structured outputs produced by deterministic financial services; the LLM never executes direct raw database mutations.

---

## 5. Desktop Client Architecture (`desktop/`)

- **Shell:** Tauri v1.5 with Rust backend.
- **Production URL:** Dedicated remote Webview pointing to `https://monvex-web.onrender.com`.
- **Navigation Guard:** Strict `.on_navigation()` Rust filter prohibiting loopback or localhost redirection.
- **WebView2 Provisioning:** `embedBootstrapper` with bundled `WebView2Loader.dll`.
- **Contextual Detection:** Injected `window.__IS_TAURI__` flag enabling conditional CTA hiding on the public landing page.

---

## 6. Mobile Client Architecture (`mobile/`)

- **Framework:** Flutter 3.x / Dart 3.x.
- **State Management:** `provider` v6.
- **Networking:** `http` package with centralized interceptors.
- **Security:** `flutter_secure_storage` with hardware keystore backed token encryption.
- **Status:** Release frozen (no APK build/release during current phase).
