# MONVEX V5 NATIVE ANDROID — PRODUCTION REST API CONTRACT & INTEGRATION GUIDE

**Document Version:** 1.0.0  
**Target Release:** MONVEX V5.0.0 (Native Android / Flutter)  
**Backend API Version:** `/api/v1/`  
**Security Standard:** Multi-Tenant Scoped, JWT RFC 7519, TLS 1.3, Rate-Limited  

---

## 1. Executive Summary & Architecture Overview

This document specifies the exact, production-certified REST API contract provided by the MONVEX Django/PostgreSQL backend for the upcoming **MONVEX V5 Native Android Application (Flutter)**.

### Architectural Principles
1. **Multi-Tenant Strict Isolation:** Every authenticated request is scoped directly to `request.user`. No tenant can query, modify, or infer the existence of another user's transactions, receipts, budgets, or goals.
2. **Deterministic Financial Precision:** All currency amounts (`amount`, `total_inflows`, `net_savings`) are represented as exact decimals or fixed-precision 2-decimal floats (`0.00`). No floating-point round-off errors.
3. **Stateless JWT Authentication:** Short-lived Access Tokens (60 min) with rotatable Refresh Tokens (7 days). Stored natively in Android Keystore / EncryptedSharedPreferences via `flutter_secure_storage`.
4. **Resilient Document Processing:** Receipts undergo real multimodal OCR with strict fallback boundaries (zero fabricated amounts). Confirmed receipts create immutable ledger entries.

---

## 2. Base Configuration & Environments

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **Local Emulator** | `http://10.0.2.2:8000/api/v1` | Standard Android Studio AVD mapping to host localhost |
| **Physical Device (LAN)** | `http://<HOST_IP>:8000/api/v1` | Local Wi-Fi testing on physical Android devices |
| **Production Cloud** | `https://monvex-backend.onrender.com/api/v1` | Live Render backend with PostgreSQL & Cloud Object Storage |

### Standard Request Headers
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
Accept: application/json
X-Client-Platform: android
X-Client-Version: 5.0.0
```

---

## 3. Authentication & Session Lifecycle

### 3.1 Standard Login
* **Endpoint:** `POST /auth/login/`
* **Request Body:**
  ```json
  {
    "username": "alex_monvex",
    "password": "TestUser123!@#"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "alex_monvex",
      "email": "alex@monvex.ai"
    }
  }
  ```

---

### 3.2 Token Refresh
* **Endpoint:** `POST /auth/refresh/`
* **Request Body:**
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 3.3 Logout
* **Endpoint:** `POST /auth/logout/`
* **Request Body:**
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Success Response (200 OK / 205 Reset Content):**
  ```json
  {
    "detail": "Successfully logged out."
  }
  ```

---

### 3.4 Google Native Sign-In
* **Endpoint:** `POST /auth/google/`
* **Request Body:**
  ```json
  {
    "id_token": "<GOOGLE_ID_TOKEN_FROM_PLAY_SERVICES>"
  }
  ```
* **Response (200 OK):** Same JWT payload as standard login.

---

## 4. Core Financial Resources

### 4.1 Transactions

#### List Transactions
* **Endpoint:** `GET /transactions/`
* **Query Parameters:**
  - `ordering` (e.g. `-date`, `-created_at`)
  - `type` (`INCOME` | `EXPENSE`)
  - `category` (category ID)
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
  - `search` (string)
* **Response (200 OK):**
  ```json
  [
    {
      "id": 101,
      "type": "EXPENSE",
      "amount": "1450.00",
      "category": 3,
      "category_name": "Groceries",
      "description": "Star Bazaar Weekly Restock",
      "date": "2026-09-05",
      "created_at": "2026-09-05T14:22:00Z"
    }
  ]
  ```

#### Create Transaction
* **Endpoint:** `POST /transactions/`
* **Request Body:**
  ```json
  {
    "type": "EXPENSE",
    "amount": "450.00",
    "category": 3,
    "description": "Coffee and snacks",
    "date": "2026-09-06"
  }
  ```
* **Response (201 Created):** Transaction object.

---

### 4.2 Monthly Financial Statement & Summary
* **Endpoint:** `GET /transactions/monthly-report/`
* **Query Parameters:** `month=YYYY-MM` (e.g. `month=2026-09`)
* **Response (200 OK):**
  ```json
  {
    "month": "2026-09",
    "total_inflows": "125000.00",
    "total_outflows": "38450.00",
    "net_savings": "86550.00",
    "savings_rate": 69.24,
    "category_breakdown": [
      {
        "category_name": "Groceries",
        "total": "14200.00",
        "percentage": 36.93
      }
    ],
    "daily_trend": [
      { "date": "2026-09-01", "amount": "1200.00" }
    ]
  }
  ```

---

### 4.3 Categories, Budgets & Goals

* `GET /categories/` — List user custom + default categories.
* `POST /categories/` — `{ "name": "Travel", "icon": "plane", "color": "#4056A1" }`
* `GET /budgets/` — List active budgets with spend tracking.
* `POST /budgets/` — `{ "category": 3, "amount": "20000.00", "month": "2026-09" }`
* `GET /goals/` — List active savings goals.
* `POST /goals/` — `{ "name": "Emergency Fund", "target_amount": "500000.00", "current_amount": "150000.00", "target_date": "2027-01-01" }`

---

## 5. Receipt Processing & OCR Pipeline (Mobile Native Flow)

### 5.1 Upload Receipt Image
* **Endpoint:** `POST /transactions/receipts/upload/`
* **Content-Type:** `multipart/form-data`
* **Request Field:** `file` (binary PNG/JPEG/WEBP/PDF, max 10MB)
* **Response (200 OK):**
  ```json
  {
    "id": 42,
    "merchant_name": "Star Bazaar",
    "total_amount": 1700.0,
    "date": "2026-09-05",
    "confidence_score": 0.95,
    "status": "PENDING_REVIEW",
    "engine": "GEMINI_MULTIMODAL",
    "items": [
      { "name": "Basmati Rice 5kg", "amount": 650.0, "quantity": 1 }
    ],
    "raw_text": "STAR BAZAAR ... TOTAL 1700.00"
  }
  ```
* **Zero-Fabrication Guarantee:** If OCR fails to parse the receipt or image is unreadable:
  - `total_amount`: `0.0`
  - `merchant_name`: `"Unknown Vendor"`
  - `confidence_score`: `0.0`
  - `engine`: `"MANUAL_ENTRY_REQUIRED"`
  - `items`: `[]`

---

### 5.2 Confirm Receipt (Human-in-the-Loop)
* **Endpoint:** `POST /transactions/receipts/{id}/confirm/`
* **Request Body:**
  ```json
  {
    "merchant_name": "Star Bazaar",
    "amount": 1700.00,
    "category_name": "Groceries",
    "date": "2026-09-05",
    "description": "Star Bazaar Groceries - Confirmed via Android"
  }
  ```
* **Response (200 OK / 201 Created):**
  ```json
  {
    "message": "Receipt confirmed and transaction created successfully",
    "receipt_id": 42,
    "transaction": {
      "id": 108,
      "amount": "1700.00",
      "type": "EXPENSE",
      "category_name": "Groceries"
    }
  }
  ```
* **Idempotency Shield:** Repeated calls with the same receipt ID will safely return the existing transaction without creating duplicate expense records.

---

### 5.3 Fetch Receipt Media Image
* **Endpoint:** `GET /transactions/receipts/{id}/image/`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Response:**
  - Local mode: Binary image stream.
  - Cloud mode: 302 Found redirect to S3/R2 presigned URL.
  - On IDOR attempt: 404 Not Found.

---

## 6. Real PDF Statement Generation

* **Endpoint:** `GET /transactions/export/pdf/?month=YYYY-MM`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Response:** Server-side ReportLab compiled vector binary (`%PDF-1.4`) with `Content-Type: application/pdf`.

---

## 7. AI Financial Copilot & Affordability Evaluator

* **Endpoint:** `POST /ai/impulse-buy/`
* **Request Body:**
  ```json
  {
    "amount": 14999.00,
    "item_name": "Noise Cancelling Headphones",
    "category": "Electronics"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "verdict": "CAUTION",
    "affordable": true,
    "impact_percentage_of_savings": 17.3,
    "budget_headroom_remaining": "3450.00",
    "ai_reasoning": "Purchasing this item will consume 17.3% of your monthly net savings."
  }
  ```

---

## 8. Error Handling & Standard Error Envelopes

| HTTP Status | Meaning | Typical Envelope |
| :--- | :--- | :--- |
| **400** | Validation Failure / Bad Input | `{"detail": "Invalid date format. Expected YYYY-MM-DD."}` |
| **401** | Token Expired or Invalid | `{"code": "token_not_valid", "detail": "Given token not valid"}` |
| **403** | Permission Denied | `{"detail": "You do not have permission to perform this action."}` |
| **404** | Resource Not Found / IDOR Shield | `{"detail": "Not found."}` |
| **429** | Rate Limited | `{"detail": "Request was throttled."}` |
| **500** | Server Error (Sanitized) | `{"error": "An internal error occurred. Please try again later."}` |

---

## 9. Android Flutter Implementation Recommendations

* **Storage:** `flutter_secure_storage` for JWT tokens.
* **HTTP Client:** `dio` with automated refresh token interceptor.
* **Palette:**
  - Canvas: `#F6F5F1`
  - Card: `#FFFFFF`
  - Primary Text: `#2A1F3D`
  - Interactive Accent: `#4056A1`
  - Positive / Savings: `#059669`
  - Outflow / Warning: `#DC2626`
