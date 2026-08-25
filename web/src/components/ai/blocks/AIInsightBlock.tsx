'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { AIInsightItem } from '@/types/ai';
import { cn } from '@/lib/utils';

interface Props {
  insights: AIInsightItem[];
}

export const AIInsightBlock: React.FC<Props> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  const getSeverityStyle = (sev?: string) => {
    switch (sev) {
      case 'critical':
        return {
          bg: 'bg-rose-50/70 border-rose-200/80',
          text: 'text-rose-900',
          icon: <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/70 border-amber-200/80',
          text: 'text-amber-900',
          icon: <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/70 border-emerald-200/80',
          text: 'text-emerald-900',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
        };
      default:
        return {
          bg: 'bg-blue-50/60 border-blue-200/70',
          text: 'text-blue-900',
          icon: <TrendingUp className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
        };
    }
  };

  return (
    <div className="space-y-2 my-3">
      <span className="text-[10.5px] font-bold text-[#858D9A] uppercase tracking-wider block">
        Key Variance Drivers & Telemetry Insights
      </span>
      {insights.map((ins, idx) => {
        const style = getSeverityStyle(ins.severity);
        return (
          <div
            key={idx}
            className={cn('flex items-start gap-2.5 p-3 rounded-2xl border transition-all text-xs', style.bg)}
          >
            {style.icon}
            <div className="space-y-0.5 flex-1 min-w-0">
              <span className={cn('font-bold block', style.text)}>{ins.title}</span>
              <p className="text-[11.5px] text-[#475569] leading-relaxed font-medium">
                {ins.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
