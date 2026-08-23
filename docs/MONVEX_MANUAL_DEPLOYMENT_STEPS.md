# MONVEX Manual Cloud Deployment & Integration Guide

This guide provides step-by-step instructions for deploying MONVEX to Render Cloud, connecting Google OAuth 2.0, setting up custom DNS domains, and distributing native binaries.

---

## Step 1: Deploying to Render via Blueprint (`render.yaml`)

1. **Log in to Render:** Go to [dashboard.render.com](https://dashboard.render.com/).
2. **Create New Blueprint:**
   - Click **New +** at the top right of the dashboard.
   - Select **Blueprint**.
3. **Connect Repository:**
   - Select your GitHub repository containing the MONVEX project.
   - Render will automatically locate [`render.yaml`](file:///d:/MONVEX/render.yaml) at the repository root.
4. **Configure Environment Parameters:**
   - **`SECRET_KEY`**: Click *Generate* (Render generates a 50+ character random key).
   - **`GEMINI_API_KEY`**: Enter your Google AI Studio API key.
   - **`GOOGLE_CLIENT_ID`**: Enter your Google Cloud OAuth 2.0 Client ID.
   - **`GOOGLE_CLIENT_SECRET`**: Enter your Google Cloud OAuth 2.0 Client Secret.
5. **Click "Apply":** Render will automatically provision:
   - `monvex-db` (PostgreSQL 16)
   - `monvex-backend` (Django REST API + Gunicorn + WhiteNoise)
   - `monvex-web` (Next.js 14 Web Service)

---

## Step 2: Google Cloud Console OAuth 2.0 Configuration

1. **Open Google Cloud Console:** Navigate to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2. **Select OAuth 2.0 Client ID:** Select your Web application client.
3. **Configure Authorized JavaScript Origins:**
   - Add: `https://monvex-web.onrender.com`
   - Add: `https://app.monvex.ai` (or your custom domain)
   - Add: `http://localhost:3000` (for local development)
4. **Configure Authorized Redirect URIs:**
   - Add: `https://monvex-web.onrender.com/login`
   - Add: `https://monvex-web.onrender.com/api/auth/callback/google`
   - Add: `http://localhost:3000/login`
5. **Save Changes:** Google Identity Services will now accept sign-ins from your production web application.

---

## Step 3: Custom Domain & DNS Mapping (Optional)

| Record Type | Host / Name | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **CNAME** | `app` or `@` | `monvex-web.onrender.com` | Web Frontend (`https://monvex.ai`) |
| **CNAME** | `api` | `monvex-backend.onrender.com` | Backend REST API (`https://api.monvex.ai`) |

After adding DNS records in your domain registrar (Cloudflare, GoDaddy, Namecheap):
1. In Render Web Service settings, add custom domain `app.monvex.ai`.
2. In Render Backend Service settings, add custom domain `api.monvex.ai`.
3. Update backend `CORS_ALLOWED_ORIGINS` to `https://app.monvex.ai`.
4. Update web `NEXT_PUBLIC_API_URL` to `https://api.monvex.ai/api/v1`.

---

## Step 4: Android Release Signing & Distribution

1. To generate a signed Android App Bundle (AAB) for Google Play:
   ```bash
   cd mobile
   flutter build appbundle --release --dart-define=API_BASE_URL=https://monvex-backend.onrender.com/api/v1
   ```
2. The output bundle will be located at:
   `mobile/build/app/outputs/bundle/release/app-release.aab`
3. Upload `app-release.aab` directly to Google Play Console.
