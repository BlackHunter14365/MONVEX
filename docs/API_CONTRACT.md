# MONVEX V2 — Locked Core API Contract & Specification

**Document Status**: LOCKED & FROZEN SPECIFICATION  
**Phase**: Phase 2 Milestone Completion  
**Version**: 2.0.0  
**Effective Date**: August 22, 2026  
**Protocol**: REST / JSON over HTTPS  
**Base URL**: `/api/v1`  

---

## 1. Global API Standards & Architecture

### 1.1 Authentication & Header Requirements
All private endpoints require Bearer token authentication via RFC 6750 JWT:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 1.2 Multi-Tenant Authorization & User Isolation Rule
- **Zero Client Identity Trust**: The server determines the user identity solely from the cryptographically verified JWT payload (`request.user`).
- Clients must **NEVER** pass `user_id` in URL parameters, query strings, or request bodies for authorization.
- Every database query in the backend is strictly scoped to `WHERE user_id = authenticated_user.id`.
- Modifying resource IDs (e.g. `GET /api/v1/transactions/<foreign-uuid>/`) returns `404 Not Found` or `403 Forbidden`.

### 1.3 Standardized Error Response Format
All error responses adhere to the standard structured envelope:
```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED | VALIDATION_ERROR | NOT_FOUND | RATE_LIMITED | SERVER_ERROR",
    "message": "Human-readable description of error.",
    "details": {
      "field_name": ["Specific constraint failure."]
    }
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Identity (`/api/v1/auth/`)

#### 1. Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register/`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "username": "user123",
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "currency": "INR",
    "monthly_income": 80000.00
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "username": "user123",
      "email": "user@example.com",
      "currency": "INR",
      "monthly_income": 80000.00,
      "is_verified": false
    },
    "message": "Verification code sent to email."
  }
  ```

#### 2. Verify Email Code
- **Method**: `POST`
- **Path**: `/api/v1/auth/verification/check/`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "verified": true,
    "access": "jwt.access.token",
    "refresh": "jwt.refresh.token",
    "user": { "id": "uuid", "username": "user123", "is_verified": true }
  }
  ```

#### 3. Login
- **Method**: `POST`
- **Path**: `/api/v1/auth/login/`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "identifier": "user123",
    "password": "StrongPassword123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "access": "jwt.access.token",
    "refresh": "jwt.refresh.token",
    "user": { "id": "uuid", "username": "user123", "email": "user@example.com", "currency": "INR" }
  }
  ```

#### 4. Google One-Tap / Identity Sign-In
- **Method**: `POST`
- **Path**: `/api/v1/auth/google/`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "credential": "google_jwt_id_token"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "access": "jwt.access.token",
    "refresh": "jwt.refresh.token",
    "user": { "id": "uuid", "username": "google_user", "email": "user@gmail.com" }
  }
  ```

#### 5. Current Authenticated Profile
- **Method**: `GET` / `PATCH`
- **Path**: `/api/v1/auth/me/`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "id": "uuid",
    "username": "user123",
    "email": "user@example.com",
    "currency": "INR",
    "monthly_income": 80000.00,
    "is_verified": true,
    "is_onboarded": true,
    "avatar": "data:image/png;base64,..."
  }
  ```

---

### 2.2 Universal Search (`/api/v1/search/`)

#### 1. Unified Multi-Entity Search
- **Method**: `GET`
- **Path**: `/api/v1/search/`
- **Auth**: Required (Strictly user-scoped)
- **Query Parameters**:
  - `q` (string, optional): Search keyword (e.g. `coffee`, `hdfc`, `emergency`, `analytics`).
  - `limit` (integer, optional, default: 5, max: 20): Max results per entity bucket.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "query": "coffee",
    "results": {
      "transactions": [
        {
          "id": "uuid",
          "type": "transaction",
          "title": "Blue Tokai Coffee",
          "subtitle": "Dining & Cafes · Aug 22, 2026",
          "amount": 450.00,
          "badge": "EXPENSE",
          "destination": "/transactions",
          "date": "2026-08-22"
        }
      ],
      "accounts": [
        {
          "id": "uuid",
          "type": "account",
          "title": "HDFC Salary Checking",
          "subtitle": "HDFC Bank · Bank Savings & Deposits",
          "amount": 54200.00,
          "badge": "BANK",
          "destination": "/accounts"
        }
      ],
      "budgets": [
        {
          "id": "uuid",
          "type": "budget",
          "title": "Dining & Cafes Budget",
          "subtitle": "Limit: ₹8,000.00 (Monthly)",
          "amount": 8000.00,
          "badge": "MONTHLY",
          "destination": "/budgets"
        }
      ],
      "goals": [
        {
          "id": "uuid",
          "type": "goal",
          "title": "Emergency Fund",
          "subtitle": "₹80,000 of ₹200,000 (40% reached)",
          "amount": 200000.00,
          "badge": "IN_PROGRESS",
          "destination": "/goals"
        }
      ],
      "conversations": [
        {
          "id": "uuid",
          "type": "conversation",
          "title": "August Spending Breakdown",
          "subtitle": "AI Session · Aug 21, 2026",
          "badge": "AI CHAT",
          "destination": "/ai?session=uuid"
        }
      ],
      "navigation": [
        {
          "id": "nav-transactions",
          "type": "navigation",
          "title": "Transactions Ledger",
          "subtitle": "Full categorized transaction history & search",
          "destination": "/transactions",
          "badge": "COMMAND"
        }
      ]
    },
    "total": 6
  }
  ```

---

### 2.3 Financial Ledger & Transactions (`/api/v1/transactions/`)

#### 1. List Transactions
- **Method**: `GET`
- **Path**: `/api/v1/transactions/`
- **Auth**: Required
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `type` (`INCOME` | `EXPENSE` | `TRANSFER`)
  - `category` (uuid)
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
  - `search` (string)
- **Response** (`200 OK`):
  ```json
  {
    "count": 45,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "uuid",
        "merchant": "Blue Tokai Coffee",
        "category": { "id": "uuid", "name": "Dining", "icon": "coffee", "color": "#E11D48" },
        "amount": "450.00",
        "type": "EXPENSE",
        "date": "2026-08-22",
        "description": "Morning roast",
        "source": "MANUAL"
      }
    ]
  }
  ```

#### 2. Create Transaction
- **Method**: `POST`
- **Path**: `/api/v1/transactions/`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "amount": 450.00,
    "type": "EXPENSE",
    "merchant_name": "Blue Tokai Coffee",
    "category_name": "Dining",
    "description": "Morning roast",
    "date": "2026-08-22",
    "source": "MANUAL"
  }
  ```
- **Response** (`201 Created`): Returns created Transaction object.

#### 3. Export Ledger (CSV)
- **Method**: `GET`
- **Path**: `/api/v1/transactions/export/`
- **Auth**: Required
- **Response** (`200 OK`): `text/csv` formatted file download.

---

### 2.4 Accounts & Net Worth (`/api/v1/transactions/assets/`, `/liabilities/`, `/net-worth/`)

#### 1. Net Worth Balance Sheet Overview
- **Method**: `GET`
- **Path**: `/api/v1/transactions/net-worth/`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "net_worth": 450000.00,
    "total_assets": 600000.00,
    "total_liabilities": 150000.00,
    "solvency_ratio_pct": 75.0,
    "liquid_runway_months": 5.4,
    "assets": [],
    "liabilities": []
  }
  ```

#### 2. List & Create Assets
- **Method**: `GET` / `POST`
- **Path**: `/api/v1/transactions/assets/`
- **Auth**: Required
- **Request Body** (POST):
  ```json
  {
    "name": "HDFC Salary Checking",
    "asset_type": "BANK",
    "institution": "HDFC Bank",
    "value": 54200.00
  }
  ```

---

### 2.5 Budgets & Limits (`/api/v1/budgets/`)

#### 1. Budget Overview & Adherence
- **Method**: `GET`
- **Path**: `/api/v1/budgets/overview/`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "total_budgeted": 25000.00,
    "total_spent": 18450.00,
    "overall_adherence_pct": 73.8,
    "over_budget_count": 0,
    "near_limit_count": 1,
    "budgets": [
      {
        "id": "uuid",
        "category_name": "Groceries",
        "limit_amount": 10000.00,
        "spent_amount": 8200.00,
        "percentage": 82.0,
        "is_near_limit": true,
        "is_exceeded": false
      }
    ]
  }
  ```

---

### 2.6 Savings Goals (`/api/v1/goals/`)

#### 1. Goals List & Progress
- **Method**: `GET`
- **Path**: `/api/v1/goals/`
- **Auth**: Required
- **Response** (`200 OK`): Array of user savings goals with target milestones and completion dates.

#### 2. Contribute to Goal
- **Method**: `POST`
- **Path**: `/api/v1/goals/<uuid:pk>/contribute/`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "amount": 5000.00,
    "notes": "August savings transfer"
  }
  ```

---

### 2.7 Analytics & Deterministic Forecasting (`/api/v1/analytics/`)

#### 1. Command Dashboard KPIs
- **Method**: `GET`
- **Path**: `/api/v1/analytics/dashboard/`
- **Auth**: Required
- **Response** (`200 OK`): Deterministic net savings, monthly burn rate, category breakdown, 6-factor health score.

#### 2. 30/60/90 Day Cash Flow Forecast
- **Method**: `GET`
- **Path**: `/api/v1/analytics/cashflow-forecast/`
- **Auth**: Required
- **Response** (`200 OK`): Time-series projections with daily burn velocity, month-end balance, and upper/lower confidence boundaries.

---

### 2.8 AI Copilot 2.0 & Intelligence (`/api/v1/ai/`)

#### 1. Multi-Turn Financial Chat
- **Method**: `POST`
- **Path**: `/api/v1/ai/chat/`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "message": "How much did I spend on dining this month?",
    "session_id": "uuid" (optional)
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "session_id": "uuid",
    "response": "You spent ₹5,840 across 12 dining transactions in August.",
    "intent": "EXPENSE_QUERY",
    "tools_used": ["get_spending_by_category"],
    "tool_activity": [
      { "tool": "get_spending_by_category", "summary": "Retrieved category breakdown for user" }
    ],
    "citations": []
  }
  ```

#### 2. What-If Scenario Simulator
- **Method**: `POST`
- **Path**: `/api/v1/ai/what-if/`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "scenario_type": "DISCRETIONARY_CUT",
    "reduction_percentage": 25,
    "category": "Dining"
  }
  ```

---

### 2.9 Security & Telemetry (`/api/v1/security/`)

#### 1. Security Overview & Active Shields
- **Method**: `GET`
- **Path**: `/api/v1/security/overview/`
- **Auth**: Required
- **Response** (`200 OK`): Security score (100%), shield statuses, active session count, last audit log.

#### 2. Revoke All Sessions (Panic Button)
- **Method**: `POST`
- **Path**: `/api/v1/security/revoke-sessions/`
- **Auth**: Required
- **Response** (`200 OK`): Blacklists all issued refresh tokens for the authenticated user.

---

### 2.10 Contact Inquiries (`/api/v1/contact/`)

#### 1. Submit Inbound Contact Inquiry
- **Method**: `POST`
- **Path**: `/api/v1/contact/`
- **Auth**: Public (Rate limited & sanitized)
- **Request Body**:
  ```json
  {
    "name": "Dev Sharma",
    "email": "dev@example.com",
    "phone": "+91 9876543210",
    "message": "Inquiry regarding API integrations."
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Your message has been received.",
    "submission_id": "uuid"
  }
  ```

---

## 3. Contract Certification
This API Contract is frozen for MONVEX V2 across Web (Next.js), Windows Desktop (Tauri), and Android (Flutter).
All clients communicate exclusively through these versioned endpoints. Direct database queries from client tiers are strictly forbidden.
