# MONVEX — Complete Visual Identity Reset Report

**Date**: August 21, 2026  
**Scope**: Complete visual overhaul from dark terminal/developer dashboard to a warm editorial consumer fintech product.

---

## 1. Summary of Changes

### A. Environment & Color System (Light Mode First)
- **Primary Canvas Background**: `#F7F6F2` (Warm editorial off-white paper canvas)
- **Sidebar Rail**: `#F0EEE8` (Warm soft neutral)
- **Primary Surfaces**: `#FFFFFF` (Crisp white cards and tables)
- **Secondary Surfaces**: `#EFECE6` / `#E8E5DE` (Subtle insets and controls)
- **Primary Text**: `#171717` (Deep obsidian / charcoal)
- **Secondary Text**: `#555555` (Warm graphite)
- **Muted Text**: `#8A8A8A` (Soft warm gray)
- **Borders**: `#E2E0D8` (Delicate warm 1px hairline)
- **Brand Accent**: `#1E293B` (Deep Navy / Slate)
- **Positive Inflow**: `#059669` (Refined financial green)
- **Negative Outflow**: `#E11D48` (Muted coral / rose red)
- **Warning / Alert**: `#D97706` (Warm amber)

---

### B. Typography & Tone
- **Sans Font**: `Inter` for all navigation, headings, body text, labels, and buttons.
- **Monospace Usage**: Restricted strictly to raw transaction data, timestamps, and subtle tabular financial numbers.
- **Removed Terminal Language**:
  - Removed all `COMMAND /`, `LEDGER /`, `SYSTEM /`, `EXECUTIVE COMMAND`, and `TELEMETRY` breadcrumbs.
  - Switched from uppercase labels to natural sentence case (`Available balance`, `Spending overview`, `What needs your attention`, `Budget progress`, `Recent transactions`).

---

### C. AppShell & Navigation
- **Sidebar ([`Sidebar.tsx`](file:///d:/MONVEX/web/src/components/layout/Sidebar.tsx))**:
  - Warm beige background (`#F0EEE8`) with clean brand mark `MONVEX`.
  - Natural groupings: **Overview** (Home, Transactions, Budgets, Goals, Analytics), **Intelligence** (Ask MONVEX), **Workspace** (Settings).
  - Active item uses crisp white card background with soft shadow (`shadow-card`) and delicate border (`#E2E0D8`).
- **Topbar ([`Topbar.tsx`](file:///d:/MONVEX/web/src/components/layout/Topbar.tsx))**:
  - Single-line lightweight header blending with the background.
  - Contextual title (`Overview`), natural date (`Friday, Aug 21, 2026`), user menu, and "+ Add transaction" primary button.
- **Floating AI Copilot**:
  - **Permanently removed** from the bottom-right of the screen.
  - AI analysis is housed inside `/ai` and presented contextually on the dashboard as a clean insight card.

---

### D. Reference Dashboard ([`dashboard/page.tsx`](file:///d:/MONVEX/web/src/app/dashboard/page.tsx))
- **Header**: `Good evening, [User]` + `Here's how your money is moving this month.` + `+ Add transaction` action.
- **Available Balance Hero**: Dominant `text-4xl sm:text-5xl font-extrabold text-[#171717]` display balance with cashflow status badge and horizontal row for Income (`+₹XX,XXX`), Expenses (`-₹XX,XXX`), and Net Saved (`₹XX,XXX` at `XX% rate`) — **not 4 identical card boxes**.
- **Spending Overview Chart**: Large, elegant 30-day outflow area chart with soft `#E2E0D8` grid lines and subtle gradient fill.
- **What Needs Your Attention**: Editorial financial insight card (e.g. food spending pacing, potential monthly savings, and "View analysis →" link).
- **Your Financial Picture**:
  - **Budget Progress**: Category list with clean rounded progress bars and month-end projections.
  - **Goal Progress**: Primary savings goal with saved vs target amounts, progress bar, target date, and required monthly pace.
  - **Recent Transactions**: Crisp white table with natural case merchant names, category labels, and green/red colored amounts.
  - **Upcoming Obligations**: Clean list of scheduled recurring payments with due dates.

---

## 2. Verification Results

| Check | Result |
| :--- | :--- |
| **Frontend Compilation (`npx tsc --noEmit`)** | **0 errors (100% type-safe)** |
| **Backend Test Suite (`manage.py test tests`)** | **45 / 45 tests passing (100%)** |
| **Theme Default** | **Light Mode Active** (`#F7F6F2` canvas, `#FFFFFF` surfaces) |
| **Floating AI Orb** | **Removed** |
