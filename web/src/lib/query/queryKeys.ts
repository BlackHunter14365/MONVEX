/**
 * MONVEX Centralized Query Key Factory
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    healthScore: () => [...queryKeys.dashboard.all, 'health-score'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (params?: Record<string, string>) => [...queryKeys.transactions.all, 'list', params] as const,
    categories: (type?: string) => [...queryKeys.transactions.all, 'categories', type] as const,
    recurring: () => [...queryKeys.transactions.all, 'recurring'] as const,
    duplicates: () => [...queryKeys.transactions.all, 'duplicates'] as const,
    netWorth: () => [...queryKeys.transactions.all, 'net-worth'] as const,
    assets: () => [...queryKeys.transactions.all, 'assets'] as const,
    liabilities: () => [...queryKeys.transactions.all, 'liabilities'] as const,
    debtPlanner: () => [...queryKeys.transactions.all, 'debt-planner'] as const,
    receipts: () => [...queryKeys.transactions.all, 'receipts'] as const,
    notifications: (type?: string) => [...queryKeys.transactions.all, 'notifications', type] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    list: () => [...queryKeys.budgets.all, 'list'] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: () => [...queryKeys.goals.all, 'list'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    summary: () => [...queryKeys.analytics.all, 'summary'] as const,
    spendingByCategory: () => [...queryKeys.analytics.all, 'spending-by-category'] as const,
    monthlyTrend: () => [...queryKeys.analytics.all, 'monthly-trend'] as const,
    anomalies: () => [...queryKeys.analytics.all, 'anomalies'] as const,
    forecast: (days: number = 90) => [...queryKeys.analytics.all, 'forecast', days] as const,
  },
  ai: {
    all: ['ai'] as const,
    conversations: () => [...queryKeys.ai.all, 'conversations'] as const,
    conversation: (id: string) => [...queryKeys.ai.all, 'conversation', id] as const,
    history: () => [...queryKeys.ai.all, 'history'] as const,
  },
  security: {
    all: ['security'] as const,
    overview: () => [...queryKeys.security.all, 'overview'] as const,
    logs: (params?: any) => [...queryKeys.security.all, 'logs', params] as const,
  },
};
