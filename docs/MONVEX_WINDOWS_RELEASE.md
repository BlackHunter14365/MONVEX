# MONVEX Windows Desktop Release & Distribution Specification

---

## 1. Desktop Architecture

The **MONVEX Windows Desktop Application** is built on the **Tauri Native Shell** architecture, combining the high performance and low memory footprint of Rust with the modern web interface of Next.js and Tailwind CSS.

- **Framework**: Tauri 1.5.11 (Rust 1.98.0 / Edition 2021)
- **Webview Engine**: Microsoft Edge WebView2 (Chromium Evergreen)
- **Application Identifier**: `com.monvex.desktop`
- **Application Name**: MONVEX — Financial Intelligence
- **Category**: Finance / Productivity
- **System Integration**:
  - System Tray Menu with Quick Transaction (`+`), Ask AI Copilot, Command Dashboard, and Background Minimization.
  - Global Command Center shortcut (`Ctrl+K`).
  - Native OS Toast Notifications via Windows Notification Subsystem.
  - Native File Dialogs (CSV/Statement statement import and ledger export).

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONVEX Windows Desktop App                   │
│                     (com.monvex.desktop)                        │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
                 ▼                                ▼
     ┌───────────────────────┐        ┌───────────────────────┐
     │   Tauri Native Core   │        │   Chromium Webview    │
     │     (Rust Engine)     │        │  (Next.js App Shell)  │
     │ - System Tray         │        │ - Command Center      │
     │ - Global Shortcuts    │        │ - Universal Search    │
     │ - OS Notifications    │        │ - AI Copilot Canvas   │
     │ - File I/O Sandbox    │        │ - Analytics & Ledger  │
     └───────────────────────┘        └───────────┬───────────┘
                                                  │
                                                  ▼ HTTPS
                                      ┌───────────────────────┐
                                      │ Live Render Backend   │
                                      │ monvex-backend.onrender│
                                      └───────────────────────┘
```

---

## 2. Production API & Cloud Endpoints

The desktop client communicates directly with the live production MONVEX cloud services:

- **Production Webview Entrypoint**: `https://monvex-web.onrender.com`
- **Production REST API Base**: `https://monvex-backend.onrender.com/api/v1`
- **Authentication**: JWT Bearer Tokens (SimpleJWT) + Google OAuth 2.0 Identity Services
- **AI Telemetry Grounding**: Google Gemini Pro / Flash API (Grounded server-side via backend only)
- **Database**: PostgreSQL 16 (Render Cloud)

---

## 3. Production Build Pipeline & Commands

The Windows release installer is generated using the native Tauri CLI and Cargo build tools:

```powershell
# Set Cargo/Rust toolchain path
$env:Path = "C:\Users\Demon68\.cargo\bin;" + $env:Path

# Navigate to desktop root
Set-Location "d:\MONVEX\desktop"

# Execute Tauri Production Build
npx.cmd tauri build
```

---

## 4. Generated Release Artifacts & Specifications

| Property | Value |
| :--- | :--- |
| **Product Name** | MONVEX |
| **Release Version** | `2.0.0` |
| **Target OS / Architecture** | Windows 10 / Windows 11 (64-bit `x64` / `x86_64`) |
| **Primary Installer** | NSIS Standalone Setup Executable (`.exe`) |
| **Secondary Installer** | Windows Installer Package (`.msi`) |
| **Output Path** | `desktop/src-tauri/target/release/bundle/nsis/` |
| **Installer Filename** | `MONVEX_2.0.0_x64-setup.exe` (Published as `MONVEX-Setup.exe`) |
| **Exact File Size** | `1,654,330 bytes` (~1.58 MB) |
| **SHA-256 Checksum** | `8603D83380481AFF21D3900558817DAD98263B45733F3CD98F9424A1037CA6AA` |
| **Standalone Executable** | `MONVEX.exe` (`6,571,008 bytes` / ~6.27 MB) |
| **MSI Package** | `MONVEX_2.0.0_x64_en-US.msi` (`2,973,696 bytes` / ~2.84 MB) |

---

## 5. Public Distribution & GitHub Release Strategy

Large executable binaries are distributed publicly via **GitHub Releases** over secure HTTPS rather than bloating normal Git repository history.

- **GitHub Repository**: `https://github.com/BlackHunter14365/MONVEX`
- **Release Tag**: `v2.0.0`
- **Release Title**: `MONVEX Desktop v2.0.0 (Windows x64)`
- **Public Download URL**:
  ```
  https://github.com/BlackHunter14365/MONVEX/releases/download/v2.0.0/MONVEX-Setup.exe
  ```

---

## 6. Landing Page Download CTA Integration

The production web landing page (`web/src/app/page.tsx`) features high-visibility, responsive Windows download touchpoints:

1. **Top Navigation & Mobile Menu**: Direct navigation link (`Windows App` / `Windows Desktop App` $\rightarrow$ `#desktop`).
2. **Hero Action Group**: Dedicated "Download for Windows" button with download icon, linking to `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`.
3. **Dedicated Windows Section (`#desktop`)**:
   - High-contrast card with native desktop feature breakdown (Command Center shortcuts, System Tray entry, OS notifications).
   - Clear compatibility tags: `Windows 10 / 11 (64-bit)`, `NSIS Installer (~1.6 MB)`, `v2.0.0 Production Release`.
   - Prominent, touch-friendly primary download button.
4. **Footer Navigation**: Quick link to Windows Desktop download.

---

## 7. Security Audit & Client Safety

The desktop client was subjected to a rigorous security audit:

- **Zero Committed Secrets**: Verified that no `DATABASE_URL`, `DATABASE_PASSWORD`, `SECRET_KEY`, `GEMINI_API_KEY`, or `GOOGLE_CLIENT_SECRET` exist in the client codebase or binary.
- **Server-Side AI Grounding**: All Gemini calls and financial telemetry queries are executed strictly by the Django backend on Render.
- **Strict Multi-Tenant Query Scoping**: All database requests are authenticated via JWT Bearer tokens and scoped to `request.user`.
- **Custom Protocol & Sandbox**: Tauri file system access is constrained strictly to user-level document/download scopes.

---

## 8. Verification & QA Matrix

| Verification Item | Scope | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Tauri Windows Build** | `desktop/` | **PASSED** | NSIS & MSI bundles generated with zero errors |
| **Installer Integrity** | `MONVEX-Setup.exe` | **PASSED** | Valid 1.65 MB NSIS installer, SHA-256 verified |
| **Production Cloud Binding** | Webview & API | **PASSED** | Points to `monvex-web.onrender.com` & `monvex-backend.onrender.com` |
| **Landing Page Build** | Next.js (`npm run build`) | **PASSED** | 24/24 static pages prerendered successfully |
| **TypeScript Validation** | `npx tsc --noEmit` | **PASSED** | 0 type errors across web & components |
| **Mobile Responsiveness** | Landing Page (`360px - 768px`) | **PASSED** | Responsive grid, zero horizontal overflow |
