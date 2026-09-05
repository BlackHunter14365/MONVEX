'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'brand'
    | 'accent'
    | 'indigo'
    | 'subtle'
    | 'success';
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
      'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-lg select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:ring-offset-1 focus-visible:outline-none active:scale-[0.985]';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-xs px-3.5 py-2 gap-2 min-h-[36px] sm:min-h-[36px]',
      lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[42px]',
    };

    const variantStyles = {
      primary:
        'bg-[#2A1F3D] hover:bg-[#3B2D54] active:bg-[#21182F] text-white shadow-subtle active:translate-y-[0.5px]',
      secondary:
        'bg-white hover:bg-[#F6F3FA] text-[#191522] border border-[#2A1F3D]/20 active:translate-y-[0.5px]',
      accent:
        'bg-[#4056A1] hover:bg-[#26335F] text-white shadow-subtle active:translate-y-[0.5px]',
      indigo:
        'bg-[#4056A1] hover:bg-[#26335F] text-white shadow-subtle active:translate-y-[0.5px]',
      subtle:
        'bg-[#EEEAF7] hover:bg-[#E2DCF0] text-[#3B2D54] border border-[#625477]/20 active:translate-y-[0.5px]',
      brand:
        'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-subtle active:translate-y-[0.5px]',
      outline:
        'bg-white hover:bg-[#F6F5F1] text-[#625D69] hover:text-[#191522] border border-[#E4E2DC] active:translate-y-[0.5px]',
      ghost:
        'bg-transparent hover:bg-[#EEEAF7]/60 text-[#625D69] hover:text-[#191522]',
      success:
        'bg-[#059669] hover:bg-[#047857] text-white shadow-subtle active:translate-y-[0.5px]',
      danger:
        'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-subtle active:translate-y-[0.5px]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        aria-disabled={disabled || isLoading ? 'true' : undefined}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
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
