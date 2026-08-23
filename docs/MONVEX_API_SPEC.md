# MONVEX 2.0 REST API Specification

## 1. Authentication & Security Headers
All requests must include standard JWT Bearer token:
`Authorization: Bearer <access_token>`

WAF Defense Middleware enforces:
- SQL Injection pattern rejection (403 Forbidden)
- XSS tag stripping and attack interception (403 Forbidden)
- Path Traversal directory climb prevention (403 Forbidden)

---

## 2. API Endpoint Matrix

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login/` | Authenticate user & issue JWT |
| `GET` | `/api/v1/analytics/dashboard/` | Core metrics, velocity, Health Score 2.0 |
| `POST` | `/api/v1/ai/copilot/ask/` | Structured AI Copilot reasoning |
| `POST` | `/api/v1/ai/simulator/` | What-If Financial Simulator computation |
| `GET` | `/api/v1/transactions/net-worth/` | Balance sheet: Assets, Liabilities, Net Worth |
| `GET/POST` | `/api/v1/transactions/assets/` | List and register assets |
| `GET/POST` | `/api/v1/transactions/liabilities/` | List and register liabilities |
| `GET` | `/api/v1/transactions/debt-planner/` | Debt amortization and loan overview |
| `POST` | `/api/v1/transactions/debt-simulate/` | Extra loan prepayment acceleration |
| `GET` | `/api/v1/transactions/receipts/` | List extracted receipts |
| `POST` | `/api/v1/transactions/receipts/upload/` | Upload & OCR receipt entities |
| `POST` | `/api/v1/transactions/receipts/<id>/confirm/` | Confirm receipt & post to ledger |
| `GET` | `/api/v1/transactions/why/` | Root-cause spending variance attribution |
| `GET` | `/api/v1/transactions/duplicates/` | Detect duplicate transaction entries |
| `GET` | `/api/v1/transactions/notifications/` | Filterable smart alerts & notifications |
| `GET` | `/api/v1/transactions/report/monthly/` | Executive monthly statement |
| `GET` | `/api/v1/security/overview/` | Threat defense & active session telemetry |
| `POST` | `/api/v1/security/scan/` | Run real-time security posture audit |
| `POST` | `/api/v1/security/revoke-sessions/` | Revoke all active sessions & refresh tokens |
