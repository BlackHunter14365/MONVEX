'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'subtle' | 'dark' | 'aurora' | 'violet' | 'mint';
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'light',
  glow = false,
  ...props
}) => {
  const variantClass = {
    light: 'aurora-glass',
    subtle: 'bg-white/70 border border-[#E7E6F0] backdrop-blur-md',
    dark: 'bg-[#20212B]/90 text-white border border-[#42415E] backdrop-blur-md',
    aurora: 'aurora-glass',
    violet: 'aurora-glass-violet',
    mint: 'aurora-glass-mint',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-2xl relative overflow-hidden transition-all duration-300',
        variantClass,
        glow && 'ambient-glow',
        className
      )}
      {...props}
    >
      {/* Specular Top Edge Light Refraction */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
