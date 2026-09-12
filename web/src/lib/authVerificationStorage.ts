/**
 * Safe client-side verification session storage.
 * Stores ONLY public metadata (session ID, masked email, purpose, expiration timestamps).
 * NEVER stores raw plaintext OTPs or sensitive user credentials.
 */

export interface VerificationSessionData {
  verification_id: string;
  masked_email: string;
  purpose: 'REGISTRATION' | 'LOGIN';
  expires_at: number; // Unix epoch in ms
  resend_available_at: number; // Unix epoch in ms
  created_at: number; // Unix epoch in ms
}

const STORAGE_KEY = 'monvex_active_verification';

export const authVerificationStorage = {
  saveSession: (data: {
    verification_id: string;
    masked_email: string;
    purpose?: 'REGISTRATION' | 'LOGIN';
    expires_in?: number; // seconds
    resend_after?: number; // seconds
  }): VerificationSessionData => {
    const now = Date.now();
    const expiresInSec = data.expires_in && data.expires_in > 0 ? data.expires_in : 600;
    const resendAfterSec = data.resend_after && data.resend_after > 0 ? data.resend_after : 60;

    const session: VerificationSessionData = {
      verification_id: data.verification_id,
      masked_email: data.masked_email,
      purpose: data.purpose || 'REGISTRATION',
      expires_at: now + expiresInSec * 1000,
      resend_available_at: now + resendAfterSec * 1000,
      created_at: now,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Safe fallback if storage quota exceeded or disabled
      }
    }

    return session;
  },

  getSession: (): VerificationSessionData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const session: VerificationSessionData = JSON.parse(raw);
      if (!session.verification_id || !session.expires_at) {
        authVerificationStorage.clearSession();
        return null;
      }

      // If already expired by more than 5 minutes, purge
      if (Date.now() > session.expires_at + 300000) {
        authVerificationStorage.clearSession();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  },

  clearSession: (): void => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },

  updateAfterResend: (resend_after = 60, expires_in = 600): VerificationSessionData | null => {
    const current = authVerificationStorage.getSession();
    if (!current) return null;

    const now = Date.now();
    current.resend_available_at = now + resend_after * 1000;
    current.expires_at = now + expires_in * 1000;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // ignore
      }
    }

    return current;
  },

  getRemainingSeconds: (session: VerificationSessionData): number => {
    const remaining = Math.floor((session.expires_at - Date.now()) / 1000);
    return Math.max(0, remaining);
  },

  getResendCooldownSeconds: (session: VerificationSessionData): number => {
    const remaining = Math.floor((session.resend_available_at - Date.now()) / 1000);
    return Math.max(0, remaining);
  },
};
