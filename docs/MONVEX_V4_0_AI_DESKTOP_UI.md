# MONVEX V4.0 — Desktop AI Workspace Design System

============================================================
DESKTOP & WINDOWS TAURI INTERFACE
============================================================

The MONVEX V4.0 Desktop AI Workspace is an interactive financial intelligence console designed for screen widths `>= 1024px` in standard browsers and the Windows Tauri desktop client.

---

## 1. Visual Hierarchy & Components

```
┌────────────────────────────────────────────────────────────────────────┐
│ MONVEX AI                     Gemini 2.0 Flash • Online    + New Chat   │
├─────────────────┬──────────────────────────────────────────────────────┤
│                 │                                                      │
│ CONVERSATION    │              AI INTELLIGENCE CONSOLE                 │
│ HISTORY         │                                                      │
│                 │   User Prompt: "Why did my spending increase?"       │
│ + New Chat      │                                                      │
│                 │   AI Response:                                       │
│ Today           │   ✓ Executed 1 verified domain tool (1.2s)           │
│ • Spending      │                                                      │
│ • Budget Pace   │   ┌───────────────────┬───────────────────┐          │
│                 │   │ Current Spending  │ Expense Variance  │          │
│ Yesterday       │   │ ₹44,200.00        │ ₹5,800.00         │          │
│ • Net Worth     │   │ +15.1%            │ Net Shift         │          │
│ • Car Loan      │   └───────────────────┴───────────────────┘          │
│                 │                                                      │
│ Previous 7 Days │   [ Dynamic Spending Variance Comparison Chart ]     │
│ • Forecast 30D  │                                                      │
│                 │   Your spending increased primarily due to higher    │
│ Search History  │   discretionary transactions in Food & Dining.       │
│                 │                                                      │
│                 │   • Food & Dining increased by +₹2,400.00 (30.0%)    │
│                 │   • Shopping increased by +₹1,800.00 (36.0%)         │
│                 │                                                      │
│                 │   💡 Recommendation: Set a ₹10,000 budget cap       │
│                 │                                                      │
│                 │   [ Where can I cut? ]  [ Compare with 90D ]         │
│                 │                                                      │
├─────────────────┴──────────────────────────────────────────────────────┤
│ +  Ask MONVEX AI...                                🎙        ➤       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key UX Features

1. **Dual Canvas Architecture**: Empty state with quick starter prompt capsules vs. Active conversation stream with rich visual cards and charts.
2. **Composer Ergonomics**: Auto-expanding textarea with voice dictation, file attachment triggers, and keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline).
3. **Session Management**: Full conversation history with search filter, date grouping (`Today`, `Yesterday`, `Previous 7 Days`), pin, rename, and delete.
4. **Mobile Preservation**: Screens `< 1024px` seamlessly switch to the dedicated `MobileAIWorkspace` with mobile drawer and touch-first ergonomics.
