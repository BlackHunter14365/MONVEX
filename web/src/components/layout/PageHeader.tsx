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
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E6F0]',
        className
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-[10px] font-mono font-bold text-[#6865E8] uppercase tracking-wider block">
            {eyebrow}
          </span>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-[#20212B] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs font-medium text-[#77798A] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionSlot && <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">{actionSlot}</div>}
    </header>
  );
};
