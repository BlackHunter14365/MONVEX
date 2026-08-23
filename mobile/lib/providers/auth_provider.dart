import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_profile.dart';

class AuthProvider extends ChangeNotifier {
  UserProfile? _user;
  bool _isLoading = true;
  String? _errorMessage;

  UserProfile? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    ApiClient.onUnauthorized = () {
      _user = null;
      _isLoading = false;
      notifyListeners();
    };
    Future.microtask(() => checkAuthStatus(isInitial: true));
  }

  Future<void> checkAuthStatus({bool isInitial = false}) async {
    _isLoading = true;
    _errorMessage = null;
    if (!isInitial) {
      notifyListeners();
    }

    try {
      final hasToken = await SecureStorageService.hasValidToken();
      if (!hasToken) {
        _user = null;
        _isLoading = false;
        notifyListeners();
        return;
      }

      final profileData = await ApiClient.get(ApiEndpoints.me);
      if (profileData is Map<String, dynamic>) {
        _user = UserProfile.fromJson(profileData);
      }
    } catch (_) {
      await SecureStorageService.clearTokens();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post(ApiEndpoints.login, {
        'identifier': identifier.trim(),
        'password': password,
      });

      if (res is Map<String, dynamic> && res['access'] != null && res['refresh'] != null) {
        await SecureStorageService.saveTokens(
          accessToken: res['access'],
          refreshToken: res['refresh'],
        );
        await checkAuthStatus();
        return true;
      }
      throw ApiException('Invalid credentials returned from server.');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<Map<String, dynamic>?> register(Map<String, dynamic> payload) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post(ApiEndpoints.register, payload);
      _isLoading = false;
      notifyListeners();
      return res is Map<String, dynamic> ? res : null;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> verifyOtp(String verificationId, String code) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post(ApiEndpoints.verificationCheck, {
        'verification_id': verificationId,
        'code': code,
      });

      if (res is Map<String, dynamic> && res['success'] == true) {
        final data = res['data'];
        if (data != null && data['access'] != null && data['refresh'] != null) {
          await SecureStorageService.saveTokens(
            accessToken: data['access'],
            refreshToken: data['refresh'],
          );
          await checkAuthStatus();
          return true;
        }
      }
      throw ApiException(res['message'] ?? 'Invalid verification code.');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resendOtp(String verificationId) async {
    try {
      await ApiClient.post(ApiEndpoints.verificationResend, {
        'verification_id': verificationId,
      });
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final refresh = await SecureStorageService.getRefreshToken();
    await SecureStorageService.clearTokens();
    _user = null;
    notifyListeners();

    if (refresh != null) {
      try {
        await ApiClient.post(ApiEndpoints.logout, {'refresh': refresh});
      } catch (_) {
        // ignore logout network errors
      }
    }
  }
}
