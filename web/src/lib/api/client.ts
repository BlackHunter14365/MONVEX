/**
 * MONVEX HTTP Client Core
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://monvex-backend.onrender.com/api/v1';

export class HttpClient {
  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('monvex_access_token');
  }

  public setAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monvex_access_token', token);
    }
  }

  public setTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monvex_access_token', access);
      localStorage.setItem('monvex_refresh_token', refresh);
    }
  }

  public clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('monvex_access_token');
      localStorage.removeItem('monvex_refresh_token');
      sessionStorage.removeItem('monvex_access_token');
      sessionStorage.removeItem('monvex_refresh_token');
    }
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const isPublicAuthEndpoint =
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/google') ||
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
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      let msg = 'An unexpected error occurred';

      if (res.status === 401) {
        if (err.code === 'token_not_valid' || (typeof err.detail === 'string' && err.detail.includes('token'))) {
          this.clearTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('monvex:auth-logout'));
          }
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
