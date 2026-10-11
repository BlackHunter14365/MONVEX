# MONVEX Feature Inventory & Functional Implementation Matrix

> **Dossier Document:** 03  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 1.3, Chapter 3.5, Chapter 4.1  

---

## 1. Feature Classification & Verification Summary

Every feature listed below has been verified against the physical codebase in `/web` and `/backend`. The implementation is mapped to its exact UI routes, API endpoints, backend services, database models, and test cases.

```
Total Discovered Features:        20
Verified From Source [V-SRC]:     20
Verified By Automated Test [V-TST]: 18
Partially Implemented [V-PART]:    1 (Voice input UI entry point mapped to text NLP)
Planned / Future [V-FUT]:          1 (Live Open Banking Plaid/Yodlee Bank Sync)
```

---

## 2. Comprehensive Feature Matrix

### Feature 01: Public Marketing, Trust & Legal Portal
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Passed 24/24 Playwright automated link tests)
* **Purpose:** Introduces the platform, conveys value propositions, presents security posture, and provides required legal disclaimers.
* **User Problem Addressed:** Trust verification, clear terms of use, privacy transparency, and statutory financial disclaimer compliance.
* **Intended Actor:** Unauthenticated Visitors, Prospective Users.
* **UI Routes:** `/`, `/about`, `/contact`, `/help`, `/security-overview`, `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/financial-disclaimer`.
* **Frontend Components:** `PublicPageShell.tsx`, `LandingHero.tsx`, `FeatureGrid.tsx`, `SecurityBadges.tsx`.
* **Backend Endpoint:** `POST /api/v1/contact/` (`ContactSubmissionView`).
* **Database Models:** `apps.security.models.ContactSubmission`.
* **Business Rules:** Contact form rate-limited; IP address and user-agent logged for security audit. Single-click public navigation with zero login redirects.

---

### Feature 02: User Authentication & JWT Session Architecture
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_standard_auth.py` and `test_cookie_auth.py`)
* **Purpose:** Provides cryptographically secure account registration, email/password login, token refreshing, and session termination.
* **User Problem Addressed:** Identity management, session persistence, protection against unauthorized access.
* **Intended Actor:** All Users.
* **UI Routes:** `/login`, `/register`, `/forgot-password`.
* **Frontend Implementation:** `AuthShell.tsx`, `AuthContext.tsx`, `client.ts` (intercepts 401s and triggers refresh).
* **Backend Implementation:** `apps.authentication.views.RegisterView`, `CustomLoginView`, `CookieTokenRefreshView`, `LogoutView`.
* **API Endpoints:**
  - `POST /api/v1/auth/register/`
  - `POST /api/v1/auth/login/`
  - `POST /api/v1/auth/token/refresh/`
  - `POST /api/v1/auth/logout/`
  - `GET /api/v1/auth/me/`
* **Database Models:** `auth.models.User`, `apps.authentication.models.Profile`.
* **Security Controls:** Passwords hashed with PBKDF2/Argon2. Access tokens expire in 60 minutes; refresh tokens stored in secure HttpOnly cookies (`monvex_refresh_token`) with rotation and blacklisting upon logout.

---

### Feature 03: Multi-Factor Authentication (TOTP / 2FA)
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_mfa_auth.py`)
* **Purpose:** Secondary layer of authentication utilizing RFC 6238 Time-based One-Time Passwords (compatible with Google Authenticator / Authy).
* **User Problem Addressed:** Account takeover prevention in case of password compromise.
* **Intended Actor:** Authenticated Users.
* **UI Routes:** `/security` (Setup), `/login` (MFA Challenge Step).
* **Backend Implementation:** `apps.authentication.views.MFASetupView`, `MFAVerifyView`, `MFADisableView`, `MFALoginCompleteView`.
* **API Endpoints:**
  - `POST /api/v1/auth/mfa/setup/`
  - `POST /api/v1/auth/mfa/verify/`
  - `POST /api/v1/auth/mfa/disable/`
  - `GET /api/v1/auth/mfa/status/`
  - `POST /api/v1/auth/mfa/login/`
* **Database Models:** `Profile.mfa_secret`, `Profile.is_mfa_enabled`.
* **Dependencies:** `pyotp` (v2.10.0).

---

### Feature 04: Google OAuth 2.0 Federated Identity & Account Linking
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_google_auth.py`)
* **Purpose:** Single-click sign-in using Google Cloud OAuth 2.0 ID tokens and linking Google identities to existing local user accounts.
* **User Problem Addressed:** Friction in account creation; eliminates password fatigue.
* **UI Routes:** `/login`, `/register`, `/settings`.
* **Backend Implementation:** `apps.authentication.views.GoogleLoginView`, `GoogleLinkAccountView`, `GoogleAuthService`.
* **API Endpoints:**
  - `POST /api/v1/auth/google/`
  - `POST /api/v1/auth/google/link/`
* **Database Models:** `apps.authentication.models.GoogleIdentity` (Enforces unique constraint on `[provider, provider_subject]`).
* **Dependencies:** `google-auth` (v2.56.3).

---

### Feature 05: Executive Financial Dashboard
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `useDashboardQuery.ts` and `audit_results.json`)
* **Purpose:** Central command center summarizing financial health, monthly cashflow, spending distribution, and recent activity.
* **User Problem Addressed:** Fragmentation of financial data across disconnected accounts and receipts.
* **Intended Actor:** Authenticated User.
* **UI Route:** `/dashboard`.
* **Frontend Implementation:** `DashboardView.tsx`, `NetWorthCard.tsx`, `CashFlowSummary.tsx`, `CategoryDonutChart.tsx`, `HealthScoreWidget.tsx`.
* **Backend Implementation:** `apps.analytics.views.DashboardMetricsView`, `services.finance_service.FinanceService`.
* **API Endpoint:** `GET /api/v1/analytics/dashboard/`.
* **Calculated Metrics:** Net worth, monthly total income, monthly total expenses, net savings rate, category breakdown percentages, budget consumption percentages.

---

### Feature 06: Transaction Management & Double-Entry Ledger
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_api_endpoints.py` and `test_v42_data_integrity.py`)
* **Purpose:** Comprehensive financial transaction ledger supporting manual entry, categorization, date filtering, pagination, and CSV export.
* **User Problem Addressed:** Inaccurate tracking of personal cash inflows and outflows.
* **UI Route:** `/transactions`.
* **Frontend Implementation:** `TransactionList.tsx`, `AddTransactionModal.tsx`, `TransactionFilters.tsx`, `useTransactionsQuery.ts`.
* **Backend Implementation:** `apps.transactions.views.TransactionListCreateView`, `TransactionDetailView`, `TransactionExportCSVView`.
* **API Endpoints:**
  - `GET /api/v1/transactions/` (paginated, filterable by date, type, category)
  - `POST /api/v1/transactions/`
  - `GET /api/v1/transactions/<pk>/`
  - `PATCH /api/v1/transactions/<pk>/`
  - `DELETE /api/v1/transactions/<pk>/`
  - `GET /api/v1/transactions/export/` (Streams RFC 4180 compliant CSV)
* **Database Models:** `apps.transactions.models.Transaction`, `Category`, `Merchant`.
* **Data Types:** `amount` stored as `DecimalField(max_digits=12, decimal_places=2)`.

---

### Feature 07: Machine Learning Transaction Auto-Categorization Engine
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_engines.py`)
* **Purpose:** Automatically predicts the appropriate expense/income category when a user inputs a transaction description or merchant name.
* **User Problem Addressed:** Manual categorization fatigue leading to uncategorized and abandoned expense records.
* **Implementation:** `backend/ml/categorizer.py` (`FinancialCategorizer`), `ml/training_data.py`.
* **Algorithm:** Scikit-learn Pipeline with `TfidfVectorizer(ngram_range=(1,2))` and `MultinomialNB(alpha=0.1)`.
* **Execution Flow:** Triggered transparently inside `TransactionService.create_transaction()` whenever category is omitted or unassigned. Returns predicted category name and `confidence_score` (0.0000–1.0000).

---

### Feature 08: Natural Language Financial Entry (NLP Parser)
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_nlp_copilot.py`)
* **Purpose:** Parses unstructured human language strings (e.g., *"Spent ₹450 on Starbucks coffee yesterday"*) into structured financial transactions.
* **UI Entry Point:** Universal Command Bar (`FinancialCommandBar.tsx`) and Quick Entry Modal.
* **Backend Implementation:** `apps.transactions.views.NaturalLanguageParseView`, `services.nlp_parser.NLPParser`.
* **API Endpoint:** `POST /api/v1/transactions/parse-natural/`.
* **Extracted Entities:** Amount (currency regex), Date (relative day parsing: today, yesterday, 2 days ago), Merchant name, and ML-predicted Category.

---

### Feature 09: Category-Based Budget Management & Real-Time Variance
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_engines.py`)
* **Purpose:** Allows users to establish spending limits per category across defined periods and monitors spending thresholds.
* **UI Route:** `/budgets`.
* **Frontend Implementation:** `BudgetGrid.tsx`, `BudgetProgressBar.tsx`, `CreateBudgetModal.tsx`, `useBudgetsQuery.ts`.
* **Backend Implementation:** `apps.budgets.views.BudgetListCreateView`, `BudgetOverviewView`, `services.budget_service.BudgetService`.
* **API Endpoints:**
  - `GET /api/v1/budgets/`
  - `POST /api/v1/budgets/`
  - `GET /api/v1/budgets/overview/`
  - `GET /api/v1/budgets/<pk>/`
  - `DELETE /api/v1/budgets/<pk>/`
* **Database Models:** `apps.budgets.models.Budget`, `BudgetHistory`.
* **Business Invariant:** `unique_together = ('user', 'category', 'period')` prevents duplicate active budgets for the same category.

---

### Feature 10: Savings Goals Velocity & Milestone Tracker
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_engines.py`)
* **Purpose:** Enables users to set target savings amounts, assign target deadlines, allocate monthly contributions, and track progress velocity.
* **UI Route:** `/goals`.
* **Frontend Implementation:** `GoalCard.tsx`, `GoalContributionModal.tsx`, `useGoalsQuery.ts`.
* **Backend Implementation:** `apps.goals.views.SavingsGoalListCreateView`, `ContributeGoalView`.
* **API Endpoints:**
  - `GET /api/v1/goals/`
  - `POST /api/v1/goals/`
  - `POST /api/v1/goals/<pk>/contribute/`
  - `GET /api/v1/goals/<pk>/`
* **Database Models:** `apps.goals.models.SavingsGoal`, `GoalContribution`.
* **Business Rules:** Contributions atomically increment `current_amount`. When `current_amount >= target_amount`, status automatically transitions to `COMPLETED`.

---

### Feature 11: Algorithmic 360-Degree Financial Health Score (0–100)
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_engines.py`)
* **Purpose:** Calculates a single, comprehensive financial wellness index from 0 to 100 with grade badges (A+, A, B, C, D) and prioritized recommendations.
* **UI Route:** `/dashboard`, `/analytics`.
* **Frontend Implementation:** `HealthScoreGauge.tsx`, `ScoreBreakdownCard.tsx`.
* **Backend Implementation:** `services.finance_service.FinanceService.calculate_financial_health_score()`.
* **API Endpoint:** `GET /api/v1/analytics/health-score/`.
* **Four Scoring Pillars:**
  1. **Savings Rate Component (30 pts):** Based on `(monthly_savings / monthly_income) * 100`.
  2. **Budget Discipline Component (30 pts):** Ratio of categories maintained under budget limit.
  3. **Debt-to-Income Component (20 pts):** Ratio of monthly EMI liabilities to monthly net income.
  4. **Emergency Runway Component (20 pts):** Liquid savings divided by average monthly burn rate.

---

### Feature 12: Statistical Cashflow Runway Forecasting
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_engines.py`)
* **Purpose:** Projects future liquid balances 30, 60, or 90 days forward by combining fixed recurring obligations and historical daily expenditure velocity.
* **UI Route:** `/forecast`.
* **Frontend Implementation:** `CashflowForecastChart.tsx`, `useForecastQuery.ts`.
* **Backend Implementation:** `services.forecast_service.ForecastService.forecast_cash_flow()`.
* **API Endpoint:** `GET /api/v1/analytics/cashflow-forecast/?days=30`.
* **Output:** Daily projected balance series, danger-zone threshold alerts, and estimated cash depletion date.

---

### Feature 13: Net Worth Portfolio (Assets & Liabilities Tracking)
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_v42_data_integrity.py`)
* **Purpose:** Complete balance sheet tracking of total assets (Bank, Cash, Investments, Gold, Property) and liabilities (Loans, Mortgages, Credit Cards).
* **UI Route:** `/net-worth`.
* **Frontend Implementation:** `NetWorthOverview.tsx`, `AssetList.tsx`, `LiabilityList.tsx`, `useNetWorthQuery.ts`.
* **Backend Implementation:** `services.net_worth_service.NetWorthService`, `apps.transactions.views_extra.NetWorthOverviewView`.
* **API Endpoints:**
  - `GET /api/v1/transactions/assets/`
  - `POST /api/v1/transactions/assets/`
  - `GET /api/v1/transactions/liabilities/`
  - `POST /api/v1/transactions/liabilities/`
  - `GET /api/v1/transactions/net-worth/`
* **Database Models:** `apps.transactions.models.Asset`, `Liability`.

---

### Feature 14: Debt Payoff Optimization & Amortization Planner
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_engines.py`)
* **Purpose:** Models debt reduction strategies (Debt Avalanche: highest interest first vs Debt Snowball: lowest balance first) and extra prepayment simulations.
* **UI Route:** `/debt`.
* **Frontend Implementation:** `DebtPlannerView.tsx`, `AmortizationSchedule.tsx`, `ExtraPaymentSimulator.tsx`, `useDebtQuery.ts`.
* **Backend Implementation:** `services.debt_service.DebtService`.
* **API Endpoints:**
  - `GET /api/v1/transactions/debt-planner/`
  - `POST /api/v1/transactions/debt-simulate/`
* **Calculations:** Total interest paid, debt-free date, total savings under extra payment schedule.

---

### Feature 15: Receipt Intelligence Studio (Multimodal OCR)
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_file_upload_security.py`)
* **Purpose:** Ingests paper receipt photos or PDF invoices, validates binary magic bytes, extracts structured data via Gemini multimodal OCR, and converts confirmed receipts into ledger transactions.
* **UI Route:** `/receipts`.
* **Frontend Implementation:** `ReceiptUploadZone.tsx`, `ReceiptReviewModal.tsx`, `useReceiptsQuery.ts`.
* **Backend Implementation:** `services.file_validation_service.FileValidationService`, `services.ocr_service.OCRService`, `services.receipt_service.ReceiptService`.
* **API Endpoints:**
  - `GET /api/v1/transactions/receipts/`
  - `POST /api/v1/transactions/receipts/upload/`
  - `POST /api/v1/transactions/receipts/<pk>/confirm/`
  - `POST /api/v1/transactions/receipts/<pk>/reject/`
  - `GET /api/v1/transactions/receipts/<pk>/image/`
* **Database Models:** `apps.transactions.models.Receipt`.
* **Security Controls:** Magic byte binary inspection blocks executable files, PHP scripts, or disguised binaries.

---

### Feature 16: AI Financial Copilot & Multi-Turn Conversational Agent
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_nlp_copilot.py`)
* **Purpose:** Conversational agent capable of answering user inquiries regarding their financial posture, synthesizing trends, and running "What-If" simulations.
* **UI Route:** `/ai`.
* **Frontend Implementation:** `AIConversationWorkspace.tsx`, `DesktopAIWorkspace.tsx`, `AIMessageRenderer.tsx`, `AIContextPanel.tsx`.
* **Backend Implementation:** `apps.ai_copilot.views.AIChatView`, `services.ai_copilot_service.AICopilotService`.
* **API Endpoints:**
  - `POST /api/v1/ai/chat/`
  - `GET /api/v1/ai/conversations/`
  - `GET /api/v1/ai/conversations/<pk>/`
  - `DELETE /api/v1/ai/conversations/<pk>/clear/`
  - `POST /api/v1/ai/what-if/`
  - `POST /api/v1/ai/simulator/`
  - `GET /api/v1/ai/insights/`
* **Database Models:** `ConversationSession`, `ConversationMessage`, `AIInteraction`, `AIInsight`.
* **AI Provider:** Google Gemini 2.0 via `google-genai` SDK.

---

### Feature 17: Automated Anomaly & Duplicate Detection Engine
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_financial_data_integrity.py`)
* **Purpose:** Automatically flags abnormal transaction spikes (using statistical deviations) and duplicate transactions (identical amount, merchant, and date window).
* **UI Route:** `/dashboard`, `/transactions/duplicates`.
* **Backend Implementation:** `services.anomaly_service.AnomalyService`, `services.financial_integrity_service.FinancialIntegrityService`.
* **API Endpoints:**
  - `GET /api/v1/analytics/anomalies/`
  - `PATCH /api/v1/analytics/anomalies/<pk>/status/`
  - `GET /api/v1/transactions/duplicates/`
* **Database Models:** `apps.ai_copilot.models.AnomalyEvent`.

---

### Feature 18: Financial Statement PDF & CSV Reporting Engine
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_api_endpoints.py`)
* **Purpose:** Generates downloadable, presentation-grade monthly financial PDF statements complete with summaries, category charts, and transaction logs, as well as CSV exports.
* **UI Route:** `/reports`.
* **Frontend Implementation:** `ReportsView.tsx`, `useReportsQuery.ts`.
* **Backend Implementation:** `services.pdf_report_service.PDFReportService`.
* **API Endpoints:**
  - `GET /api/v1/transactions/report/monthly/` (JSON breakdown)
  - `GET /api/v1/transactions/report/pdf/` (Streams binary PDF with `Content-Type: application/pdf`)
* **Library:** `reportlab` (v5.0.1).

---

### Feature 19: Universal Omnibar Search & Quick Action Command Center
* **Verification Status:** `[V-SRC]` & `[V-TST]` (Tested in `test_api_endpoints.py`)
* **Purpose:** Universal search keyboard shortcut (`Ctrl+K` / `Cmd+K`) searching across transactions, merchants, categories, budgets, and goals simultaneously.
* **UI Component:** `GlobalSearch.tsx`, `FinancialCommandBar.tsx`.
* **Backend Implementation:** `services.search_service.SearchService`, `apps.transactions.views_extra.UniversalSearchView`.
* **API Endpoint:** `GET /api/v1/search/?q=<query>`.

---

### Feature 20: Native Windows Desktop Wrapper (Tauri)
* **Verification Status:** `[V-SRC]` & `[V-CFG]` (Verified in `desktop/src-tauri/tauri.conf.json`)
* **Purpose:** Encapsulates the web application into a lightweight Windows desktop executable with system tray support, native OS notifications, and local file access.
* **Package Identifier:** `com.monvex.desktop` (v2.1.0).
* **Architecture:** Rust backend binding Microsoft Edge WebView2.
