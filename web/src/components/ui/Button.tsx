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
      'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-xl select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6865E8]/30 focus-visible:ring-offset-1 focus-visible:outline-none active:scale-[0.985]';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-xs px-3.5 py-2 gap-2 min-h-[36px] sm:min-h-[36px]',
      lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[42px]',
    };

    const variantStyles = {
      primary:
        'bg-[#6865E8] hover:bg-[#5754DC] active:bg-[#4744C8] text-white shadow-subtle active:translate-y-[0.5px]',
      secondary:
        'bg-white hover:bg-[#F8F7FC] text-[#20212B] border border-[#E7E6F0] active:translate-y-[0.5px]',
      accent:
        'bg-[#6865E8] hover:bg-[#5754DC] text-white shadow-subtle active:translate-y-[0.5px]',
      indigo:
        'bg-[#6865E8] hover:bg-[#5754DC] text-white shadow-subtle active:translate-y-[0.5px]',
      subtle:
        'bg-[#EEEDF8] hover:bg-[#E3E1F5] text-[#20212B] border border-[#6865E8]/20 active:translate-y-[0.5px]',
      brand:
        'bg-[#6865E8] hover:bg-[#5754DC] text-white shadow-subtle active:translate-y-[0.5px]',
      outline:
        'bg-white hover:bg-[#F8F7FC] text-[#77798A] hover:text-[#20212B] border border-[#E7E6F0] active:translate-y-[0.5px]',
      ghost:
        'bg-transparent hover:bg-[#EEEDF8]/60 text-[#77798A] hover:text-[#20212B]',
      success:
        'bg-[#16745C] hover:bg-[#12604C] text-white shadow-subtle active:translate-y-[0.5px]',
      danger:
        'bg-[#E76D7A] hover:bg-[#D95B69] text-white shadow-subtle active:translate-y-[0.5px]',
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
