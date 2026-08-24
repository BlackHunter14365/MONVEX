# MONVEX V3.2 — AI Copilot Forensic Audit & Execution Trace

> **Document Type:** AI Execution Pipeline Forensic Audit & Telemetry Baseline  
> **Target Release:** MONVEX Enterprise v3.2  
> **Audit Date:** August 25, 2026  
> **Status:** AUDITED & VALIDATED

---

## 1. Complete AI Pipeline Execution Trace

```
User Prompt (Web / Mobile / Desktop Composer)
    │
    ▼ [HTTPS POST /api/v1/ai/chat/]
Django REST View (`AIChatView`)
    │ (Validates JWT Authorization & ChatInputSerializer)
    ▼
User Resolution & Tenant Context (`request.user`)
    │
    ▼
AI Service Facade (`AICopilotService.ask_copilot`)
    │
    ▼
Financial Agent Orchestrator (`FinancialAgentOrchestrator.chat`)
    ├── 1. Adversarial Guardrail Regex Scan (10 Jailbreak / Injection Patterns)
    ├── 2. Multi-turn Session Retrieval (`ConversationSession.objects.filter(user=user)`)
    ├── 3. Context History Window (Recent 6 turns retrieved)
    ├── 4. Deterministic Intent Classifier
    └── 5. Gemini Reasoning & Function Dispatcher (`GeminiClient.generate_response`)
            │
            ├── [If Gemini API Configured]: Live Google GenAI Function Calling Loop (max 5 iterations)
            │       │
            │       ├── Model generates function calls (e.g., `get_transactions`, `get_budgets`)
            │       ├── Orchestrator executes typed tool via `MONVEXTools`
            │       │       └── Domain Services (`FinanceService`, `BudgetService`, `ForecastingEngine`, `AffordabilityEngine`)
            │       │               └── PostgreSQL ORM (`user=user` strictly isolated)
            │       ├── Tool responses returned to model as `types.Part.from_function_response`
            │       └── Model generates final analytical response
            │
            └── [If Offline / Fallback]: Deterministic Fallback Reasoner
                    ├── Intent-targeted deterministic tool execution
                    └── Structured Markdown response generation
    │
    ▼
Persistence & Telemetry Layer
    ├── Saves User Message (`ConversationMessage`)
    ├── Saves Assistant Message (`ConversationMessage` with tools_used, citations, data payload)
    └── Saves Legacy Interaction (`AIInteraction`)
    │
    ▼
JSON HTTP Response (200 OK)
    │
    ▼
Frontend Rendering (`web/src/app/ai/page.tsx`)
    └── Dynamic Markdown Parser, Tool Badge Drawer, and Thought Duration Telemetry
```

---

## 2. Representative AI Query Baseline Telemetry

Measured on PostgreSQL/Django test harness with full multi-tenant dataset:

| Prompt | Classified Intent | Tools Invoked | DB Queries | Avg Latency | Response Size | Status / Quality Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **"What is my current balance?"** | `ACCOUNT_QUERY` | `get_accounts` | 6 | 44.59ms | 194 chars | Exact verified balance from `Asset` model. |
| **"How much did I spend this month?"** | `TRANSACTION_QUERY` | `get_transaction_summary` | 9 | 31.43ms | 455 chars | Breakdown of top categories and net savings. |
| **"Why did my spending increase?"** | `TRANSACTION_QUERY` | `get_transaction_summary` | 9 | 29.60ms | 455 chars | **Suboptimal Tool**: Should invoke variance attribution engine. |
| **"Am I overspending on food?"** | `TRANSACTION_QUERY` | `get_transactions` | 8 | 28.95ms | 163 chars | **Suboptimal Tool**: Should invoke `get_budget_status` for Food. |
| **"How long until I reach my emergency fund?"** | `GOAL_QUERY` | `get_goals` | 6 | 31.76ms | 208 chars | Progress percentage and required monthly rate calculated. |
| **"What subscriptions should I review?"** | `GENERAL_FINANCIAL_INQUIRY` | `get_transaction_summary, get_cashflow` | 13 | 34.22ms | 434 chars | **Suboptimal Tool**: Should invoke `get_recurring_expenses`. |
| **"Analyze my recent financial activity."** | `GENERAL_FINANCIAL_INQUIRY` | `get_transaction_summary, get_cashflow` | 12 | 28.50ms | 434 chars | Comprehensive cashflow summary. |
| **"Give me a plan to save ₹10,000 this month."** | `GENERAL_FINANCIAL_INQUIRY` | `get_transaction_summary, get_cashflow` | 12 | 32.38ms | 434 chars | Discretionary expense optimization recommendations. |

---

## 3. Complete Tool Inventory & Forensic Audit

| Tool Name | Declared Purpose | Input Schema | Domain Service | DB Queries | Tenant Isolation | Audit Finding & Optimization Path |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`get_transactions`** | Filtered transaction list | `start_date`, `end_date`, `category`, `type`, `merchant`, `limit` | `Transaction` ORM | 2 (count + select) | ✅ Strict (`user=user`) | Returns slim transaction dictionaries (id, date, merchant, category, type, amount). |
| **`get_transaction_summary`**| Rolling cashflow & top categories | `period_days` (default 30) | `Transaction` ORM | 3 (income, expense, cat breakdown) | ✅ Strict (`user=user`) | Combines income/expense queries using single aggregation. |
| **`search_transactions`** | Keyword & amount search | `query`, `min_amount`, `max_amount` | `Transaction` ORM | 1 | ✅ Strict (`user=user`) | Indexed `icontains` lookup. |
| **`get_accounts`** | Liquid accounts & balances | None | `Asset` ORM | 2 | ✅ Strict (`user=user`) | Verified liquid balances. |
| **`get_budgets`** | All active category budgets | None | `BudgetService` | 2 | ✅ Strict (`user=user`) | Compares limit vs actual spend. |
| **`get_budget_status`** | Specific category budget check | `category_name` | `BudgetService` | 2 | ✅ Strict (`user=user`) | Immediate alert if limit exceeded. |
| **`get_goals`** | Active savings goals | None | `SavingsGoal` ORM | 1 | ✅ Strict (`user=user`) | Fixed `deadline` attribute lookup. |
| **`get_cashflow`** | Daily burn rate & runway | `period_days` | `FinanceService` | 3 | ✅ Strict (`user=user`) | Computes runway days and net burn. |
| **`get_spending_by_category`**| Category breakdown | `period_days` | `Transaction` ORM | 2 | ✅ Strict (`user=user`) | Sorted by spend magnitude. |
| **`get_recurring_expenses`** | Subscriptions & commitments | None | `RecurringPayment` ORM | 1 | ✅ Strict (`user=user`) | Monthly burn and annual projection. |
| **`calculate_financial_health`**| 7-factor health score (0-100)| None | `FinancialHealthEngine` | 5 | ✅ Strict (`user=user`) | Deterministic multi-factor calculation. |
| **`forecast_cashflow`** | 3-month forecast | `months_ahead` | `ForecastingEngine` | 3 | ✅ Strict (`user=user`) | Linear run-rate projection with confidence bounds. |
| **`simulate_purchase`** | Affordability evaluation | `item_name`, `price` | `AffordabilityEngine` | 4 | ✅ Strict (`user=user`) | Multi-tier buffer check. |
| **`simulate_spending_reduction`**| What-if & SIP compounder | `category_name`, `reduction_pct`, `months` | `FinanceService` | 2 | ✅ Strict (`user=user`) | Computes 12% CAGR wealth gain. |
| **`compare_periods`** | Spending variance & delta | `period1_days`, `period2_days` | `Transaction` ORM | 4 | ✅ Strict (`user=user`) | Calculates category delta and % shift. |
| **`detect_anomalies`** | Z-score outlier detection | `lookback_days` | `AnomalyService` | 2 | ✅ Strict (`user=user`) | Flags outlays > mean + 1.8σ. |

---

## 4. Key Optimization Opportunities

1. **Intent Classification Precision:**
   - Add intent rules for `SUBSCRIPTION_QUERY` (matching `'subscription'`, `'recurring'`, `'netflix'`, `'spotify'`) to directly route to `get_recurring_expenses`.
   - Add intent rules for `WHY_VARIANCE` (matching `'why'`, `'increase'`, `'variance'`, `'higher than'`) to route to `compare_periods`.
   - Add intent rules for `SPECIFIC_BUDGET` (matching `'overspending on'`, `'food budget'`, `'shopping budget'`) to route to `get_budget_status`.
2. **Database Query Consolidation:**
   - In `FinancialAgentOrchestrator.chat`, avoid duplicate session lookups and redundant legacy `AIInteraction` creation.
   - Aggregate income, expense, and transaction count in a single `aggregate()` query inside `MONVEXTools.get_transaction_summary` and `get_cashflow`.
3. **Context Truncation:**
   - Limit tool output payloads to top 5 categories and top 5 transactions unless the prompt explicitly requests all records.
