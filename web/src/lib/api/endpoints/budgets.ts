import { HttpClient } from '../client';

export class BudgetEndpoints {
  constructor(private client: HttpClient) {}

  async getBudgets() {
    const res = await this.client.request<any>('/budgets/overview/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async createBudget(budgetData: any) {
    return this.client.request('/budgets/', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(id: string, budgetData: any) {
    return this.client.request(`/budgets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(id: string) {
    return this.client.request(`/budgets/${id}/`, {
      method: 'DELETE',
    });
  }
}
