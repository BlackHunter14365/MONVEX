# MONVEX Windows Desktop — QA & Testing Verification Matrix

**Document Status**: LOCKED QA MATRIX  
**Phase**: Phase 3 Milestone Verification  
**Date**: August 22, 2026  

---

## 1. Desktop Test Matrix & Verification Status

| Test ID | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| **WIN-01** | Desktop Window Shell Launch | Window renders at 1280x860 px, centered, with standard Windows controls | **PASSED** |
| **WIN-02** | System Tray Initialization | System tray icon loads `icons/icon.png` with complete 5-item menu | **PASSED** |
| **WIN-03** | Tray Click Restore | Left-clicking tray icon shows and focuses main workspace window | **PASSED** |
| **WIN-04** | Quick Transaction from Tray | Selecting "Quick Transaction (+)" opens `AddTransactionModal` dialog | **PASSED** |
| **WIN-05** | Window Minimize-to-Tray | Clicking close button hides window to tray without terminating app | **PASSED** |
| **WIN-06** | Tray Explicit Quit | Clicking "Quit MONVEX" cleanly exits process | **PASSED** |
| **WIN-07** | Global Shortcut `Ctrl+K` | Opens Command Center modal overlay with search autofocus | **PASSED** |
| **WIN-08** | Command Center Navigation | Arrow keys navigate results, Enter triggers route or action | **PASSED** |
| **WIN-09** | Multi-Tenant Data Isolation | User A in Desktop cannot access User B's accounts, txs, or AI sessions | **PASSED** |
| **WIN-10** | Web ↔ Windows Sync | Transaction created in Desktop immediately reflects on Web | **PASSED** |
| **WIN-11** | Native OS Notifications | Financial threshold alerts trigger native Windows toast notifications | **PASSED** |
| **WIN-12** | Native File Export | CSV/JSON exports write safely without crashing or permission errors | **PASSED** |

---

## 2. Cross-Platform Synchronization Verification (Scenario Walkthrough)

1. **Step 1**: User logs in on Web (`http://localhost:3000`) and adds a transaction (`₹850` - Groceries at Nature's Basket).
2. **Step 2**: User opens Windows Desktop app (`MONVEX.exe`) and logs in as the same user.
3. **Step 3**: Windows Desktop retrieves the exact same account balance and transaction ledger.
4. **Step 4**: User presses `Ctrl+N` on Desktop, records `+₹75,000` Salary credit.
5. **Step 5**: Web app refreshes ledger: `₹75,000` credit is immediately present.
6. **Step 6**: AI Copilot on both Web and Desktop references the updated net worth and cashflow metrics identically.
