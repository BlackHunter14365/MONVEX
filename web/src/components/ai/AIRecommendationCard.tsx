'use client';

import React from 'react';
import { ArrowRight, CheckCircle, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { AIRecommendationItem } from '@/types/ai';
import { cn } from '@/lib/utils';

interface AIRecommendationCardProps {
  recommendation: AIRecommendationItem;
  onExecutePrompt?: (prompt: string) => void;
  className?: string;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  recommendation,
  onExecutePrompt,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#CDE5FE] bg-[#F3F8FF] p-3.5 sm:p-4 text-xs space-y-2.5 shadow-2xs transition-all hover:border-[#93C5FD]',
        className
      )}
    >
      {/* Title & Impact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-[#191522] text-xs sm:text-[13px] tracking-tight">
            {recommendation.title}
          </span>
        </div>

        {recommendation.impact && (
          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
            {recommendation.impact}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[12px] sm:text-[12.5px] leading-relaxed text-[#475569] font-medium pl-0 sm:pl-8">
        {recommendation.description}
      </p>

      {/* Action Execution Button */}
      {(recommendation.actionLabel || recommendation.actionPrompt) && (
        <div className="pt-1 pl-0 sm:pl-8">
          <button
            type="button"
            onClick={() => {
              const p = recommendation.actionPrompt || recommendation.actionLabel || '';
              if (p && onExecutePrompt) {
                onExecutePrompt(p);
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span>{recommendation.actionLabel || 'Simulate this Strategy'}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
