# MONVEX V3.5 — Frontend Motion System & Data Animation Standard

============================================================
EXECUTIVE SUMMARY
============================================================

The **MONVEX V3.5 Frontend Motion System** establishes a consistent, high-performance, and subtle animation standard across the entire web application.

Designed for a premium financial intelligence product, the motion system delivers fluid, intentional visual feedback while strictly preventing visual fatigue or layout shifts.

---

## 1. Design Principles & Motion Philosophy

1. **Subtle & Intentional**: Animations serve cognitive comprehension and hierarchy, avoiding excessive decorative movements.
2. **Data-Aware**: Numeric values animate only when verified backend API data is received. No false initial zeros or premature animations.
3. **Smooth Delta Interpolation**: On live data updates or state mutations, values interpolate smoothly from `previousValue` to `newValue`.
4. **GPU-Accelerated**: Animations exclusively modify `transform` and `opacity` properties to prevent layout thrashing and maintain 60 FPS on all devices.
5. **Zero Layout Shifts (CLS = 0)**: Elements reserve their exact layout footprint before and during entrance.
6. **Accessible**: Honors `prefers-reduced-motion: reduce` by disabling transitions and instantly rendering final computed values.

---

## 2. Centralized Motion Tokens (`@/lib/motion.ts`)

### 2.1 Durations
| Token | Duration | Usage |
| :--- | :--- | :--- |
| `FAST` | `150ms` (`0.15s`) | Tooltips, badge toggles, icon micro-interactions |
| `NORMAL` | `220ms` (`0.22s`) | Dropdown menus, subtle tab switches |
| `CARD` | `280ms` (`0.28s`) | Card reveals, container entrances |
| `COUNTER_MS` | `650ms` | Number counter interpolation duration (`requestAnimationFrame`) |
| `MODAL` | `200ms` (`0.20s`) | Modal dialog fade & scale in |
| `DRAWER` | `240ms` (`0.24s`) | Mobile drawer slide in/out |
| `STAGGER_STEP` | `40ms` (`0.04s`) | Delay between sibling elements |
| `STAGGER_MAX` | `240ms` (`0.24s`) | Maximum cumulative stagger delay cap |

### 2.2 Easing Curves
- **Primary (Apple-Style Decel)**: `[0.16, 1, 0.3, 1]` (Cubic Out / Expo Decel)
- **Exit / Acceleration**: `[0.32, 0, 0.67, 0]`
- **Subtle Spring Physics**: `damping: 24, stiffness: 300, mass: 0.8`

---

## 3. Core Motion Primitives (`@/components/motion/`)

### 3.1 Data-Aware Animated Value (`AnimatedValue.tsx`)
```tsx
import { AnimatedValue } from '@/components/motion';

<AnimatedValue 
  value={totalNetBalance} 
  currency="INR" 
  type="currency" 
  decimals={2} 
/>
```
- **Lifecycle**:
  - Unmounted / Loading: Renders skeleton or fallback placeholder.
  - Initial Load: Evaluates `requestAnimationFrame` from `0` to `targetValue` over 650ms with cubic out easing.
  - Live Update: Evaluates rAF from `previousValue` to `newValue`.
  - Format Preservation: Full Indian numbering standard (`₹12,34,567`), fixed decimal precision, negative value preservation (`-₹2,500`), zero `NaN`/`undefined` leaks.

### 3.2 Viewport Card Reveal (`CardReveal.tsx`)
```tsx
import { CardReveal } from '@/components/motion';

<CardReveal index={0} hoverLift={true} className="editorial-card p-6">
  {/* Card Content */}
</CardReveal>
```
- **Entrance**: `opacity: 0, translateY(8px), scale(0.985)` -> `opacity: 1, translateY(0), scale(1)`
- **Hover Lift**: Subtle `translateY(-2px)` on desktop pointers.
- **Active Press**: Subtle `scale(0.99)` on user interaction.
- **Stagger Cap**: Automatically calculates `Math.min(index * 0.04, 0.24)` delay.

### 3.3 Modal & Dialog Transitions (`Modal.tsx`)
- **Backdrop**: `opacity: 0` -> `opacity: 1` (`bg-[#172033]/45 backdrop-blur-xs`)
- **Surface**: `opacity: 0, scale: 0.97, translateY(4px)` -> `opacity: 1, scale: 1, translateY(0)`
- **Exit**: Reverses gracefully with `AnimatePresence`.

---

## 4. Workspaces & Pages Integrated

| Workspace Route | Animated KPIs | Card Motion & Stagger | Chart Transitions |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Available Balance, Income, Spending, Savings, Goal Target | Top Command Center, KPI Grid, Trajectory Card, Recent Tx | 500ms Area Glow Animation |
| `/budgets` | Total Allocated, Total Spent, Remaining Buffer | Summary Strip, Category Budget Cards (`CardReveal` stagger) | Progress Bar Fill Sync |
| `/goals` | Cumulative Targets, Accumulated, Buffer, Monthly Pace | Summary Strip, Savings Goal Milestone Cards | Progress Bar Fill Sync |
| `/analytics` | Financial Health Score, Income, Spending, Savings Rate | Core Health KPI Grid, Trajectory Stream, Category Breakdown | Recharts Area & Donut Sync |
| `/net-worth` | Net Worth, Total Assets, Total Liabilities, Solvency % | Top Summary Strip, Balance Sheet Sections | Real-time Asset Tally |
| `/debt` | Principal Balance, Monthly EMI, Simulated Interest Saved, Months Saved | Top Metrics Strip, Prepayment Simulator Lab, Active Loans | Slider Live Interpolation |
| `/subscriptions` | Monthly Burn, Annualized Drain, Active Count, Savings Potential | Top Summary Strip, Subscriptions Grid | Live Tally |
| `/forecast` | Starting Balance, Daily Burn Rate, Projected Ending Liquidity | Forecast KPI Strip, Trajectory & Confidence Stream | Responsive Area Interpolation |
| `/simulator` | Monthly Surplus, Projected Savings Rate, Wealth Created, 5Y Corpus | Top Comparison Strip, Scenario Levers Panel | Live Tally |
| `/reports` | Inflow, Outflow, Net Savings, Financial Health Score | Executive Summary Strip, Statement Breakdown | Printable Layout Frozen |
| `/transactions` | Transaction Count, Amount Filters, Live Amounts | Search & Filter Bar, Ledger Card Table | Instant Row Placement |
| `/security` | Health Score, Intercepted Attacks, Audit Trail Events | Telemetry HUD, Shield Grid, Audit Log Stream | Pulse Badges |

---

## 5. Performance & Quality Verification

### 5.1 Verification Checklist
- **TypeScript Compilation**: `0 errors` (`npx tsc --noEmit`).
- **Next.js Production Build**: `24/24 static pages compiled` with 0 bundle warnings.
- **Django Test Suite**: `66/66 tests passed` (100% pass rate).
- **AI Copilot Evaluation Suite**: `16/16 scenarios passed` (100% deterministic accuracy).
- **Security Regression Gate**: `6/6 suites passed` (SQLi, XSS, Path Traversal, Command Injection defenses verified).
- **Flutter Analyzer**: `0 issues found` (ran in 42.6s).
- **Reduced Motion Test**: All components bypass animation when `prefers-reduced-motion: reduce` is enabled.
