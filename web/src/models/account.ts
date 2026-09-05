/**
 * [M] MODEL: Financial Accounts & Net Worth Entities
 */

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'LOAN' | 'WALLET' | 'OTHER';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  account_number?: string;
  institution_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  total_liquid_balance: number;
  total_accounts: number;
  solvency_status: 'STRONG' | 'MODERATE' | 'VULNERABLE';
  accounts_breakdown: FinancialAccount[];
}
