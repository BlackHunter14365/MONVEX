# MONVEX Frontend Architecture & Technical Specification

**Framework**: Next.js 14 (App Router) + React 18 + TypeScript  
**Backend**: Django REST Framework + SimpleJWT  
**State Architecture**: Context API + Local Storage Session Token Management + Direct API Client  
**Version**: 2.0

---

## 1. Route Map & Page Roles

| Route | Page Role & Style Personality | Key Entities & Data Dependencies |
| :--- | :--- | :--- |
| `/` | **Landing Page** (Editorial + Motion-first) | Public product philosophy, architecture showcase, feature overview |
| `/login` | **Authentication - Sign In** (Minimal Editorial Fintech) | `POST /api/v1/auth/login/` (JWT issuance) |
| `/register` | **Authentication - Sign Up** (Minimal Editorial Fintech) | `POST /api/v1/auth/register/` (User creation + Auto login) |
| `/dashboard` | **Command Center** (Editorial + Swiss Grid + Data Viz) | `getDashboardMetrics()`, `getTransactions()`, `getBudgets()`, `getGoals()` |
| `/transactions` | **Ledger Terminal** (Dense Fintech Terminal) | `getTransactions()`, `createTransaction()`, `deleteTransaction()` |
| `/budgets` | **Spending Velocity** (Data Visualization + Editorial) | `getBudgets()` (`/budgets/overview/`), `createBudget()`, `deleteBudget()` |
| `/goals` | **Milestones & Trajectory** (Aspirational Editorial + Data Viz)| `getGoals()`, `createGoal()`, `updateGoal()`, `contributeToGoal()` |
| `/analytics` | **Analytics Workspace** (Data Visualization First + Swiss Grid)| `getAnalyticsSummary()`, `getSpendingByCategory()`, `getMonthlyTrend()` |
| `/ai` | **AI Intelligence Workspace** (Dark Luxury + Selective Glass) | `askAICopilot()` (`POST /api/v1/ai/chat/`) |
| `/settings` | **Account & Preferences** (Minimal Swiss Functional) | `getCurrentUser()`, `updateProfile()`, Data export |

---

## 2. Shared Layout Architecture: `<AppShell>`

All authenticated routes are wrapped with a single unified `<AppShell>` component:
- **Desktop Sidebar**: High-density left navigation with quick-action transaction button and user profile summary.
- **Topbar**: Active page breadcrumbs, real-time sync status, quick modal triggers, and user badge.
- **Mobile Bottom Navigation**: Compact 5-tab bar with thumb-friendly quick transaction action.
- **Floating AI Copilot**: Global bottom-right decision support drawer accessible from any page.
- **Global Modals**: Transaction fast-entry modal (`<AddTransactionModal />`) triggered globally via hotkey (`Cmd/Ctrl+K` or button).

---

## 3. Strict Multi-Tenant User Isolation & State Management

1. **Authentication State**:
   - Stored in `AuthContext.tsx`.
   - Access and refresh tokens stored securely in `localStorage`.
   - Automatic JWT token refresh handled in `api.ts`.
2. **Cache & Session Cleansing**:
   - `logout()` explicitly flushes `localStorage`, `sessionStorage`, and dispatches `monvex:auth-logout` to purge memory caches.
   - Newly signed-up users start with ₹0 net balance and clean empty states (no cross-user contamination).
3. **Event-Driven UI Refresh**:
   - Window event `monvex:transaction-added` triggers reactive refreshes across the active view without full page reloads.

---

## 4. Component Hierarchy

```text
web/src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/login, register
│   ├── dashboard, transactions, budgets, goals, analytics, ai, settings
├── components/
│   ├── ui/               # Core atomic primitives (Button, Badge, Modal, Skeleton, EmptyState, Input)
│   ├── layout/           # AppShell, Sidebar, Topbar, MobileNav, PageHeader
│   ├── finance/          # AddTransactionModal, TransactionTable, BudgetCard, GoalCard
│   ├── ai/               # FloatingAICopilot, AIInsightCard, MessageBubble
│   └── charts/           # TrajectoryAreaChart, CategoryBarChart, CashFlowHorizon
├── context/              # AuthContext, ToastContext
├── lib/                  # api.ts (HTTP client), utils.ts (formatters, cn)
└── styles/               # globals.css, tokens.css
```
