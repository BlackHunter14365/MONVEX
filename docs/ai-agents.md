# MONVEX AI Agents & Tool Architecture Specification

## 1. Agent Architecture & Governance

The MONVEX AI Financial Copilot couples Google Gemini with a sandboxed, controlled tool execution layer.

```
                    +------------------------------------+
                    |        User Question / Query       |
                    +-----------------+------------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |    Gemini Reasoning Engine         |
                    | (Analyzes intent & selects tools)  |
                    +-----------------+------------------+
                                      |
                        +-------------+-------------+
                        | Parameterized Tool Calls  |
                        v                           v
             +---------------------+     +---------------------+
             | get_spending_summary|     | get_budget_status   |
             +----------+----------+     +----------+----------+
                        |                           |
                        +-------------+-------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |    MONVEX Backend Service Layer    |
                    |  - Scoped to Authenticated User    |
                    |  - Deterministic Calculations      |
                    +-----------------+------------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |   Verified Structured Financial    |
                    |           Data Payload             |
                    +-----------------+------------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |  Gemini Synthesis & Explanation    |
                    | (Transparent, actionable guidance) |
                    +------------------------------------+
```

## 2. Core Controlled Tools

| Tool Function | Scoped Inputs | Output Schema |
| :--- | :--- | :--- |
| `get_transactions` | `user`, `start_date`, `end_date`, `category_id`, `limit` | List of sanitized transaction objects |
| `get_spending_summary` | `user`, `period` (`current_month`, `last_month`, `last_30_days`) | Total spent, category breakdown, top merchants, baseline comparison |
| `get_budget_status` | `user` | List of budgets, percentage spent, velocity, projected overrun |
| `get_goals_progress` | `user` | Goals list, target vs saved, estimated completion dates |
| `calculate_what_if` | `user`, `action_type`, `parameters` | Deterministic projection of savings/cashflow changes |
| `get_recurring_obligations` | `user` | List of upcoming subscriptions, bills, and payment dates |

## 3. Tool Safety Rules
- **Read-Only Auto Execution**: Read-only tools execute automatically without human intervention.
- **Write Actions Require Confirmation**: Any mutation (e.g. creating a budget, categorizing an expense, transferring funds) must return a structured action draft to the user for explicit confirmation before being committed.
- **No Unrestricted SQL**: The model is never supplied with database query generators or raw ORM handles.
