/**
 * [M] MODEL: Savings Goals & Milestones
 */

export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  progress_pct: number;
  status: GoalStatus;
  category?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalContributionPayload {
  amount: number;
  source_account_id?: string;
  notes?: string;
}

export interface CreateGoalPayload {
  title: string;
  target_amount: number;
  target_date: string;
  current_amount?: number;
  category?: string;
}
