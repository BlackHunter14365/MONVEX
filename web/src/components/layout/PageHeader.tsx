'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actionSlot?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  actionSlot,
  badge,
  className,
}) => {
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E2DC]',
        className
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <span className="swiss-eyebrow text-[10px] font-bold text-[#898390] uppercase tracking-wider block">
            {eyebrow}
          </span>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#191522] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm font-medium text-[#625D69] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionSlot && <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">{actionSlot}</div>}
    </header>
  );
};
