import { HttpClient } from '../client';

export class SecurityEndpoints {
  constructor(private client: HttpClient) {}

  async getSecurityOverview() {
    return this.client.request<any>('/security/overview/');
  }

  async getSecurityLogs(params?: { event_type?: string; severity?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const endpoint = query ? `/security/logs/?${query}` : '/security/logs/';
    return this.client.request<any>(endpoint);
  }

  async runSecurityScan() {
    return this.client.request<any>('/security/scan/', {
      method: 'POST',
    });
  }

  async revokeAllSessions() {
    return this.client.request<any>('/security/revoke-sessions/', {
      method: 'POST',
    });
  }
}
