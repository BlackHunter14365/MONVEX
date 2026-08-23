# MONVEX Database Specification

## 1. Relational Entity Overview

The MONVEX database is strictly user-isolated. Every sensitive entity contains a foreign key to `auth.User` with appropriate database indexes (`db_index=True` or `unique_together` constraints).

```
User (auth.User)
  ├── Profile (currency, theme, preferences)
  ├── Category (name, type: income/expense, icon, color, is_custom)
  ├── Merchant (name, normalized_name, default_category)
  ├── Transaction (amount, type, category, merchant, date, notes, source, confidence)
  ├── Budget (category, limit_amount, period, active)
  │     └── BudgetHistory (period, actual_spent, variance)
  ├── SavingsGoal (title, target_amount, current_amount, deadline, monthly_commitment)
  ├── RecurringPayment (merchant, amount, frequency, next_due_date, is_active)
  ├── AnomalyEvent (transaction, score, reason, status: pending/confirmed/dismissed)
  ├── AIInsight (insight_type, content, score_impact, created_at)
  └── AIInteraction (question, tools_used, response, feedback_rating)
```

## 2. Table Schemas & Constraints

### `transactions_transaction`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Universally unique transaction identifier |
| `user_id` | Foreign Key | `auth.User`, on_delete=CASCADE, db_index | Tenant / Account owner |
| `category_id` | Foreign Key | `Category`, on_delete=SET_NULL, null=True | Classified category |
| `merchant_id` | Foreign Key | `Merchant`, on_delete=SET_NULL, null=True | Identified merchant entity |
| `amount` | Decimal(12, 2) | > 0 | Transaction monetary value |
| `type` | Char(10) | `INCOME` / `EXPENSE` / `TRANSFER` | Cash flow direction |
| `date` | Date | db_index | Execution / settlement date |
| `source` | Char(20) | `MANUAL` / `VOICE` / `RECEIPT` / `IMPORT` / `AI` | Capture provenance |
| `confidence` | Decimal(5, 4) | 0.0000 to 1.0000 | ML / parser confidence score |
| `raw_text` | Text | Nullable | Original unparsed natural text or OCR |
| `created_at` | DateTime | auto_now_add=True | Timestamp of creation |

### `budgets_budget`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique budget identifier |
| `user_id` | Foreign Key | `auth.User`, on_delete=CASCADE | Owner |
| `category_id` | Foreign Key | `Category`, on_delete=CASCADE | Monitored expense category |
| `limit_amount` | Decimal(12, 2) | > 0 | Monthly budget cap |
| `period` | Char(10) | `MONTHLY`, `WEEKLY`, `CUSTOM` | Allocation timeframe |
| `is_active` | Boolean | Default=True | Status toggle |

### `goals_savingsgoal`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique goal identifier |
| `user_id` | Foreign Key | `auth.User`, on_delete=CASCADE | Owner |
| `title` | Char(255) | Non-empty | Goal title (e.g., "Emergency Fund") |
| `target_amount` | Decimal(12, 2) | > 0 | Target monetary goal |
| `current_amount` | Decimal(12, 2) | Default=0.00 | Accumulated savings toward goal |
| `deadline` | Date | Nullable | Target completion date |
| `monthly_commitment`| Decimal(12, 2)| Auto-calculated/Manual | Required monthly allocation |
| `status` | Char(20) | `IN_PROGRESS` / `COMPLETED` / `PAUSED` | Lifecycle state |
