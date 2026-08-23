# MONVEX Design System Specification

**Design Identity**: Editorial Fintech + Swiss International Typographic + Data-Visualization-First  
**Version**: 2.0  
**Authority**: MONVEX Design Foundation

---

## 1. Design Tokens Architecture

All design tokens are defined as semantic CSS custom properties in `/styles/tokens.css` and mapped directly into `tailwind.config.ts`.

### Semantic Color Tokens

```css
:root {
  /* Surfaces & Backgrounds */
  --mx-bg: #09090B;               /* Deepest obsidian canvas */
  --mx-surface-0: #121215;        /* Ground-level surface */
  --mx-surface-1: #18181B;        /* Primary panel / table surface */
  --mx-surface-2: #27272A;        /* Elevated control / input background */
  --mx-surface-3: #3F3F46;        /* Hover / active states */

  /* Text & Content Hierarchy */
  --mx-text-primary: #FAFAFA;     /* High-contrast crisp white */
  --mx-text-secondary: #A1A1AA;   /* Balanced editorial muted */
  --mx-text-tertiary: #71717A;    /* Meta / timestamp / unit label */
  --mx-text-disabled: #52525B;    /* Disabled text */

  /* Borders & Dividers */
  --mx-border-subtle: #27272A;    /* Subtle separation lines */
  --mx-border-strong: #3F3F46;    /* High-definition card & table borders */
  --mx-border-interactive: #52525B;/* Focused & active inputs */

  /* Semantic Financial Accents */
  --mx-brand-primary: #6366F1;    /* MONVEX Editorial Indigo */
  --mx-brand-accent: #818CF8;     /* Soft Indigo highlight */
  --mx-inflow-success: #10B981;   /* Liquid Surplus / Positive Cashflow */
  --mx-inflow-subtle: #064E3B;    /* Inflow backdrop tint */
  --mx-outflow-danger: #F43F5E;   /* Burn Rate / Overspend Alert */
  --mx-outflow-subtle: #4C0519;   /* Outflow backdrop tint */
  --mx-velocity-warning: #F59E0B; /* Budget Warning / Pacing Alert */
  --mx-velocity-subtle: #451A03;  /* Warning backdrop tint */
}
```

---

## 2. Typography System

- **Primary UI Typeface**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
- **Monospace Financial Typeface**: `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace`
- **Display Typeface**: Bold, high-contrast, tight letter-spacing (`tracking-tight` / `tracking-tighter`)

### Typographic Scale:

| Level | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Balance** | `2.5rem - 3.5rem` (`40px - 56px`) | `900` (Black) | `-0.04em` (tabular) | Main Net Liquid Balance display |
| **Display H1** | `1.75rem - 2.25rem` (`28px - 36px`)| `800` (ExtraBold) | `-0.03em` | Page Headings |
| **Section H2** | `1.25rem - 1.5rem` (`20px - 24px`) | `700` (Bold) | `-0.02em` | Section Titles & Panel Headers |
| **Subsection H3**| `0.875rem - 1.0rem` (`14px - 16px`) | `600` (SemiBold) | `-0.01em` | Group Titles, Card Headers |
| **Data Metric** | `1.125rem - 1.5rem` (`18px - 24px`) | `800` (Bold Mono) | `0em` (tabular) | Financial Numbers, Ledgers, KPI tickers |
| **Body Large** | `1.0rem` (`16px`) | `400` / `500` | `0em` | Editorial descriptions, AI responses |
| **Body Regular** | `0.875rem` (`14px`) | `400` / `500` | `0em` | Form inputs, standard table rows |
| **Body Small** | `0.75rem` (`12px`) | `500` | `0.01em` | Secondary table cells, helper text |
| **Badge / Label**| `0.6875rem` (`11px`) | `700` (Bold) | `+0.05em` (uppercase)| Status badges, category indicators |
| **Micro Caption**| `0.625rem` (`10px`) | `600` | `+0.06em` (uppercase)| Section kicker tags, metadata |

---

## 3. Grid & Spacing System

- **Desktop (12-column Swiss Grid)**:
  - 12 flexible columns with `gap-4` (16px) or `gap-6` (24px).
  - Asymmetric spans: 7 cols (Primary data / chart) + 5 cols (Contextual insight / secondary ledger).
- **Tablet (8-column adaptive)**:
  - Rebalanced vertical rhythm with stacked panels.
- **Mobile (Single-column high-priority stack)**:
  - Immediate access to Net Balance $\to$ Trajectory $\to$ Recent Transactions $\to$ Budgets.

---

## 4. Border & Radius System

- **Restrained Corner Radii**:
  - `sm` (`6px`): Badges, tooltips, small chips.
  - `md` (`10px`): Inputs, select dropdowns, table cells.
  - `lg` (`14px`): Interactive buttons, command controls.
  - `xl` (`16px`): Editorial panels, charts, modals.
  - `full` (`9999px`): Status pills, avatar bubbles.
- **Borders**: Sharp 1px solid borders (`border-zinc-800` / `border-surface-border`) prioritize high contrast over heavy drop shadows.

---

## 5. Motion & Interaction System (GSAP)

All transitions are restrained, functional, and purposeful:
- **Fast Micro-interaction**: `150ms - 200ms` `ease-out` (Button hover, active press, badge transition).
- **Standard Panel / Modal Reveal**: `250ms - 350ms` `power2.out` (Modal popover, drawer slide-in).
- **Number Ticker / Counter**: `400ms - 600ms` `power3.out` on initial data mount.
- **Accessibility Rule**: Honors `prefers-reduced-motion: reduce` by replacing motion with instant alpha reveals.
