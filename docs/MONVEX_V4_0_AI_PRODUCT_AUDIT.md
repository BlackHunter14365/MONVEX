# MONVEX V4.0 — AI Product & Financial Intelligence Architecture Audit

============================================================
PHASE 0 — FORENSIC AUDIT & BASELINE ASSESSMENT
============================================================

Date: 2026-08-25
Release Target: MONVEX V4.0 (Financial Intelligence Platform & AI Workspace Redesign)
Author: MONVEX Autonomous Engineering Agent

---

## 1. Executive Summary & Objective

MONVEX V3.0 through V3.5 established a world-class, hardened engineering foundation:
- **V3.0**: Clean modular architecture (Next.js 14, React 18, Django 5.2, PostgreSQL, official Google GenAI SDK, TanStack Query v5, Zustand).
- **V3.1**: Dependency freshness, zero deprecated libraries, dead code elimination, security hardening.
- **V3.2**: Deterministic Decimal financial math, AI intent classification (16 intents), multi-tenant isolation, prompt injection defense.
- **V3.3**: Production observability, sliding-window telemetry, automated AI evaluation suite.
- **V3.4**: CI/CD release gates, financial integrity invariants (8 invariants), non-destructive smoke tests.
- **V3.5**: Measured ORM performance optimizations (-89.5% queries in comparative tools), centralized frontend motion system (`AnimatedValue`, `CardReveal`, `StaggerContainer`).

**The Objective of V4.0** is to transform MONVEX from a financial recording utility into an **Interactive Financial Intelligence Platform**.
Users will no longer simply receive text responses; inquiries will return **actionable financial intelligence**, combining:
1. Direct analytical text answers
2. Verified Financial KPI Cards
3. Dynamic Interactive Charts (Line, Bar, Area, Donut, Comparison)
4. Variance Drivers & Insights
5. Data-backed Recommendations
6. Contextual Follow-up Actions

---

## 2. Forensic Codebase Audit

### 2.1 Backend AI Layer (`backend/services/ai/` & `backend/apps/ai_copilot/`)
- **Orchestration**: `FinancialAgentOrchestrator` (`orchestrator.py`) handles prompt sanitization, intent classification across 16 financial intents, multi-turn session persistence (`ConversationSession`, `ConversationMessage`), and telemetry tracking.
- **Tools Suite**: `MONVEXTools` (`tools.py`) executes deterministic PostgreSQL queries with strict tenant isolation (`user=user`) using `Decimal` math. Tools include:
  - `get_transactions`, `get_transaction_summary`, `search_transactions`
  - `get_accounts`, `get_budgets`, `get_budget_status`
  - `get_goals`, `get_cashflow`, `get_spending_by_category`
  - `get_recurring_expenses`, `compare_periods`, `detect_anomalies`
  - `simulate_purchase`, `run_what_if_simulation`, `get_net_worth_overview`
  - `get_debt_overview`, `calculate_financial_health`
- **Gemini Client**: `GeminiClient` (`gemini_client.py`) uses official Google GenAI SDK (`google-genai`), system instructions with strict anti-hallucination rules, and deterministic tool dispatch fallback.
- **Identified Gap for V4.0**:
  - The backend returns `response` (text) and `data` (raw tool payload).
  - It lacks a standardized, typed **Structured Response Schema** (`metrics`, `charts`, `insights`, `recommendations`, `actions`, `warnings`) that cleanly instructs the frontend on how to render rich visual cards and charts.

### 2.2 Frontend Web / Desktop AI Layer (`web/src/app/ai/` & `web/src/components/ai/`)
- **Routing & Workspace Switcher**: `web/src/app/ai/page.tsx` splits rendering based on viewport:
  - `>= 1024px`: Renders `DesktopAIWorkspace.tsx`.
  - `< 1024px`: Renders dedicated `MobileAIWorkspace.tsx`.
- **Current Desktop AI Workspace (`DesktopAIWorkspace.tsx`)**:
  - Contains standard sidebar with chat history, model selector pill, empty state welcome screen with 4 starter cards, and a message stream.
  - **Identified Gaps for V4.0**:
    - AI responses are displayed primarily as markdown text strings inside chat bubbles.
    - Charts are not rendered dynamically inside AI message bubbles.
    - Financial KPI cards are not rendered natively inside responses.
    - Follow-up action chips are static instead of dynamically suggested based on the inquiry.
    - Header lacks model status indicator and quick workspace actions.
    - Message layout is styled like a standard general chatbot rather than a specialized financial intelligence console.

### 2.3 Frontend Mobile AI Layer (`MobileAIWorkspace.tsx`)
- Dedicated full-screen mobile experience with bottom sheet history drawer, quick prompt pills, compact message cards, and voice dictation.
- **V4.0 Mandate**: Preserve this dedicated mobile experience without regressions. Desktop redesign must NOT be forced into `< 1024px`.

### 2.4 Motion & Chart Infrastructure
- **Motion System** (`@/lib/motion.ts`, `@/components/motion/`): `AnimatedValue`, `CardReveal`, `StaggerContainer`, `PageTransition`, `MOTION_DURATIONS`, `MOTION_EASINGS`.
- **Chart Infrastructure**: `recharts` (^2.12.7) is already installed and proven in dashboard and analytics pages.
- **V4.0 Requirement**: Build a clean, typed chart abstraction (`DynamicAIChart`, `FinancialLineChart`, `FinancialBarChart`, `FinancialAreaChart`, `FinancialDonutChart`, `FinancialComparisonChart`) so the AI workspace can render high-precision charts safely from backend datasets.

---

## 3. V4.0 Target Architecture & Response Schema

```
                           ┌───────────────────────────┐
                           │      USER INQUIRY         │
                           │   (Desktop / Windows)     │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │   Financial Orchestrator  │
                           │     Intent & Routing      │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │  Deterministic Tools (DB) │
                           │   Verified Financial Data │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │   Structured V4 Builder   │
                           │  Text + Cards + Charts    │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
          ┌─────────────────────────────────────────────────────────────┐
          │                    V4 RICH AI RESPONSE                       │
          │                                                             │
          │  1. Analytical Answer (Markdown Text)                      │
          │  2. Financial KPI Metric Cards (<AnimatedValue />)          │
          │  3. Dynamic Visual Chart (Line / Bar / Area / Donut)        │
          │  4. Key Variance Drivers & Insights                         │
          │  5. Actionable Data-Backed Recommendations                  │
          │  6. Contextual Follow-up Action Chips                       │
          └─────────────────────────────────────────────────────────────┘
```

---

## 4. Phase-by-Phase V4.0 Implementation Plan

1. **Phase 1 — Structured AI Response Schema**:
   - Define TypeScript response interfaces in `web/src/types/ai.ts` (`AIResponse`, `AIMetricCard`, `AIChartConfig`, `AIInsightItem`, `AIRecommendationItem`, `AIActionChip`).
   - Implement backend response builder in `backend/services/ai/response_builder.py` to structure verified tool results into rich blocks.
2. **Phase 2 — Reusable AI Chart System (`web/src/components/ai/charts/`)**:
   - `FinancialLineChart.tsx`: Spending & income trends, net worth history, debt reduction.
   - `FinancialBarChart.tsx`: Category spending, budget vs actual, period comparison drivers.
   - `FinancialAreaChart.tsx`: Cashflow trajectory, balance forecast with confidence bands.
   - `FinancialDonutChart.tsx`: Expense category distribution, asset allocation.
   - `FinancialComparisonChart.tsx`: Period-over-period variance waterfall.
   - `DynamicAIChart.tsx`: Type-safe dispatcher with responsive layout, tooltips, and accessibility labels.
3. **Phase 3 — Rich AI Message Blocks (`web/src/components/ai/blocks/`)**:
   - `AIMetricCardBlock.tsx`: Compact KPI cards with `AnimatedValue` and delta badges.
   - `AIInsightBlock.tsx`: Highlighted drivers and observations.
   - `AIRecommendationBlock.tsx`: Actionable recommendations with step-by-step guidance.
   - `AIActionChipsBlock.tsx`: Context-aware follow-up suggestion chips.
   - `AIToolExecutionBlock.tsx`: Compact, transparent execution status without leaking internal tokens.
4. **Phase 4 — Redesigned Desktop AI Workspace (`DesktopAIWorkspace.tsx`)**:
   - Professional Financial Intelligence Console header (`MONVEX AI`, model status, new chat, quick actions).
   - Polished sidebar history with search filter, date grouping (Today, Yesterday, Previous 7 Days), rename, delete, pin.
   - Elevated canvas layout with rich multi-block response rendering.
   - Advanced Composer with auto-expanding textarea, voice recognition, attachment triggers, send/stop button, keyboard shortcuts.
5. **Phase 5 — Mobile AI Preservation**:
   - Verify `MobileAIWorkspace.tsx` compatibility with structured payloads, maintaining mobile-native interactions.
6. **Phase 6 — Evaluation & Quality Gates**:
   - Expand AI benchmark in `apps/ai_copilot/test_evaluation.py` to validate structured outputs across all 16 scenarios.
   - Run full verification (Django 66/66, AI eval, Security gate 6/6, TypeScript 0 errors, Next.js build 24/24 static pages, Flutter analyze 0 issues).
7. **Phase 7 — Comprehensive Documentation & Release Manifest**:
   - Create V4.0 documentation suite in `docs/`.
   - Update `release_manifest.json` and generate git commits.

---

## 5. Security, Accessibility & Reliability Invariants

1. **Deterministic Financial Math**: All numbers originate from backend PostgreSQL queries using Python `Decimal`. LLM never calculates authoritative numbers.
2. **Strict Tenant Isolation**: Every tool call enforces `user=request.user`.
3. **Safe Chart Rendering**: Charts only accept validated numeric data payloads; arbitrary HTML or scripts are strictly disallowed.
4. **Accessibility Compliance**: Respects `prefers-reduced-motion: reduce`; includes semantic headings, focus states, and text alternatives for all visual graphs.
5. **Zero Localhost Leaks**: Tauri production WebView URL remains `https://monvex-web.onrender.com`.
