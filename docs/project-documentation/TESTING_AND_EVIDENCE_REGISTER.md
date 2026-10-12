# MONVEX Testing Methodology & Evidence Register

> **Dossier Document:** 10  
> **Source Verification Status:** `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 5.2 (5.2.1 Unit Testing, 5.2.2 Integrated Testing) & Chapter 6.1 (Test Reports)  

---

## 1. Testing Philosophy & Verification Strategy

MONVEX enforces a multi-tiered verification hierarchy guaranteeing that all monetary calculations, security boundaries, and user interactions are systematically validated prior to release:

```
                              +---------------------------------------+
                              |         End-to-End (E2E) Tests        |
                              |   Playwright Headless Browser Tests   |
                              |  (24 Public Routes, Navigation Flow)  |
                              +-------------------+-------------------+
                                                  |
                                  +---------------+---------------+
                                  |    Integration & API Tests    |
                                  | Django REST TestClient (108)  |
                                  |  (Auth, Tokens, Net Worth)    |
                                  +---------------+---------------+
                                                  |
                          +-----------------------+-----------------------+
                          |              Unit Test Suite                  |
                          |  Django TestCase / Scikit-learn Unit (72)     |
                          | (Health Score, Naive Bayes, Decimal Accuracy) |
                          +-----------------------------------------------+
```

---

## 2. Test Execution Ledger & Master Summary

| Test Category | Framework / Tool | Test Target | Total Tests | Passed | Failed | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Backend App Unit Tests** | Django `unittest` / DRF | `backend/apps` | 72 | 72 | 0 | **PASS** |
| **Backend Integration Tests**| Django `unittest` / DRF | `backend/tests` | 108 | 108 | 0 | **PASS** |
| **Production Security Check**| `manage.py check --deploy`| Production Settings | 1 | 1 | 0 | **PASS** |
| **Frontend Standalone Build**| Next.js Compiler (`npm run build`) | `web/.next/standalone` | 1 | 1 | 0 | **PASS** |
| **Public Links & Legal E2E** | Playwright (`test_all_public_links.mjs`) | Web Client (24 routes) | 24 | 24 | 0 | **PASS** |
| **Viewport & Layout Audit** | Node Playwright (`audit_runner.js`) | Desktop & Mobile (14 routes) | 28 | 28 | 0 | **PASS** |
| **TOTAL VERIFIED SUITE** | Multi-Tier Test Suite | Complete MONVEX System | **234** | **234** | **0** | **PASS** |

---

## 3. Detailed Test Reports (Chapter 6.1 Matrix)

### 3.1 Unit Testing Suite (Chapter 5.2.1)

| Test ID | Module | Scenario / Objective | Inputs / Preconditions | Expected Result | Actual Result | Status | Evidence File |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UT-01** | `authentication` | Standard user registration | `{username: "alice", email: "alice@test.com", password: "StrongPassword123!"}` | HTTP 201 Created; profile seeded with default categories | User and profile created | **PASS** | `apps/authentication/tests.py` |
| **UT-02** | `authentication` | Duplicate email rejection | Existing email registered | HTTP 400 Bad Request with validation error message | Duplicate email rejected | **PASS** | `apps/authentication/tests.py` |
| **UT-03** | `authentication` | Password hashing verification | Raw password string | Argon2/PBKDF2 hash stored; raw password never persisted | Salted hash verified in DB | **PASS** | `apps/authentication/tests.py` |
| **UT-04** | `authentication` | TOTP MFA secret generation | Authenticated user session | Base32 secret string and valid `otpauth://` URI generated | QR code URI returned | **PASS** | `apps/authentication/test_mfa_auth.py` |
| **UT-05** | `authentication` | TOTP code validation | 6-digit TOTP code generated from secret | HTTP 200 OK; `is_mfa_enabled` updated to True | MFA successfully enabled | **PASS** | `apps/authentication/test_mfa_auth.py` |
| **UT-06** | `transactions` | Transaction creation with decimal amount | `{amount: Decimal('450.75'), type: 'EXPENSE', date: '2026-10-12'}` | HTTP 201 Created; amount persisted with 2 decimal places | Stored as `450.75` | **PASS** | `tests/test_api_endpoints.py` |
| **UT-07** | `transactions` | ML auto-categorization on missing category | Description: "Swiggy food delivery" | System assigns category "Food & Dining" with confidence > 0.85 | Assigned category "Food & Dining" | **PASS** | `tests/test_financial_engines.py` |
| **UT-08** | `transactions` | Natural language entry parsing | Text: "Spent 300 on fuel yesterday" | Amount=300.00, Date=Yesterday, Category="Transportation" | Entities parsed correctly | **PASS** | `tests/test_nlp_copilot.py` |
| **UT-09** | `budgets` | Budget limit variance calculation | Monthly budget: ₹10,000; Total expenses: ₹7,500 | `actual_spent = 7500`, `variance = 2500`, `consumed_pct = 75%` | Variance verified | **PASS** | `tests/test_financial_engines.py` |
| **UT-10** | `budgets` | Duplicate category budget prevention | Same user, same category, same period | Database raises `IntegrityError`; API returns 400 | Unique constraint enforced | **PASS** | `tests/test_financial_engines.py` |
| **UT-11** | `goals` | Savings goal contribution logging | Target: ₹50,000; Current: ₹10,000; Contribution: ₹5,000 | `current_amount` becomes ₹15,000; contribution logged | Atomically incremented | **PASS** | `tests/test_financial_engines.py` |
| **UT-12** | `goals` | Auto-completion upon reaching target | Target: ₹20,000; Current: ₹19,000; Contribution: ₹2,000 | `status` transitions to `COMPLETED` | Status set to `COMPLETED` | **PASS** | `tests/test_financial_engines.py` |
| **UT-13** | `analytics` | 360 Health Score calculation | Valid income, expenses, debt, and liquid savings | Deterministic integer score between 0 and 100 with grade | Returns Score: 82, Grade: A | **PASS** | `tests/test_financial_engines.py` |
| **UT-14** | `analytics` | Health Score division-by-zero protection | Income: 0.00, Expenses: 0.00 | Handles edge case gracefully; returns fallback score | Zero-income handled cleanly | **PASS** | `tests/test_financial_engines.py` |
| **UT-15** | `security` | Magic-byte upload validation | Executable ELF binary renamed as `.png` | File validation raises validation error; upload rejected | Disguised binary blocked | **PASS** | `apps/authentication/test_file_upload_security.py`|

---

### 3.2 Integration Testing Suite (Chapter 5.2.2)

| Test ID | Module | Scenario / Objective | Multi-Component Workflow | Expected Result | Actual Result | Status | Evidence File |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **IT-01** | `auth_flow` | Full login with HttpOnly cookie rotation | Client -> Login -> Refresh -> Protected Endpoint | Refresh token issued in cookie; access token rotated | Refresh cookie rotated cleanly | **PASS** | `apps/authentication/test_cookie_auth.py` |
| **IT-02** | `isolation` | Multi-tenant financial data isolation | User A attempts to read or mutate User B's transaction | HTTP 404 Not Found; User B's data unmodified | Cross-tenant access blocked | **PASS** | `tests/test_cyber_security.py` |
| **IT-03** | `net_worth` | Net worth aggregate portfolio updates | Asset created (₹5,00,000); Liability added (₹2,00,000) | Net worth calculated as ₹3,00,000 in `/net-worth/` API | Exact balance sheet match | **PASS** | `tests/test_v42_data_integrity.py` |
| **IT-04** | `debt_calc` | Debt Avalanche vs Snowball simulation | Multiple loans with different interest rates | Avalanche shows higher total interest saved | Avalanche interest verified | **PASS** | `tests/test_financial_engines.py` |
| **IT-05** | `receipt_ocr`| Receipt upload -> stage -> ledger confirm | Upload image -> Gemini Vision -> Staged -> Confirm | Creates permanent Transaction with linked Receipt FK | Flow completed end-to-end | **PASS** | `tests/test_api_endpoints.py` |
| **IT-06** | `ai_copilot`| AI multi-turn dialog with ledger context | User asks *"Where did I spend most?"* | AI aggregates categories and names top category accurately | Contextually grounded advice | **PASS** | `tests/test_nlp_copilot.py` |
| **IT-07** | `pdf_export`| Monthly PDF statement generation | Requests `/report/pdf/?year=2026&month=9` | Binary stream starting with `%PDF-1.4`; tables populated | Valid binary PDF streamed | **PASS** | `tests/test_api_endpoints.py` |
| **IT-08** | `security` | Session revocation invalidation | User clicks "Revoke All Sessions" | All existing refresh tokens blacklisted immediately | Tokens rejected on next call | **PASS** | `tests/test_cyber_security.py` |

---

### 3.3 End-to-End Playwright Browser Testing Suite

| Test ID | Scenario | Browser | Viewport | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **E2E-01**| Landing Page Footer -> Privacy Policy | Chromium | 1440x900 | Instant single-click load; URL `/privacy-policy`; 0 redirects | Loaded in 42ms | **PASS** |
| **E2E-02**| Landing Page Footer -> Terms of Service | Chromium | 1440x900 | Instant single-click load; URL `/terms-of-service`; 0 redirects | Loaded in 38ms | **PASS** |
| **E2E-03**| Landing Page Footer -> Security Overview | Chromium | 1440x900 | Instant single-click load; URL `/security-overview`; 0 redirects | Loaded in 40ms | **PASS** |
| **E2E-04**| Landing Page Footer -> Financial Disclaimer| Chromium | 1440x900 | Instant single-click load; URL `/financial-disclaimer`; 0 redirects| Loaded in 35ms | **PASS** |
| **E2E-05**| Landing Page Footer -> Contact Support | Chromium | 1440x900 | Instant single-click load; URL `/contact`; 0 redirects | Loaded in 45ms | **PASS** |
| **E2E-06**| Login Page Footer -> Legal Links | Chromium | 1440x900 | Direct link navigation without loop back to `/login` | Verified across all 5 links | **PASS** |
| **E2E-07**| Register Page Form -> Terms & Privacy | Chromium | 1440x900 | Direct link navigation without discarding registration form | Verified | **PASS** |
| **E2E-08**| Sidebar State Hydration Persistence | Chromium | 1440x900 | Sidebar maintains collapsed/expanded state across route changes | Zero flickering or resets | **PASS** |
| **E2E-09**| Browser Tab Focus Revalidation | Chromium | 1440x900 | Switching away and returning to browser tab preserves UI state | Zero unexpected collapses | **PASS** |
| **E2E-10**| Mobile Navigation Drawer Open/Close | Mobile WebKit | 390x844 | Drawer slides smoothly; navigation links route correctly | Zero horizontal scroll leak | **PASS** |

---

## 4. Test Evidence Paths & Execution Logs

* **Backend Unit & Integration Test Output:**  
  `Ran 180 tests in 48.215s — OK (0 failures, 0 errors)`.
* **Playwright Automated Public Links Validation Log:**  
  `24 / 24 public legal and navigation links passed with 0 unrecoverable errors and 0 unwanted login redirects`.
* **Viewport Screenshot Audit Report:**  
  `audit_results.json` covering 14 routes across desktop (`1440x900`) and mobile (`390x844`) viewports with zero console errors.
