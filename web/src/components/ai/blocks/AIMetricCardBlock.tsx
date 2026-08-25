'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AIMetricCard } from '@/types/ai';
import { AnimatedValue, CardReveal } from '@/components/motion';
import { cn } from '@/lib/utils';

interface Props {
  metrics: AIMetricCard[];
}

export const AIMetricCardBlock: React.FC<Props> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 my-3">
      {metrics.map((m, idx) => {
        const isNumeric = typeof m.value === 'number';
        const isPositive = m.trend === 'positive';
        const isNegative = m.trend === 'negative';

        return (
          <CardReveal
            key={`${m.title}-${idx}`}
            index={idx}
            className="rounded-2xl border border-[#E4E2DC] bg-[#FFFFFF] p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-[#5F6878] truncate uppercase tracking-wider">
                {m.title}
              </span>
              {m.delta && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold shrink-0',
                    isPositive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : isNegative
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      : 'bg-slate-50 text-slate-700 border border-slate-200/60'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : isNegative ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  <span>{m.delta}</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-lg sm:text-xl font-black text-[#172033] tracking-tight">
                {isNumeric ? (
                  <AnimatedValue
                    value={Number(m.value)}
                    type={m.type === 'percentage' ? 'percentage' : m.type === 'number' ? 'number' : 'currency'}
                    currency="INR"
                    decimals={m.type === 'percentage' ? 1 : 2}
                  />
                ) : (
                  <span>{String(m.value)}</span>
                )}
              </div>
              {m.subtitle && (
                <span className="text-[10.5px] text-[#858D9A] font-medium block truncate pt-0.5">
                  {m.subtitle}
                </span>
              )}
            </div>
          </CardReveal>
        );
      })}
    </div>
  );
};
