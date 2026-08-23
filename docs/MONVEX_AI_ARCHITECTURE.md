# MONVEX 2.0 AI Architecture & Copilot Engine

## 1. The Core AI Rule
> **"Financial Engine calculates numbers, Gemini explains numbers."**

Gemini is strictly prevented from performing accounting calculations or inventing data. Instead, MONVEX provides a rich **Tool Execution Layer** where Gemini calls deterministic financial services and formats natural language insights.

---

## 2. AI Reasoning Pipeline

```
USER QUERY
  │
  ▼
INTENT ROUTER (Classifies Query Domain: Health, Buy Evaluation, What-If, Net Worth, Category Deep-Dive, Debt, Anomaly)
  │
  ▼
DETERMINISTIC TOOL EXECUTION (Python Financial Engines)
  ├── tool_get_spending_summary(user, days)
  ├── tool_get_budget_status(user)
  ├── tool_get_cashflow_forecast(user, days)
  ├── tool_evaluate_purchase(user, amount, category)
  ├── tool_get_net_worth(user)
  ├── tool_get_debt_plan(user)
  ├── tool_run_what_if_simulation(user, params)
  └── tool_explain_why_variance(user)
  │
  ▼
PROMPT CONTEXT INGESTION (System Guardrails + JSON Telemetry)
  │
  ▼
GEMINI / DETERMINISTIC LLM REASONING
  │
  ▼
STRUCTURED RESPONSE (Markdown with Data Badges, Levers, Next Actions)
```

---

## 3. Human-in-the-Loop Safeguards

1. **Receipt OCR Processing**:
   - `ReceiptService` extracts data into a `PENDING_REVIEW` state.
   - User reviews and confirms the itemized breakdown in the UI.
   - Transaction is only inserted into the financial ledger upon explicit confirmation.

2. **Voice Natural Language Parsing**:
   - `parseNaturalTransaction` extracts merchant, amount, category, and date.
   - Returns parsed object for modal preview before the transaction is saved.
