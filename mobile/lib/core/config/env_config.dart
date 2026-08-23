import 'package:flutter/foundation.dart';

/// Environment Configuration for MONVEX Android Mobile
class EnvConfig {
  /// Default base URL for Android Emulator (10.0.2.2 points to host localhost)
  static const String _emulatorUrl = 'http://10.0.2.2:8000/api/v1';

  /// Default base URL for physical device on local WiFi network
  static const String _lanUrl = 'http://192.168.1.100:8000/api/v1';

  /// Production HTTPS endpoint
  static const String _prodUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.monvex.app/api/v1',
  );

  /// Active environment mode: 'emulator' | 'lan' | 'production'
  static String activeMode = kReleaseMode ? 'production' : 'emulator';

  /// Dynamic custom URL override (if user configures in settings)
  static String? customBaseUrl;

  static String get baseUrl {
    if (customBaseUrl != null && customBaseUrl!.isNotEmpty) {
      return customBaseUrl!;
    }
    switch (activeMode) {
      case 'production':
        return _prodUrl;
      case 'lan':
        return _lanUrl;
      case 'emulator':
      default:
        return kReleaseMode ? _prodUrl : _emulatorUrl;
    }
  }
}
