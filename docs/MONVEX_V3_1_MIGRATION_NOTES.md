# MONVEX V3.1 — Migration Notes & Development Guidelines

> **Document Type:** Architectural Migration Notes & Operational Guidelines  
> **Target Release:** MONVEX Enterprise v3.1  
> **Date:** August 25, 2026

---

## 1. Architectural Principles (v3.1)

1. **Backend = Single Source of Truth:**
   - All financial logic and aggregations live in deterministic Python services (`finance_service.py`, `budget_service.py`, `anomaly_service.py`).
2. **Deterministic Financial Math:**
   - Never use `float` for currency calculations in backend or AI tools. Use Python `Decimal` (`ROUND_HALF_UP`).
3. **Server State Standard:**
   - All server data fetching must use `@tanstack/react-query` v5 custom query hooks (`@/hooks/queries/`).
   - Mutations must use custom mutation hooks (`@/hooks/mutations/`) with automated query invalidation.
4. **Client UI State Standard:**
   - Transient UI state (drawer open/close, active theme, currency preferences) lives in `@/lib/store/uiStore.ts` (Zustand). Server data must NOT be copied into Zustand.
5. **Form & Validation Standard:**
   - Forms must use `react-hook-form` paired with `zod` schemas (`@/lib/validation/schemas.ts`).
6. **API Architecture Standard:**
   - All HTTP interactions must use the modular domain endpoint classes in `web/src/lib/api/endpoints/`.
