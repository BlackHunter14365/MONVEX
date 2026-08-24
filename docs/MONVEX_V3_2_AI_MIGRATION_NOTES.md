# MONVEX V3.2 — AI Copilot Migration & Operational Notes

> **Document Type:** AI Copilot Migration Guide & Operational Manual  
> **Release Target:** MONVEX v3.2  
> **Date:** August 25, 2026

---

## 1. Breaking Changes & Deprecations

- **Zero Breaking API Changes:** All endpoints (`/api/v1/ai/chat/`, `/api/v1/ai/conversations/`, `/api/v1/ai/simulate/`) maintain full backward compatibility with legacy clients.
- **Bug Fixes:**
  - Fixed `SavingsGoal` deadline attribute lookup in `get_goals` tool (was accessing non-existent `target_date`).
  - Fixed subscription intent routing to invoke dedicated `get_recurring_expenses` rather than general cashflow.
  - Added variance attribution handling for *"why did my spending increase"* queries to invoke `compare_periods`.

---

## 2. Environment Variables & Setup

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | `""` | Official Google Gemini API Key. If omitted, MONVEX automatically operates via the Deterministic Fallback Engine. |
| `MONVEX_AI_MODEL` | Optional | `gemini-2.0-flash` | Gemini model name used for live function calling and reasoning. |
