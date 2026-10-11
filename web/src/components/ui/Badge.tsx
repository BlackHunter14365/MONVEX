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
  const baseStyles = 'inline-flex items-center font-bold rounded-full select-none tracking-tight';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5',
  };

  const variantStyles = {
    accent: 'bg-[#6865E8] text-white',
    lavender: 'bg-[#EEEDF8] text-[#6865E8] border border-[#6865E8]/25',
    indigo: 'bg-[#EDEBFB] text-[#5754DC] border border-[#6865E8]/30',
    cyan: 'bg-[#E6F9F5] text-[#16745C] border border-[#75DCC0]/35',
    brand: 'bg-[#EEEDF8] text-[#6865E8] border border-[#6865E8]/30',
    success: 'bg-[#E6F9F5] text-[#16745C] border border-[#75DCC0]',
    emerald: 'bg-[#E6F9F5] text-[#16745C] border border-[#75DCC0]',
    warning: 'bg-[#FEF6EB] text-[#E8A54B] border border-[#FCD89E]',
    amber: 'bg-[#FEF6EB] text-[#E8A54B] border border-[#FCD89E]',
    danger: 'bg-[#FDEEF0] text-[#E76D7A] border border-[#F8B4BD]',
    rose: 'bg-[#FDEEF0] text-[#E76D7A] border border-[#F8B4BD]',
    neutral: 'bg-[#F8F7FC] text-[#77798A] border border-[#E7E6F0]',
    outline: 'bg-transparent text-[#77798A] border border-[#E7E6F0]',
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
};
