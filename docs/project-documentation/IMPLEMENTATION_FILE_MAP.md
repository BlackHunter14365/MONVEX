# MONVEX Implementation File Map & Code Directory

> **Dossier Document:** 09  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 5.1.1 (5.1.1.1 Code Details, 5.1.1.2 Code Efficiency)  

---

## 1. Overview & Directory Organization

The MONVEX codebase is architected with strict separation of concerns, modular domain services, and zero circular dependencies. This directory maps every core architectural file to its responsibilities, major exports, and test references.

---

## 2. Frontend Subsystem (`/web/src`)

### 2.1 Core Routing & Page Entry Points (`web/src/app`)
* **`app/layout.tsx`**
  - **Responsibility:** Root HTML document shell. Wraps application with `ThemeContext`, `AuthContext`, `SidebarContext`, and `QueryClientProvider`.
  - **Key Logic:** Configures Inter font, sets meta tags, and initializes theme tokens.
* **`app/page.tsx`**
  - **Responsibility:** High-conversion public marketing landing page.
  - **Key Logic:** Renders hero section, live interactive feature previews, security badges, and footer links.
* **`app/dashboard/page.tsx`**
  - **Responsibility:** Executive dashboard route.
  - **Key Components:** `NetWorthCard`, `CashFlowSummary`, `CategoryDonutChart`, `HealthScoreWidget`.
  - **Hook Used:** `useDashboardQuery.ts`.
* **`app/transactions/page.tsx`**
  - **Responsibility:** Core ledger interface for viewing, creating, searching, and exporting transactions.
  - **Key Components:** `TransactionList`, `AddTransactionModal`, `TransactionFilters`.
  - **Hook Used:** `useTransactionsQuery.ts`.
* **`app/ai/page.tsx`**
  - **Responsibility:** AI Financial Copilot multi-turn chat and scenario simulation workspace.
  - **Key Components:** `AIConversationWorkspace`, `DesktopAIWorkspace`, `AIContextPanel`.
  - **Hook Used:** `useAIConversationsQuery.ts`.
* **`app/budgets/page.tsx`**
  - **Responsibility:** Budget limits, threshold progress bars, and over-budget warnings.
  - **Hook Used:** `useBudgetsQuery.ts`.
* **`app/goals/page.tsx`**
  - **Responsibility:** Target savings milestones, progress velocity, and contribution logging.
  - **Hook Used:** `useGoalsQuery.ts`.
* **`app/analytics/page.tsx`**
  - **Responsibility:** 360-degree Financial Health Score breakdown and category analytics.
  - **Hook Used:** `useAnalyticsQuery.ts`.
* **`app/forecast/page.tsx`**
  - **Responsibility:** 30/60/90-day cashflow runway projections and depletion warnings.
  - **Hook Used:** `useForecastQuery.ts`.
* **`app/net-worth/page.tsx`**
  - **Responsibility:** Asset valuation tracking, liability amortizations, and total net worth.
  - **Hook Used:** `useNetWorthQuery.ts`.
* **`app/debt/page.tsx`**
  - **Responsibility:** Debt reduction planner comparing Debt Avalanche and Debt Snowball.
  - **Hook Used:** `useDebtQuery.ts`.
* **`app/receipts/page.tsx`**
  - **Responsibility:** Multimodal receipt image upload zone, staged review, and confirmation.
  - **Hook Used:** `useReceiptsQuery.ts`.
* **`app/security/page.tsx`** & **`app/security-overview/page.tsx`**
  - **Responsibility:** `/security` provides authenticated 2FA setup, active session revocation, and audit logs. `/security-overview` provides public security disclosures.
* **`app/not-found.tsx`**
  - **Responsibility:** Premium fintech-styled 404 page with navigation shortcuts.

### 2.2 Shared Contexts & State Management (`web/src/context`)
* **`context/AuthContext.tsx`**
  - **Responsibility:** Global user session state, login/logout functions, and token persistence.
  - **Key Logic:** Interacts with `authStorage.ts` and `api/client.ts`. Maintains user profile object in memory.
* **`context/SidebarContext.tsx`**
  - **Responsibility:** Desktop sidebar expand/collapse toggle and mobile navigation drawer state.
  - **Key Logic:** Persists desktop preference in `localStorage` with SSR-safe hydration defaults.
* **`context/ThemeContext.tsx`**
  - **Responsibility:** High-contrast dark mode and light mode theme switcher.
  - **Key Logic:** Toggles `.dark` class on root `<html>` element.

### 2.3 API Client & Network Infrastructure (`web/src/lib`)
* **`lib/api/client.ts`**
  - **Responsibility:** Centralized Axios / Fetch client configured with base URL, timeout, and interceptors.
  - **Key Logic:** Transparently attaches `Authorization: Bearer <token>` to requests. Intercepts `401 Unauthorized` responses and triggers automatic token refresh via `/api/v1/auth/token/refresh/`.

---

## 3. Backend Subsystem (`/backend`)

### 3.1 Core Platform Configuration (`backend/monvex`)
* **`monvex/settings.py`**
  - **Responsibility:** Central Django configuration module.
  - **Key Components:**
    - `DATABASES`: Configured via `dj_database_url` for Neon PostgreSQL with `conn_max_age=600`.
    - Production Guard: Raises `ImproperlyConfigured` if `DEBUG=False` and `SECRET_KEY` or `DATABASE_URL` is missing.
    - CORS & CSRF: Strict origin whitelisting (`monvex-web.onrender.com`, `tauri://localhost`).
    - REST Framework: Throttling (`120/min` anon, `1200/hr` user), pagination (`20/page`).
    - WhiteNoise: `CompressedManifestStaticFilesStorage`.
* **`monvex/urls.py`**
  - **Responsibility:** Root URL routing table mapping all application routes.
* **`monvex/views.py`**
  - **Responsibility:** Health check probes (`health_check`, `readiness_check`) and custom 400/403/404/500 JSON handlers.

### 3.2 Authentication Application (`backend/apps/authentication`)
* **`apps/authentication/models.py`**
  - **Models:** `Profile`, `GoogleIdentity`, `EmailDispatch`.
* **`apps/authentication/views.py`**
  - **Views:** `RegisterView`, `CustomLoginView`, `LogoutView`, `CookieTokenRefreshView`, `ProfileView`, `GoogleLoginView`, `MFASetupView`, `MFAVerifyView`.
* **`apps/authentication/serializers.py`**
  - **Serializers:** `UserRegisterSerializer`, `ProfileSerializer`, `MFASetupSerializer`.

### 3.3 Transactions & Portfolio (`backend/apps/transactions`)
* **`apps/transactions/models.py`**
  - **Models:** `Transaction`, `Category`, `Merchant`, `RecurringPayment`, `Asset`, `Liability`, `Receipt`, `Notification`.
* **`apps/transactions/views.py` & `views_extra.py`**
  - **Views:** `TransactionListCreateView`, `TransactionDetailView`, `TransactionExportCSVView`, `NaturalLanguageParseView`, `AssetListCreateView`, `LiabilityListCreateView`, `NetWorthOverviewView`, `DebtPlannerOverviewView`, `ReceiptUploadView`, `ReceiptConfirmView`.

### 3.4 Budgets & Goals (`backend/apps/budgets` & `apps/goals`)
* **`apps/budgets/models.py` & `views.py`**
  - **Models:** `Budget`, `BudgetHistory`.
  - **Views:** `BudgetListCreateView`, `BudgetOverviewView`.
* **`apps/goals/models.py` & `views.py`**
  - **Models:** `SavingsGoal`, `GoalContribution`.
  - **Views:** `SavingsGoalListCreateView`, `ContributeGoalView`.

### 3.5 Analytics & Health Scoring (`backend/apps/analytics`)
* **`apps/analytics/views.py`**
  - **Views:** `DashboardMetricsView`, `FinancialHealthScoreView`, `CashflowForecastView`, `AnomalyListView`.

### 3.6 AI Copilot Subsystem (`backend/apps/ai_copilot`)
* **`apps/ai_copilot/models.py`**
  - **Models:** `ConversationSession`, `ConversationMessage`, `AIInteraction`, `AIInsight`, `AnomalyEvent`.
* **`apps/ai_copilot/views.py`**
  - **Views:** `AIChatView`, `ConversationSessionListView`, `AIWhatIfSimulationView`.

### 3.7 Machine Learning Engine (`backend/ml`)
* **`ml/categorizer.py`**
  - **Responsibility:** Implements `FinancialCategorizer` singleton with TF-IDF vectorizer and Multinomial Naive Bayes classification.
* **`ml/training_data.py`**
  - **Responsibility:** Seed training corpus containing categorized financial transaction descriptions.

### 3.8 Domain Services Layer (`backend/services`)
* **`services/finance_service.py`** (19.5 KB): Aggregates dashboard totals, calculates 4-pillar financial health score, and categorizes historical expenses.
* **`services/ai_copilot_service.py`** (32.9 KB): Orchestrates multi-turn Gemini 2.0 reasoning, intent routing, and prompt construction.
* **`services/forecast_service.py`** (3.6 KB): Performs linear cashflow velocity projections.
* **`services/debt_service.py`** (5.2 KB): Computes debt avalanche and debt snowball payoff schedules.
* **`services/ocr_service.py`** (11.3 KB): Interacts with Gemini Vision for receipt extraction.
* **`services/file_validation_service.py`** (5.9 KB): Binary magic-byte inspection and MIME sanitization.
* **`services/pdf_report_service.py`** (18.3 KB): ReportLab PDF generation engine.
* **`services/nlp_parser.py`** (13.8 KB): Regex and rule-based entity parser for natural language transactions.
* **`services/search_service.py`** (11.9 KB): Cross-domain universal search indexer.

---

## 4. Native Desktop Subsystem (`/desktop/src-tauri`)

* **`desktop/src-tauri/tauri.conf.json`**
  - **Responsibility:** Tauri v1 application manifest, window size (`1280x800`), system tray icons, and WebView2 settings.
* **`desktop/src-tauri/Cargo.toml`**
  - **Responsibility:** Rust package definitions (`tauri = "1.6"`, `serde`, `serde_json`).
* **`desktop/src-tauri/src/main.rs`**
  - **Responsibility:** Rust entry point initializing Tauri application runtime and native handlers.
