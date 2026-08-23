/**
 * MONVEX Unified API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://monvex-backend.onrender.com/api/v1';

class ApiClient {
  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('monvex_access_token');
  }

  private setAccessToken(token: string) {
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  // Auth
  async login(credentials: { username?: string; identifier?: string; email?: string; password: string }) {
    const data = await this.request<{ success: boolean; access: string; refresh: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.access && data.refresh) {
      this.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async googleLogin(credential: string) {
    const data = await this.request<{
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
      this.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async linkGoogleAccount(payload: { credential: string; password: string }) {
    const data = await this.request<{
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
      this.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async register(userData: any) {
    const data = await this.request<{
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
      this.setTokens(data.access, data.refresh);
    }
    return data;
  }

  async checkVerification(payload: { verification_id: string; code: string }) {
    const data = await this.request<{
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
      this.setTokens(data.data.access, data.data.refresh);
    }
    return data;
  }

  async resendVerification(verification_id: string) {
    return this.request<{
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
    return this.request<{
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

  // Legacy aliases
  async verifyOTP(payload: { email_or_username?: string; verification_id?: string; otp?: string; code?: string }) {
    const vid = payload.verification_id || '';
    const code = payload.code || payload.otp || '';
    return this.checkVerification({ verification_id: vid, code });
  }

  async resendOTP(identifier: string) {
    return this.resendVerification(identifier);
  }

  async getProfile() {
    return this.request<any>('/auth/me/');
  }

  async updateProfile(profileData: any) {
    return this.request<any>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async logout() {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('monvex_refresh_token') : null;
    this.clearTokens();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    if (refresh) {
      try {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // ignore logout network errors
      }
    }
  }

  // Dashboard & Analytics
  async getDashboardMetrics() {
    return this.request<any>('/analytics/dashboard/');
  }

  async getAnalyticsSummary() {
    return this.getDashboardMetrics();
  }

  async getHealthScore() {
    return this.request<any>('/analytics/health-score/');
  }

  async getCashflowForecast(days: number = 90) {
    return this.request<any>(`/analytics/cashflow-forecast/?days=${days}`);
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
    const res = await this.request<any>('/analytics/anomalies/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  // Transactions
  async getTransactions(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/transactions/${query ? `?${query}` : ''}`);
  }

  async createTransaction(txData: any) {
    const payload = { ...txData };
    if (payload.date && typeof payload.date === 'string' && payload.date.includes('T')) {
      payload.date = payload.date.split('T')[0];
    }
    return this.request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransaction(id: string, txData: any) {
    const payload = { ...txData };
    if (payload.date && typeof payload.date === 'string' && payload.date.includes('T')) {
      payload.date = payload.date.split('T')[0];
    }
    return this.request(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransaction(id: string) {
    return this.request(`/transactions/${id}/`, {
      method: 'DELETE',
    });
  }

  async parseNaturalTransaction(text: string) {
    return this.request<any>('/transactions/parse-natural/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async parseAndCategorize(text: string, amount?: number) {
    return this.parseNaturalTransaction(text);
  }

  async getCategories(type?: 'income' | 'expense') {
    const res = await this.request<any>(`/transactions/categories/${type ? `?type=${type}` : ''}`);
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async getRecurringPayments() {
    const res = await this.request<any>('/transactions/recurring/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async createRecurringPayment(data: { name: string; amount: number; frequency: string; next_due_date: string }) {
    return this.request('/transactions/recurring/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurringPayment(id: string) {
    return this.request(`/transactions/recurring/${id}/`, {
      method: 'DELETE',
    });
  }

  // Budgets
  async getBudgets() {
    const res = await this.request<any>('/budgets/overview/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async createBudget(budgetData: any) {
    return this.request('/budgets/', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(id: string, budgetData: any) {
    return this.request(`/budgets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(id: string) {
    return this.request(`/budgets/${id}/`, {
      method: 'DELETE',
    });
  }

  // Goals
  async getGoals() {
    const res = await this.request<any>('/goals/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async createGoal(goalData: any) {
    return this.request('/goals/', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async updateGoal(id: string, data: any) {
    return this.request(`/goals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: string) {
    return this.request(`/goals/${id}/`, {
      method: 'DELETE',
    });
  }

  async contributeToGoal(goalId: string, amount: number | string, notes?: string) {
    return this.request(`/goals/${goalId}/contribute/`, {
      method: 'POST',
      body: JSON.stringify({ amount, notes }),
    });
  }

  // AI Copilot & Financial Intelligence Agent
  async askCopilot(question: string, conversationId?: string) {
    const res = await this.request<any>('/ai/chat/', {
      method: 'POST',
      body: JSON.stringify({
        question,
        conversation_id: conversationId || null,
      }),
    });
    return {
      id: res.id || `ai_${Date.now()}`,
      answer: res.response || res.answer || '',
      response: res.response || res.answer || '',
      conversation_id: res.conversation_id || conversationId || '',
      intent: res.intent || 'GENERAL_FINANCIAL_INQUIRY',
      tools_used: res.tools_used || [],
      tool_activity: res.tool_activity || [],
      citations: res.citations || [],
      data: res.data || null,
      model: res.model || 'MONVEX-AI',
    };
  }

  async askAICopilot(question: string, conversationId?: string) {
    return this.askCopilot(question, conversationId);
  }

  async getAIConversations() {
    const res = await this.request<any>('/ai/conversations/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async getAIConversation(id: string) {
    return this.request<any>(`/ai/conversations/${id}/`);
  }

  async deleteAIConversation(id: string) {
    return this.request<any>(`/ai/conversations/${id}/`, {
      method: 'DELETE',
    });
  }

  async clearAIConversation(id: string) {
    return this.request<any>(`/ai/conversations/${id}/clear/`, {
      method: 'POST',
    });
  }


  async runWhatIfSimulation(data: { category_name: string; reduction_percent: number; months: number }) {
    return this.request<any>('/ai/what-if/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cybersecurity & Threat Defense Center
  async getSecurityOverview() {
    return this.request<any>('/security/overview/');
  }

  async getSecurityLogs(params?: { event_type?: string; severity?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const endpoint = query ? `/security/logs/?${query}` : '/security/logs/';
    return this.request<any>(endpoint);
  }

  async runSecurityScan() {
    return this.request<any>('/security/scan/', {
      method: 'POST',
    });
  }

  async revokeAllSessions() {
    return this.request<any>('/security/revoke-sessions/', {
      method: 'POST',
    });
  }

  // =========================================================================
  // MONVEX 2.0 EXTENDED INTELLIGENCE & WEALTH APIS
  // =========================================================================

  // What-If Financial Simulator
  async runFullSimulation(data: {
    income_delta?: number;
    category_cuts?: Record<string, number>;
    extra_monthly_savings?: number;
    extra_debt_payment?: number;
    timeframe_months?: number;
  }) {
    return this.request<any>('/ai/simulator/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Net Worth & Assets / Liabilities
  async getNetWorth() {
    return this.request<any>('/transactions/net-worth/');
  }

  async getAssets() {
    const res = await this.request<any>('/transactions/assets/');
    return Array.isArray(res) ? res : res?.results || [];
  }

  async createAsset(data: { name: string; asset_type: string; value: number; institution?: string; notes?: string }) {
    return this.request<any>('/transactions/assets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: Partial<{ name: string; asset_type: string; value: number; institution?: string; notes?: string }>) {
    return this.request<any>(`/transactions/assets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string) {
    return this.request<any>(`/transactions/assets/${id}/`, {
      method: 'DELETE',
    });
  }

  async getLiabilities() {
    const res = await this.request<any>('/transactions/liabilities/');
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
    return this.request<any>('/transactions/liabilities/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteLiability(id: string) {
    return this.request<any>(`/transactions/liabilities/${id}/`, {
      method: 'DELETE',
    });
  }

  // Debt & Loan Amortization Planner
  async getDebtPlanner() {
    return this.request<any>('/transactions/debt-planner/');
  }

  async simulateDebt(data: { principal?: number; interest_rate?: number; current_emi?: number; extra_payment?: number }) {
    return this.request<any>('/transactions/debt-simulate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Receipt Intelligence & Vision
  async getReceipts() {
    const res = await this.request<any>('/transactions/receipts/');
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
    return this.request<any>('/transactions/receipts/upload/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmReceipt(id: string, data?: { category_name?: string; amount?: number; merchant_name?: string }) {
    return this.request<any>(`/transactions/receipts/${id}/confirm/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async rejectReceipt(id: string) {
    return this.request<any>(`/transactions/receipts/${id}/reject/`, {
      method: 'POST',
    });
  }

  // Duplicate Transaction Detector
  async getDuplicateTransactions() {
    return this.request<any>('/transactions/duplicates/');
  }

  // Smart Alerts & Notifications
  async getNotifications(type?: string) {
    const endpoint = type ? `/transactions/notifications/?type=${type}` : '/transactions/notifications/';
    const res = await this.request<any>(endpoint);
    return Array.isArray(res) ? res : res?.results || [];
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/transactions/notifications/${id}/read/`, {
      method: 'POST',
    });
  }

  async clearAllNotifications() {
    return this.request<any>('/transactions/notifications/clear-all/', {
      method: 'POST',
    });
  }

  // "Why?" Variance Attribution & Reports
  async getWhyExplanation(category?: string) {
    const endpoint = category ? `/transactions/why/?category=${encodeURIComponent(category)}` : '/transactions/why/';
    return this.request<any>(endpoint);
  }

  async getMonthlyReport() {
    return this.request<any>('/transactions/report/monthly/');
  }

  // AI Interaction History
  async getAIHistory() {
    const res = await this.request<any>('/ai/history/');
    return Array.isArray(res) ? res : res?.results || [];
  }

  // Secure CSV Ledger Exporter
  async downloadTransactionsCSV(): Promise<Blob> {
    const token = this.getAccessToken();
    const res = await fetch(`${API_BASE}/transactions/export/`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) throw new Error('Failed to download transactions CSV');
    return res.blob();
  }

  // Comprehensive User Portfolio JSON Exporter
  async exportFullUserDataJSON() {
    const [profile, transactions, budgets, goals, assets, liabilities, recurring] = await Promise.all([
      this.getProfile().catch(() => null),
      this.getTransactions().catch(() => []),
      this.getBudgets().catch(() => []),
      this.getGoals().catch(() => []),
      this.getAssets().catch(() => []),
      this.getLiabilities().catch(() => []),
      this.getRecurringPayments().catch(() => []),
    ]);

    return {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      platform: 'MONVEX Financial Intelligence',
      user: profile,
      financial_ledger: {
        transactions: Array.isArray(transactions) ? transactions : transactions?.results || [],
        budgets: Array.isArray(budgets) ? budgets : budgets?.results || [],
        goals: Array.isArray(goals) ? goals : goals?.results || [],
        assets: Array.isArray(assets) ? assets : assets?.results || [],
        liabilities: Array.isArray(liabilities) ? liabilities : liabilities?.results || [],
        recurring_payments: Array.isArray(recurring) ? recurring : recurring?.results || [],
      },
    };
  }

  // Universal Search API
  async search(query: string = '', limit: number = 5) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (limit) params.append('limit', String(limit));
    return this.request<{
      success: boolean;
      query: string;
      results: {
        transactions: Array<{
          id: string;
          type: string;
          title: string;
          subtitle: string;
          amount?: number;
          badge?: string;
          destination: string;
          date?: string;
        }>;
        accounts: Array<{
          id: string;
          type: string;
          title: string;
          subtitle: string;
          amount?: number;
          badge?: string;
          destination: string;
        }>;
        budgets: Array<{
          id: string;
          type: string;
          title: string;
          subtitle: string;
          amount?: number;
          badge?: string;
          destination: string;
        }>;
        goals: Array<{
          id: string;
          type: string;
          title: string;
          subtitle: string;
          amount?: number;
          badge?: string;
          destination: string;
        }>;
        conversations: Array<{
          id: string;
          type: string;
          title: string;
          subtitle: string;
          badge?: string;
          destination: string;
        }>;
        navigation: Array<{
          id: string;
          type: string;
          title: string;
          subtitle: string;
          destination: string;
          badge?: string;
        }>;
      };
      total: number;
    }>(`/search/?${params.toString()}`);
  }

  // Contact Ingestion API
  async submitContact(payload: { name: string; email: string; phone?: string; message: string }) {
    return this.request<{ success: boolean; message: string; submission_id?: string }>('/contact/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();




