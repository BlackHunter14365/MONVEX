# MONVEX Design System Specification
**Philosophy:** Premium Editorial Fintech  
**Tone:** Intelligent, Trustworthy, Data-Focused, Human-Crafted, Sophisticated

---

## 1. Color System & Semantic Tokens

### Canvas & Surface Tokens
| Token | CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `--mx-background` | `#F6F5F1` | Main page canvas (warm, breathable off-white) |
| `surface` | `--mx-surface` | `#FFFFFF` | Primary card, table, and modal surfaces |
| `surface-subtle` | `--mx-surface-subtle` | `#F0EFEA` | Inset containers, secondary button backgrounds, input fills |
| `surface-muted` | `--mx-surface-muted` | `#E8E7E1` | Dividers, subtle borders, table header backgrounds |
| `surface-elevated` | `--mx-surface-raised` | `#FFFFFF` | Popovers, dropdown menus, floating tooltips (with elevation shadow) |

### Typography Contrast Hierarchy (WCAG AA Compliant)
| Token | CSS Variable | Hex / Value | Contrast on Canvas | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-primary` | `--mx-text-primary` | `#172033` | 13.4:1 (AAA) | Headings, hero numbers, primary labels, main text |
| `text-secondary`| `--mx-text-secondary`| `#5F6878` | 5.2:1 (AA) | Descriptions, subheadings, category metadata |
| `text-muted` | `--mx-text-muted` | `#858D9A` | 3.6:1 (AA-Large) | Micro-labels, date timestamps, table headers |
| `text-disabled`| `--mx-text-disabled` | `#B0B7C3` | - | Disabled inputs and buttons |

### Financial Semantic Colors
| Semantics | Text Token | Background Tint | Border Tint | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Positive / Inflow** | `#059669` (`--mx-success`) | `#ECFDF5` (`--mx-success-soft`) | `#A7F3D0` | Income, savings surplus, positive growth |
| **Negative / Outflow**| `#E11D48` (`--mx-danger`) | `#FFF1F2` (`--mx-danger-soft`) | `#FECDD3` | Expenses, debt payments, deficits, alerts |
| **Caution / Warning** | `#D97706` (`--mx-warning`) | `#FFFBEB` (`--mx-warning-soft`) | `#FDE68A` | Approaching budget limit, pending items |
| **Interactive / Brand**| `#2563EB` (`--mx-brand-blue`)| `#EFF6FF` (`--mx-brand-blue-soft`)| `#BFDBFE` | Links, active tabs, AI badges, primary actions |

---

## 2. Typography System

### Font Families
- **Primary Sans:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Tabular Mono:** `JetBrains Mono`, `Menlo`, `monospace` (strictly for financial digits, account masks, telemetry)

### Scale & Hierarchy
| Role | Size | Weight | Tracking | Lettercase | Font Feature Settings |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `2.25rem` (36px) | `800` (ExtraBold) | `-0.035em` | Title Case | `font-sans` |
| **H1** | `1.75rem` (28px) | `800` (ExtraBold) | `-0.03em` | Title Case | `font-sans` |
| **H2** | `1.25rem` (20px) | `700` (Bold) | `-0.025em` | Title Case | `font-sans` |
| **H3** | `1rem` (16px) | `700` (Bold) | `-0.02em` | Title Case | `font-sans` |
| **Body** | `0.875rem` (14px)| `500` (Medium) | `-0.01em` | Sentence | `font-sans` |
| **Body-Small** | `0.75rem` (12px) | `500` (Medium) | `0em` | Sentence | `font-sans` |
| **Eyebrow / Label**| `0.6875rem` (11px)| `700` (Bold) | `+0.08em` | UPPERCASE | `font-mono` |
| **Financial Metric**| `1.75rem`–`2.5rem` | `800` (ExtraBold) | `-0.03em` | - | `tabular-nums`, `tnum` |
| **Table Number** | `0.75rem`–`0.875rem`| `700` (Bold) | `-0.01em` | - | `tabular-nums`, `tnum` |

---

## 3. Spacing, Radii & Shadows

### Spacing Scale (4px Base Grid)
- `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px)
- **Standard Card / Container Padding:** `p-5` to `p-7` on desktop, `p-4` to `p-5` on mobile.
- **Section Rhythm:** `space-y-6` between standard blocks, `py-16` to `py-24` on landing sections.

### Border Radii
- `sm`: `6px` (Micro badges, tags, code snippets)
- `md`: `10px` (Buttons, form inputs, table containers)
- `lg`: `14px` (Cards, panels, tabs)
- `xl`: `18px`–`20px` (Modals, full-width hero cards)
- `full`: `9999px` (Pills, avatar circles, status dots)

### Elevation Shadows
- `subtle`: `0 1px 2px 0 rgba(23, 32, 51, 0.04)`
- `card`: `0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.04)`
- `elevated`: `0 4px 6px -1px rgba(23, 32, 51, 0.06), 0 2px 4px -2px rgba(23, 32, 51, 0.04)`
- `modal`: `0 20px 25px -5px rgba(23, 32, 51, 0.12), 0 8px 10px -6px rgba(23, 32, 51, 0.08)`

---

## 4. Component Standards

### A. Buttons (`<Button>`)
- **Primary:** `bg-[#172033] hover:bg-[#0F172A] text-white shadow-subtle active:translate-y-[1px]`
- **Secondary:** `bg-[#F0EFEA] hover:bg-[#E8E7E1] text-[#172033] border border-[#E4E2DC]`
- **Outline:** `bg-transparent hover:bg-white text-[#5F6878] hover:text-[#172033] border border-[#E4E2DC]`
- **Ghost:** `bg-transparent hover:bg-[#F0EFEA] text-[#5F6878] hover:text-[#172033]`
- **Danger:** `bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-subtle`
- **States:** All buttons include `focus-visible:ring-2 focus-visible:ring-[#172033]/20 focus-visible:outline-none`, `disabled:opacity-50`, and built-in `<Loader2>` spinner during `isLoading`.

### B. Form Inputs
- Standard height: `py-2.5 px-3.5`, font size: `text-xs font-medium`.
- Background: `bg-white` or `bg-[#F6F5F1]`, Border: `border border-[#E4E2DC]`.
- Focus State: `focus:border-[#172033] focus:ring-2 focus:ring-[#172033]/15 focus:outline-none`.
- Error State: `border-[#E11D48] bg-[#FFF1F2]/20 focus:ring-[#E11D48]/30`.
- Explicit `<label>` for every input; inline error messages prefixed with `•`.

### C. Modals & Dialogs (`<Modal>`)
- Backdrop: `fixed inset-0 bg-slate-900/50 backdrop-blur-xs`.
- Surface: `bg-white border border-[#E4E2DC] rounded-2xl shadow-modal max-h-[90vh] overflow-y-auto`.
- Keyboard accessibility: `Escape` key close, focus trapping, focus restoration on close.

### D. Financial Tables
- Flat layout with clean horizontal hairlines `border-b border-[#E4E2DC]`.
- Header: `bg-[#F0EFEA]/60 text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] py-2.5 px-4`.
- Row: `hover:bg-[#F0EFEA]/40 transition-colors py-3 px-4`.
- Number columns: `text-right tabular-nums font-bold text-xs`.
- Mobile adaptation: Smooth transformation to stacked cards on viewport `< 640px`.

---

## 5. De-Carding & Layout Rhythm Rules
1. **Never nest cards inside cards inside cards.**
2. **Hero metrics stand freely** with clean typography on the page canvas.
3. **Use dividers and whitespace** to group related controls instead of heavy rounded borders.
4. **Use tables** for ledger data, not a grid of 20 identical cards.
5. **Reserve physical card aesthetics** strictly for actual debit/credit cards in the Wallets section.

---

## 6. Accessibility & Motion Rules
- **Minimum Tap Target:** `44px x 44px` on touch screens.
- **Transitions:** Fast, subtle transitions (`100ms`–`200ms` `ease-out`). Zero continuous floating blobs or disruptive bounce animations.
- **Screen Reader Support:** Semantic HTML tags (`<main>`, `<nav>`, `<header>`, `<section>`, `<table>`, `<dialog>`), `aria-labelledby`, `aria-describedby`, and accessible button labels.
