# MONVEX 2.0 Master Architecture Specification

## 1. High-Level Overview & Core Philosophy

MONVEX 2.0 is an **AI-Powered Personal Financial Intelligence Platform**.
Unlike traditional expense tracking CRUD applications, MONVEX operates on an autonomous **Intelligence Feedback Loop**:

```
                 MONVEX 2.0
                     │
                     ▼
          YOUR FINANCIAL DATA (Zero Leakage)
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     TRACK        ANALYZE      DETECT
        │            │            │
        └────────────┼────────────┘
                     ▼
                 "WHY?" (Variance Attribution Engine)
                     │
                     ▼
             CASH FLOW FORECAST (7D / 30D / 60D / 90D Horizons)
                     │
                     ▼
             WHAT-IF SIMULATOR (Income, Cuts, Extra SIP, Debt Prepayment)
                     │
                     ▼
           STRUCTURED AI REASONING (Gemini Tool Layer)
                     │
                     ▼
            CONFIRMED USER ACTION
                     │
                     ▼
               BETTER OUTCOME
```

---

## 2. Multi-Tier Technology Stack

```
                    MONVEX 2.0
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      WEB           ANDROID         WINDOWS
   Next.js 14       Flutter          Tauri
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  DJANGO REST API
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      PostgreSQL     Redis        Celery
          │
          ▼
   DETERMINISTIC FINANCIAL ENGINE
          │
   ┌──────┼────────┬──────────┐
   ▼      ▼        ▼          ▼
Forecast Health  Anomaly   Simulator & Debt
   │      │        │          │
   └──────┴────────┴──────────┘
                  │
                  ▼
             AI TOOL LAYER
                  │
                  ▼
          GEMINI INTELLIGENCE
```

---

## 3. Strict Architectural Boundary Rules

1. **Deterministic Calculation**: 100% of accounting math, forecasting models, loan amortization, net worth balances, and scenario calculations are executed in Python/Django services.
2. **AI Tool Isolation**: Gemini is restricted to reading structured JSON tool outputs (`get_transactions`, `get_budget_status`, `get_cashflow`, `run_simulator`, `get_net_worth`). **Gemini NEVER fabricates raw ledger values.**
3. **Human-in-the-Loop Confirmation**: Optical Receipt OCR and Voice Transaction entry require an explicit confirmation card before database insertion.
4. **Zero Cross-Tenant Leakage**: Every query is strictly isolated to `request.user`.
