/**
 * [M] MODEL: Transaction, Categories & Cashflow Outflows
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  type: TransactionType;
  category: string;
  category_name?: string;
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  account?: string;
  account_name?: string;
  merchant?: string;
  is_recurring?: boolean;
  notes?: string;
  receipt_url?: string;
}

export interface TransactionFilter {
  search?: string;
  category?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  account?: string;
  merchant?: string;
  notes?: string;
}
