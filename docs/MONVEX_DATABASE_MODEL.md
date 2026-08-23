# MONVEX 2.0 Database Model & Schema Architecture

## 1. Relational Entity Relationship Diagram

```
       ┌────────────────┐
       │   auth.User    │
       └───────┬────────┘
               │ 1:N
   ┌───────────┼───────────┬──────────────┬──────────────┐
   ▼           ▼           ▼              ▼              ▼
Transaction  Category    Budget      SavingsGoal     RecurringPayment
   │                                                     │
   │ 1:1                                                 │
   ▼                                                     ▼
Receipt (OCR)                                  Asset & Liability (Balance Sheet)
   │
   ▼
Notification (Smart Alerts)
```

---

## 2. Core Entities

### `Transaction`
- `id`: UUID (Primary Key)
- `user`: ForeignKey(User)
- `category`: ForeignKey(Category, null=True, on_delete=SET_NULL)
- `amount`: `DecimalField(max_digits=12, decimal_places=2)` — **Never floating point**
- `transaction_type`: `'INCOME'` | `'EXPENSE'`
- `description`: CharField
- `source`: `'MANUAL'` | `'VOICE'` | `'RECEIPT'` | `'RECURRING'` | `'IMPORT'`
- `date`: DateField

### `Asset`
- `id`: UUID
- `user`: ForeignKey(User)
- `name`: CharField
- `asset_type`: `'BANK'` | `'INVESTMENT'` | `'GOLD'` | `'REAL_ESTATE'` | `'CASH'` | `'OTHER'`
- `value`: `DecimalField(max_digits=14, decimal_places=2)`
- `institution`: CharField

### `Liability`
- `id`: UUID
- `user`: ForeignKey(User)
- `name`: CharField
- `liability_type`: `'PERSONAL_LOAN'` | `'HOME_LOAN'` | `'AUTO_LOAN'` | `'CREDIT_CARD'` | `'EDUCATION_LOAN'` | `'OTHER_DEBT'`
- `principal_amount`: `DecimalField(max_digits=14, decimal_places=2)`
- `remaining_balance`: `DecimalField(max_digits=14, decimal_places=2)`
- `interest_rate_pct`: `DecimalField(max_digits=5, decimal_places=2)`
- `tenure_months`: IntegerField
- `monthly_emi`: `DecimalField(max_digits=12, decimal_places=2)`

### `Receipt`
- `id`: UUID
- `user`: ForeignKey(User)
- `status`: `'PENDING_REVIEW'` | `'CONFIRMED'` | `'REJECTED'`
- `merchant_name`: CharField
- `total_amount`: `DecimalField(max_digits=12, decimal_places=2)`
- `items`: JSONField
- `confidence_score`: `DecimalField(max_digits=5, decimal_places=4)`
- `confirmed_transaction`: OneToOneField(Transaction, null=True)

### `Notification`
- `id`: UUID
- `user`: ForeignKey(User)
- `notification_type`: `'BUDGET_WARNING'` | `'UNUSUAL_SPENDING'` | `'GOAL_RISK'` | `'UPCOMING_PAYMENT'` | `'FORECAST_WARNING'` | `'INSIGHT_AVAILABLE'`
- `severity`: `'INFO'` | `'WARNING'` | `'CRITICAL'`
- `is_read`: BooleanField
