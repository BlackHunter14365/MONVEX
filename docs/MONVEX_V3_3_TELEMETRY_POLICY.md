# MONVEX V3.3 — Observability Data Retention & Privacy Policy

> **Document Type:** Production Telemetry, Data Retention & Privacy Governance  
> **Release Target:** MONVEX Enterprise v3.3  
> **Date:** August 25, 2026

---

## 1. Core Principles

1. **Zero Secret Retention:** Telemetry layers never store, log, or persist passwords, JWT tokens, OTPs, or API keys.
2. **Metadata Over Payload:** API logs record HTTP method, status, path, latency, and request ID — never full request/response bodies containing private transactions.
3. **Strict Tenant Segregation:** All log aggregation and audit queries are strictly scoped to the authenticated `user_id`.

---

## 2. Telemetry Retention Schedule

| Telemetry Type | Storage Engine | Fields Recorded | Retention Period | Deletion / Rotation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Security Audit Logs** | `SecurityAuditLog` (PostgreSQL) | `user`, `event_type`, `severity`, `source_ip`, `user_agent`, `endpoint`, `metadata` | 90 Days | Automated database partition pruning |
| **AI Conversation Turns** | `ConversationSession` & `ConversationMessage` | `user`, `sender`, `content`, `intent`, `tools_used`, `tool_activity`, `citations`, `data` | User-Controlled | Hard-deleted upon user request via `/api/v1/ai/conversations/{id}/` |
| **WAF Interceptions** | `SecurityAuditLog` | `threat_type`, `source_ip`, `endpoint`, `timestamp` | 180 Days | Exported to cold compliance storage |
| **HTTP Access Logs** | Render / Web Server Standard Out | `request_id`, `method`, `path`, `status`, `duration_ms`, `user_id` | 30 Days | Render automatic rolling log buffer |

---

## 3. Sensitive Data Redaction Specifications

```
Incoming Request Header: Authorization: Bearer eyJhbGciOi...
Logged Header:           Authorization: [REDACTED]

Incoming Payload:        {"password": "MySecretPassword123!"}
Logged Payload:          {"password": "[REDACTED]"}

Incoming OTP:            {"otp": "492019"}
Logged Verification:     {"event": "OTP_VERIFIED", "session_id": "a43a6..."}
```
