# MONVEX 2.0 — Comprehensive Forensic Functionality Audit

> **Date:** August 2026  
> **Auditor:** Senior Full-Stack Engineer, Database Architect & Application Security Engineer  
> **Scope:** Full-Repository Audit of All Frontend Routes, Backend Apps, API Contracts, and Persistence Layers

---

## 1. Executive Summary

MONVEX has been audited across every layer: Frontend Routes (`/dashboard`, `/transactions`, `/budgets`, `/goals`, `/analytics`, `/simulator`, `/ai`, `/settings`, `/reports`, `/receipts`, `/debt`, `/net-worth`, `/subscriptions`, `/notifications`, `/security`, `/login`, `/register`), Backend Django Services, Database Models, and API Contracts.

The objective of this audit is to systematically document every mock/static/placeholder element in the application and define the exact production logic, backend integration, and multi-tenant isolation required for 100% production readiness.

---

## 2. Page-by-Page Forensic Audit

### 2.1 Dashboard (`/dashboard`)
- **Current State:** Renders balances, spending chart, recent transactions, what-needs-attention card, budget progress, and goal progress.
- **Audit Findings:**
  - `trajectoryChartData` contained synthetic numeric fallbacks (`baseExpense = totalExpense > 0 ? totalExpense : 20900; baseIncome = totalIncome > 0 ? totalIncome : 75000`) when a new user had zero data.
  - "What needs your attention" insight card contained a hardcoded `₹1,240 / month` placeholder when no dynamic insight was returned.
- **Production Requirement:**
  - Real calculations based strictly on authenticated user's ledger. When data is empty, display clean 0.00 / real zero state without fake projections.
  - Dynamic insight computation derived from top budget utilization or cash flow velocity.

### 2.2 Transactions (`/transactions`)
- **Current State:** Real-time ledger view, search & filtering by type/category/date, delete transaction, and CSV export.
- **Audit Findings:**
  - UPDATE (Edit) transaction capability was missing from UI table.
  - CSV Export attempted to read `access_token` instead of `monvex_access_token`.
- **Production Requirement:**
  - Full CRUD: Add, Edit (prefilled modal, Save, Cancel), Delete (with confirmation), and Search/Filter.
  - Export CSV authenticated with `monvex_access_token` and protected against CSV formula injection.

### 2.3 Category Budgets (`/budgets`)
- **Current State:** Fetches budgets from `/api/v1/budgets/overview/`, allows creating and deleting budgets, renders progress bars against actual category expenditures.
- **Audit Findings:**
  - In-line budget target editing was not exposed in the action menu.
- **Production Requirement:**
  - Full CRUD: Add Budget, Edit Target Limit, Delete Budget.
  - Deterministic calculations: `spent_amount`, `remaining_amount`, `utilization_pct` computed on backend based on current month's transactions.

### 2.4 Savings Goals (`/goals`)
- **Current State:** Fetches goals from `/api/v1/goals/`, allows creating goals, contributing funds via `/goals/<id>/contribute/`, deleting goals, and tracking deadline velocities.
- **Audit Findings:**
  - Fully wired to backend `Goal` and `GoalContribution` database records.
- **Production Requirement:**
  - Maintain real-time balance accumulation, monthly required contribution calculations, and multi-tenant isolation.

### 2.5 Analytics & Trends (`/analytics`)
- **Current State:** Renders cash flow trajectory, category donut charts, financial health score, and anomaly breakdown.
- **Audit Findings:**
  - Contained fallback numbers (`75000`, `20900`, and static pie slices) when summary is empty.
- **Production Requirement:**
  - Display actual calculated data from `/api/v1/analytics/dashboard/` and `/api/v1/analytics/health-score/`.
  - When ledger is empty, display genuine 0 balance and empty state prompts.

### 2.6 Wallet & Accounts Command Center (`WalletAccountsSection.tsx`)
- **Current State:** Card carousel with balance displays, freeze toggle, and transfer modal.
- **Audit Findings:**
  - Default accounts were hardcoded (`acc_hdfc`, `acc_sbi`, `acc_metal_card`) and saved to `localStorage` rather than database `Asset` records.
- **Production Requirement:**
  - Wire directly to `api.getAssets()` and `api.createAsset()` to reflect the user's real balance sheet stored in the database.

### 2.7 AI Copilot & Natural Language (`/ai`)
- **Current State:** Chat interface, voice input, markdown formatting, text-to-speech, and simulated streaming.
- **Audit Findings:**
  - Chat history sidebar contained a static list of prompt titles.
- **Production Requirement:**
  - Connect history sidebar to `api.getAIHistory()` calling `/api/v1/ai/history/` to reflect real user conversation history stored in `AIInteraction` model.

### 2.8 What-If Simulator (`/simulator`)
- **Current State:** Multi-lever simulator for income deltas, category spending reductions, and debt paydown.
- **Audit Findings:**
  - Fully connected to backend `SimulatorService` at `/api/v1/ai/simulator/`.
- **Production Requirement:**
  - Deterministic calculations with zero hallucination. Ensure formulas compute true compounded growth based on user's actual baseline.

### 2.9 User Settings & Portfolio Export (`/settings`)
- **Current State:** Profile management, connected auth methods, security settings, preferences, and data export.
- **Audit Findings:**
  - Export data only exported transactions instead of the complete user portfolio (transactions, budgets, goals, assets, liabilities, profile).
  - CSV download used `access_token` key instead of `monvex_access_token`.
- **Production Requirement:**
  - Comprehensive JSON export bundling all user-scoped data.
  - Direct database profile synchronization via `api.updateProfile()`.

### 2.10 Net Worth, Debt, Subscriptions, Receipts, Security, Reports
- **Audit Findings:**
  - All 6 modules are wired to backend services (`NetWorthService`, `DebtService`, `ReceiptService`, `WhyExplainerService`, `SecurityAuditLog`).
  - Strict multi-tenant isolation enforced in all database querysets (`user=request.user`).

---

## 3. Multi-Tenant User Isolation Audit

| Entity | Isolation Check | Queryset Filter | Verification Status |
| :--- | :--- | :--- | :--- |
| **Transaction** | Verified | `Transaction.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Budget** | Verified | `Budget.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Goal** | Verified | `Goal.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Asset** | Verified | `Asset.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Liability** | Verified | `Liability.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Recurring Payment** | Verified | `RecurringPayment.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Receipt** | Verified | `Receipt.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **AI Interaction** | Verified | `AIInteraction.objects.filter(user=request.user)` | PASS (Tested in test suite) |
| **Security Audit Log**| Verified | `SecurityAuditLog.objects.filter(user=request.user)`| PASS (Tested in test suite) |

---

## 4. Remediation Plan

1. **Eliminate All Synthetic Fallbacks:** Remove hardcoded numeric defaults in `/dashboard` and `/analytics`.
2. **Add Full Transaction Update (Edit):** Provide prefilled edit modal, backend `PATCH` integration, and table update handler.
3. **Add Budget Target Update:** Provide edit target modal in `/budgets`.
4. **Connect Wallet to Real Assets:** Replace `defaultAccounts` in `WalletAccountsSection` with live backend `Asset` records.
5. **Universalize Token Handling:** Standardize CSV/JSON exports to use `monvex_access_token`.
6. **Live AI Chat History:** Connect sidebar in `/ai` to `api.getAIHistory()`.
7. **Comprehensive Portfolio Export:** Update `handleExportData` in `/settings` to export the complete multi-entity data bundle.
