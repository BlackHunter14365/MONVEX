'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import { AIInsightItem } from '@/types/ai';
import { cn } from '@/lib/utils';

interface AIInsightCardProps {
  insight: AIInsightItem;
  className?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, className }) => {
  const getSeverityConfig = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return {
          containerClass: 'bg-rose-50/80 border-rose-200 text-rose-950',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />,
          label: 'CRITICAL VARIANCE',
        };
      case 'warning':
        return {
          containerClass: 'bg-amber-50/80 border-amber-200 text-amber-950',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
          label: 'RISK INDICATOR',
        };
      case 'success':
        return {
          containerClass: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
          label: 'EFFICIENCY GAIN',
        };
      default:
        return {
          containerClass: 'bg-[#F4F1FA]/80 border-[#E4E0F0] text-[#191522]',
          badgeClass: 'bg-[#EEEAF7] text-[#3B2D54] border-[#D8D2E7]',
          icon: <TrendingUp className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />,
          label: 'TELEMETRY INSIGHT',
        };
    }
  };

  const config = getSeverityConfig(insight.severity);

  return (
    <div
      className={cn(
        'rounded-2xl border p-3.5 sm:p-4 text-xs space-y-2 transition-all hover:shadow-2xs',
        config.containerClass,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-bold tracking-tight text-xs sm:text-[13px]">
            {insight.title}
          </span>
        </div>
        <span
          className={cn(
            'font-mono text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shrink-0',
            config.badgeClass
          )}
        >
          {config.label}
        </span>
      </div>

      <p className="text-[12px] sm:text-[12.5px] leading-relaxed text-[#4A4553] font-medium pl-6">
        {insight.description}
      </p>

      <div className="pt-1 pl-6 flex items-center gap-2 text-[10px] text-[#898390] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Verified Double-Entry Ledger Source</span>
      </div>
    </div>
  );
};
