# MONVEX V2 — Windows Desktop Architecture Specification

**Document Status**: LOCKED ARCHITECTURE SPECIFICATION  
**Phase**: Phase 3 Milestone  
**Version**: 2.0.0  
**Platform**: Windows 10 / 11 (x64) via Tauri 1.5  
**Core Framework**: Tauri (Rust Native Shell) + Next.js (Webview UI)  
**Effective Date**: August 22, 2026  

---

## 1. Desktop Architectural Overview

MONVEX Windows Desktop is engineered as a lightweight, memory-efficient native desktop application (`MONVEX.exe`) powered by **Tauri 1.5** with a secure Rust backend shell communicating with the centralized **MONVEX REST API**.

```text
                      ┌─────────────────────────────────────────┐
                      │               MONVEX.exe                │
                      │  ┌───────────────────┬────────────────┐ │
                      │  │  TAURI RUST CORE  │  NEXT.JS UI    │ │
                      │  │  - System Tray    │  - Editorial   │ │
                      │  │  - Global Hotkeys │    Design Sys  │ │
                      │  │  - Toast Alerts   │  - Tabular UI  │ │
                      │  │  - File Dialogs   │  - Command Ctr │ │
                      │  └─────────┬─────────┴────────┬───────┘ │
                      └────────────┼──────────────────┼─────────┘
                                   │                  │
                                   ▼                  ▼
                              OS Native APIs      HTTP / JWT
                             (Windows 10/11)          │
                                                      ▼
                                              MONVEX DJANGO API
                                            (http://127.0.0.1:8000)
                                                      │
                                                      ▼
                                              CENTRAL DATABASE
```

---

## 2. Core Desktop Capabilities

### 2.1 Native System Tray Menu
The desktop shell registers a persistent tray icon (`icons/icon.png`) with the following interactive menu:
1. **Open MONVEX Workspace**: Restores and focuses the main application window.
2. **Quick Transaction (`+`)**: Restores window and immediately opens the `AddTransactionModal` dialog.
3. **Ask MONVEX AI Copilot**: Restores window and routes directly to `/ai`.
4. **Command Dashboard**: Restores window and routes to `/dashboard`.
5. **Separator**
6. **Quit MONVEX**: Cleanly terminates the background process and closes all child threads.

### 2.2 Window Minimize-to-Tray
- When users click the Windows standard close button (`X`), `WindowEvent::CloseRequested` hides the window to the tray rather than terminating the process abruptly.
- Left-clicking the tray icon immediately unhides and focuses the window.

### 2.3 Native Windows OS Toast Notifications
- Powered by `tauri::api::notification::Notification`.
- Dispatches system toast alerts for critical financial events:
  - Budget threshold warnings (>80% and >100% capacity).
  - Savings goal milestone achievements.
  - Anomaly detection alerts.
  - Security audit and session invalidation notices.

### 2.4 Global Keyboard Shortcuts
- Registered natively:
  - `Ctrl + K`: Universal Command Center palette.
  - `Ctrl + N`: Quick Transaction ingestion.
  - `Ctrl + Shift + A`: AI Intelligence Copilot workspace.
  - `Escape`: Dismiss open modals and dialogs.

### 2.5 Native File Exports
- Native dialog and filesystem access scoped strictly to `$DOWNLOAD`, `$DOCUMENT`, and `$DESKTOP`.
- Supports direct export of `.csv` ledgers and `.json` full portfolio statements.

---

## 3. Security & Multi-Tenant Isolation

1. **Zero-Trust Client Identity**:
   - The desktop client stores only the JWT access/refresh token in memory and authorized storage.
   - All financial operations require a valid `Bearer <access_token>` in the `Authorization` header.
2. **Server-Enforced Authorization**:
   - Every query to `/api/v1/` is scoped strictly to `request.user`.
   - Modifying asset IDs or account numbers returns `404 Not Found` or `403 Forbidden`.
3. **Zero Embedded Server Secrets**:
   - `GEMINI_API_KEY`, `DATABASE_URL`, and Google OAuth client secrets are never bundled into `MONVEX.exe`.

---

## 4. Build & Distribution Strategy

### Development Mode:
```bash
cd desktop
npm run dev # Launches Tauri dev window pointing to http://localhost:3000
```

### Production Build:
```bash
cd desktop
npm run build # Compiles release binary into target/release/MONVEX.exe
```
