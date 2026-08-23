# MONVEX Phase 3 — Windows Desktop (Tauri) Forensic Audit

**Document Status**: LOCKED AUDIT  
**Phase**: Phase 3 — Windows Desktop / Tauri Production Implementation  
**Audit Date**: August 22, 2026  
**Auditor**: Antigravity Core Architect  

---

## 1. Current Tauri Version & Core Setup

- **Tauri CLI Version**: `@tauri-apps/cli` `^1.5.11` (Node dev dependency in `desktop/package.json`).
- **Tauri Rust Core**: `tauri` `1.5` with `tauri-build` `1.5` (`desktop/src-tauri/Cargo.toml`).
- **Rust Edition**: 2021.
- **Frontend Integration Mode**: Next.js App (`http://localhost:3000` during development, static export `../web/out` for offline bundle).

---

## 2. Existing Tauri Configuration (`desktop/src-tauri/tauri.conf.json`)

- **Product Name**: `MONVEX`
- **Identifier**: `com.monvex.desktop`
- **Window Specs**:
  - Initial Dimensions: `1280 x 860` px (centered)
  - Minimum Constraints: `960 x 640` px (resizable)
  - Window Decorations: Enabled with native Windows titlebar controls (Minimize, Maximize, Close).
- **System Tray**:
  - Icon: `icons/icon.png`
  - Template Mode: Enabled
- **Security Policy**: Scoped allowlist, CSP compliant.

---

## 3. Existing vs Missing Desktop Capabilities

| Capability | Existing State | Target Production State (Phase 3) |
| :--- | :--- | :--- |
| **System Tray** | Basic "Open" & "Quit" menu | Rich Tray Menu: Open Workspace, Quick Transaction (`+`), Ask AI Copilot, Command Dashboard, Quit with Clean Invalidation |
| **Global Shortcuts** | Browser-only (`Ctrl+K`) | Native Global Hotkeys: `Ctrl+K` (Command Center), `Ctrl+N` (Quick Add Transaction), `Ctrl+Shift+A` (AI Workspace) |
| **OS Toast Notifications** | Web browser notifications | Native Windows 10/11 Toast Notifications wired to backend financial events (Budget exceeded, Goal achieved, Anomaly alert) |
| **Native File Export** | Browser Blob download | Native Windows Save File Dialog (`.csv`, `.json`, `.pdf`) with user-selected directory destination |
| **Window Minimize-to-Tray** | Abrupt process termination | Clean minimize-to-tray on close with persistent background listener |
| **Google Sign-In** | Web GIS modal | Seamless desktop authentication via system browser OAuth callback or standard credentials |

---

## 4. Required Dependencies & Cargo Features

### Cargo.toml Additions:
```toml
[dependencies]
tauri = { version = "1.5", features = [
    "shell-open",
    "system-tray",
    "window-hide",
    "window-show",
    "global-shortcut",
    "notification",
    "dialog",
    "fs-write-file",
    "fs-read-file"
] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Tauri Allowlist Additions:
- `notification`: `all: true`
- `globalShortcut`: `all: true`
- `dialog`: `open: true, save: true`
- `fs`: `scope: ["$DOWNLOAD/*", "$DOCUMENT/*", "$DESKTOP/*"]`
- `shell`: `open: true`
- `window`: `all: true`

---

## 5. Implementation Strategy & Data Flow

```text
                     MONVEX.exe (Windows)
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     NATIVE TAURI SHELL               NEXT.JS DESKTOP UI
  (Tray, Hotkeys, Alerts)            (Editorial Design System)
            │                                 │
            └────────────────┬────────────────┘
                             │
                        REST / JSON
                             │
                             ▼
                     MONVEX API (Django)
                             │
                   ┌─────────┼─────────┐
                   ▼         ▼         ▼
                 AUTH     FINANCE     AI
                   │         │         │
                   └─────────┼─────────┘
                             ▼
                          DATABASE
```

---

## 6. Files That Will Be Modified

1. `desktop/src-tauri/Cargo.toml` — Add Tauri native capabilities features (`notification`, `dialog`, `fs`, `global-shortcut`).
2. `desktop/src-tauri/tauri.conf.json` — Add allowlists and window event listeners.
3. `desktop/src-tauri/src/main.rs` — Implement native Rust commands (`send_native_notification`, `export_native_file`, `trigger_quick_transaction`), rich tray menu events, and window management.
4. `desktop/package.json` — Add build and execution helper scripts.
5. `web/src/lib/tauriBridge.ts` — TypeScript bridge to seamlessly detect and invoke Tauri native APIs (falling back gracefully on Web).

---

## 7. Files That Will NOT Be Modified

- **Backend Logic**: `backend/apps/*`, `backend/services/*`, database schemas, and Django APIs will remain 100% untouched.
- **Financial Calculations**: Deterministic calculation algorithms will not be duplicated into Rust.
- **AI Copilot Core**: Gemini 2.0 Flash SDK orchestration remains centralized in the backend.
- **Authentication**: JWT token issuance and password hashing (Argon2) remains server-side authoritative.

---

## 8. Potential Compatibility Issues & Mitigations

1. **Localhost API in Desktop**: Desktop frontend must route to `http://127.0.0.1:8000/api/v1` via environment variable or default fallback.
2. **CORS in Webview**: Django `CORS_ALLOWED_ORIGINS` includes `tauri://localhost`, `http://localhost:3000`, `http://127.0.0.1:8000`.
3. **Graceful Fallback**: The Web application running in standard browsers must ignore Tauri commands safely without throwing runtime errors.
