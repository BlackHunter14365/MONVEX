'use client';

import React from 'react';
import { formatCurrency, cn } from '@/lib/utils';

export interface FinancialAmountProps {
  amount: number | string;
  type?: 'income' | 'expense' | 'neutral' | 'auto';
  currency?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showSign?: boolean;
  className?: string;
}

export const FinancialAmount: React.FC<FinancialAmountProps> = ({
  amount,
  type = 'auto',
  currency = 'INR',
  size = 'md',
  showSign = false,
  className,
}) => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;

  // Resolve type automatically if auto
  const resolvedType =
    type === 'auto'
      ? num > 0
        ? 'income'
        : num < 0
        ? 'expense'
        : 'neutral'
      : type;

  const sizeStyles = {
    xs: 'text-xs font-semibold',
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg sm:text-xl font-bold',
    xl: 'text-xl sm:text-2xl font-black',
    '2xl': 'text-2xl sm:text-3xl font-black',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl font-black',
  };

  const typeStyles = {
    income: 'text-[#059669]',
    expense: 'text-[#E11D48]',
    neutral: 'text-[#191522]',
  };

  const formatted = formatCurrency(Math.abs(num), currency);
  const signPrefix = showSign ? (num > 0 ? '+' : num < 0 ? '-' : '') : '';

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight inline-flex items-baseline',
        sizeStyles[size],
        typeStyles[resolvedType],
        className
      )}
    >
      {signPrefix}
      {formatted}
    </span>
  );
};
