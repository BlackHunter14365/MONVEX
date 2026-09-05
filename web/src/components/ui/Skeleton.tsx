'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded bg-[#E8E5DE]', className)}
      {...props}
    />
  );
};

export const KpiCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('editorial-card p-6 space-y-3', className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
};

export const TableSkeletonRow: React.FC<{ cols?: number; className?: string }> = ({
  cols = 5,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3.5 px-4 border-b border-[#F0EFEA]', className)}>
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1 max-w-[200px]">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-4 w-16 hidden sm:block" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
};
