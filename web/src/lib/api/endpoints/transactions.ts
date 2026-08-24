import { HttpClient, API_BASE } from '../client';

export class TransactionEndpoints {
  constructor(private client: HttpClient) {}

  async getTransactions(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.client.request<any>(`/transactions/${query ? `?${query}` : ''}`);
  }

  async createTransaction(txData: any) {
    const payload = { ...txData };
    if (payload.date && typeof payload.date === 'string' && payload.date.includes('T')) {
      payload.date = payload.date.split('T')[0];
    }
    return this.client.request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransaction(id: string, txData: any) {
    const payload = { ...txData };
    if (payload.date && typeof payload.date === 'string' && payload.date.includes('T')) {
      payload.date = payload.date.split('T')[0];
    }
    return this.client.request(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransaction(id: string) {
    return this.client.request(`/transactions/${id}/`, {
      method: 'DELETE',
    });
  }

  async parseNaturalTransaction(text: string) {
    return this.client.request<any>('/transactions/parse-natural/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async parseAndCategorize(text: string, amount?: number) {
    return this.parseNaturalTransaction(text);
  }

  async getCategories(type?: 'income' | 'expense') {
    const res = await this.client.request<any>(`/transactions/categories/${type ? `?type=${type}` : ''}`);
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async getRecurringPayments() {
    const res = await this.client.request<any>(`/transactions/recurring/`);
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async createRecurringPayment(data: { name: string; amount: number; frequency: string; next_due_date: string }) {
    return this.client.request('/transactions/recurring/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurringPayment(id: string) {
    return this.client.request(`/transactions/recurring/${id}/`, {
      method: 'DELETE',
    });
  }

  async getNetWorth() {
    return this.client.request<any>('/transactions/net-worth/');
  }

  async getAssets() {
    const res = await this.client.request<any>('/transactions/assets/');
    return Array.isArray(res) ? res : res?.results || [];
  }

  async createAsset(data: { name: string; asset_type: string; value: number; institution?: string; notes?: string }) {
    return this.client.request<any>('/transactions/assets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: Partial<{ name: string; asset_type: string; value: number; institution?: string; notes?: string }>) {
    return this.client.request<any>(`/transactions/assets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string) {
    return this.client.request<any>(`/transactions/assets/${id}/`, {
      method: 'DELETE',
    });
  }

  async getLiabilities() {
    const res = await this.client.request<any>('/transactions/liabilities/');
    return Array.isArray(res) ? res : res?.results || [];
  }

  async createLiability(data: {
    name: string;
    liability_type: string;
    principal_amount: number;
    remaining_balance?: number;
    interest_rate_pct: number;
    tenure_months: number;
    monthly_emi?: number;
    lender?: string;
  }) {
    return this.client.request<any>('/transactions/liabilities/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteLiability(id: string) {
    return this.client.request<any>(`/transactions/liabilities/${id}/`, {
      method: 'DELETE',
    });
  }

  async getDebtPlanner() {
    return this.client.request<any>('/transactions/debt-planner/');
  }

  async simulateDebt(data: { principal?: number; interest_rate?: number; current_emi?: number; extra_payment?: number }) {
    return this.client.request<any>('/transactions/debt-simulate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReceipts() {
    const res = await this.client.request<any>('/transactions/receipts/');
    return Array.isArray(res) ? res : res?.results || [];
  }

  async uploadReceipt(data: {
    merchant_name?: string;
    total_amount: number;
    subtotal?: number;
    tax_amount?: number;
    discount_amount?: number;
    category_suggestion?: string;
    items?: any[];
    raw_text?: string;
  }) {
    return this.client.request<any>('/transactions/receipts/upload/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmReceipt(id: string, data?: { category_name?: string; amount?: number; merchant_name?: string }) {
    return this.client.request<any>(`/transactions/receipts/${id}/confirm/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async rejectReceipt(id: string) {
    return this.client.request<any>(`/transactions/receipts/${id}/reject/`, {
      method: 'POST',
    });
  }

  async getDuplicateTransactions() {
    return this.client.request<any>('/transactions/duplicates/');
  }

  async getNotifications(type?: string) {
    const endpoint = type ? `/transactions/notifications/?type=${type}` : '/transactions/notifications/';
    const res = await this.client.request<any>(endpoint);
    return Array.isArray(res) ? res : res?.results || [];
  }

  async markNotificationRead(id: string) {
    return this.client.request<any>(`/transactions/notifications/${id}/read/`, {
      method: 'POST',
    });
  }

  async clearAllNotifications() {
    return this.client.request<any>('/transactions/notifications/clear-all/', {
      method: 'POST',
    });
  }

  async getWhyExplanation(category?: string) {
    const endpoint = category ? `/transactions/why/?category=${encodeURIComponent(category)}` : '/transactions/why/';
    return this.client.request<any>(endpoint);
  }

  async getMonthlyReport() {
    return this.client.request<any>('/transactions/report/monthly/');
  }

  async downloadTransactionsCSV(): Promise<Blob> {
    const token = this.client.getAccessToken();
    const res = await fetch(`${API_BASE}/transactions/export/`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) throw new Error('Failed to download transactions CSV');
    return res.blob();
  }
}
