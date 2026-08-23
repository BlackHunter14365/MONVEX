# MONVEX Android Test Verification Matrix

============================================================
PLATFORM: ANDROID / FLUTTER
SUITE: UNIT, INTEGRATION, SECURITY & CROSS-PLATFORM
PROJECT: MONVEX V2
============================================================

## 1. Authentication & Security Test Suite

| Test Case | Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :---: |
| **AUTH-01** | Standard User Password Login | Authenticates against `/api/v1/auth/login/`, stores tokens in Keystore, transitions to Dashboard. | Passed |
| **AUTH-02** | Invalid Password / User | Displays clean inline error without stack trace or crashing. | Passed |
| **AUTH-03** | User Registration & OTP | Initiates registration, prompts for 6-digit OTP, verifies and issues session. | Passed |
| **AUTH-04** | Google Sign-In | Verifies Google ID token against `/api/v1/auth/google/` and binds session. | Passed |
| **AUTH-05** | Secure Session Restoration | App startup checks Keystore token against `/api/v1/auth/me/`; auto-routes to Dashboard if valid. | Passed |
| **AUTH-06** | Explicit Logout | Clears Keystore tokens immediately and resets state to Login screen. | Passed |
| **AUTH-07** | 401 Session Expiry | When API returns 401 Unauthorized, automatically resets session to Login without breaking state. | Passed |

---

## 2. Core Feature & Telemetry Test Suite

| Module | Features Tested | Verification Result |
| :--- | :--- | :--- |
| **Dashboard** | Net worth, monthly cash flow, health score gauge, recent transactions, spending velocity. | Loads real-time telemetry from `/analytics/dashboard/`. |
| **Transactions** | Full ledger list, search query filter, type filter (ALL/EXPENSE/INCOME), pagination, delete. | Displays unified user transactions with accurate categorization. |
| **Quick Add Tx** | Bottom sheet with Amount, Category, Account, Date, Merchant, Description validation. | Posts to `/api/v1/transactions/` and refreshes dashboard & ledger immediately. |
| **Accounts** | Bank accounts, credit cards, investments, total liquid assets. | Fetches from `/api/v1/accounts/` with masked numbers. |
| **Budgets** | Category spending bars, % used badges, warning threshold alerts (`WARNING`, `EXCEEDED`). | Fetches from `/api/v1/budgets/` with live percentage calculation. |
| **Goals** | Target savings amount, current progress, estimated completion pacing. | Fetches from `/api/v1/goals/`. |
| **AI Copilot** | Multi-turn chat assistant, quick prompt suggestions, financial tool execution tags. | Connects to `/api/v1/ai/chat/` with real database context grounding. |
| **Universal Search**| Live search sheet querying transactions, accounts, budgets, goals, navigation. | Connects to `/api/v1/search/` with instant debounced results. |

---

## 3. Cross-Platform Synchronization Matrix

```
                      ┌────────────────────────┐
                      │    CENTRAL DATABASE    │
                      └───────────┬────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
    [ WEB APP ]             [ WINDOWS APP ]          [ ANDROID APP ]
   (Next.js 15)             (Tauri 1.5/Rust)        (Flutter 3.x/Dart)

[TEST A] Web creates transaction    ──> Android ledger shows transaction immediately.
[TEST B] Android adds account       ──> Web and Windows dashboards show account.
[TEST C] Windows updates budget     ──> Android budget screen shows updated limit & velocity.
[TEST D] Android creates goal       ──> Web goals page shows new milestone.
[TEST E] Android AI query           ──> Generates answer based on unified multi-platform ledger.
```
