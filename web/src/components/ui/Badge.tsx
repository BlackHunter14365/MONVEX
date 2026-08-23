'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral'
    | 'outline'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'indigo'
    | 'brand';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-bold rounded-md select-none tracking-tight';

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
  };

  const variantStyles = {
    accent: 'bg-[#172033] text-white',
    brand: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    indigo: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    success: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
    emerald: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    amber: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    danger: 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]',
    rose: 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]',
    neutral: 'bg-[#F0EFEA] text-[#5F6878] border border-[#E4E2DC]',
    outline: 'bg-transparent text-[#5F6878] border border-[#E4E2DC]',
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
};
