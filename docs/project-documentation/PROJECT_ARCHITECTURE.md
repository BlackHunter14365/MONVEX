# MONVEX Project Architecture Specification

> **Dossier Document:** 02  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 1.5, Chapter 4.1, Chapter 5.1  

---

## 1. Architectural System Topology

MONVEX implements a modern, decoupled, multi-tier distributed micro-architecture. The system cleanly separates client presentation layers, stateless RESTful API orchestration, machine learning categorization, generative AI copilot inference, and serverless relational persistence.

```
+---------------------------------------------------------------------------------------------------+
|                                          CLIENT TIER                                              |
|                                                                                                   |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
|  |     Next.js 14 Web Client      |  |     Tauri Desktop Client       |  | Flutter Mobile App  |  |
|  |  React 18.3 / TypeScript 5.5   |  |   Rust 1.75+ / WebView2 Core   |  | (In Git Repo Hist)  |  |
|  |  TanStack Query / Tailwind CSS |  |   Desktop Native API / OS Tray |  | Provider / fl_chart |  |
|  +----------------+---------------+  +---------------+----------------+  +----------+----------+  |
+-------------------|----------------------------------|------------------------------|-------------+
                    | HTTPS / TLS 1.3                  | HTTPS / IPC                  | HTTPS / TLS
                    | Bearer JWT + HttpOnly Cookie     | Bearer JWT                   | Bearer JWT
                    v                                  v                              v
+---------------------------------------------------------------------------------------------------+
|                                      API & APPLICATION GATEWAY                                    |
|                                                                                                   |
|                                      Django 5.2 / DRF 3.18 API Server                             |
|                                           Gunicorn 26.2 (WSGI)                                    |
|                                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+  +---------------------+  |
|  | Authentication App |  |  Transactions App  |  |    Budgets App     |  |      Goals App      |  |
|  | JWT / TOTP / SSO   |  | Ledger / OCR / Net |  | Thresholds & Enforce|  | Velocity & Tracking |  |
|  +--------------------+  +--------------------+  +--------------------+  +---------------------+  |
|  +--------------------+  +--------------------+  +--------------------+  +---------------------+  |
|  |   Analytics App    |  |   AI Copilot App   |  |    Security App    |  |   ML Engine (App)   |  |
|  | Health Score / Run |  | Gemini Multi-Turn  |  | Audit Logs / WAF   |  | TF-IDF + Naive Bayes|  |
|  +--------------------+  +--------------------+  +--------------------+  +---------------------+  |
+---------------------------------------------------------------------------------------------------+
       |                        |                              |                         |
       | SQL (Port 5432/6543)   | Gemini SDK                   | SMTP (Port 465)         | OAuth 2.0
       v                        v                              v                         v
+--------------+        +---------------+              +---------------+         +---------------+
|     Neon     |        | Google Gemini |              | Google Gmail  |         | Google Cloud  |
|  PostgreSQL  |        | 2.0 Flash API |              |  SMTP Relay   |         | Identity SSO  |
|  Cluster V16 |        | Multimodal    |              | Email OTP/Notf|         | Token Exchange|
+--------------+        +---------------+              +---------------+         +---------------+
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Web Presentation Tier (`/web`)
* **Framework:** Next.js 14.2.5 (React 18.3.1, TypeScript 5.5.4).
* **Rendering Paradigm:** Hybrid Server-Side Rendering (SSR), Client-Side Hydration, and Standalone Node runtime output (`output: 'standalone'`).
* **Routing System:** App Router (`src/app/`) containing 28 routed pages grouped into public marketing/legal pages (`/`, `/about`, `/contact`, `/privacy-policy`, etc.) and authenticated financial application pages (`/dashboard`, `/transactions`, `/budgets`, `/goals`, `/ai`, `/net-worth`, `/debt`, `/receipts`, `/settings`, etc.).
* **State Management Strategy:**
  - **Server State / Cache:** `@tanstack/react-query` (v5.51.23) managing asynchronous data queries, window focus revalidation, mutations, and optimistic updates.
  - **Client UI State:** `zustand` (v4.5.4) for transient modals, currency selection, and filter states.
  - **Theme & Navigation Context:** Custom React contexts (`AuthContext.tsx`, `SidebarContext.tsx`, `ThemeContext.tsx`, `ToastContext.tsx`).
* **Styling & Design System:** Tailwind CSS 3.4.7 with CSS variable design tokens (`tokens.css`), Glassmorphism surface utilities (`GlassCard.tsx`), and Framer Motion 13.1.1 micro-interactions.

### 2.2 Backend Application Tier (`/backend`)
* **Runtime & Framework:** Python 3.12.10 running Django 5.2.17 and Django REST Framework 3.18.0.
* **Production Application Server:** Gunicorn 26.2.0 binding to dynamic host ports with 3 worker processes.
* **Static Asset Pipeline:** WhiteNoise 6.12.0 using `CompressedManifestStaticFilesStorage` to serve hashed assets directly via WSGI without requiring a separate Nginx container.
* **Application Modularity:** Cleanly divided into 7 domain-specific Django apps:
  1. `apps.authentication`: User registration, profile management, JWT tokens with rotation, TOTP 2FA multi-factor authentication, and Google OAuth 2.0 identity federation.
  2. `apps.transactions`: Double-entry style financial transaction ledger, category management, recurring subscriptions, assets & liabilities (net worth), debt payoff planning, and receipt OCR processing.
  3. `apps.budgets`: Multi-period budget limits, automatic variance calculations, threshold warning alerts, and historical spend tracking.
  4. `apps.goals`: Milestone-based savings goals, progress velocity computation, and contribution audit histories.
  5. `apps.analytics`: 360-degree Financial Health Score calculation (0–100), statistical cashflow runway forecasting, and anomaly detection.
  6. `apps.ai_copilot`: Multi-turn conversational AI financial agent, intent classification, context aggregation, and financial "What-If" scenario simulation.
  7. `apps.security`: Security audit log streaming, session revocation, vulnerability posture self-scanning, and contact submissions.

### 2.3 Machine Learning Subsystem (`/backend/ml`)
* **Libraries:** `scikit-learn` 1.9.0, `numpy` 2.5.2, `scipy` 1.18.1.
* **Model Architecture:** Pipeline consisting of:
  1. **Text Normalization:** Lowercasing, regex stripping of transaction merchant artifacts.
  2. **Feature Extraction:** `TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)`.
  3. **Classification Algorithm:** `MultinomialNB(alpha=0.1)`.
* **Inference Pipeline:** Singleton pattern (`FinancialCategorizer`) trained on comprehensive financial transaction corpus in `training_data.py`. Returns predicted category label and confidence probability score.

### 2.4 Generative AI Intelligence Subsystem (`/backend/services/ai_copilot_service.py`)
* **Engine:** Google Gemini 2.0 via `google-genai` SDK (v2.19.0).
* **Architecture:** Stateful multi-turn financial assistant with function-calling capabilities.
* **Privacy & Isolation Boundary:** The prompt construction layer isolates the authenticated user's ledger data, extracts pertinent totals (spending by category, remaining budget headroom, goal milestones), injects system behavioral rules, and sanitizes outputs to prevent prompt injection or financial hallucinations.

### 2.5 Native Desktop Subsystem (`/desktop`)
* **Framework:** Tauri 1.6 / Rust core with Microsoft Edge WebView2 binding.
* **Application Package:** `com.monvex.desktop` (v2.1.0).
* **Responsibilities:** System tray minification, native OS notifications, offline window chrome management, and secure local credential caching.

### 2.6 Persistence & Storage Tier
* **Database Engine:** Neon Serverless PostgreSQL 16.
* **Connection Protocol:** TCP over TLS (`sslmode=require`) utilizing connection pooling via `pgbouncer` (`-pooler` endpoint on port `6543`) or direct execution on port `5432`.
* **ORM:** Django Object-Relational Mapping (ORM) with database connection health verification (`conn_health_checks=True`) and connection reuse (`conn_max_age=600`).

---

## 3. Core Request & Dataflow Lifecycles

### 3.1 Authentication & Session Lifecycle
```
[User Browser]           [Next.js Web / API]            [Django Auth API]           [Neon PostgreSQL]
      |                           |                             |                           |
      | 1. Submit Credentials --->|                             |                           |
      |    (email + password)     | 2. POST /api/v1/auth/login/ |                           |
      |                           |---------------------------->| 3. Query User & Profile ->|
      |                           |                             |<--- Return Password Hash -|
      |                           |                             | 4. Argon2/PBKDF2 Check    |
      |                           |                             | 5. Generate JWT Pair      |
      |                           |                             |    - Access Token (60m)   |
      |                           |                             |    - Refresh Token (7d)   |
      |                           |<-- Set-Cookie (HttpOnly) ---|                           |
      |                           |    + JSON {access, user}    |                           |
      |<-- Store in Memory Cache -|                             |                           |
      |                           |                             |                           |
      | 6. Authenticated Request  |                             |                           |
      |    [Header: Bearer JWT]   |                             |                           |
      |-------------------------->| 7. Forward with Bearer ---->| 8. Verify JWT Signature   |
      |                           |                             | 9. Set request.user       |
```

### 3.2 AI Financial Copilot Inference Lifecycle
```
[User / React UI]             [AIChatView API]           [FinanceService]           [Google Gemini 2.0]
       |                              |                          |                          |
       | 1. "How much did I spend"    |                          |                          |
       |    POST /api/v1/ai/chat/ --->|                          |                          |
       |                              | 2. Classify Intent       |                          |
       |                              | 3. Retrieve Context ---->| 4. Aggregate Ledger SQL  |
       |                              |                          |    (User-Isolated)       |
       |                              |<-- Return JSON Financial |                          |
       |                              |    Context & Budgets     |                          |
       |                              |                          |                          |
       |                              | 5. Construct Grounded Prompt                        |
       |                              |    + System Directives   |                          |
       |                              |---------------------------------------------------->|
       |                              |                          | 6. Multi-turn Reasoning  |
       |                              |<----------------------------------------------------|
       |                              | 7. Persist ConversationTurn to Database             |
       |<-- Formatted Markdown + Data |                                                     |
       |    Visual Widget Payload     |                                                     |
```
