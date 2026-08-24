import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  notes: z.string().optional(),
  is_recurring: z.boolean().default(false),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthly_limit: z.coerce.number().positive('Budget limit must be positive'),
  alert_threshold: z.coerce.number().min(50).max(100).default(80),
});
export type BudgetInput = z.infer<typeof budgetSchema>;

export const goalSchema = z.object({
  title: z.string().min(2, 'Goal title is required'),
  target_amount: z.coerce.number().positive('Target amount must be positive'),
  current_amount: z.coerce.number().min(0).default(0),
  target_date: z.string().optional(),
  category: z.string().optional(),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  asset_type: z.string().min(1, 'Asset type is required'),
  value: z.coerce.number().positive('Value must be positive'),
  institution: z.string().optional(),
  notes: z.string().optional(),
});
export type AssetInput = z.infer<typeof assetSchema>;

export const liabilitySchema = z.object({
  name: z.string().min(1, 'Liability name is required'),
  liability_type: z.string().min(1, 'Type is required'),
  principal_amount: z.coerce.number().positive('Principal amount must be positive'),
  remaining_balance: z.coerce.number().optional(),
  interest_rate_pct: z.coerce.number().min(0, 'Interest rate must be positive'),
  tenure_months: z.coerce.number().int().positive('Tenure must be at least 1 month'),
  monthly_emi: z.coerce.number().optional(),
  lender: z.string().optional(),
});
export type LiabilityInput = z.infer<typeof liabilitySchema>;
