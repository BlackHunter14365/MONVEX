import { AUTH_CONFIG, SessionExpiredReason } from '@/config/auth';

export interface StoredAuthSession {
  access: string;
  refresh: string;
  lastActivity: number;
  version: number;
}

const SESSION_VERSION = 2;

class AuthStorageManager {
  private lastActivityInMemory: number = 0;
  private cachedSession: StoredAuthSession | null = null;
  private isInitialized = false;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Initializes storage manager, performing any required legacy migrations.
   */
  private init() {
    if (!this.isBrowser() || this.isInitialized) return;
    this.isInitialized = true;
    this.migrateLegacyStorage();
    this.setupStorageListener();
  }

  /**
   * Seamlessly migrates existing legacy sessionStorage / localStorage tokens to the persistent session schema.
   */
  private migrateLegacyStorage() {
    try {
      // Check if persistent session already exists
      const existing = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION);
      if (existing) {
        // Clean up legacy keys
        sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
        sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);
        return;
      }

      // Check legacy sessionStorage or localStorage
      const legacyAccess =
        sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS) ||
        localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
      const legacyRefresh =
        sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH) ||
        localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);

      if (legacyAccess && legacyRefresh) {
        this.saveSession(legacyAccess, legacyRefresh);
      }

      // Purge legacy storage items
      sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
      sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);
    } catch {
      // Storage access blocked or restricted
    }
  }

  /**
   * Listens for cross-tab storage events (e.g. logout in another tab).
   */
  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === AUTH_CONFIG.STORAGE_KEYS.SESSION) {
        if (!event.newValue) {
          // Session was cleared in another tab
          this.cachedSession = null;
          window.dispatchEvent(new Event(AUTH_CONFIG.EVENTS.LOGOUT));
        } else {
          try {
            this.cachedSession = JSON.parse(event.newValue);
          } catch {
            this.cachedSession = null;
          }
        }
      }
    });
  }

  /**
   * Retrieves the active persistent session.
   * Enforces the inactivity timeout: if the user has been inactive longer than 7 days,
   * the session is purged and null is returned with the expired reason set.
   */
  public getSession(): StoredAuthSession | null {
    if (!this.isBrowser()) return null;
    this.init();

    try {
      const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION);
      if (!raw) {
        this.cachedSession = null;
        return null;
      }

      const session: StoredAuthSession = JSON.parse(raw);
      if (!session || !session.access || !session.refresh) {
        this.clearSession();
        return null;
      }

      // Check inactivity expiry
      const now = Date.now();
      const lastActivity = session.lastActivity || now;
      const inactiveDuration = now - lastActivity;

      if (inactiveDuration > AUTH_CONFIG.INACTIVITY_TIMEOUT_MS) {
        // Session expired due to inactivity
        this.setSessionExpiredReason('inactivity');
        this.clearSession(false); // don\'t overwrite the reason
        return null;
      }

      this.cachedSession = session;
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /**
   * Returns whether the session is currently expired due to inactivity.
   */
  public isInactive(): boolean {
    if (!this.isBrowser()) return false;
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION);
      if (!raw) return false;
      const session: StoredAuthSession = JSON.parse(raw);
      if (!session || !session.lastActivity) return false;
      return Date.now() - session.lastActivity > AUTH_CONFIG.INACTIVITY_TIMEOUT_MS;
    } catch {
      return false;
    }
  }

  public getAccessToken(): string | null {
    const session = this.getSession();
    return session ? session.access : null;
  }

  public getRefreshToken(): string | null {
    const session = this.getSession();
    return session ? session.refresh : null;
  }

  /**
   * Persists a newly obtained token pair with initial/refreshed activity timestamp.
   */
  public saveSession(access: string, refresh: string) {
    if (!this.isBrowser()) return;
    this.init();

    const now = Date.now();
    const session: StoredAuthSession = {
      access,
      refresh,
      lastActivity: now,
      version: SESSION_VERSION,
    };

    try {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, now.toString());
      this.lastActivityInMemory = now;
      this.cachedSession = session;
      this.clearSessionExpiredReason();
    } catch {
      // QuotaExceededError or private browsing restrictions
    }
  }

  /**
   * Updates the access token after a silent token refresh while preserving the refresh token.
   */
  public updateTokens(access: string, newRefresh?: string) {
    if (!this.isBrowser()) return;
    const current = this.getSession();
    const refresh = newRefresh || (current ? current.refresh : '');
    if (refresh) {
      this.saveSession(access, refresh);
    }
  }

  /**
   * Refreshes the last activity timestamp in storage.
   * Throttled to at most once every 60 seconds unless forced.
   */
  public updateActivity(force = false) {
    if (!this.isBrowser()) return;
    const now = Date.now();

    if (!force && this.lastActivityInMemory && now - this.lastActivityInMemory < AUTH_CONFIG.ACTIVITY_THROTTLE_MS) {
      return;
    }

    try {
      const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION);
      if (!raw) return;

      const session: StoredAuthSession = JSON.parse(raw);
      if (session) {
        session.lastActivity = now;
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(session));
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, now.toString());
        this.lastActivityInMemory = now;
        this.cachedSession = session;
      }
    } catch {
      // ignore
    }
  }

  /**
   * Completely removes all credentials, persistent sessions, and legacy tokens.
   */
  public clearSession(clearReason = true) {
    if (!this.isBrowser()) return;
    this.cachedSession = null;
    this.lastActivityInMemory = 0;

    try {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);
      sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_ACCESS);
      sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LEGACY_REFRESH);

      if (clearReason) {
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_EXPIRED_REASON);
      }
    } catch {
      // ignore
    }
  }

  public setSessionExpiredReason(reason: SessionExpiredReason) {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_EXPIRED_REASON, reason);
    } catch {}
  }

  public getSessionExpiredReason(): SessionExpiredReason | null {
    if (!this.isBrowser()) return null;
    try {
      return (localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_EXPIRED_REASON) as SessionExpiredReason) || null;
    } catch {
      return null;
    }
  }

  public clearSessionExpiredReason() {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_EXPIRED_REASON);
    } catch {}
  }
}

export const authStorage = new AuthStorageManager();
