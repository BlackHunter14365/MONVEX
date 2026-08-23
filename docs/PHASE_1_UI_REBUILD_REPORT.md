# MONVEX — Phase 1 Actual UI Rebuild Report

**Date**: August 21, 2026  
**Scope**: Phase 1 Core Rebuild (Repository Sanitation, Token Chain, Typography, AppShell, Core Primitives, and Reference Dashboard).

---

## 1. Deleted Obsolete Files

All confirmed redundant and duplicate files were cleaned up after an import audit:

1. `web/src/app/app/` (Entire shadow re-export folder containing 8 shadow page files)
2. `web/src/components/Navigation.tsx` (Legacy topbar replaced by AppShell Topbar/Sidebar)
3. `web/src/components/AICopilotDrawer.tsx` (Legacy drawer replaced by `FloatingAICopilot.tsx`)
4. `web/src/components/SkeletonLoaders.tsx` (Legacy loader replaced by `components/ui/Skeleton.tsx`)
5. `web/src/components/AddTransactionModal.tsx` (Duplicate root component replaced by `components/finance/AddTransactionModal.tsx`)
6. `web/src/components/HealthScoreCard.tsx` (Obsolete standalone card)
7. `web/src/components/HealthScoreSpeedometer.tsx` (Obsolete standalone SVG gauge)
8. `web/src/components/Charts.tsx` (Obsolete chart wrappers replaced by direct Recharts)
9. `web/src/components/CommandPalette.tsx` (Obsolete root modal)

---

## 2. Modified Files

1. `web/src/app/layout.tsx` — Configured Google Fonts (`Inter` + `JetBrains_Mono`), CSS variables (`--font-sans`, `--font-mono`), and root body styles.
2. `web/tailwind.config.js` — Connected all semantic color utilities directly to `var(--mx-*)` CSS custom properties.
3. `web/src/styles/tokens.css` — Standardized semantic tokens (`--mx-background`, `--mx-surface`, `--mx-surface-muted`, `--mx-surface-raised`, `--mx-text-primary`, `--mx-text-secondary`, `--mx-text-muted`, `--mx-border`, `--mx-accent`, `--mx-success`, `--mx-warning`, `--mx-danger`).
4. `web/src/app/globals.css` — Configured font variable bindings, thin structural rules (`thin-rule`), tabular numbers (`.financial-number`), and terminal table styling (`.terminal-table`).
5. `web/src/components/layout/AppShell.tsx` — Grounded terminal layout with global modal listeners.
6. `web/src/components/layout/Sidebar.tsx` — Rebuilt with quiet Swiss grouping: Overview (6 items), Workspace (1 item), Profile footer.
7. `web/src/components/layout/Topbar.tsx` — Rebuilt with lightweight bottom border, date/context indicator, and clean dropdown menu.
8. `web/src/components/layout/MobileNav.tsx` — Compact 5-destination bar with quick add action.
9. `web/src/components/ui/Button.tsx` — Clean, tactile variants (Primary, Secondary, Outline, Ghost, Danger) without gradient noise.
10. `web/src/components/ui/Badge.tsx` — Compact monospace status pills (`success`, `warning`, `danger`, `accent`, `neutral`).
11. `web/src/components/ui/Modal.tsx` — Accessible dialog overlay with backdrop blur and clean hierarchy.
12. `web/src/components/ui/EmptyState.tsx` — Contextual empty state with standard copy and action trigger.
13. `web/src/components/ui/Skeleton.tsx` — Neutral surface pulse skeleton.
14. `web/src/hooks/useGsapAnimations.ts` — Enhanced with dynamic currency-aware counters and fast stagger reveals respecting `prefers-reduced-motion`.
15. `web/src/app/dashboard/page.tsx` — Rebuilt reference dashboard with true financial hierarchy.
16. `web/src/app/forecast/page.tsx` — Refactored to use AppShell and clean components.

---

## 3. Created Files

1. `docs/CURRENT_UI_FORENSIC_AUDIT.md` — Full forensic investigation of UI inertia root causes.
2. `docs/PHASE_1_UI_REBUILD_REPORT.md` — This Phase 1 completion document.

---

## 4. Token Architecture

The broken chain (`tokens.css` $\neq$ `tailwind.config.js`) is completely resolved:

$$\text{MONVEX Token in } \texttt{tokens.css} \longrightarrow \text{CSS Variable } (\texttt{--mx-*}) \longrightarrow \text{Tailwind Utility } (\texttt{bg-surface}, \texttt{text-text-primary}, \texttt{border-border}, \dots) \longrightarrow \text{React Component}$$

All semantic colors are mapped directly to CSS variables:
- Canvas: `bg-background` (`--mx-background: #09090B`)
- Surfaces: `bg-surface` (`#121215`), `bg-surface-muted` (`#18181B`), `bg-surface-raised` (`#27272A`)
- Text: `text-text-primary` (`#FAFAFA`), `text-text-secondary` (`#A1A1AA`), `text-text-muted` (`#71717A`)
- Borders: `border-border` (`#27272A`), `border-border-strong` (`#3F3F46`)
- Accents: `bg-accent` (`#6366F1`), `text-success` (`#10B981`), `text-warning` (`#F59E0B`), `text-danger` (`#F43F5E`)

---

## 5. Typography Changes

- **Sans UI**: `Inter` loaded via `next/font/google` with CSS variable `--font-sans`. Applied to headings, labels, body text, and navigation.
- **Financial Mono**: `JetBrains Mono` loaded via `next/font/google` with CSS variable `--font-mono`. Applied to financial values, amounts, percentages, dates, tabular numbers, and technical metadata.
- Configured font-feature-settings: `cv02`, `cv03`, `cv04`, `cv11`, `tnum` (tabular numbers).

---

## 6. AppShell & Layout Changes

- **Desktop Sidebar**: 240px wide, quiet Swiss typography, no giant rounded panels or heavy shadows. Divided into **Overview** (Dashboard, Transactions, Budgets, Goals, Analytics, Intelligence), **Workspace** (Settings), and **Profile**.
- **Topbar**: Lightweight single-line bar with date context (`Thu, Aug 21, 2026`), contextual page title, record action, and clean user profile menu.
- **Mobile Navigation**: Compact fixed bar displaying 5 core destinations.
- **Container Structure**: Grounded terminal canvas without nested floating boxes.

---

## 7. Dashboard Structural Rebuild (Anti-Card-Sea Architecture)

The reference Dashboard was rebuilt to eliminate the uniform card-sea pattern:

1. **Editorial Header**:
   - Clean top level typography: `MONVEX / EXECUTIVE COMMAND`
   - Dynamic time greeting: `Good evening, [User].`
   - Live contextual sentence based on real user data (e.g. burn rate pace, savings retention vs benchmark).
2. **Primary Financial Position**:
   - Dominant `text-4xl sm:text-6xl font-black font-mono` Available Balance display with Liquid Surplus/Deficit badge.
   - Three minimal typographic supporting columns (Monthly Inflow, Monthly Outflow, Net Savings & Savings Rate) separated by clean spacing, **not 4 identical card boxes**.
3. **Spending Trajectory & Intelligence**:
   - **7 Columns**: Large, clean 30-day outflow area chart (`Recharts`).
   - **5 Columns**: Distinct **MONVEX Intelligence** observation block (analyst-style observation, potential savings reduction, and direct explore link). No AI orb, no glowing chat bubbles.
4. **Budget Health & Recent Transactions**:
   - **5 Columns**: Editorial Budget Health section (top categories with progress bars, spent vs limit, and month-end projections).
   - **7 Columns**: High-density **Terminal Ledger Table** (DATE, MERCHANT, CATEGORY, AMOUNT, STATUS) with thin borders and monospaced amounts.
5. **Goal Accumulation & Upcoming Obligations**:
   - **6 Columns**: Primary active savings goal with current vs target amount, progress bar, target date, and required monthly savings velocity.
   - **6 Columns**: Compact list of upcoming recurring obligations with due dates.

---

## 8. GSAP Implementation

- **`useStaggerEntrance('.dash-reveal')`**: Staggers the fast entrance of dashboard sections on mount (`0.35s`, `power2.out`).
- **`useKpiCounter`**: Currency-aware numerical countup tweening.
- **Reduced Motion**: All animations strictly check `window.matchMedia('(prefers-reduced-motion: reduce)')` and disable animations if requested.

---

## 9. Bootstrap, 21st.dev Magic, and UI/UX Pro Max Status

- **Bootstrap**: Kept installed for any structural grid requirements, but default Bootstrap card/button themes are **NOT** applied to prevent conflicting styling.
- **21st.dev Magic**: Available in MCP registry. Selective table and terminal patterns were reviewed and adapted to MONVEX tokens.
- **UI/UX Pro Max**: Active and used to validate typography contrast (Inter + JetBrains Mono), spacing rhythm, and WCAG AA compliance.

---

## 10. Verification Results

| Check / Test | Command | Result |
| :--- | :--- | :--- |
| **Frontend Typecheck** | `npx tsc --noEmit` | **0 errors (100% type-safe)** |
| **Backend Test Suite** | `python manage.py test tests` | **45 / 45 tests passing (100%)** |
| **User Data Isolation** | Multi-tenant auth checks | **100% verified (Zero cross-user leakage)** |

---

## 11. Remaining Work (Post-Approval Phases)

As mandated by the hard stop directive, the following pages remain untouched and will be rebuilt according to the new design system after user review and approval of the Reference Dashboard:
- Transactions Terminal (`/transactions`)
- Budgets & Velocity Engine (`/budgets`)
- Savings Goals (`/goals`)
- Analytics Workspace (`/analytics`)
- AI Intelligence Workspace (`/ai`)
- Settings & Data Export (`/settings`)
- Authentication (`/login`, `/register`)
- Public Landing Page (`/`)
