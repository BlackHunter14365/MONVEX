import { HttpClient } from '../client';

export class AuthEndpoints {
  constructor(private client: HttpClient) {}

  async login(credentials: { username?: string; identifier?: string; email?: string; password: string }) {
    const data = await this.client.request<{ success: boolean; access: string; refresh: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.access && data.refresh) {
      this.client.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async googleLogin(credential: string) {
    const data = await this.client.request<{
      success: boolean;
      action?: string;
      code?: string;
      message?: string;
      email?: string;
      access?: string;
      refresh?: string;
      user?: any;
    }>('/auth/google/', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });

    if (data.access && data.refresh) {
      this.client.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async linkGoogleAccount(payload: { credential: string; password: string }) {
    const data = await this.client.request<{
      success: boolean;
      action?: string;
      access?: string;
      refresh?: string;
      user?: any;
    }>('/auth/google/link/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.access && data.refresh) {
      this.client.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async register(userData: any) {
    const data = await this.client.request<{
      success: boolean;
      message: string;
      access?: string;
      refresh?: string;
      user?: any;
      verification_id?: string;
      email_masked?: string;
      expires_in?: number;
      resend_after?: number;
    }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.access && data.refresh) {
      this.client.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async checkVerification(payload: { verification_id: string; code: string }) {
    const data = await this.client.request<{
      success: boolean;
      message: string;
      data?: { access: string; refresh: string; user: any };
      code?: string;
      attempts_remaining?: number;
    }>('/auth/verification/check/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.data?.access && data.data?.refresh) {
      this.client.setTokens(data.data.access, data.data.refresh);
    }
    return data;
  }

  async resendVerification(verification_id: string) {
    return this.client.request<{
      success: boolean;
      message: string;
      resend_after?: number;
      code?: string;
      retry_after?: number;
    }>('/auth/verification/resend/', {
      method: 'POST',
      body: JSON.stringify({ verification_id }),
    });
  }

  async sendVerification(email: string) {
    return this.client.request<{
      success: boolean;
      message: string;
      verification_id: string;
      email_masked: string;
      expires_in: number;
      resend_after: number;
    }>('/auth/verification/send/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(payload: { email_or_username?: string; verification_id?: string; otp?: string; code?: string }) {
    const vid = payload.verification_id || '';
    const code = payload.code || payload.otp || '';
    return this.checkVerification({ verification_id: vid, code });
  }

  async resendOTP(identifier: string) {
    return this.resendVerification(identifier);
  }

  async getProfile() {
    return this.client.request<any>('/auth/me/');
  }

  async updateProfile(profileData: any) {
    return this.client.request<any>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async logout() {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('monvex_refresh_token') : null;
    this.client.clearTokens();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    if (refresh) {
      try {
        await this.client.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // ignore logout network errors
      }
    }
  }
}
