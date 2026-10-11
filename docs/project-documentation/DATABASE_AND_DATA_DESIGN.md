# MONVEX Database Schema & Data Design Specification

> **Dossier Document:** 05  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 4.2, Chapter 4.2.1  

---

## 1. Database Architecture Overview

MONVEX utilizes **Neon Serverless PostgreSQL 16** as its primary relational persistence engine.

### Logical vs. Physical Data Design
* **Logical Model:** Pure relational architecture normalized to Third Normal Form (3NF). Every entity is strictly associated with a tenant boundary (`auth.User`), eliminating cross-account data leakage.
* **Physical Implementation:**
  - **Primary Keys:** Cryptographic version-4 UUIDs (`models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`) for all domain models, preventing predictable integer enumeration attacks.
  - **Monetary Precision:** Implemented strictly using arbitrary-precision fixed-point numbers via `DecimalField(max_digits=12, decimal_places=2)` or `(max_digits=14, decimal_places=2)`. Floating-point arithmetic (`FLOAT`/`REAL`) is explicitly prohibited across financial tables to prevent IEEE 754 rounding inaccuracies.
  - **Indexes:** Composite B-tree indexes applied on high-traffic temporal query paths (e.g., `[user, date]`, `[user, category, date]`).
  - **Semi-Structured Storage:** PostgreSQL native `JSONField` utilized for polymorphic payload data (e.g., receipt line items, AI tool invocation traces, and security audit metadata).

---

## 2. Comprehensive Entity Data Dictionary

### Table 1: `auth_user` (Django Core User Table)
* **Description:** Manages core login credentials, username, and account activity flags.
* **Primary Key:** `id` (`INTEGER`, Auto-increment).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `username` | `VARCHAR(150)` | UNIQUE, NOT NULL | Unique login handle / email username. |
  | `email` | `VARCHAR(254)` | NOT NULL, INDEXED | User contact and notification address. |
  | `password` | `VARCHAR(128)` | NOT NULL | Salted PBKDF2/Argon2 one-way cryptographic hash. |
  | `is_active` | `BOOLEAN` | DEFAULT TRUE | Account operational status. |
  | `date_joined`| `TIMESTAMPTZ` | DEFAULT NOW() | Account registration timestamp. |

---

### Table 2: `authentication_profile` (`apps.authentication.models.Profile`)
* **Description:** Extends user with financial parameters, currency settings, avatar, and 2FA secrets.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | UNIQUE, FK(`auth_user.id`, CASCADE) | One-to-one parent user relationship. |
  | `phone_number` | `VARCHAR(20)` | DEFAULT '' | User telephone contact. |
  | `status` | `VARCHAR(32)` | CHOICES: `ACTIVE, SUSPENDED, DISABLED` | Profile state. |
  | `currency` | `VARCHAR(10)` | DEFAULT 'INR' | Default display currency symbol. |
  | `monthly_income` | `NUMERIC(12,2)` | DEFAULT 0.00 | Baseline net monthly income for ratios. |
  | `savings_target_percentage` | `NUMERIC(5,2)` | DEFAULT 20.00 | Target savings rate percentage. |
  | `theme` | `VARCHAR(20)` | DEFAULT 'dark' | UI appearance preference (`dark`/`light`). |
  | `avatar` | `VARCHAR(100)` | NULLABLE | Uploaded avatar image filename. |
  | `avatar_url` | `TEXT` | DEFAULT '' | Direct CDN or preset image URL. |
  | `mfa_secret` | `VARCHAR(64)` | DEFAULT '' | Base32 TOTP two-factor shared secret. |
  | `is_mfa_enabled` | `BOOLEAN` | DEFAULT FALSE | Two-factor challenge activation flag. |
  | `created_at` | `TIMESTAMPTZ` | AUTO_NOW_ADD | Creation audit timestamp. |
  | `updated_at` | `TIMESTAMPTZ` | AUTO_NOW | Mutation audit timestamp. |

---

### Table 3: `authentication_googleidentity` (`apps.authentication.models.GoogleIdentity`)
* **Description:** Stores verified Google OAuth 2.0 Subject identifiers linked to local users.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE) | Linked MONVEX user account. |
  | `provider` | `VARCHAR(32)` | DEFAULT 'google' | Identity provider name. |
  | `provider_subject` | `VARCHAR(255)` | INDEXED, NOT NULL | Google unique subject identifier (`sub`). |
  | `email` | `VARCHAR(254)` | DEFAULT '' | Google profile verified email. |
  | `last_login_at` | `TIMESTAMPTZ` | NULLABLE | Timestamp of last Google SSO login. |
* **Table Constraints:** `UniqueConstraint(fields=['provider', 'provider_subject'], name='unique_google_provider_subject')`.

---

### Table 4: `transactions_category` (`apps.transactions.models.Category`)
* **Description:** Categorization taxonomy for income and expense transactions.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE), NULLABLE | Owning user (`NULL` indicates system-wide default). |
  | `name` | `VARCHAR(100)` | NOT NULL | Category display title (e.g., "Groceries"). |
  | `type` | `VARCHAR(10)` | CHOICES: `INCOME, EXPENSE` | Cashflow category direction. |
  | `icon` | `VARCHAR(50)` | DEFAULT 'tag' | Lucide icon identifier. |
  | `color` | `VARCHAR(20)` | DEFAULT '#6366F1' | Hexadecimal color code for charts. |
  | `is_system_default` | `BOOLEAN` | DEFAULT FALSE | Flag distinguishing built-in defaults. |

---

### Table 5: `transactions_merchant` (`apps.transactions.models.Merchant`)
* **Description:** Normalized merchant registry for vendor deduplication and categorizer learning.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | `VARCHAR(150)` | UNIQUE, NOT NULL | Raw merchant title. |
  | `normalized_name` | `VARCHAR(150)` | INDEXED, NOT NULL | Canonical normalized title (e.g., "AMAZON"). |
  | `default_category_id` | `UUID` | FK(`transactions_category.id`, SET_NULL), NULLABLE | Inferred default category. |

---

### Table 6: `transactions_transaction` (`apps.transactions.models.Transaction`)
* **Description:** The core double-entry style financial transaction ledger.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE), INDEXED | Tenant owning user. |
  | `category_id` | `UUID` | FK(`transactions_category.id`, SET_NULL), NULLABLE | Expense/Income category. |
  | `merchant_id` | `UUID` | FK(`transactions_merchant.id`, SET_NULL), NULLABLE | Transacting merchant entity. |
  | `amount` | `NUMERIC(12,2)`| NOT NULL | Monetary amount (strictly positive). |
  | `type` | `VARCHAR(10)` | CHOICES: `INCOME, EXPENSE, TRANSFER`, INDEXED | Transaction classification. |
  | `date` | `DATE` | INDEXED, NOT NULL | Transaction effective accounting date. |
  | `description` | `VARCHAR(255)` | DEFAULT '' | User-entered transaction note. |
  | `source` | `VARCHAR(20)` | CHOICES: `MANUAL, VOICE, RECEIPT, IMPORT, AI` | Transaction ingestion origin. |
  | `confidence` | `NUMERIC(5,4)` | DEFAULT 1.0000 | ML/OCR classification confidence. |
  | `is_recurring` | `BOOLEAN` | DEFAULT FALSE | Flags subscription or recurring billing. |
  | `created_at` | `TIMESTAMPTZ` | AUTO_NOW_ADD | Record ingestion timestamp. |
  | `updated_at` | `TIMESTAMPTZ` | AUTO_NOW | Record modification timestamp. |
* **Composite Indexes:**
  - `[user_id, date]`
  - `[user_id, category_id, date]`
  - `[user_id, type, date]`

---

### Table 7: `budgets_budget` (`apps.budgets.models.Budget`)
* **Description:** Defines spending caps for specific categories across defined accounting intervals.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE) | Owning user. |
  | `category_id` | `UUID` | FK(`transactions_category.id`, CASCADE) | Monitored category. |
  | `limit_amount` | `NUMERIC(12,2)`| NOT NULL | Maximum expenditure allowance. |
  | `period` | `VARCHAR(10)` | CHOICES: `MONTHLY, WEEKLY, CUSTOM` | Budget duration period. |
  | `is_active` | `BOOLEAN` | DEFAULT TRUE | Operational enforcement flag. |
* **Table Constraints:** `unique_together = ('user', 'category', 'period')`.

---

### Table 8: `goals_savingsgoal` (`apps.goals.models.SavingsGoal`)
* **Description:** Tracks long-term target savings objectives and completion status.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE) | Owning user. |
  | `title` | `VARCHAR(200)` | NOT NULL | Goal title (e.g., "Emergency Fund"). |
  | `target_amount` | `NUMERIC(12,2)`| NOT NULL | Desired financial target. |
  | `current_amount`| `NUMERIC(12,2)`| DEFAULT 0.00 | Accumulated savings to date. |
  | `deadline` | `DATE` | NULLABLE | Target completion milestone. |
  | `monthly_commitment`| `NUMERIC(12,2)`| DEFAULT 0.00 | Planned monthly allocation. |
  | `status` | `VARCHAR(20)` | CHOICES: `IN_PROGRESS, COMPLETED, PAUSED` | Lifecycle state. |

---

### Table 9: `transactions_asset` (`apps.transactions.models.Asset`)
* **Description:** Physical and financial assets comprising total wealth.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE) | Owning user. |
  | `name` | `VARCHAR(150)` | NOT NULL | Asset title (e.g., "HDFC Fixed Deposit"). |
  | `asset_type` | `VARCHAR(20)` | CHOICES: `CASH, BANK, INVESTMENT, GOLD, REAL_ESTATE, OTHER` | Asset class. |
  | `value` | `NUMERIC(14,2)`| NOT NULL | Current market / appraised valuation. |
  | `institution` | `VARCHAR(150)` | DEFAULT '' | Financial institution holding asset. |

---

### Table 10: `transactions_liability` (`apps.transactions.models.Liability`)
* **Description:** Outstanding debt obligations and loans.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE) | Owning user. |
  | `name` | `VARCHAR(150)` | NOT NULL | Liability title (e.g., "SBI Home Loan"). |
  | `liability_type`| `VARCHAR(20)` | CHOICES: `CREDIT_CARD, PERSONAL_LOAN, HOME_LOAN, AUTO_LOAN, EDUCATION_LOAN, OTHER_DEBT` | Debt classification. |
  | `principal_amount`| `NUMERIC(14,2)`| NOT NULL | Original borrowed loan amount. |
  | `remaining_balance`| `NUMERIC(14,2)`| NOT NULL | Current unpaid debt balance. |
  | `interest_rate_pct`| `NUMERIC(6,2)` | DEFAULT 10.50 | Annual percentage interest rate. |
  | `monthly_emi` | `NUMERIC(12,2)`| DEFAULT 0.00 | Recurring monthly installment. |

---

### Table 11: `transactions_receipt` (`apps.transactions.models.Receipt`)
* **Description:** Staged OCR extraction records from uploaded receipts.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, CASCADE) | Owning user. |
  | `merchant_name` | `VARCHAR(150)` | DEFAULT '' | Extracted vendor name. |
  | `total_amount` | `NUMERIC(12,2)`| NOT NULL | Final invoice total amount. |
  | `status` | `VARCHAR(20)` | CHOICES: `PENDING_REVIEW, CONFIRMED, REJECTED` | Staging review status. |
  | `items` | `JSONField` | DEFAULT [] | Extracted line item objects. |
  | `raw_ocr_text` | `TEXT` | DEFAULT '' | Unstructured raw text from OCR. |
  | `confirmed_transaction_id`| `UUID` | FK(`transactions_transaction.id`, SET_NULL), NULLABLE | Associated permanent ledger entry. |

---

### Table 12: `ai_copilot_conversationsession` & `conversationmessage`
* **Description:** Stateful multi-turn conversation sessions and individual dialog turns for the AI Financial Copilot.
* **Fields (`ConversationSession`):**
  - `id`: `UUID` (PK)
  - `user_id`: FK(`auth_user.id`, CASCADE)
  - `title`: `VARCHAR(255)` (Auto-summarized inquiry subject)
  - `is_pinned`: `BOOLEAN`
* **Fields (`ConversationMessage`):**
  - `id`: `UUID` (PK)
  - `session_id`: FK(`conversationsession.id`, CASCADE)
  - `sender`: CHOICES: `user, assistant`
  - `content`: `TEXT` (Markdown formatted response or prompt)
  - `tools_used`: `JSONField` (Tools called during inference)
  - `tool_activity`: `JSONField` (Execution telemetry)
  - `data`: `JSONField` (Structured visual charts or widget payloads)

---

### Table 13: `security_securityauditlog` (`apps.security.models.SecurityAuditLog`)
* **Description:** Security telemetry, threat interception events, and access logs.
* **Primary Key:** `id` (`UUID`, PK).
* **Fields:**
  | Field Name | Type | Constraints | Description |
  | :--- | :--- | :--- | :--- |
  | `user_id` | `INTEGER` | FK(`auth_user.id`, SET_NULL), NULLABLE | User associated with event. |
  | `event_type` | `VARCHAR(50)` | CHOICES: `AUTH_SUCCESS, AUTH_FAILED, INJECTION_BLOCKED, BRUTE_FORCE_ATTEMPT, TOKEN_ROTATED, SESSION_REVOKED, VULNERABILITY_SCAN, SUSPICIOUS_ACTIVITY` | Event classification. |
  | `severity` | `VARCHAR(20)` | CHOICES: `INFO, WARNING, CRITICAL` | Security severity tier. |
  | `source_ip` | `VARCHAR(64)` | DEFAULT '127.0.0.1' | Client network IP address. |
  | `endpoint` | `VARCHAR(255)` | DEFAULT '' | Target HTTP URI. |
  | `description` | `TEXT` | NOT NULL | Human-readable audit narrative. |
  | `metadata` | `JSONField` | DEFAULT {} | Context headers and attack signatures. |

---

## 3. Data Integrity & Constraints (Chapter 4.2.1)

1. **Multi-Tenant Isolation Guarantees:**
   Every model (excluding system default categories) maintains an explicit foreign key to `auth.User`. In DRF views, querysets are filtered by `self.request.user`, preventing horizontal privilege escalation (IDOR) attacks.
2. **Referential Deletion Protection:**
   - Deleting a category does NOT delete financial history: `Transaction.category` uses `on_delete=models.SET_NULL`.
   - Deleting a user cascades cleanly: `Profile`, `Transaction`, `Budget`, and `SavingsGoal` use `on_delete=models.CASCADE`.
3. **Double-Budget Prevention:**
   The composite unique constraint `unique_together = ('user', 'category', 'period')` guarantees that users cannot accidentally create contradictory spending caps for the same category.
4. **Monetary Precision Defense:**
   All balances, EMIs, asset valuations, and totals use `DecimalField` with strict Python `decimal.Decimal` conversion. Rounding errors inherent to binary floating-point numbers are completely eliminated.
