import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Keystore-backed secure storage for sensitive authentication tokens with safe fallback
class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      resetOnError: true,
    ),
  );

  static const String _accessTokenKey = 'monvex_access_token';
  static const String _refreshTokenKey = 'monvex_refresh_token';

  static Future<String?> getAccessToken() async {
    try {
      return await _storage.read(key: _accessTokenKey);
    } catch (e) {
      debugPrint('[SecureStorage] Error reading access token: $e');
      return null;
    }
  }

  static Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _refreshTokenKey);
    } catch (e) {
      debugPrint('[SecureStorage] Error reading refresh token: $e');
      return null;
    }
  }

  static Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    try {
      await _storage.write(key: _accessTokenKey, value: accessToken);
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    } catch (e) {
      debugPrint('[SecureStorage] Error saving tokens: $e');
    }
  }

  static Future<void> clearTokens() async {
    try {
      await _storage.delete(key: _accessTokenKey);
      await _storage.delete(key: _refreshTokenKey);
    } catch (e) {
      debugPrint('[SecureStorage] Error clearing tokens: $e');
    }
  }

  static Future<bool> hasValidToken() async {
    try {
      final token = await getAccessToken();
      return token != null && token.isNotEmpty;
    } catch (e) {
      debugPrint('[SecureStorage] Error checking valid token: $e');
      return false;
    }
  }
}

