# MONVEX Multi-Platform Feature Matrix

============================================================
PROJECT: MONVEX V2
PLATFORMS: WEB | WINDOWS DESKTOP | ANDROID MOBILE
LOCKED CENTRAL BACKEND: DJANGO REST + FINANCIAL INTELLIGENCE + GEMINI AI
============================================================

| Feature Module | Web (Next.js 15) | Windows Desktop (Tauri / Rust) | Android (Flutter / Dart) | Underlying Central API |
| :--- | :---: | :---: | :---: | :--- |
| **Authentication (Password / JWT)** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/auth/login/`, `/auth/register/` |
| **Email OTP Verification** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/auth/verification/` |
| **Google Sign-In / Linking** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/auth/google/` |
| **Dashboard & Telemetry** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/analytics/dashboard/` |
| **Transactions Ledger** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/transactions/` |
| **Quick Add Transaction** | ✅ Modal | ✅ Modal (`Ctrl+N`) | ✅ Bottom Sheet (`+` FAB) | `/api/v1/transactions/` |
| **Financial Accounts** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/accounts/` |
| **Budgets & Spending Limits** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/budgets/` |
| **Savings Goals & Horizons** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/goals/` |
| **Health Score Engine (10-Vector)** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/analytics/health-score/` |
| **AI Copilot & Grounding** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/ai/chat/` |
| **Universal Search** | ✅ Production (`Ctrl+K`) | ✅ Production (`Ctrl+K`) | ✅ Production (Search Sheet) | `/api/v1/search/` |
| **Security Center & Audit Logs** | ✅ Production | ✅ Production | ✅ Production | `/api/v1/security/` |
| **User Data Isolation** | ✅ Enforced | ✅ Enforced | ✅ Enforced | Central Django ORM & JWT Claims |
