# MONVEX Phase 5: Cross-Platform Integration & QA Test Matrix

## 1. Test Architecture & Methodology

All tests in this suite validate that **Web**, **Windows Desktop**, and **Android Mobile** are three presentation viewports of **ONE underlying MONVEX system**.

```
                       ┌────────────────────────┐
                       │    DJANGO REST API     │
                       │     (/api/v1/...)      │
                       └───────────┬────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
    [ WEB APP ]              [ WINDOWS APP ]           [ ANDROID APP ]
   Next.js 15.x               Tauri 1.5/Rust          Flutter 3.x/Dart
```

---

## 2. Cross-Platform Execution Results

### 2.1 Authentication & Session Management

| Test Case | Description | Web Result | Windows Result | Android Result | Verdict |
|---|---|---|---|---|---|
| **AUTH-01** | Password Registration & 6-Digit OTP | Verified | Verified | Verified | **PASS** |
| **AUTH-02** | Password Login & JWT Issuance | Verified | Verified | Verified | **PASS** |
| **AUTH-03** | Google OAuth Identity Federation | Verified | Verified | Verified | **PASS** |
| **AUTH-04** | Synchronous Session Logout & Token Purge | Verified | Verified | Verified | **PASS** |
| **AUTH-05** | Token Expiration & 401 Interception | Auto-Redirect | Auto-Redirect | Auto-Redirect | **PASS** |
| **AUTH-06** | Invalid Credentials Rejection | `400 Bad Request` | `400 Bad Request` | `400 Bad Request` | **PASS** |

### 2.2 User Data Isolation & Multi-Tenancy (Server-Side)

| Test Case | Scenario | Expected Behavior | Observed Result | Verdict |
|---|---|---|---|---|
| **TENANT-01** | User A queries User B's Account ID | `404 Not Found` / `403 Forbidden` | Strict Queryset Bound (`filter(user=request.user)`) | **PASS** |
| **TENANT-02** | User A attempts deleting User B's Transaction | `404 Not Found` | Server-Side Verification Blocks Request | **PASS** |
| **TENANT-03** | User A modifies URL to view User B's Budget | Access Denied | `404 Not Found` returned by DRF | **PASS** |
| **TENANT-04** | User A invokes AI Copilot with prompt injection to read all users | Refusal / Guardrail Alert | Intercepted by Prompt Sanitizer | **PASS** |

### 2.3 Cross-Platform Live Synchronization

| Flow | Action Initiator | Action Target | Verification Target | Observed State | Verdict |
|---|---|---|---|---|---|
| **SYNC-01** | Web Client creates new Checking Account (`₹50,000`) | Android Mobile | Accounts Screen | Balance ₹50,000 matches instantly | **PASS** |
| **SYNC-02** | Android Mobile adds Quick Expense (`-₹3,500` Dining) | Windows Desktop | Transaction Ledger | Ledger and Net Balance decrement by ₹3,500 | **PASS** |
| **SYNC-03** | Windows Desktop sets Monthly Budget (`₹10,000`) | Web & Android | Budget Screens | 35% utilization shown across all clients | **PASS** |
| **SYNC-04** | Web Client creates Savings Goal (`₹1,00,000`) | Android Mobile | Goals Screen | Milestone displays with exact remaining horizon | **PASS** |
| **SYNC-05** | Android AI Copilot queries `"How much did I spend on dining?"` | Central Server | AI Engine | Answers `₹3,500` grounded in real database records | **PASS** |

### 2.4 Financial Determinism & Precision

| Computation Vector | Mathematical Formula | Backend Service | Client Presentation | Verdict |
|---|---|---|---|---|
| **Net Cash Flow** | $\sum \text{Income} - \sum \text{Expense}$ | `FinanceService.py` | Identical across Web, Windows, Android | **PASS** |
| **10-Vector Health Score** | Multi-Factor Algorithmic Matrix (0–100) | `FinancialHealthEngine.py` | Radial Gauge & Grades identical on all clients | **PASS** |
| **Budget Velocity** | $(\text{Spent} / \text{Limit}) \times 100$ | `BudgetService.py` | `HEALTHY` / `WARNING` / `EXCEEDED` parity | **PASS** |
| **What-If Simulation** | Compound Growth $(P \times (1 + r)^t)$ | `SimulatorService.py` | Identical projection outputs | **PASS** |

---

## 3. Resilience & Security Test Summary

- **Duplicate Submissions**: Debounced UI submit buttons and unique client request states prevent double charging or duplicate entries (**PASS**).
- **Network Interruption**: Disconnecting WiFi during transaction creation gracefully fails without corrupting database state or displaying false success (**PASS**).
- **Universal Search**: Ctrl+K on Web/Windows and the Android Search modal hit `/api/v1/search/` and return identical ranked entity matches (**PASS**).
