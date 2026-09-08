/**
 * MONVEX HTTP Client Core
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://monvex-backend.onrender.com/api/v1';

export class HttpClient {
  private refreshPromise: Promise<string | null> | null = null;

  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('monvex_access_token');
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('monvex_refresh_token');
  }

  public setAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('monvex_access_token');
      } catch {}
      sessionStorage.setItem('monvex_access_token', token);
    }
  }

  public setTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('monvex_access_token');
        localStorage.removeItem('monvex_refresh_token');
      } catch {}
      sessionStorage.setItem('monvex_access_token', access);
      sessionStorage.setItem('monvex_refresh_token', refresh);
    }
  }

  public clearTokens() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('monvex_access_token');
        localStorage.removeItem('monvex_refresh_token');
      } catch {}
      sessionStorage.removeItem('monvex_access_token');
      sessionStorage.removeItem('monvex_refresh_token');
    }
  }

  public async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('monvex:auth-logout'));
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
          throw new Error('Refresh token invalid or expired');
        }

        const data = await res.json();
        const newAccess = data.access;
        const newRefresh = data.refresh || refreshToken;
        this.setTokens(newAccess, newRefresh);
        return newAccess;
      } catch {
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('monvex:auth-logout'));
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
          window.dispatchEvent(new Event('monvex:auth-logout'));
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

      throw new Error(msg);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }
}

export const httpClient = new HttpClient();
