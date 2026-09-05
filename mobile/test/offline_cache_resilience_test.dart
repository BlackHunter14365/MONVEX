import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/core/storage/cache_manager.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Offline Cache & Resilience Tests', () {
    setUp(() {
      CacheManager.clearAll();
    });

    test('CacheManager sets and retrieves data correctly with user scope', () {
      const userId = 'usr_offline_001';
      const key = 'dashboard_summary';
      final testData = {
        'net_worth': 540000.0,
        'currency': 'INR',
        'health_score': 88,
      };

      CacheManager.set(userId, key, testData);

      expect(CacheManager.has(userId, key), isTrue);
      final cached = CacheManager.get(userId, key) as Map<String, dynamic>?;
      expect(cached, isNotNull);
      expect(cached!['net_worth'], equals(540000.0));
      expect(cached['health_score'], equals(88));
    });

    test('CacheManager isolates user keys strictly between distinct users', () {
      const userA = 'usr_offline_A';
      const userB = 'usr_offline_B';
      const key = 'balance';

      CacheManager.set(userA, key, 75000.0);
      CacheManager.set(userB, key, 1200.0);

      expect(CacheManager.get(userA, key), equals(75000.0));
      expect(CacheManager.get(userB, key), equals(1200.0));

      CacheManager.clearUserCache(userA);
      expect(CacheManager.get(userA, key), isNull);
      expect(CacheManager.get(userB, key), equals(1200.0));
    });

    test('CacheManager ignores empty user IDs to prevent accidental global pollution', () {
      CacheManager.set('', 'dangerous_key', 'should_not_save');
      expect(CacheManager.get('', 'dangerous_key'), isNull);
      expect(CacheManager.has('', 'dangerous_key'), isFalse);
    });

    test('CacheManager clearAll wipes all users from memory', () {
      CacheManager.set('u1', 'k1', 'v1');
      CacheManager.set('u2', 'k2', 'v2');

      CacheManager.clearAll();

      expect(CacheManager.get('u1', 'k1'), isNull);
      expect(CacheManager.get('u2', 'k2'), isNull);
    });
  });
}
