/**
 * MONVEX Centralized Authentication & Session Architecture Configuration
 */

export const AUTH_CONFIG = {
  // Centralized session inactivity timeout: 7 days
  INACTIVITY_TIMEOUT_DAYS: 7,
  // Milliseconds equivalent: 7 days = 604,800,000 ms
  INACTIVITY_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000,
  // Throttled activity refresh: update storage at most once every 60 seconds
  ACTIVITY_THROTTLE_MS: 60 * 1000,
  // Storage keys
  STORAGE_KEYS: {
    SESSION: 'monvex_auth_session',
    LAST_ACTIVITY: 'monvex_last_activity_ts',
    SESSION_EXPIRED_REASON: 'monvex_session_expired_reason',
    // Legacy keys for clean migration/purging
    LEGACY_ACCESS: 'monvex_access_token',
    LEGACY_REFRESH: 'monvex_refresh_token',
  },
  // Cross-window and application events
  EVENTS: {
    LOGOUT: 'monvex:auth-logout',
    ACTIVITY: 'monvex:auth-activity',
    SESSION_EXPIRED: 'monvex:auth-session-expired',
  },
} as const;

export type SessionExpiredReason = 'inactivity' | 'invalid_token' | 'manual_logout';
