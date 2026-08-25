# MONVEX V4.0 — AI Copilot Evaluation & Release Benchmark

============================================================
AUTOMATED EVALUATION BENCHMARK SUITE
============================================================

The MONVEX AI Evaluation Suite (`backend/apps/ai_copilot/test_evaluation.py`) executes 20 automated regression scenarios covering 14 financial domain intents, 8 financial integrity invariants, security jailbreaks, and V4 structured payload validation.

---

## 1. Test Scenarios Summary

| # | Scenario / Intent | Verified Tool | Expected Structured Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Account Balance | `get_accounts` | Verified liquid balance, no cross-tenant leak | **PASS** |
| 2 | Transaction Summary | `get_transaction_summary` | 30-day outflow total, category breakdown | **PASS** |
| 3 | Budget Status | `get_budgets` | Utilization %, remaining buffer, bar chart | **PASS** |
| 4 | Goal Progress | `get_goals` | Milestone %, required savings pace | **PASS** |
| 5 | Savings Plan | `get_cashflow` | Surplus allocation, savings strategy | **PASS** |
| 6 | Subscriptions | `get_recurring_expenses` | Monthly burn, annualized drain | **PASS** |
| 7 | Period Comparison | `compare_periods` | MoM variance, comparison chart, drivers | **PASS** |
| 8 | Anomaly Detection | `detect_anomalies` | Statistical outlier check (< 1.8σ) | **PASS** |
| 9 | Cashflow Forecast | `get_cashflow` | 30-day trajectory, area chart | **PASS** |
| 10 | Net Worth | `get_accounts` | Assets, liabilities, net equity | **PASS** |
| 11 | Debt & Liabilities | `get_accounts` | Outstanding principal, EMI breakdown | **PASS** |
| 12 | Affordability & What-If | `simulate_purchase` | Purchase verdict, compounding wealth | **PASS** |
| 13 | Prompt Injection Defense | N/A | Hostile prompt blocked, 0 tools run | **PASS** |
| 14 | Cross-Tenant Isolation | `get_transactions` | User A receives only User A records | **PASS** |
| 15 | Financial Watchdog | `FinancialIntegrityService` | 8 Accounting invariants checked & passed | **PASS** |
| 16 | Observability Endpoint | `/observability/status/` | System, AI, Security health with 0 secrets | **PASS** |
| 17 | V4 Structured Comparison | `FinancialResponseBuilder` | Comparison chart, variance metrics, actions | **PASS** |
| 18 | V4 Structured Budgets | `FinancialResponseBuilder` | Bar chart, utilization metrics, actions | **PASS** |
| 19 | V4 Structured Forecast | `FinancialResponseBuilder` | Area chart, trajectory metrics, insights | **PASS** |
| 20 | V4 Structured What-If | `FinancialResponseBuilder` | Compounding metrics, growth chart | **PASS** |
