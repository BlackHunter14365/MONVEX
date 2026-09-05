import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/providers/auth_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const MethodChannel channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, (MethodCall call) async {
      return null;
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, null);
  });

  group('Biometric & App Lifecycle Lock Tests (Phase 7)', () {
    test('AuthProvider initializes with biometric unlocked state before biometrics enabled', () {
      final auth = AuthProvider();
      expect(auth.isAppLocked, isFalse);
      expect(auth.biometricsEnabled, isFalse);
    });

    test('AuthProvider lockApp locks app when biometrics is enabled and unlockApp clears it', () async {
      final auth = AuthProvider();

      await auth.toggleBiometrics(true);
      expect(auth.biometricsEnabled, isTrue);

      auth.lockApp();
      expect(auth.isAppLocked, isTrue);

      auth.unlockApp();
      expect(auth.isAppLocked, isFalse);
    });

    test('AuthProvider maintains locked state upon repeated lock calls', () async {
      final auth = AuthProvider();
      await auth.toggleBiometrics(true);

      auth.lockApp();
      auth.lockApp();
      expect(auth.isAppLocked, isTrue);

      auth.unlockApp();
      expect(auth.isAppLocked, isFalse);
    });

    test('AuthProvider logout clears lock state and resets user session', () async {
      final auth = AuthProvider();
      await auth.toggleBiometrics(true);
      auth.lockApp();
      expect(auth.isAppLocked, isTrue);

      await auth.logout();
      expect(auth.isAppLocked, isFalse);
      expect(auth.isAuthenticated, isFalse);
      expect(auth.user, isNull);
    });
  });
}
