import 'package:flutter/foundation.dart';

/// User-scoped memory and offline cache manager.
/// Ensures zero data leakage between User A and User B.
class CacheManager {
  static final Map<String, dynamic> _memoryCache = {};

  static String _formatKey(String userId, String key) => 'user_${userId}_$key';

  static void set(String userId, String key, dynamic value) {
    if (userId.isEmpty) return;
    _memoryCache[_formatKey(userId, key)] = value;
  }

  static dynamic get(String userId, String key) {
    if (userId.isEmpty) return null;
    return _memoryCache[_formatKey(userId, key)];
  }

  static bool has(String userId, String key) {
    if (userId.isEmpty) return false;
    return _memoryCache.containsKey(_formatKey(userId, key));
  }

  /// Purges all cached records for a specific user ID on logout or session expiration
  static void clearUserCache(String userId) {
    if (userId.isEmpty) return;
    final prefix = 'user_${userId}_';
    _memoryCache.removeWhere((k, _) => k.startsWith(prefix));
    debugPrint('[CacheManager] User cache purged for $userId');
  }

  /// Complete wipe of all cached data
  static void clearAll() {
    _memoryCache.clear();
    debugPrint('[CacheManager] Global memory cache cleared.');
  }
}
