# MONVEX Android Architecture Specification

============================================================
PLATFORM: ANDROID (FLUTTER)
ARCHITECTURE: CLEAN PROVIDER PATTERN + UNIFIED REST CLIENT
PROJECT: MONVEX V2
============================================================

## 1. Architectural Principles

1. **Shared Centralized Backend**: The Flutter Android app communicates strictly with the canonical MONVEX Django REST API (`http://10.0.2.2:8000/api/v1` in emulator, or LAN/production base URL). No independent databases, no duplicate calculation engines, and no client-side financial calculations.
2. **Unified User Identity**: Accounts created on Web or Windows log into Android seamlessly using JWT access & refresh tokens stored in Android Keystore via `flutter_secure_storage`.
3. **Reactive Provider Pattern**: Single state management framework (`package:provider`) managing discrete domains (`AuthProvider`, `DashboardProvider`, `TransactionProvider`, `AccountProvider`, `BudgetProvider`, `GoalProvider`, `CopilotProvider`, `SearchProvider`).
4. **Mobile-First Touch Ergonomics**: Native bottom navigation, bottom sheets for transaction creation and search, swipe-to-dismiss actions, pull-to-refresh, and zero layout overflow on small to large smartphone displays.

---

## 2. Directory & Module Architecture

```
mobile/
├── android/                         # Android native wrapper & Gradle build
│   ├── app/
│   │   ├── build.gradle             # Application ID, SDK versions (minSdk 21, targetSdk 34)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml  # Internet permissions & launcher config
│   │       └── res/                 # App launcher icons & splash
│   └── build.gradle
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── env_config.dart      # Dynamic host resolution (Emulator, LAN, Prod)
│   │   ├── constants/
│   │   │   └── colors.dart          # Semantic financial & brand color palette
│   │   ├── networking/
│   │   │   ├── api_client.dart      # HTTP client, bearer token interceptor, error parsing
│   │   │   └── api_endpoints.dart   # Frozen Phase 2 API paths
│   │   ├── storage/
│   │   │   └── secure_storage.dart  # Keystore-backed token management
│   │   ├── theme/
│   │   │   └── monvex_theme.dart    # Dark editorial typography & card aesthetics
│   │   └── utils/
│   │       └── formatters.dart      # Currency (₹ INR), compact numbers, date parsing
│   │
│   ├── models/
│   │   ├── user_profile.dart        # User profile & authentication data
│   │   ├── transaction.dart         # Ledger transaction schema
│   │   ├── account.dart             # Financial account & balance
│   │   ├── budget.dart              # Budget category & velocity
│   │   ├── goal.dart                # Savings milestone & forecast
│   │   ├── health_score.dart        # 10-vector health score & grade
│   │   ├── ai_message.dart          # Multi-turn Copilot message & tools
│   │   └── search_result.dart       # Universal search hit
│   │
│   ├── providers/
│   │   ├── auth_provider.dart       # Login, register, OTP, Google auth, logout
│   │   ├── dashboard_provider.dart  # Telemetry, cash flow, net worth, velocity
│   │   ├── transaction_provider.dart# Ledger state, pagination, filtering, quick add
│   │   ├── account_provider.dart    # Account list, balances, types
│   │   ├── budget_provider.dart     # Spending limits, alerts, projected velocity
│   │   ├── goal_provider.dart       # Target tracking, contribution pacing
│   │   ├── copilot_provider.dart    # Conversational AI state, tool execution
│   │   └── search_provider.dart     # Universal search query & results
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login_screen.dart    # Password & Google login
│   │   │   └── register_screen.dart # Sign up & 6-digit OTP verification
│   │   ├── dashboard/
│   │   │   └── dashboard_screen.dart# Command center, health score, quick actions
│   │   ├── transactions/
│   │   │   ├── transactions_screen.dart # Ledger list, filters, search
│   │   │   └── add_transaction_sheet.dart# Bottom sheet quick-add composer
│   │   ├── accounts/
│   │   │   └── accounts_screen.dart # Bank, card, wallet & investment accounts
│   │   ├── budgets/
│   │   │   └── budgets_screen.dart  # Category spend cards & velocity warnings
│   │   ├── goals/
│   │   │   └── goals_screen.dart    # Milestones & horizon forecasts
│   │   ├── analytics/
│   │   │   └── analytics_screen.dart# Mobile cash flow & spending trajectory charts
│   │   ├── copilot/
│   │   │   └── copilot_screen.dart  # AI chat interface with grounding badges
│   │   ├── search/
│   │   │   └── search_sheet.dart    # Universal search bottom sheet / modal
│   │   └── settings/
│   │       └── settings_screen.dart # User profile, security status, logout
│   │
│   ├── shared/
│   │   └── widgets/
│   │       ├── monvex_card.dart     # Consistent editorial card container
│   │       ├── health_score_gauge.dart # Radial score gauge
│   │       ├── transaction_tile.dart# Clean category icon + amount row
│   │       └── empty_state_view.dart# Zero-state placeholder with action button
│   │
│   └── main.dart                    # App initialization, Provider tree, route guard
│
└── pubspec.yaml                     # Dependencies & asset declarations
```

---

## 3. Data Flow & Security

```
┌────────────────────────────────────────────────────────┐
│                   Flutter Android App                  │
│                                                        │
│  [UI Screens] ──> [Providers] ──> [ApiClient]          │
└──────────────────────────────────────────┬─────────────┘
                                           │ HTTPS / Bearer Token
                                           ▼
┌────────────────────────────────────────────────────────┐
│               MONVEX Django REST API                   │
│                                                        │
│  /api/v1/auth/me/                                      │
│  /api/v1/analytics/dashboard/                          │
│  /api/v1/transactions/                                 │
│  /api/v1/accounts/                                     │
│  /api/v1/budgets/                                      │
│  /api/v1/goals/                                        │
│  /api/v1/ai/chat/                                      │
│  /api/v1/search/                                       │
└──────────────────────────────────────────┬─────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────┐
│              Central Database & AI Engine              │
│                                                        │
│  - Financial Intelligence Engine                       │
│  - Gemini AI Orchestration Layer                       │
│  - User Isolated Database Records                      │
└────────────────────────────────────────────────────────┘
```
