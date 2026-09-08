'use client';

import React from 'react';
import {
  TrendingUp,
  PieChart,
  Repeat,
  CreditCard,
  Target,
  Sliders,
  AlertCircle,
  Activity,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickActionItem {
  id: string;
  label: string;
  prompt: string;
  category: 'spending' | 'budget' | 'forecast' | 'debt' | 'savings';
  icon: React.ComponentType<{ className?: string }>;
}

export const MONVEX_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'spending-spikes',
    label: 'Analyze Outliers & Spikes',
    prompt: 'Did I have any unusual expense or outlier spending spikes this month?',
    category: 'spending',
    icon: Activity,
  },
  {
    id: 'budget-health',
    label: 'Check Budget Health',
    prompt: 'Analyze my budget utilization across all categories and flag over-budget risks.',
    category: 'budget',
    icon: PieChart,
  },
  {
    id: 'cashflow-forecast',
    label: '30-Day Cashflow Forecast',
    prompt: 'Forecast my cashflow trajectory for the next 30 days based on run-rate.',
    category: 'forecast',
    icon: Calendar,
  },
  {
    id: 'dining-sim',
    label: 'Simulate 20% Dining Cut',
    prompt: 'What happens if I cut Food & Dining spending by 20% for the next 6 months?',
    category: 'savings',
    icon: Sliders,
  },
  {
    id: 'recurring-review',
    label: 'Review Subscriptions',
    prompt: 'Identify all active subscriptions and recurring payments on my account.',
    category: 'spending',
    icon: Repeat,
  },
  {
    id: 'debt-strategy',
    label: 'Accelerate Debt Payoff',
    prompt: 'What is my current debt balance and how much interest can I save by paying an extra ₹5,000 monthly?',
    category: 'debt',
    icon: CreditCard,
  },
];

interface AIQuickActionsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export const AIQuickActions: React.FC<AIQuickActionsProps> = ({
  onSelectAction,
  disabled = false,
  className,
  compact = false,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
        {MONVEX_QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAction(action.prompt)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border font-bold transition-all shrink-0 cursor-pointer select-none',
                compact
                  ? 'px-2.5 py-1 text-[11px] bg-white hover:bg-[#F3F1F8] border-[#E4E2DC] text-[#3B2D54] shadow-2xs'
                  : 'px-3 py-1.5 text-xs bg-white hover:bg-[#F3F1F8] border-[#E2DFD7] text-[#191522] shadow-2xs hover:border-[#625477]/30 hover:scale-[1.01] active:scale-[0.99]',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className={cn('text-[#0EA5E9]', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
