# MONVEX Current UI Forensic Audit & Diagnostic Report

**Date**: August 21, 2026  
**Auditor**: Antigravity Lead UI/UX & Frontend Architect  
**Scope**: Full forensic inspection of the `web/` codebase, design tokens, Tailwind configuration, component architecture, layout system, and root causes of visual inertia.

---

## 1. Current Frontend Stack

- **Framework**: Next.js 14.2.5 (App Router) + React 18.3.1 + TypeScript 5.5.4
- **Styling Engine**: Tailwind CSS 3.4.7 + PostCSS 8.4.40 + Autoprefixer 10.4.19
- **CSS Utility Tooling**: `clsx` 2.1.1, `tailwind-merge` 2.4.0
- **Iconography**: `lucide-react` 0.424.0
- **Data Visualization**: `recharts` 2.12.7
- **Motion & Micro-interactions**: `gsap` 3.12.5
- **Grid / Framework Package**: `bootstrap` 5.3.3 (Installed in `package.json`, but **NEVER imported in CSS**)
- **State Management**: React Context (`AuthContext.tsx`, `ToastContext.tsx`) + Local Storage Session Token persistence + Direct API Client (`/lib/api.ts`)

---

## 2. Current Route Structure

The repository contains 10 primary App Router routes, alongside shadow legacy routes:

```text
web/src/app/
├── (auth)/
│   ├── login/page.tsx               # Sign In
│   ├── register/page.tsx            # Sign Up / Registration
│   └── forgot-password/page.tsx     # Password Reset
├── (authenticated)/
│   ├── dashboard/page.tsx           # Primary Command Center
│   ├── transactions/page.tsx        # Transactions Ledger
│   ├── budgets/page.tsx             # Budgets & Velocity
│   ├── goals/page.tsx               # Savings Goals & Milestones
│   ├── analytics/page.tsx           # Financial Analytics
│   ├── ai/page.tsx                  # Dedicated AI Copilot Workspace
│   ├── forecast/page.tsx            # [LEGACY] Cashflow Forecast Page
│   └── settings/page.tsx            # User Preferences & Data Export
├── app/                             # [DUPLICATE/SHADOW DIRECTORY]
│   ├── page.tsx, ai/page.tsx, analytics/page.tsx, budgets/page.tsx,
│   ├── dashboard/page.tsx, goals/page.tsx, settings/page.tsx, transactions/page.tsx
│   (These files only contain single-line re-exports: `export { default } from '@/app/dashboard/page'`)
├── layout.tsx                       # Root Layout (Inter font, Providers)
├── globals.css                      # Global Stylesheet
└── page.tsx                         # Public Landing Page
```

---

## 3. Current AppShell / Layout Architecture

Authenticated pages are wrapped by `web/src/components/layout/AppShell.tsx`:
- **Desktop Sidebar** (`web/src/components/layout/Sidebar.tsx`): 64px width sticky left column with brand mark, "Record Transaction" action, 7 nav links, and user footer.
- **Topbar** (`web/src/components/layout/Topbar.tsx`): Sticky header with route title, quick transaction button, and user dropdown.
- **Mobile Bottom Navigation** (`web/src/components/layout/MobileNav.tsx`): Fixed bottom bar for `< lg` screens.
- **Global Floating AI Copilot** (`web/src/components/ai/FloatingAICopilot.tsx`): Fixed bottom-right launcher button and expandable drawer.
- **Global Transaction Modal** (`web/src/components/finance/AddTransactionModal.tsx`): Managed at shell level.

**Legacy Layout Remaining in Repo**:
- `web/src/components/Navigation.tsx`: Legacy top navigation bar previously used before `AppShell`. Still imported by `web/src/app/forecast/page.tsx`.

---

## 4. Current Design System

The project currently has two competing, unlinked design systems:
1. **Design System A (CSS Variables in `tokens.css`)**:
   - Variables defined: `--mx-bg`, `--mx-surface-0`, `--mx-surface-1`, `--mx-surface-2`, `--mx-text-primary`, `--mx-text-secondary`, `--mx-brand-primary`, `--mx-inflow-success`, etc.
2. **Design System B (Tailwind Theme in `tailwind.config.js`)**:
   - Hardcoded hex definitions: `background: '#09090B'`, `surface: { 50: '#18181B', 100: '#121214', 200: '#1C1C20', 300: '#27272A', border: '#27272A' }`, `brand: { 500: '#6366F1', 600: '#4F46E5' }`.

**Critical Flaw**: `tailwind.config.js` does NOT reference the CSS variables in `tokens.css`. As a result, changing tokens in `tokens.css` does not alter Tailwind utility classes like `bg-surface-100` or `text-zinc-400`.

---

## 5. Current Typography

- **Configured in `layout.tsx`**:
  ```tsx
  const inter = Inter({ subsets: ['latin'] });
  ```
- **Configured in `tailwind.config.js`**:
  ```js
  fontFamily: {
    sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['var(--font-mono)', 'Fira Code', 'monospace'],
    display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
  }
  ```
- **Defects**:
  - `layout.tsx` does NOT attach `--font-sans` or `--font-mono` CSS variable classes to `<body>` or `<html>`.
  - `JetBrains Mono` is neither imported from Google Fonts nor bundled locally.
  - As a result, all tabular/financial mono numbers render in standard browser default monospace fonts.

---

## 6. Current Colors

| Semantic Purpose | Token Name | Actual Rendered Hex / Tailwind Class |
| :--- | :--- | :--- |
| **Canvas Background** | `--mx-bg` | `#09090B` (`bg-background`) |
| **Ground Card / Panel**| `--mx-surface-0` / `--mx-surface-100` | `#121214` (`bg-surface-100` / `.editorial-panel`) |
| **Elevated Control** | `--mx-surface-2` / `--mx-surface-200` | `#1C1C20` / `#27272A` (`bg-surface-200`) |
| **Border Line** | `--mx-border-subtle` / `--mx-surface-border`| `#27272A` (`border-surface-border`) |
| **Primary Brand** | `--mx-brand-primary` / `--mx-brand` | `#6366F1` / `#4F46E5` (`bg-brand-600`) |
| **Inflow / Surplus** | `--mx-inflow-success` / `--mx-success` | `#10B981` (`text-emerald-400`, `bg-emerald-500/10`) |
| **Outflow / Deficit** | `--mx-outflow-danger` / `--mx-danger` | `#F43F5E` (`text-rose-400`, `bg-rose-500/10`) |
| **Warning / Pacing** | `--mx-velocity-warning` / `--mx-warning`| `#F59E0B` (`text-amber-400`) |

---

## 7. Current Spacing

- Uses Tailwind's standard 4px scale (`p-4` = 16px, `p-6` = 24px, `gap-4` = 16px, `gap-6` = 24px, `space-y-6` = 24px).
- Container maximum width is globally capped at `max-w-7xl` in `AppShell.tsx`.
- Sidebar is fixed at `w-64` (256px).
- Topbar is fixed at `h-16` (64px).

---

## 8. Current Border & Radius System

- **Borders**: 1px solid `#27272A` (`border border-surface-border`).
- **Corner Radii**:
  - `rounded-xl` (`12px`): Extensively applied to virtually every input, button, table container, and card.
  - `rounded-2xl` (`16px`): Applied to modal overlays and `.editorial-panel`.
  - `rounded-lg` (`8px`): Applied to badges and status chips.

---

## 9. Current Component Architecture

```text
web/src/components/
├── ui/                                # Atomic primitives
│   ├── Button.tsx                     # Polymorphic button (primary, secondary, outline, ghost, danger, neo)
│   ├── Badge.tsx                      # Semantic badges (indigo, emerald, amber, rose, neutral, outline)
│   ├── Modal.tsx                      # Accessible Dialog overlay with Backdrop blur
│   ├── EmptyState.tsx                 # Empty state placeholder
│   └── Skeleton.tsx                   # Pulse loading skeleton
├── layout/                            # Shell scaffolding
│   ├── AppShell.tsx                   # Master wrapper for authenticated pages
│   ├── Sidebar.tsx                    # Left-hand navigation
│   ├── Topbar.tsx                     # Header bar
│   ├── MobileNav.tsx                  # Bottom bar (< 1024px)
│   └── PageHeader.tsx                 # Standardized title + kicker + badge + action slot
├── finance/                           # Financial domain components
│   └── AddTransactionModal.tsx        # Voice / NLP / Manual transaction entry modal
├── ai/                                # AI intelligence components
│   └── FloatingAICopilot.tsx          # Global bottom-right expandable copilot
└── [LEGACY / DUPLICATE ROOT COMPONENTS]
    ├── Navigation.tsx                 # Old topbar (deprecated)
    ├── AddTransactionModal.tsx        # Duplicate of finance/AddTransactionModal.tsx (deprecated)
    ├── AICopilotDrawer.tsx            # Old drawer (deprecated)
    ├── Charts.tsx                     # Old chart components (deprecated)
    ├── CommandPalette.tsx             # Standalone palette (deprecated)
    ├── HealthScoreCard.tsx            # Standalone card (deprecated)
    ├── HealthScoreSpeedometer.tsx     # Standalone SVG gauge (deprecated)
    └── SkeletonLoaders.tsx            # Standalone loader (deprecated)
```

---

## 10. Current Dashboard Structure (`web/src/app/dashboard/page.tsx`)

The current reference dashboard is laid out in vertical sequence:
1. **Editorial Header**: Greeting ("Good evening, [User]"), live telemetry status badge, primary currency indicator.
2. **Asymmetric Flow Grid (12 cols)**:
   - **Col 7**: Large Net Liquid Balance (`₹X,XX,XXX.00`) + Inflow / Outflow / Savings strip.
   - **Col 5**: Monthly Savings Rate (`X%`) + Daily Burn Rate velocity progress bar.
3. **Trajectory & Intelligence Grid (12 cols)**:
   - **Col 7**: 90-Day Cash Flow Trajectory area chart (`Recharts`).
   - **Col 5**: MONVEX Decision Support Engine insight panel with link to AI Workspace.
4. **Budget Health & Activity Grid (12 cols)**:
   - **Col 5**: Monthly Budget Health list with progress bars.
   - **Col 7**: Recent Ledger Activity table.
5. **Accumulation & Obligations Grid (12 cols)**:
   - **Col 6**: Savings Milestones list with progress bars.
   - **Col 6**: Upcoming Recurring Obligations list.

---

## 11. Current Use of Bootstrap

- **Status**: **Completely Unused at Runtime.**
- `bootstrap`: `^5.3.3` is installed in `package.json`.
- However, `bootstrap/dist/css/bootstrap.min.css` is **NOT** imported in `layout.tsx`, `globals.css`, or any page.
- Bootstrap JavaScript is not initialized.
- Therefore, any Bootstrap classes in markup have zero visual effect.

---

## 12. Current Use of Tailwind

- **Status**: **Primary styling engine for all components.**
- The entire application relies on Tailwind utility classes: `bg-surface-100`, `border-surface-border`, `text-zinc-400`, `flex`, `grid`, `col-span-7`, `p-6`, etc.
- Custom plugins (`@tailwindcss/forms`, `@tailwindcss/typography`) are not installed.

---

## 13. Current Use of 21st.dev / Magic MCP

- **Status**: Registered in MCP server registry (`21st` with 30+ tools like `search`, `get_component`, `generate`).
- Queried during research phase, but **no components from 21st.dev were installed or integrated into the actual codebase**.

---

## 14. Current Use of UI/UX Pro Max

- **Status**: Installed and queried via search script (`search.py`) for design intelligence and color schemes.
- Recommended typography (`Inter` / `JetBrains Mono`) and Swiss grid guidelines, which were documented in `docs/design-system.md`, but not fully wired into the Tailwind CSS compilation layer.

---

## 15. Current Use of GSAP / Animations

- **File**: `web/src/hooks/useGsapAnimations.ts` provides `useStaggerEntrance` and `useKpiCounter`.
- **Actual Usage**:
  - `useStaggerEntrance`: Only imported and executed on `app/page.tsx` (Landing) and `app/forecast/page.tsx` (Legacy).
  - `useKpiCounter`: **Not used anywhere** in the entire application (numbers render statically without counter animations).
  - Main dashboard and workspaces (`/dashboard`, `/transactions`, `/budgets`, `/goals`, `/analytics`, `/ai`) do not use GSAP.

---

## 16. Hardcoded / Mock UI Data

- **Audit Result**: **ZERO fake or mock data in production endpoints.**
- All pages call live authenticated Django REST endpoints (`/api/v1/analytics/dashboard/`, `/api/v1/transactions/`, `/api/v1/budgets/overview/`, `/api/v1/goals/`, `/api/v1/transactions/recurring/`, `/api/v1/ai/query/`).
- Fallbacks are purely computational (e.g. `(totalIncome - totalExpense)` if `net_balance` is undefined).
- Empty states are rendered when database tables are empty.

---

## 17. Duplicate Components & Redundant Files

| File A (Active / Clean) | File B (Legacy / Duplicate) | Recommendation |
| :--- | :--- | :--- |
| `web/src/components/layout/Topbar.tsx` + `Sidebar.tsx` | `web/src/components/Navigation.tsx` | Delete `Navigation.tsx` |
| `web/src/components/finance/AddTransactionModal.tsx` | `web/src/components/AddTransactionModal.tsx` | Delete root `AddTransactionModal.tsx` |
| `web/src/components/ai/FloatingAICopilot.tsx` | `web/src/components/AICopilotDrawer.tsx` | Delete `AICopilotDrawer.tsx` |
| `web/src/components/ui/Skeleton.tsx` | `web/src/components/SkeletonLoaders.tsx` | Delete `SkeletonLoaders.tsx` |
| `web/src/app/dashboard/page.tsx` | `web/src/app/app/dashboard/page.tsx` (and all `app/app/*`) | Delete entire `web/src/app/app/` shadow folder |
| `web/src/app/analytics/page.tsx` | `web/src/app/forecast/page.tsx` | Consolidate or update `forecast/page.tsx` to use `AppShell` |
| Standalone unused widgets | `web/src/components/HealthScoreCard.tsx`, `HealthScoreSpeedometer.tsx`, `Charts.tsx`, `CommandPalette.tsx` | Delete or refactor into `components/ui/` |

---

## 18. Components Responsible for the Current Visual Style

The entire visual appearance is governed by these specific files:

1. **`web/tailwind.config.js`**: Defines the static hex palette (`surface-50` through `300`, `brand-600`, `zinc`).
2. **`web/src/app/globals.css`**: Defines `.editorial-panel`, `.editorial-panel-neo`, `.terminal-table`, body background, and scrollbars.
3. **`web/src/components/layout/AppShell.tsx`**: Governs max width, padding, background, and desktop/mobile structure.
4. **`web/src/components/layout/Sidebar.tsx`**: Governs the desktop left-rail navigation visual style.
5. **`web/src/components/layout/Topbar.tsx`**: Governs the sticky header and user badge styling.
6. **`web/src/components/ui/Button.tsx`**: Governs button styling, radii, and hover states.
7. **`web/src/components/ui/Badge.tsx`**: Governs status chip appearance across tables and metrics.
8. **`web/src/components/ui/Modal.tsx`**: Governs all modal dialog presentation.
9. **`web/src/app/dashboard/page.tsx`**: Governs the primary dashboard visual rhythm.
10. **`web/src/app/layout.tsx`**: Governs HTML/body tags and root font imports.

---

## 19. Why Previous Prompts Did Not Materially Change the UI

### Root Cause 1: CSS Variable Token Disconnect
The team created `tokens.css` with semantic CSS variables (`--mx-bg`, `--mx-surface-*`), but `tailwind.config.js` was left pointing to static hex color strings (`#121214`, `#18181B`, `#27272A`). Because every component in JSX used Tailwind classes like `bg-surface-100` and `border-surface-border`, editing `tokens.css` had **zero visual impact** on the rendered HTML elements.

### Root Cause 2: Monochromatic Card-Overuse Pattern
Every section was coded with the identical wrapper:
`<div className="editorial-panel p-6 space-y-4">`.
Because `.editorial-panel` applied a dark `#121214` background with a 1px `#27272A` border and `rounded-2xl` corners, every page rendered as a uniform stack of identical gray rounded rectangles. There was insufficient typographic contrast, no contrasting surface depths, and no distinct data table styling.

### Root Cause 3: Missing True Financial Typography
The font setup in `layout.tsx` only imported Inter without exposing a `--font-mono` variable. JetBrains Mono was never loaded. Financial numbers used generic browser fonts without true tabular formatting or large editorial scale contrast.

### Root Cause 4: Logic-Focused Edits vs Layout Re-Architecture
Previous development turns focused heavily on fixing backend endpoints, serializers, alias resolution (`limit_amount` vs `amount`, `name` vs `title`), and API integration. While these fixed critical bugs, the JSX layout structure was simply patched in place rather than rewritten with new visual hierarchy, high-contrast layouts, and dynamic micro-interactions.

---

## 20. EXACT Files That Must Be Replaced / Upgraded

1. **`web/tailwind.config.js`**: Must bind directly to CSS variables (`var(--mx-*)`) with rich surface depths, terminal borders, and typography variables.
2. **`web/src/app/layout.tsx`**: Must configure Google Fonts (`Inter` + `JetBrains Mono`) with CSS variable injection (`--font-sans`, `--font-mono`).
3. **`web/src/app/globals.css`**: Must provide high-contrast editorial utilities, sharp borders, micro-grid dividers, and terminal typography.
4. **`web/src/components/ui/Button.tsx`**: Must be upgraded to high-contrast tactile/editorial styling.
5. **`web/src/components/ui/Badge.tsx`**: Must be upgraded to crisp terminal-style status pills.
6. **`web/src/components/layout/AppShell.tsx`**: Must eliminate visual clutter and enforce strict layout margins.
7. **`web/src/components/layout/Sidebar.tsx`**: Must feature high-contrast active states, refined typography, and compact density.
8. **`web/src/components/layout/Topbar.tsx`**: Must feature clean breadcrumbs, telemetry indicators, and sharp profile menus.
9. **`web/src/app/dashboard/page.tsx`**: Must be rebuilt with distinct contrasting sections, large display numbers, and GSAP counters.
10. **`web/src/app/transactions/page.tsx`**: Must be rebuilt into a dense, high-contrast fintech terminal table.
11. **`web/src/app/budgets/page.tsx`**: Must feature high-contrast velocity cards and month-end trajectory bars.
12. **`web/src/app/goals/page.tsx`**: Must feature milestone accumulation gauges.
13. **`web/src/app/analytics/page.tsx`**: Must feature multi-horizon area charts and variance grids.
14. **`web/src/app/ai/page.tsx`**: Must feature luxury terminal chat interface.
15. **`web/src/components/finance/AddTransactionModal.tsx`**: Must be polished with tactile tab switching and voice input.

---

## 21. EXACT Files That Should Be Preserved

1. **`web/src/lib/api.ts`**: Preserved. Contains all robust API client methods, JWT refresh logic, and error handling.
2. **`web/src/context/AuthContext.tsx`**: Preserved. Contains session management, user state, and token lifecycle.
3. **`web/src/context/ToastContext.tsx`**: Preserved. Contains toast notification state.
4. **`web/src/lib/utils.ts`**: Preserved. Contains currency formatters and `cn` utility.
5. **All Django Backend Endpoints (`backend/apps/*`, `backend/services/*`)**: Preserved. Fully verified with 100% passing tests.

---

## CURRENT UI ROOT CAUSES SUMMARY

1. **Tailwind Token Disconnect**: Tailwind classes were hardcoded to hex values, ignoring CSS variables.
2. **Monochromatic "Card-Sea"**: Overuse of identical `.editorial-panel` wrappers created visual monotony.
3. **Missing JetBrains Mono**: Tabular numbers lacked distinct financial typography.
4. **Unused Dependencies**: Bootstrap was installed but never imported; GSAP was installed but only used on the landing page.
5. **Shadow / Duplicate Files**: Redundant components and routes cluttered the tree.

---

## REBUILD PLAN

### Step 1: Clean Up Redundant & Duplicate Files
- Delete `web/src/app/app/` shadow directory.
- Delete obsolete root components (`Navigation.tsx`, `AICopilotDrawer.tsx`, `SkeletonLoaders.tsx`, duplicate `AddTransactionModal.tsx`, `HealthScoreCard.tsx`, `HealthScoreSpeedometer.tsx`, `Charts.tsx`, `CommandPalette.tsx`).

### Step 2: Wire Up True Typography & Tailwind CSS Variable Tokens
- Update `layout.tsx` to load `Inter` and `JetBrains Mono` with `--font-sans` and `--font-mono`.
- Configure `tailwind.config.js` to map semantic colors directly to CSS variables (`var(--mx-*)`).
- Update `globals.css` with high-contrast Swiss typography, terminal borders, and surface depths.

### Step 3: Upgrade UI Primitives (`components/ui/` & `components/layout/`)
- Upgrade `Button.tsx`, `Badge.tsx`, `Modal.tsx`, `EmptyState.tsx`, `Skeleton.tsx`.
- Refine `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`, and `AppShell.tsx`.

### Step 4: Rebuild Reference Dashboard (`app/dashboard/page.tsx`)
- Implement true Editorial Fintech visual hierarchy with animated GSAP number counters, distinct section treatments (avoiding uniform card-sea), terminal tables, and high-contrast charts.

### Step 5: Progressively Rebuild Remaining Workspaces
- Transactions, Budgets, Goals, Analytics, AI Workspace, Authentication, and Landing Page.
