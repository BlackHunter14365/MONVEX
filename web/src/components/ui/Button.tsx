'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-lg select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#172033]/25 focus-visible:ring-offset-1 focus-visible:outline-none';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-xs px-3.5 py-2 gap-2 min-h-[36px]',
      lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[42px]',
    };

    const variantStyles = {
      primary:
        'bg-[#172033] hover:bg-[#0F172A] text-white shadow-subtle active:translate-y-[1px]',
      brand:
        'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-subtle active:translate-y-[1px]',
      secondary:
        'bg-[#F0EFEA] hover:bg-[#E8E7E1] text-[#172033] border border-[#E4E2DC] active:translate-y-[1px]',
      outline:
        'bg-white hover:bg-[#F6F5F1] text-[#5F6878] hover:text-[#172033] border border-[#E4E2DC]',
      ghost:
        'bg-transparent hover:bg-[#F0EFEA] text-[#5F6878] hover:text-[#172033]',
      danger:
        'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-subtle active:translate-y-[1px]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
