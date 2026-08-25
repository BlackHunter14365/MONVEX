# MONVEX V4.0 — Financial Intelligence Platform Architecture

============================================================
ARCHITECTURE OVERVIEW
============================================================

MONVEX V4.0 transforms the application from a personal finance recorder into a full-scale **Financial Intelligence Platform**.

---

## 1. System Architecture Diagram

```
                         ┌─────────────────────┐
                         │      USER           │
                         │ Web / Windows App   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   AI CHAT UI        │
                         │ Streaming Composer  │
                         │ History / Context   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ AI REQUEST LAYER    │
                         │ Auth + Request ID   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ FinancialAgentOrchestrator   │
                    │                               │
                    │ Intent Detection (16 intents) │
                    │ Context Selection             │
                    │ Tool Routing                  │
                    │ Security Guardrails           │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐    ┌───────────────┐
      │ Financial     │     │ Analytics /   │    │ Search /      │
      │ Tools         │     │ Forecast Tools│    │ Context Tools │
      └───────┬───────┘     └───────┬───────┘    └───────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ DOMAIN SERVICES     │
                         │ Decimal Math        │
                         │ Business Rules      │
                         │ Authorization       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    POSTGRESQL       │
                         │ Financial Source    │
                         │ of Truth            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ VERIFIED RESULT     │
                         └──────────┬──────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                ┌────────────────┐    ┌─────────────────┐
                │ Gemini / AI    │    │ Deterministic   │
                │ Reasoning      │    │ Financial Math  │
                └───────┬────────┘    └────────┬────────┘
                        │                      │
                        └──────────┬───────────┘
                                   ▼
                         ┌─────────────────────┐
                         │ RESPONSE BUILDER    │
                         │ Text + Cards +       │
                         │ Charts + Insights    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ AI WORKSPACE        │
                         │ Streaming Response  │
                         │ Interactive Graphs  │
                         │ Financial Cards     │
                         └─────────────────────┘
```

---

## 2. Invariants & Security Principles

1. **Deterministic Calculations**: The LLM NEVER computes authoritative financial values. All numbers originate from PostgreSQL queries evaluated in Python `Decimal`.
2. **Multi-Tenant Isolation**: Every database query is strictly scoped to `user=request.user`.
3. **Structured Response Generation**: Visual cards and charts are constructed from verified datasets via `FinancialResponseBuilder`, preventing arbitrary LLM visual fabrication.
4. **Zero HTML Injections**: AI response text is safely rendered using sanitized React component mappings.
5. **No Chain-of-Thought Leaks**: Only high-level transparent tool execution signals are rendered in the client interface.
