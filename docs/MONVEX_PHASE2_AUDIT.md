# MONVEX Phase 2 — Universal Search & Command Center Audit

**Document Status**: LOCKED AUDIT  
**Phase**: Phase 2 — Universal Search + Command Center + API Contract Freeze  
**Audit Date**: August 22, 2026  
**Auditor**: Antigravity Core Architect  

---

## 1. Existing Search Implementation

- **Transactions Filter**: The `/transactions` view performs client-side substring matching on merchant name and description from the paginated ledger.
- **AI Tool Search (`tools.search_transactions`)**: Backend AI service contains `search_transactions(query, limit)` in `backend/services/ai/tools.py`, filtering `Transaction.objects.filter(user=user, ...)` using Django `icontains` on merchant and description.
- **Missing Global Search API**: There is currently NO dedicated `/api/v1/search/` endpoint that aggregates cross-entity search (Transactions, Accounts, Budgets, Goals, AI Conversations, and Navigation actions) in a single fast backend query.

---

## 2. Existing Reusable Backend Services & Models

- `apps.transactions.models.Transaction`: Scoped to `user`. Fields: `merchant`, `description`, `amount`, `date`, `category`, `source`.
- `apps.transactions.models.Account`: Scoped to `user`. Fields: `name`, `institution`, `type`, `balance`, `currency`.
- `apps.budgets.models.Budget`: Scoped to `user`. Fields: `name`, `category__name`, `limit_amount`, `spent_amount`.
- `apps.goals.models.SavingsGoal`: Scoped to `user`. Fields: `title` / `name`, `target_amount`, `current_amount`, `target_date`.
- `apps.ai_copilot.models.ConversationSession`: Scoped to `user`. Fields: `title`, `created_at`, `updated_at`.
- `apps.security.models.SecurityAuditLog`: Records search and security events.

---

## 3. Existing Reusable Frontend UI Components & Tokens

- **UI Primitives (`web/src/components/ui/`)**:
  - `Button.tsx`: Variants (`primary`, `outline`, `ghost`, `secondary`), loading state (`<Loader2 />`), focus rings.
  - `Badge.tsx`: Semantic badges (`brand`, `success`, `warning`, `danger`, `neutral`).
  - `Modal.tsx`: Accessible dialog container (`role="dialog"`, scroll-lock, backdrop blur/click, Escape key listener).
  - `Skeleton.tsx`: Content loading placeholders.
  - `EmptyState.tsx`: Dashed border container for zero-result states.
- **Finance Modals (`web/src/components/finance/`)**:
  - `AddTransactionModal.tsx`: Existing modal form for creating transactions (`monvex:open-add-transaction`).
  - `AddAccountModal.tsx`: Existing modal form for linking bank accounts and cards (`monvex:open-add-account`).
- **Design Tokens (`web/src/styles/tokens.css` / `globals.css`)**:
  - Background: `--mx-background` (`#F6F5F1`), Surface: `--mx-surface` (`#FFFFFF`), Text Primary: `--mx-text-primary` (`#172033`), Text Secondary: `--mx-text-secondary` (`#5F6878`), Borders: `--mx-border` (`#E4E2DC`).
  - Font: Inter (`var(--font-sans)`), Monospace (`var(--font-mono)`), `tabular-nums`.

---

## 4. Existing API Routes (`/api/v1/`)

- `POST /api/v1/auth/login/`, `POST /api/v1/auth/register/`, `POST /api/v1/auth/google/`
- `GET/POST /api/v1/transactions/`, `GET /api/v1/transactions/export/`
- `GET/POST /api/v1/budgets/`, `GET /api/v1/budgets/overview/`
- `GET/POST /api/v1/goals/`, `POST /api/v1/goals/<id>/contribute/`
- `GET /api/v1/analytics/dashboard/`, `GET /api/v1/analytics/health-score/`, `GET /api/v1/analytics/cashflow-forecast/`
- `POST /api/v1/ai/chat/`, `GET /api/v1/ai/conversations/`
- `GET /api/v1/security/overview/`, `GET /api/v1/security/logs/`
- `POST /api/v1/contact/`

---

## 5. Existing Authorization Mechanisms

- **JWT Authentication (`rest_framework_simplejwt`)**: All private endpoints require `IsAuthenticated` permission.
- **Strict User Scoping**: Backend queries enforce `filter(user=request.user)`.
- **Zero Client Identity Trust**: Backend derives user identity strictly from the verified JWT payload (`request.user`), never from request parameters.

---

## 6. Existing Keyboard Shortcut Implementation

- `web/src/components/ui/Modal.tsx` listens for `Escape` to close dialogs.
- `web/src/components/finance/AddTransactionModal.tsx` responds to custom `window` event `monvex:open-add-transaction`.
- No global `Ctrl+K` / `Cmd+K` listener currently exists in `AppShell` or `Topbar`.

---

## 7. Existing Command Palette Implementation

- Currently **MISSING** in the repository.
- There is no existing Command Palette or Command Center component.

---

## 8. What is Missing

1. **Backend Universal Search Endpoint (`GET /api/v1/search/?q={query}`)**:
   - Multi-entity user-scoped query engine aggregating:
     - Transactions (matches merchant, description, category name)
     - Accounts & Wallets (matches name, institution, type)
     - Budgets (matches name, category name)
     - Savings Goals (matches title/name)
     - AI Conversations (matches title)
     - Quick Navigation Actions (Dashboard, Transactions, Accounts, Budgets, Goals, Analytics, AI, Settings, Security)
   - Proper result limits (top 5 per category, max 25 total) to maintain sub-50ms latency.
2. **Frontend Command Center Modal (`web/src/components/search/CommandCenter.tsx`)**:
   - Global `Ctrl+K` / `Cmd+K` keyboard shortcut trigger.
   - Arrow Up / Arrow Down keyboard navigation.
   - Enter to activate navigation or trigger existing modals.
   - Categorized search results with clear icons and metadata.
   - Search input autofocus on open.
   - Empty state, error state, and debounce mechanism (200ms).
3. **Topbar & Mobile Search Trigger**:
   - Visible search button in `Topbar` with `Ctrl+K` / `⌘K` badge.
   - Touch-friendly search button in `MobileNav` opening the Command Center.

---

## 9. What Will Be Changed

1. **`backend/apps/transactions/views_extra.py` & `urls.py`**:
   - Add `UniversalSearchView` implementing user-scoped multi-entity queries.
   - Register route `GET /api/v1/search/`.
2. **`backend/apps/transactions/test_search.py`**:
   - Add automated test suite verifying authenticated search, query validation, entity coverage, and strict multi-tenant user isolation.
3. **`web/src/lib/api.ts`**:
   - Add `search(query: string)` method to `ApiClient`.
4. **`web/src/components/search/CommandCenter.tsx`**:
   - Create canonical Command Center modal reusing design system tokens and event triggers.
5. **`web/src/components/layout/AppShell.tsx` & `Topbar.tsx` & `MobileNav.tsx`**:
   - Mount `CommandCenter` and bind keyboard shortcuts + UI trigger buttons.
6. **`docs/API_CONTRACT.md`**:
   - Formalize and freeze the complete V2 REST API contract across all 11 domains.

---

## 10. What Will NOT Be Changed

- **Existing Financial Engine**: Deterministic calculation algorithms (`financial_health.py`, `forecasting.py`, `affordability.py`, `debt_service.py`) will NOT be touched.
- **Existing AI 2.0 Service**: `gemini_client.py` and tools suite will NOT be rewritten.
- **Existing Authentication System**: Password hashing (Argon2), OTP email verification, and Google Sign-In will NOT be altered.
- **Existing Database Schema**: No destructive migrations or table redesigns.
- **Existing Web Views**: Dashboard, Transactions, Budgets, Goals, Analytics, and Settings pages will remain completely intact.
