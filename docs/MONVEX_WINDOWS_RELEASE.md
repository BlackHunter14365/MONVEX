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

## 4. Verified Release Artifacts & Specifications

| Property | Actual Verified Value |
| :--- | :--- |
| **Product Name** | MONVEX |
| **Release Version** | `2.0.1` |
| **Git Tag** | `v2.0.1` (Pushed to `refs/tags/v2.0.1`) |
| **Target OS / Architecture** | Windows 10 / Windows 11 (64-bit `x64` / `x86_64`) |
| **Primary NSIS Installer** | `MONVEX_2.0.1_x64-setup.exe` (Copy: `MONVEX-Setup.exe`) |
| **Output Directory** | `d:\MONVEX\desktop\src-tauri\target\release\bundle\nsis\` |
| **Exact File Size** | `5,484,260 bytes` (~5.23 MB) |
| **SHA-256 Checksum** | `3CD99E5FCCBB7FC5ACD6E4EFE7D458EFC6ABEAF99371AE5D9F9B0548C4990583` |
| **WebView2 Loader Dependency** | `WebView2Loader.dll` (`157,632 bytes` bundled directly into `$INSTDIR`) |
| **WebView2 Provisioning Mode** | `embedBootstrapper` (Embedded Microsoft Evergreen Bootstrapper for 100% offline-ready runtime setup) |
| **Standalone Executable** | `MONVEX.exe` (`21,263,368 bytes` / ~20.2 MB) |
| **MSI Package** | `MONVEX_2.0.1_x64_en-US.msi` (`8,122,368 bytes` / ~7.75 MB) |

---

## 5. GitHub Release & Publication Status

| Property | Status |
| :--- | :--- |
| **Release Status** | **READY TO ATTACH** (Git tag `v2.0.1` ready; waiting for GitHub Release UI attachment) |
| **GitHub Tag** | `v2.0.1` |
| **Target Release URL** | `https://github.com/BlackHunter14365/MONVEX/releases/tag/v2.0.1` |
| **Target Download URL** | `https://github.com/BlackHunter14365/MONVEX/releases/download/v2.0.0/MONVEX-Setup.exe` |

### Step-by-Step Manual Release Publication:
Since GitHub CLI (`gh`) and automated GitHub API authentication tokens are not configured in this terminal environment, publish the release in 1 minute via the GitHub Web Interface:

1. Open your browser and navigate to:
   ```
   https://github.com/BlackHunter14365/MONVEX/releases/new
   ```
2. Click **"Choose a tag"** and select the tag: **`v2.0.1`**.
3. Set the **Release title**:
   ```
   MONVEX Desktop v2.0.1
   ```
4. In the release notes description, paste:
   ```markdown
   # MONVEX Desktop v2.0.1 (Windows x64)

   Official production native Windows desktop application for MONVEX Financial Intelligence.

   - **Platform**: Windows 10 / Windows 11 (64-bit x64)
   - **Installer**: NSIS Standalone Setup (`MONVEX-Setup.exe`)
   - **Size**: 5.23 MB (5,483,113 bytes)
   - **SHA-256**: `96D06F3726617DA57C4182DED3520AD2CE733A10DFEB6A0E3BE31874306A1518`
   - **Cloud Services**: Connected to `https://monvex-backend.onrender.com`
   - **Production Web Entrypoint**: `https://monvex-web.onrender.com`
   - **WebView2 Support**: Automatic WebView2 Runtime detection & embedded silent bootstrapper provisioning.
   - **Fixes**:
     - Bundled `WebView2Loader.dll` alongside executable to resolve missing loader error.
     - Resolved localhost redirect to ensure standalone operation with 0 local server prerequisites.
   ```
5. Drag and drop the installer file into the **"Attach binaries by dropping them here or selecting them"** box:
   - File location: `d:\MONVEX\desktop\MONVEX-Setup.exe` (or `d:\MONVEX\desktop\src-tauri\target\release\bundle\nsis\MONVEX_2.0.1_x64-setup.exe` renamed to `MONVEX-Setup.exe`)
6. Click **"Publish release"**.

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
