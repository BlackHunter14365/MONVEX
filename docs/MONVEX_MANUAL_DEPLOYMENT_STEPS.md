# MONVEX Step-by-Step Manual Cloud Deployment Guide

Follow these exact steps to deploy MONVEX to Render Cloud and connect Google OAuth 2.0.

---

## Phase 1: Push Code to Your GitHub Repository

1. **Remote Already Configured:**
   - Remote URL: `https://github.com/BlackHunter14365/MONVEX.git`
2. **Push Branch from Terminal:**
   ```powershell
   git push -u origin master
   ```
   *(If prompted by Git Credential Manager or GitHub, complete the browser sign-in or provide your GitHub Personal Access Token).*
3. **Verify:** Confirm that commit `6d75385` is now the `HEAD` of `master` on `https://github.com/BlackHunter14365/MONVEX`.

---

## Phase 2: Deploy to Render via Blueprint (`render.yaml`)

1. **Log in to Render Dashboard:**
   - Navigate to [dashboard.render.com](https://dashboard.render.com/).
2. **Launch Blueprint:**
   - Click the **New +** button in the top navigation bar.
   - Select **Blueprint**.
3. **Connect Your GitHub Repository:**
   - Select your `MONVEX` repository.
   - Render will parse [`render.yaml`](file:///d:/MONVEX/render.yaml) and display the 3 services:
     - `monvex-db` (PostgreSQL 16)
     - `monvex-backend` (Web Service)
     - `monvex-web` (Web Service)
4. **Enter Environment Variables (Server-Only Secrets):**
   - **`SECRET_KEY`**: Click *Generate* (Render generates a 50-character random key).
   - **`GEMINI_API_KEY`**: Paste your Google AI Studio API key (from [aistudio.google.com](https://aistudio.google.com/)).
   - **`GOOGLE_CLIENT_ID`**: Paste your Google OAuth Web Client ID.
   - **`GOOGLE_CLIENT_SECRET`**: Paste your Google OAuth Web Client Secret.
   - **`CORS_ALLOWED_ORIGINS`**: Leave blank initially or enter `https://monvex-web.onrender.com`.
5. **Click "Apply":** Render will build and deploy the database, backend, and frontend automatically.

---

## Phase 3: Post-Deployment Verification & URL Linking

1. **Obtain Render URLs:**
   - **Backend URL:** Copy from Render Dashboard (e.g. `https://monvex-backend-xxxx.onrender.com`).
   - **Web URL:** Copy from Render Dashboard (e.g. `https://monvex-web-xxxx.onrender.com`).
2. **Verify Backend Health:**
   - Open in browser: `https://<your-backend-url>/health/` $\rightarrow$ Expect `HTTP 200 {"status": "healthy"}`
   - Open in browser: `https://<your-backend-url>/ready/` $\rightarrow$ Expect `HTTP 200 {"status": "ready", "checks": {"database": true}}`
3. **Update Web Environment Variable:**
   - Go to `monvex-web` service settings in Render Dashboard $\rightarrow$ **Environment**.
   - Set `NEXT_PUBLIC_API_URL` to `https://<your-backend-url>/api/v1`.
   - Click **Save Changes** (Render will trigger a quick redeploy of the web client).
4. **Update Backend CORS Configuration:**
   - Go to `monvex-backend` service settings in Render Dashboard $\rightarrow$ **Environment**.
   - Set `CORS_ALLOWED_ORIGINS` to `https://<your-web-url>,https://<your-custom-domain>`.
   - Set `CSRF_TRUSTED_ORIGINS` to `https://*.onrender.com,https://<your-web-url>`.
   - Click **Save Changes**.

---

## Phase 4: Configure Google Cloud OAuth 2.0

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2. Click your OAuth 2.0 Client ID for Web.
3. Under **Authorized JavaScript Origins**, add:
   - `https://<your-web-url>` (e.g. `https://monvex-web-xxxx.onrender.com`)
   - `http://localhost:3000` (for local development)
4. Under **Authorized Redirect URIs**, add:
   - `https://<your-web-url>/login`
   - `https://<your-web-url>/api/auth/callback/google`
5. Click **Save**.

---

## Phase 5: Build Production Native Clients (Windows & Android)

1. **Android Release APK / AAB:**
   ```bash
   cd mobile
   flutter build apk --release --dart-define=API_BASE_URL=https://<your-backend-url>/api/v1
   ```
   Output: `mobile/build/app/outputs/flutter-apk/app-release.apk`
2. **Windows Tauri Installer:**
   ```bash
   cd desktop
   npm run build
   ```
   Output: `desktop/src-tauri/target/release/bundle/nsis/MONVEX-Setup.exe`
