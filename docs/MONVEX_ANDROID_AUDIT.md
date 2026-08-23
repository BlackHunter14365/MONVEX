# MONVEX Android Forensic Audit

============================================================
STATUS: PHASE 0 COMPLETE
PLATFORM: ANDROID / FLUTTER
PROJECT: MONVEX V2
============================================================

## 1. Executive Summary

This forensic audit evaluates the existing Flutter mobile codebase in `d:\MONVEX\mobile` against the locked MONVEX V2 Master Architecture contract. The mobile project is designed to deliver a genuine, native mobile-first experience using the shared Django REST API (`/api/v1`), SQLite/PostgreSQL database, unified JWT authentication, and the Financial Intelligence & AI Orchestration layer.

---

## 2. Current Project Inventory

### 2.1 File & Directory Breakdown
```
d:\MONVEX\mobile\
├── lib/
│   ├── core/
│   │   └── api_client.dart          (Basic HTTP client + secure storage)
│   ├── models/
│   │   └── transaction.dart         (Basic transaction data model)
│   ├── screens/
│   │   ├── dashboard_screen.dart    (Command telemetry + health score)
│   │   ├── budgets_screen.dart      (Budget list + status badges)
│   │   ├── goals_screen.dart        (Savings milestones + progress)
│   │   └── copilot_screen.dart      (AI Copilot chat interface)
│   └── main.dart                    (App entrypoint + BottomNavigationBar)
└── pubspec.yaml                     (Dart/Flutter package specifications)
```

### 2.2 Dependencies Audit (`pubspec.yaml`)
- **`sdk: '>=3.0.0 <4.0.0'`**
- **`http: ^1.2.1`**: Core HTTP networking.
- **`flutter_secure_storage: ^9.0.0`**: Android Keystore-backed JWT access/refresh token persistence.
- **`intl: ^0.19.0`**: Currency and date formatting.
- **`provider: ^6.1.2`**: Reactive state management across auth, accounts, transactions, and AI.
- **`fl_chart: ^0.68.0`**: High-performance mobile financial charting.
- **`lucide_icons: ^0.257.0`**: Consistent iconography matching Web and Windows.
- **`google_fonts: ^6.2.1`**: Inter / JetBrains Mono typography hierarchy.

---

## 3. Detailed Forensic Assessment

| Area | Current Status | Assessment & Gap Analysis |
| :--- | :---: | :--- |
| **Authentication & Session** | ⚠️ Partial / Demo | Uses hardcoded demo login (`alex_monvex`). Lacks Login, Register, OTP Verification, Google Sign-In, and auto-session validation against `/api/v1/auth/me/`. |
| **State Management** | ⚠️ Missing / Local State | Screens use standalone `setState()` with isolated API calls instead of centralized `AuthProvider`, `TransactionProvider`, `BudgetProvider`, and `CopilotProvider`. |
| **Networking & API Client** | ⚠️ Basic | Has basic GET/POST helper pointing to `http://10.0.2.2:8000/api/v1`. Needs unified interceptor for 401 token refresh/auto-logout, unified error formatting, and timeout management. |
| **Environment Configuration** | ⚠️ Hardcoded | Host hardcoded to `10.0.2.2:8000`. Needs configurable environment switching (Emulator `10.0.2.2`, LAN IP for physical device, and Production URL). |
| **Navigation & Back Stack** | ⚠️ Basic | Basic `IndexedStack` in `main.dart`. Needs bottom navigation with 5 primary tabs (`Command/Dashboard`, `Transactions`, `Accounts`, `AI Copilot`, `More`) plus modal sheets for Add Transaction & Search. |
| **Universal Search** | ❌ Missing | No mobile search bar or bottom sheet querying `/api/v1/search/`. |
| **Accounts Management** | ❌ Missing | No dedicated Accounts screen or provider. |
| **Transactions Ledger** | ⚠️ Dashboard-Only | Transactions exist only as a sub-list on Dashboard. Needs dedicated Transactions screen with pagination, filters, and Add Transaction bottom sheet. |
| **Financial Intelligence** | ⚠️ Basic | Health score displayed on dashboard. Needs Cash Flow, Net Worth breakdown, and velocity analytics. |
| **AI Copilot** | ⚠️ Basic | Chat UI exists with prompt chips and `/api/v1/ai/chat/` integration. Needs streaming/typing indicator and context preservation. |
| **Android Wrapper (`android/`)**| ❌ Needs Generation | Standard Gradle build files (`android/app/build.gradle`, `AndroidManifest.xml`, `settings.gradle`) need standard Flutter Android scaffolding. |

---

## 4. Architecture Plan & What Will Be Reused vs. Modified

### 4.1 Reused Components
- `mobile/pubspec.yaml` core dependencies (`http`, `flutter_secure_storage`, `provider`, `intl`, `fl_chart`, `lucide_icons`, `google_fonts`).
- Existing transaction data model patterns (`mobile/lib/models/transaction.dart`).
- Existing endpoint paths matching Phase 2 API Contract (`/auth/login/`, `/auth/register/`, `/analytics/dashboard/`, `/budgets/`, `/goals/`, `/ai/chat/`, `/search/`).

### 4.2 Enhanced & New Features
1. **Core & Network**:
   - `lib/core/config/env_config.dart` (Environment configuration for emulator, physical device, production).
   - `lib/core/networking/api_client.dart` (Robust API client with automatic bearer headers, 401 handling, timeout handling).
   - `lib/core/storage/secure_storage.dart` (Keystore-backed token storage).
   - `lib/core/theme/monvex_theme.dart` (Design system matching MONVEX dark editorial aesthetics).
2. **State Providers (`lib/providers/`)**:
   - `AuthProvider`: Login, registration, token refresh, logout, session restoration.
   - `DashboardProvider`: Live telemetry, health score, cash flow, net worth.
   - `TransactionProvider`: Transaction list, pagination, quick add, category filtering.
   - `AccountProvider`: Financial accounts list, balances, account types.
   - `BudgetProvider`: Spending limits, velocity, exceeded warnings.
   - `GoalProvider`: Target amounts, milestone forecasts.
   - `CopilotProvider`: Multi-turn AI conversations, financial tool tags.
   - `SearchProvider`: Universal instant search across all entities.
3. **Screens (`lib/screens/`)**:
   - `AuthScreen` / `LoginScreen` & `RegisterScreen` with OTP verification flow.
   - `DashboardScreen`: Complete mobile command center.
   - `TransactionsScreen`: Search, filters, pagination, transaction details.
   - `AccountsScreen`: Bank, card, investment, cash accounts.
   - `BudgetsScreen`: Category cards, velocity indicators, projections.
   - `GoalsScreen`: Progress bars, completion horizon estimates.
   - `CopilotScreen`: Mobile-first conversational financial assistant.
   - `SearchScreen`: Universal Search modal.
   - `SettingsScreen`: Profile, security, clear cache, logout.
4. **Android Native Config (`android/`)**:
   - `AndroidManifest.xml` (Internet permissions, app label MONVEX).
   - `build.gradle` & `app/build.gradle` (SDK versions, applicationId `com.monvex.app`).
