# MONVEX REST API & External Integration Inventory

> **Dossier Document:** 06  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 4.1, Chapter 5.1  

---

## 1. REST API Architecture & Standards

MONVEX adheres to the Richardson Maturity Model (Level 2/3) RESTful standards:
* **Base URL Path:** `/api/v1/`
* **Transport Protocol:** Strict HTTPS (TLS 1.3 in production).
* **Content Negotiation:** `application/json` for data payloads; `text/csv` and `application/pdf` for file streams.
* **Authentication Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Cookie Exchange:** `Set-Cookie: monvex_refresh_token=<JWT_REFRESH_TOKEN>; HttpOnly; Secure; SameSite=Lax`

---

## 2. API Endpoint Directory by Subsystem

### 2.1 Core Authentication & Profile (`/api/v1/auth/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | `RegisterView` | AllowAny | Body: `{username, email, password}`. Provisions user and profile. | 201 Created |
| `POST` | `/api/v1/auth/login/` | `CustomLoginView` | AllowAny | Body: `{username, password}`. Issues access token and HttpOnly refresh cookie. | 200 OK |
| `POST` | `/api/v1/auth/logout/` | `LogoutView` | IsAuthenticated | Blacklists refresh token; clears cookie. | 200 OK |
| `POST` | `/api/v1/auth/token/refresh/` | `CookieTokenRefreshView` | AllowAny | Reads `monvex_refresh_token` cookie; rotates and returns new access token. | 200 OK |
| `GET` | `/api/v1/auth/me/` | `CurrentUserView` | IsAuthenticated | Returns current authenticated user and profile summary. | 200 OK |
| `GET/PUT`| `/api/v1/auth/profile/` | `ProfileView` | IsAuthenticated | Retrieves or updates currency, monthly income, savings target, theme. | 200 OK |
| `POST` | `/api/v1/auth/profile/avatar/` | `AvatarUploadView` | IsAuthenticated | Multipart form: `avatar` image with magic-byte validation. | 200 OK |
| `POST` | `/api/v1/auth/google/` | `GoogleLoginView` | AllowAny | Body: `{credential}` (Google ID token). Authenticates via Google SSO. | 200 OK |
| `POST` | `/api/v1/auth/google/link/` | `GoogleLinkAccountView` | IsAuthenticated | Links Google account to existing user profile. | 200 OK |
| `POST` | `/api/v1/auth/mfa/setup/` | `MFASetupView` | IsAuthenticated | Generates TOTP secret and QR code URI. | 200 OK |
| `POST` | `/api/v1/auth/mfa/verify/` | `MFAVerifyView` | IsAuthenticated | Body: `{code}`. Validates 6-digit TOTP code to enable 2FA. | 200 OK |
| `POST` | `/api/v1/auth/mfa/disable/` | `MFADisableView` | IsAuthenticated | Disables 2FA on profile. | 200 OK |
| `GET` | `/api/v1/auth/mfa/status/` | `MFAStatusView` | IsAuthenticated | Returns `{is_mfa_enabled: boolean}`. | 200 OK |
| `POST` | `/api/v1/auth/mfa/login/` | `MFALoginCompleteView`| AllowAny | Body: `{ephemeral_token, code}`. Completes 2FA login challenge. | 200 OK |

---

### 2.2 Financial Transactions & Ledger (`/api/v1/transactions/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/transactions/` | `TransactionListCreateView`| IsAuthenticated | Query params: `page`, `page_size`, `type`, `category`, `start_date`, `end_date`, `search`. | 200 OK |
| `POST` | `/api/v1/transactions/` | `TransactionListCreateView`| IsAuthenticated | Body: `{amount, type, date, category_id, merchant_name, description}`. | 201 Created |
| `GET` | `/api/v1/transactions/<pk>/`| `TransactionDetailView` | IsAuthenticated | Returns single transaction details. | 200 OK |
| `PATCH` | `/api/v1/transactions/<pk>/`| `TransactionDetailView` | IsAuthenticated | Partial updates to transaction fields. | 200 OK |
| `DELETE`| `/api/v1/transactions/<pk>/`| `TransactionDetailView` | IsAuthenticated | Deletes transaction record. | 204 No Content |
| `GET` | `/api/v1/transactions/export/`| `TransactionExportCSVView`| IsAuthenticated | Streams RFC 4180 CSV export of filtered transactions. | 200 OK |
| `POST` | `/api/v1/transactions/parse-natural/`| `NaturalLanguageParseView`| IsAuthenticated | Body: `{text}`. NLP entity extraction returns parsed JSON. | 200 OK |
| `GET/POST`| `/api/v1/transactions/categories/`| `CategoryListCreateView`| IsAuthenticated | List user + default categories or create custom category. | 200 OK / 201 |
| `GET/POST`| `/api/v1/transactions/recurring/` | `RecurringPaymentListCreateView`| IsAuthenticated | Manage active recurring subscriptions and obligations. | 200 OK / 201 |
| `GET` | `/api/v1/transactions/duplicates/`| `DuplicateTransactionsView`| IsAuthenticated | Detects potential duplicate charges in recent history. | 200 OK |

---

### 2.3 Net Worth Portfolio & Debt Optimization (`/api/v1/transactions/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET/POST`| `/api/v1/transactions/assets/` | `AssetListCreateView` | IsAuthenticated | List/Create assets (Cash, Bank, Investments, Real Estate). | 200 OK / 201 |
| `GET/POST`| `/api/v1/transactions/liabilities/`| `LiabilityListCreateView`| IsAuthenticated | List/Create liabilities (Loans, Mortgages, Credit Cards). | 200 OK / 201 |
| `GET` | `/api/v1/transactions/net-worth/` | `NetWorthOverviewView` | IsAuthenticated | Returns total assets, total liabilities, and net worth trend. | 200 OK |
| `GET` | `/api/v1/transactions/debt-planner/`| `DebtPlannerOverviewView`| IsAuthenticated | Returns debt avalanche vs snowball schedules. | 200 OK |
| `POST` | `/api/v1/transactions/debt-simulate/`| `DebtSimulateExtraPaymentView`| IsAuthenticated | Body: `{extra_monthly_amount}`. Calculates interest savings. | 200 OK |

---

### 2.4 Receipt Intelligence Studio (`/api/v1/transactions/receipts/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/transactions/receipts/` | `ReceiptListView` | IsAuthenticated | Lists staged receipts and review statuses. | 200 OK |
| `POST` | `/api/v1/transactions/receipts/upload/`| `ReceiptUploadView` | IsAuthenticated | Multipart: receipt file. Runs magic-byte check + Gemini OCR. | 201 Created |
| `POST` | `/api/v1/transactions/receipts/<pk>/confirm/`| `ReceiptConfirmView`| IsAuthenticated | Confirms staged receipt; creates `Transaction` in ledger. | 200 OK |
| `POST` | `/api/v1/transactions/receipts/<pk>/reject/` | `ReceiptRejectView` | IsAuthenticated | Rejects staged receipt. | 200 OK |
| `GET` | `/api/v1/transactions/receipts/<pk>/image/` | `ReceiptImageView` | IsAuthenticated | Streams securely stored receipt image. | 200 OK |

---

### 2.5 Budgets & Savings Goals (`/api/v1/budgets/` & `/api/v1/goals/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET/POST`| `/api/v1/budgets/` | `BudgetListCreateView` | IsAuthenticated | List/create category budget spending caps. | 200 OK / 201 |
| `GET` | `/api/v1/budgets/overview/` | `BudgetOverviewView` | IsAuthenticated | Real-time budget consumption and variance calculation. | 200 OK |
| `DELETE`| `/api/v1/budgets/<pk>/` | `BudgetDetailView` | IsAuthenticated | Deletes budget cap. | 204 No Content |
| `GET/POST`| `/api/v1/goals/` | `SavingsGoalListCreateView`| IsAuthenticated | List/create target savings goals. | 200 OK / 201 |
| `POST` | `/api/v1/goals/<pk>/contribute/`| `ContributeGoalView` | IsAuthenticated | Body: `{amount, notes}`. Logs contribution towards goal. | 200 OK |

---

### 2.6 Analytics, Forecasting & Anomaly Engine (`/api/v1/analytics/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/dashboard/` | `DashboardMetricsView` | IsAuthenticated | Aggregated overview metrics (income, expenses, savings rate). | 200 OK |
| `GET` | `/api/v1/analytics/health-score/` | `FinancialHealthScoreView`| IsAuthenticated | Algorithmic 360-degree health score (0–100) and recommendations. | 200 OK |
| `GET` | `/api/v1/analytics/cashflow-forecast/`| `CashflowForecastView` | IsAuthenticated | Query: `?days=30`. Projected daily balance cashflow series. | 200 OK |
| `GET` | `/api/v1/analytics/anomalies/` | `AnomalyListView` | IsAuthenticated | Lists statistical spending outliers. | 200 OK |
| `PATCH` | `/api/v1/analytics/anomalies/<pk>/status/`| `AnomalyStatusUpdateView`| IsAuthenticated | Body: `{status: CONFIRMED/DISMISSED}`. Updates review state. | 200 OK |

---

### 2.7 AI Financial Copilot (`/api/v1/ai/`)

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chat/` | `AIChatView` | IsAuthenticated | Body: `{message, session_id}`. Multi-turn AI reasoning via Gemini. | 200 OK |
| `GET` | `/api/v1/ai/conversations/` | `ConversationSessionListView`| IsAuthenticated | Lists historical conversation sessions. | 200 OK |
| `GET` | `/api/v1/ai/conversations/<pk>/`| `ConversationSessionDetailView`| IsAuthenticated | Retrieves message turns within specific session. | 200 OK |
| `DELETE`| `/api/v1/ai/conversations/<pk>/clear/`| `ConversationSessionClearView`| IsAuthenticated | Clears dialog history for session. | 200 OK |
| `POST` | `/api/v1/ai/what-if/` | `AIWhatIfSimulationView`| IsAuthenticated | Body: `{scenario}`. Financial scenario simulation. | 200 OK |
| `GET` | `/api/v1/ai/insights/` | `AIInsightListView` | IsAuthenticated | Retrieves proactive automated AI advice cards. | 200 OK |

---

### 2.8 Security Telemetry & System Probes

| Method | Endpoint | View Class | Auth Req | Description & Payload | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health/` | `health_check` | AllowAny | Container liveness probe. | 200 OK |
| `GET` | `/ready/` | `readiness_check` | AllowAny | Verifies database socket readiness. | 200 OK |
| `GET` | `/api/v1/security/overview/` | `SecurityOverviewView` | IsAuthenticated | Security posture grade, active sessions, and 2FA status. | 200 OK |
| `GET` | `/api/v1/security/logs/` | `SecurityAuditLogListView`| IsAuthenticated | Security audit event telemetry feed. | 200 OK |
| `POST` | `/api/v1/security/revoke-sessions/`| `RevokeAllSessionsView`| IsAuthenticated | Invalidates all issued refresh tokens for user. | 200 OK |
| `POST` | `/api/v1/contact/` | `ContactSubmissionView`| AllowAny | Body: `{name, email, message}`. Public contact form. | 201 Created |
| `GET` | `/api/v1/search/` | `UniversalSearchView` | IsAuthenticated | Universal omnibar search query (`?q=`). | 200 OK |

---

## 3. External Service Integrations

### 3.1 Google Gemini 2.0 Multimodal AI Integration
* **SDK:** `google-genai` (v2.19.0).
* **Environment Variable:** `GEMINI_API_KEY`.
* **Use Cases:**
  1. **Conversational Financial Copilot (`AICopilotService`):** System prompt restricts AI persona to financial advisory role; passes aggregated category totals and budget limits as structured JSON context.
  2. **Receipt OCR Processing (`OCRService`):** Ingests image base64 bytes into Gemini Vision model, requesting structured JSON output conforming to `{merchant_name, date, total_amount, subtotal, tax_amount, items: [{name, price, qty}]}`.

### 3.2 Google Cloud Identity Platform (OAuth 2.0 SSO)
* **SDK:** `google-auth` (v2.28.0+).
* **Environment Variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
* **Flow:** Browser initiates Google Identity Services prompt; Google returns signed JWT ID token; client sends token to `POST /api/v1/auth/google/`; backend verifies cryptographic signature against Google's public JWKS certificates; extracts `sub`, `email`, `given_name`.

### 3.3 Transactional Email Relay (Google SMTP Engine)
* **Configuration:** Django SMTP Backend (`django.core.mail.backends.smtp.EmailBackend`).
* **Relay Host:** `smtp.gmail.com` on Port `465` (SSL).
* **Environment Variables:** `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (16-character App Password).
* **Use Case:** Dispatches account registration verification notices, security password change alerts, and contact inquiry confirmations.
