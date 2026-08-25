# MONVEX V4.0 — AI Dynamic Chart System

============================================================
REUSABLE FINANCIAL CHART ABSTRACTION
============================================================

The MONVEX V4.0 chart system (`@/components/ai/charts/`) provides a clean, typed chart rendering pipeline built on Recharts.

---

## 1. Supported Chart Types & Selection Rules

| Chart Type | Component | Typical Financial Questions | Visual Representation |
| :--- | :--- | :--- | :--- |
| **Line** | `FinancialLineChart` | Spending over time, net worth growth, debt payoff | Multi-series smoothed lines with data dots |
| **Bar** | `FinancialBarChart` | Category spending, budget utilization, principal balance | Rounded vertical bars with responsive widths |
| **Area** | `FinancialAreaChart` | Cashflow trajectory, 30-day forecast, balance projection | Gradient-filled area with projection confidence |
| **Donut** | `FinancialDonutChart` | Expense category distribution, asset allocation | Center-cut donut pie with interactive legend |
| **Comparison** | `FinancialComparisonChart` | Period-over-period variance, current vs previous month | Dual grouped bars with variance deltas |

---

## 2. Dispatcher Architecture (`DynamicAIChart.tsx`)

```tsx
<DynamicAIChart chart={chartConfig} />
```
- **Verified Data Badge**: Every chart renders a verified telemetry watermark and domain icon.
- **Accessibility**: Includes semantic aria labels and textual descriptions for screen readers.
- **Motion**: Respects `prefers-reduced-motion: reduce`.
