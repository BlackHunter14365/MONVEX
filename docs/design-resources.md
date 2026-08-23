# MONVEX Design Resources & Development Environment

This document records the design systems, libraries, and frameworks integrated into the MONVEX frontend architecture, their versions, installation status, and designated architectural responsibilities.

---

## 1. Resource Matrix

| Resource | Version | Status | Purpose & Responsibility | Where Used |
| :--- | :--- | :--- | :--- | :--- |
| **UI/UX Pro Max** | Skill (`search.py`) | Active / Verified | Design intelligence, UX rules, editorial typography hierarchies, color reasoning, and accessibility benchmarks. | System Design, Token Definitions, Layout Guidelines |
| **21st.dev Magic MCP** | MCP Lazy Tools | Active / Available | Advanced data table patterns, interactive financial ledgers, command surfaces, and specialized component references. | Interactive Tables, Terminal Panels, Advanced Inputs |
| **Bootstrap** | `5.3.3` | Installed (`npm`) | Structural responsive grid fundamentals, breakpoints, flexbox alignment utilities, and container standards. | Macro layout alignment, grid scaffolding |
| **GSAP (GreenSock)** | `3.12.5` | Installed (`npm`) | Purposeful motion orchestration, chart reveals, financial number counters, modal reveals, and smooth page transitions. | Landing motion, number countups, drawer transitions |
| **Lucide Icons** | `0.424.0` | Installed (`npm`) | Clean, single-style modern geometric SVG iconography. Zero emojis in primary interface. | Navigation, badges, actionable controls, status indicators |
| **Recharts** | `2.12.7` | Installed (`npm`) | Primary deterministic data visualization system (Cashflow Area, Bar distributions, Burn trajectory, Velocity gauges). | Dashboard, Analytics, Budgets, Forecast views |
| **Tailwind CSS** | `3.4.7` | Installed (`npm`) | Utility-first CSS engine bound to semantic design tokens (`--mx-*`). | Component styling, layout composition |
| **Next.js / React** | `14.2.5 / 18.3.1` | Installed (`npm`) | App Router, Server/Client components, dynamic routing, and fast hydration. | Core Web Application |
| **Clsx & Tailwind-Merge** | `2.1.1 / 2.4.0` | Installed (`npm`) | Safe class name composition and token overrides without CSS specificity bugs. | Design System Primitives (`/components/ui`) |

---

## 2. Tool Responsibilities & Separation of Concerns

1. **UI/UX Pro Max**:
   - Authority for typography scales, visual density, spacing rhythm, contrast ratios (WCAG AAA/AA), and financial information architecture.
2. **Bootstrap**:
   - Used strictly for structural responsive foundations and grid scaffolding.
   - **Rule**: Bootstrap default styles (blue buttons, basic cards) do **NOT** govern MONVEX's visual identity.
3. **GSAP**:
   - Used strictly for purposeful, restrained micro-interactions (e.g. number ticker animations, modal slide-ins, chart path reveals).
   - **Rule**: Honors `prefers-reduced-motion` at all times.
4. **21st.dev Magic**:
   - Selected for advanced data table and command palette patterns, adapting them into MONVEX's strict editorial design system.
5. **Recharts**:
   - Sole chart engine to ensure consistent tooltip styling, grid lines, semantic palette mapping, and zero visual clutter.

---

## 3. Dependency Discipline Rule
- No overlapping UI component libraries (no mixing Bootstrap + Material UI + Chakra + Ant Design).
- One icon system (`lucide-react`).
- One motion system (`gsap`).
- One charting system (`recharts`).
