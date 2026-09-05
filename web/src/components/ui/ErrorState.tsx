'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon,
  title = 'Unable to load data',
  description = 'A temporary network or server error occurred while retrieving this information.',
  retryLabel = 'Try again',
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3.5 border border-[#FECDD3] rounded-2xl bg-white/80 max-w-md mx-auto my-4 shadow-subtle',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDECEF] text-[#E11D48] border border-[#FECDD3] shadow-xs">
        {icon || <AlertCircle className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-[#191522] tracking-tight">{title}</h4>
        <p className="text-xs font-medium text-[#625D69] max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {retryLabel && onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="secondary"
          leftIcon={<RotateCcw className="h-3.5 w-3.5 text-[#4056A1]" />}
          className="mt-2 border-[#E4E2DC] hover:border-[#4056A1]/40"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
