import { HttpClient } from '../client';

export class AnalyticsEndpoints {
  constructor(private client: HttpClient) {}

  async getDashboardMetrics() {
    return this.client.request<any>('/analytics/dashboard/');
  }

  async getAnalyticsSummary() {
    return this.getDashboardMetrics();
  }

  async getHealthScore() {
    return this.client.request<any>('/analytics/health-score/');
  }

  async getCashflowForecast(days: number = 90) {
    return this.client.request<any>(`/analytics/cashflow-forecast/?days=${days}`);
  }

  async getSpendingByCategory() {
    const dash = await this.getDashboardMetrics().catch(() => null);
    return dash?.category_breakdown || dash?.spending_by_category || [];
  }

  async getMonthlyTrend() {
    const dash = await this.getDashboardMetrics().catch(() => null);
    return dash?.monthly_trends || dash?.monthly_trend || [];
  }

  async getAnomalies() {
    const res = await this.client.request<any>('/analytics/anomalies/');
    return Array.isArray(res) ? res : (res?.results || []);
  }
}
