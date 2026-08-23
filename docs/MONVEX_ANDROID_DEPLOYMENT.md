# MONVEX Android Build & Deployment Guide

============================================================
PLATFORM: ANDROID
TARGET: FLUTTER RELEASE APK / AAB
PROJECT: MONVEX V2
============================================================

## 1. Prerequisites
- **Flutter SDK**: 3.x+ (Dart 3.x+)
- **Android SDK**: API Level 34 (Android 14) with minSdk 21 (Android 5.0 Lollipop)
- **Java Development Kit (JDK)**: OpenJDK 17

---

## 2. Configuration & Host Mapping

### 2.1 Development Environments
- **Android Emulator**: Uses `10.0.2.2:8000` to communicate with the host Django development server.
- **Physical Device**: Uses host LAN IP (e.g., `http://192.168.1.x:8000/api/v1`) or Ngrok tunnel over WiFi.
- **Production**: Uses production HTTPS API endpoint (configured in `lib/core/config/env_config.dart`).

---

## 3. Build Commands

### 3.1 Fetch Dependencies
```bash
cd mobile
flutter pub get
```

### 3.2 Run in Debug Mode
```bash
flutter run
```

### 3.3 Build Release APK
```bash
flutter build apk --release
```
*Output Path*: `mobile/build/app/outputs/flutter-apk/app-release.apk`

### 3.4 Build Release App Bundle (Google Play Store)
```bash
flutter build appbundle --release
```
*Output Path*: `mobile/build/app/outputs/bundle/release/app-release.aab`

---

## 4. Android App Identity & Permissions
- **Application Name**: `MONVEX`
- **Application ID**: `com.monvex.app`
- **Permissions**: `android.permission.INTERNET`, `android.permission.ACCESS_NETWORK_STATE`
- **Security**: Cleartext HTTP permitted only for local development (`10.0.2.2` / local LAN); all remote production traffic strictly enforced over TLS 1.3 (HTTPS).
