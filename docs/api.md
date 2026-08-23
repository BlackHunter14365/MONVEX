# MONVEX REST API Specification (v1)

## Base URL
`/api/v1/`

All endpoints (except public auth) require the `Authorization: Bearer <access_jwt>` header.

---

## 1. Authentication Endpoints (`/api/v1/auth/`)

| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register/` | Register new user account with initial profile & default categories | Public |
| `POST` | `/auth/login/` | Authenticate user & return JWT tokens (`access`, `refresh`) | Public |
| `POST` | `/auth/token/refresh/` | Refresh expired access token | Public |
| `GET` | `/auth/profile/` | Retrieve current user profile, currency & preferences | Authenticated |
| `PATCH`| `/auth/profile/` | Update profile settings | Authenticated |

---

## 2. Transactions & Categories (`/api/v1/transactions/`)

| Method | Path | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/transactions/` | List user transactions (paginated) | `start_date`, `end_date`, `category`, `type`, `search` |
| `POST` | `/transactions/` | Create transaction (triggers ML categorization if category empty) | — |
| `GET` | `/transactions/{id}/`| Retrieve single transaction | — |
| `PUT/PATCH`| `/transactions/{id}/`| Update transaction | — |
| `DELETE`| `/transactions/{id}/`| Delete transaction | — |
| `POST` | `/transactions/parse-natural/`| Parse natural language/voice text into transaction draft | `{"text": "Spent 620 on Swiggy"}` |
| `GET` | `/categories/` | List system & user custom categories | `type` (`income` / `expense`) |
| `POST` | `/categories/` | Create user custom category | — |

---

## 3. Budgets & Goals (`/api/v1/budgets/` & `/api/v1/goals/`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/budgets/` | List active budgets with real-time calculated velocity & projected month-end spend |
| `POST` | `/budgets/` | Create a new budget limit |
| `GET` | `/budgets/status/` | Overall budget adherence & warning alerts |
| `GET` | `/goals/` | List savings goals with progress percentage & required monthly savings |
| `POST` | `/goals/` | Create a savings goal |
| `POST` | `/goals/{id}/contribute/` | Record a contribution towards a goal |

---

## 4. Analytics & Intelligence (`/api/v1/analytics/`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/analytics/dashboard/` | Primary dashboard metrics: Balance, Monthly Income, Expense, Savings Rate |
| `GET` | `/analytics/category-breakdown/` | Aggregated category spending by period |
| `GET` | `/analytics/health-score/` | Transparent 0–100 Financial Health Score with factor breakdowns |
| `GET` | `/analytics/cashflow-forecast/` | 30/60/90-day cash flow & balance projections |
| `GET` | `/analytics/anomalies/` | List detected unusual spending events |

---

## 5. AI Copilot (`/api/v1/ai/`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/ai/chat/` | Send financial query to AI Copilot; executes controlled tools & returns structured answer |
| `POST` | `/ai/what-if/` | Run deterministic what-if scenario calculation with AI explanation |
| `GET` | `/ai/insights/` | Retrieve active proactive AI financial insights |
