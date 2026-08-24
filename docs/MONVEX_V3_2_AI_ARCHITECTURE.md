# MONVEX V3.2 — AI Copilot Architecture Specification

> **Document Type:** AI Technical Specification & Architectural Blueprint  
> **Release Target:** MONVEX v3.2  
> **Date:** August 25, 2026

---

## 1. System Topology

MONVEX AI Intelligence consists of four core micro-layers:

1. **Frontend AI Workspace (`web/src/app/ai/page.tsx`, `DesktopAIWorkspace.tsx`, `MobileAIWorkspace.tsx`):**
   - Multi-session chat drawer with history pinning and deletion.
   - Live tool execution badge drawer rendering real-time thought duration and data attachments.
   - Quick action prompt presets and speech-to-text input integration.

2. **API & Orchestration Layer (`backend/services/ai/orchestrator.py`):**
   - Coordinates intent detection, adversarial prompt neutralization, session state, and Gemini tool execution loops.
   - Multi-turn conversation persistence across `ConversationSession` and `ConversationMessage`.

3. **GenAI Client & Function Calling Dispatcher (`backend/services/ai/gemini_client.py`):**
   - Official Google GenAI SDK (`google-genai`) integration.
   - 16 declared financial function tools and Google Search Grounding for real-time market data.
   - High-precision deterministic fallback engine for offline or unconfigured environments.

4. **Deterministic Tool & Calculation Suite (`backend/services/ai/tools.py`):**
   - Multi-tenant data access layer.
   - Mathematical calculations powered by `FinancialHealthEngine`, `ForecastingEngine`, `AffordabilityEngine`, and `WhyExplainerService`.

---

## 2. Function Calling Tool Registry

```typescript
type MONVEXToolName =
  | 'get_transactions'
  | 'get_transaction_summary'
  | 'search_transactions'
  | 'get_accounts'
  | 'get_budgets'
  | 'get_budget_status'
  | 'get_goals'
  | 'get_cashflow'
  | 'get_spending_by_category'
  | 'get_recurring_expenses'
  | 'calculate_financial_health'
  | 'forecast_cashflow'
  | 'simulate_purchase'
  | 'simulate_spending_reduction'
  | 'compare_periods'
  | 'detect_anomalies';
```
