/**
 * MONVEX Unified API Types
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  results?: T[];
  count?: number;
  [key: string]: any;
}

export interface UserProfile {
  id: string | number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    phone?: string;
    currency?: string;
    avatar_url?: string;
    two_factor_enabled?: boolean;
    tier?: string;
  };
  [key: string]: any;
}

export interface TransactionItem {
  id: string;
  user?: number;
  account?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  merchant?: {
    id: string;
    name: string;
  };
  amount: number | string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  description?: string;
  notes?: string;
  is_recurring?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  [key: string]: any;
}

export interface BudgetItem {
  id: string;
  category: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  monthly_limit: number | string;
  alert_threshold?: number;
  spent_amount?: number | string;
  remaining_amount?: number | string;
  utilization_percentage?: number;
  [key: string]: any;
}

export interface GoalItem {
  id: string;
  title: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date?: string;
  category?: string;
  status?: string;
  progress_percentage?: number;
  [key: string]: any;
}

export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  category_breakdown?: Array<{ name: string; amount: number; percentage?: number; color?: string }>;
  monthly_trends?: Array<{ month: string; income: number; expense: number; net: number }>;
  health_score?: number;
  [key: string]: any;
}

export interface AIChatResponse {
  id: string;
  answer: string;
  response: string;
  conversation_id: string;
  intent: string;
  tools_used: string[];
  tool_activity: any[];
  citations: any[];
  data: any;
  metrics?: any[];
  charts?: any[];
  insights?: any[];
  recommendations?: any[];
  actions?: any[];
  warnings?: any[];
  model: string;
}

export interface SearchResultGroup {
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
}
