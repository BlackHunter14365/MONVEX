/**
 * MONVEX HTTP Client Core
 */

import { authStorage } from '@/lib/authStorage';
import { AUTH_CONFIG } from '@/config/auth';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://monvex-backend.onrender.com/api/v1';

export class HttpClient {
  private refreshPromise: Promise<string | null> | null = null;

  public getAccessToken(): string | null {
    return authStorage.getAccessToken();
  }

  public getRefreshToken(): string | null {
    return authStorage.getRefreshToken();
  }

  public setAccessToken(token: string) {
    authStorage.updateTokens(token);
  }

  public setTokens(access: string, refresh: string) {
    authStorage.saveSession(access, refresh);
  }

  public clearTokens() {
    authStorage.clearSession();
  }

  public async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (authStorage.isInactive()) {
      authStorage.setSessionExpiredReason('inactivity');
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_CONFIG.EVENTS.LOGOUT));
      }
      return null;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_CONFIG.EVENTS.LOGOUT));
      }
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Platform': 'web',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) {
          // Token is blacklisted, expired, or invalid
          if (res.status === 401 || res.status === 400) {
            authStorage.setSessionExpiredReason('invalid_token');
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event(AUTH_CONFIG.EVENTS.LOGOUT));
            }
            return null;
          }
          throw new Error('Temporary error refreshing authentication token');
        }

        const data = await res.json();
        const newAccess = data.access;
        const newRefresh = data.refresh || refreshToken;
        this.setTokens(newAccess, newRefresh);
        return newAccess;
      } catch (err: any) {
        // If network error occurred, do NOT clear tokens immediately (graceful degradation)
        if (err.name === 'TypeError' || err.message?.includes('fetch')) {
          return null;
        }
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const reqId = typeof crypto !== 'undefined' && crypto.randomUUID ? `req_${crypto.randomUUID().slice(0, 16)}` : `req_${Math.random().toString(36).substring(2, 10)}`;
    const headers: Record<string, string> = {
      'X-Request-ID': reqId,
      'X-Client-Platform': 'web',
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    } else if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const isPublicAuthEndpoint =
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/google') ||
      endpoint.startsWith('/auth/token/refresh') ||
      endpoint.startsWith('/auth/verification') ||
      endpoint.startsWith('/auth/verify-otp') ||
      endpoint.startsWith('/auth/resend-otp') ||
      endpoint.startsWith('/contact') ||
      endpoint.startsWith('/security/contact');

    if (token && !isPublicAuthEndpoint) {
      headers['Authorization'] = `Bearer ${token}`;
      authStorage.updateActivity();
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      // Automatic Token Refresh on 401 for authenticated endpoints
      if (res.status === 401 && !isPublicAuthEndpoint) {
        const newAccessToken = await this.refreshAccessToken();
        if (newAccessToken) {
          // Retry the request with the refreshed token
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${newAccessToken}`,
          };
          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });

          if (retryRes.ok) {
            authStorage.updateActivity();
            if (retryRes.status === 204) {
              return {} as T;
            }
            return retryRes.json();
          }
        }
      }

      const err = await res.json().catch(() => ({ detail: res.statusText }));
      let msg = 'An unexpected error occurred';

      if (res.status === 401 && !isPublicAuthEndpoint) {
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(AUTH_CONFIG.EVENTS.LOGOUT));
        }
      }

      if (typeof err === 'string') {
        msg = err;
      } else if (err.error && typeof err.error === 'object') {
        if (err.error.message && typeof err.error.message === 'string') {
          msg = err.error.message;
        } else if (err.error.details && typeof err.error.details === 'object') {
          const entries = Object.entries(err.error.details);
          if (entries.length > 0) {
            const [field, val] = entries[0];
            const cleanVal = Array.isArray(val) ? val.join(' ') : String(val);
            msg = field === 'detail' || field === 'non_field_errors' || field === 'error' ? cleanVal : `${field}: ${cleanVal}`;
          }
        }
      } else if (typeof err.error === 'string') {
        msg = err.error;
      } else if (typeof err.detail === 'string') {
        msg = err.detail;
      } else if (err.message) {
        msg = err.message;
      } else if (typeof err === 'object') {
        const firstKey = Object.keys(err)[0];
        if (firstKey) {
          const val = err[firstKey];
          const cleanVal = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          const k = firstKey.toLowerCase();
          msg = k === 'detail' || k === 'error' || k === 'message' ? cleanVal : `${k}: ${cleanVal}`;
        }
      }

      throw new ApiError(msg, res.status, err);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }
}

export class ApiError extends Error {
  public status: number;
  public data: any;
  public code?: string;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = data?.code || data?.error?.code;
  }
}

export const httpClient = new HttpClient();
