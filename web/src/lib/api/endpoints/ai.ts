import { HttpClient } from '../client';
import { AIChatResponse } from '../types';

export class AIEndpoints {
  constructor(private client: HttpClient) {}

  async askCopilot(question: string, conversationId?: string): Promise<AIChatResponse> {
    const res = await this.client.request<any>('/ai/chat/', {
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
    const res = await this.client.request<any>('/ai/conversations/');
    return Array.isArray(res) ? res : (res?.results || []);
  }

  async getAIConversation(id: string) {
    return this.client.request<any>(`/ai/conversations/${id}/`);
  }

  async deleteAIConversation(id: string) {
    return this.client.request<any>(`/ai/conversations/${id}/`, {
      method: 'DELETE',
    });
  }

  async clearAIConversation(id: string) {
    return this.client.request<any>(`/ai/conversations/${id}/clear/`, {
      method: 'POST',
    });
  }

  async runWhatIfSimulation(data: { category_name: string; reduction_percent: number; months: number }) {
    return this.client.request<any>('/ai/what-if/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async runFullSimulation(data: {
    income_delta?: number;
    category_cuts?: Record<string, number>;
    extra_monthly_savings?: number;
    extra_debt_payment?: number;
    timeframe_months?: number;
  }) {
    return this.client.request<any>('/ai/simulator/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAIHistory() {
    const res = await this.client.request<any>('/ai/history/');
    return Array.isArray(res) ? res : res?.results || [];
  }
}
