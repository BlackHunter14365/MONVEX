'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'accent'
    | 'lavender'
    | 'indigo'
    | 'cyan'
    | 'brand'
    | 'success'
    | 'emerald'
    | 'warning'
    | 'amber'
    | 'danger'
    | 'rose'
    | 'neutral'
    | 'outline';
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
    accent: 'bg-[#2A1F3D] text-white',
    lavender: 'bg-[#EEEAF7] text-[#3B2D54] border border-[#625477]/25',
    indigo: 'bg-[#E9EDFA] text-[#26335F] border border-[#7184C4]/30',
    cyan: 'bg-[#DDF7FA] text-[#0E7490] border border-[#06B6D4]/30',
    brand: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    success: 'bg-[#E8F7F1] text-[#059669] border border-[#A7F3D0]',
    emerald: 'bg-[#E8F7F1] text-[#059669] border border-[#A7F3D0]',
    warning: 'bg-[#FFF4DF] text-[#D97706] border border-[#FDE68A]',
    amber: 'bg-[#FFF4DF] text-[#D97706] border border-[#FDE68A]',
    danger: 'bg-[#FDECEF] text-[#E11D48] border border-[#FECDD3]',
    rose: 'bg-[#FDECEF] text-[#E11D48] border border-[#FECDD3]',
    neutral: 'bg-[#F1F0EC] text-[#625D69] border border-[#E4E2DC]',
    outline: 'bg-transparent text-[#625D69] border border-[#E4E2DC]',
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
};
