/**
 * [M] MODEL: Budget Caps, Thresholds & Progress
 */

export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'YEARLY';
export type BudgetStatus = 'ON_TRACK' | 'WARNING' | 'EXCEEDED';

export interface Budget {
  id: string;
  category: string;
  category_name?: string;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_pct: number;
  period: BudgetPeriod;
  status: BudgetStatus;
  alert_threshold_pct?: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  total_budgets: number;
  total_budget_limit: number;
  total_budget_spent: number;
  overall_usage_pct: number;
  budgets: Budget[];
}

export interface CreateBudgetPayload {
  category: string;
  limit_amount: number;
  period?: BudgetPeriod;
  alert_threshold_pct?: number;
}
