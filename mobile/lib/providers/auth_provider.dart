import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:local_auth/local_auth.dart';
import '../core/config/env_config.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../core/storage/secure_storage.dart';
import '../core/storage/cache_manager.dart';
import '../models/user_profile.dart';

class AuthProvider extends ChangeNotifier {
  UserProfile? _user;
  bool _isLoading = true;
  String? _errorMessage;
  bool _biometricsEnabled = false;
  bool _isAppLocked = false;

  late final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: EnvConfig.googleWebClientId,
    scopes: ['email', 'profile'],
  );
  final LocalAuthentication _localAuth = LocalAuthentication();

  /// Global callback registered by providers to purge in-memory state on logout
  static final List<VoidCallback> _onLogoutCallbacks = [];

  static void registerLogoutCallback(VoidCallback callback) {
    _onLogoutCallbacks.add(callback);
  }

  static void unregisterLogoutCallback(VoidCallback callback) {
    _onLogoutCallbacks.remove(callback);
  }

  UserProfile? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get biometricsEnabled => _biometricsEnabled;
  bool get isAppLocked => _isAppLocked;

  AuthProvider() {
    ApiClient.onUnauthorized = () {
      _purgeLocalSession();
    };
    Future.microtask(() => checkAuthStatus(isInitial: true));
  }

  Future<void> _initBiometrics() async {
    _biometricsEnabled = await SecureStorageService.isBiometricsEnabled();
    if (_biometricsEnabled && isAuthenticated) {
      _isAppLocked = true;
    }
    notifyListeners();
  }

  Future<void> toggleBiometrics(bool enabled) async {
    _biometricsEnabled = enabled;
    await SecureStorageService.setBiometricsEnabled(enabled);
    notifyListeners();
  }

  void unlockApp() {
    _isAppLocked = false;
    notifyListeners();
  }

  void lockApp() {
    if (_biometricsEnabled) {
      _isAppLocked = true;
      notifyListeners();
    }
  }

  Future<bool> authenticateWithBiometrics() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      if (!canCheck && !isDeviceSupported) {
        unlockApp();
        return true;
      }

      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to access your MONVEX Financial Vault',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );

      if (authenticated) {
        unlockApp();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[AuthProvider] Biometric error: $e');
      return false;
    }
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
        await _initBiometrics();
      }
    } catch (_) {
      await _purgeLocalSession();
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

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled dialog
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;

      if (idToken == null || idToken.isEmpty) {
        throw ApiException('Google ID token was not returned by Google Play Services.');
      }

      final res = await ApiClient.post(ApiEndpoints.googleAuth, {
        'credential': idToken,
      });

      if (res is Map<String, dynamic> && res['access'] != null && res['refresh'] != null) {
        await SecureStorageService.saveTokens(
          accessToken: res['access'],
          refreshToken: res['refresh'],
        );
        await checkAuthStatus();
        return true;
      }
      throw ApiException(res['message'] ?? 'Google authentication failed.');
    } catch (e, stack) {
      debugPrint('[AuthProvider] Google Sign-In technical error: $e\n$stack');
      final errStr = e.toString();
      if (errStr.contains('sign_in_canceled') || errStr.contains('12501')) {
        // User intentionally cancelled account picker
        _errorMessage = null;
      } else {
        // Strict production mandate: never expose raw PlatformException or ApiException: 10
        _errorMessage = "Google Sign-In couldn't be completed.";
      }
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> fields) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.patch(ApiEndpoints.me, fields);
      if (res is Map<String, dynamic>) {
        _user = UserProfile.fromJson(res);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw ApiException('Could not update profile information.');
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

  Future<void> _purgeLocalSession() async {
    final userId = _user?.id ?? '';
    if (userId.isNotEmpty) {
      CacheManager.clearUserCache(userId);
    }
    CacheManager.clearAll();
    await SecureStorageService.clearTokens();
    try {
      if (await _googleSignIn.isSignedIn()) {
        await _googleSignIn.signOut();
      }
    } catch (_) {}
    _user = null;
    _isAppLocked = false;

    // Trigger all registered data providers to wipe in-memory state
    for (final cb in _onLogoutCallbacks) {
      try {
        cb();
      } catch (_) {}
    }

    notifyListeners();
  }

  Future<void> logout() async {
    final refresh = await SecureStorageService.getRefreshToken();
    await _purgeLocalSession();

    if (refresh != null) {
      try {
        await ApiClient.post(ApiEndpoints.logout, {'refresh': refresh});
      } catch (_) {
        // ignore logout network errors
      }
    }
  }
}
