/**
 * [M] MODEL: Financial Health, Forecasting & Diagnostics
 */

export interface CashflowSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate_pct: number;
  cash_runway_days: number;
  daily_burn_rate: number;
  top_categories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface FinancialHealthDiagnostic {
  health_score: number;
  health_grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  savings_rate_pct: number;
  cash_runway_days: number;
  debt_to_income_pct: number;
  sub_scores: {
    budget_adherence: number;
    savings_discipline: number;
    debt_sustainability: number;
    liquidity_buffer: number;
  };
  recommendations: string[];
}

export interface CashflowForecast {
  starting_balance: number;
  daily_burn_rate: number;
  forecast_ending_balance: number;
  projection_days: number;
  trajectory: Array<{
    day: string;
    projected_balance: number;
  }>;
}
