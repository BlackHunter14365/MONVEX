'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionSlot?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actionSlot,
  badge,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E2DC]',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm font-medium text-[#5F6878] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionSlot && <div className="flex items-center gap-3 shrink-0">{actionSlot}</div>}
    </div>
  );
};
