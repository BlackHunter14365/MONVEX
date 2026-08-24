import { HttpClient } from '../client';

export class GoalEndpoints {
  constructor(private client: HttpClient) {}

  async getGoals() {
    const res = await this.client.request<any>('/goals/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async createGoal(goalData: any) {
    return this.client.request('/goals/', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async updateGoal(id: string, data: any) {
    return this.client.request(`/goals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: string) {
    return this.client.request(`/goals/${id}/`, {
      method: 'DELETE',
    });
  }

  async contributeToGoal(goalId: string, amount: number | string, notes?: string) {
    return this.client.request(`/goals/${goalId}/contribute/`, {
      method: 'POST',
      body: JSON.stringify({ amount, notes }),
    });
  }
}
