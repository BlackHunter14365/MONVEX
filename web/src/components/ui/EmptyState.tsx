'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Plus } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Your financial picture starts here',
  description = 'Add your first record to begin tracking and forecasting your finances.',
  actionLabel = 'Add entry',
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3.5 border border-dashed border-[#E4E2DC] rounded-xl bg-white/70 max-w-md mx-auto my-4',
        className
      )}
    >
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EFEA] text-[#172033] border border-[#E4E2DC]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-[#172033] tracking-tight">{title}</h4>
        <p className="text-xs font-medium text-[#5F6878] max-w-xs mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
