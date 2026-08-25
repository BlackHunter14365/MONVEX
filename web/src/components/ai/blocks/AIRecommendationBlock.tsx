'use client';

import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { AIRecommendationItem } from '@/types/ai';

interface Props {
  recommendations: AIRecommendationItem[];
  onActionClick?: (prompt: string) => void;
}

export const AIRecommendationBlock: React.FC<Props> = ({ recommendations, onActionClick }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-2.5 my-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
        <span className="text-[10.5px] font-bold text-[#858D9A] uppercase tracking-wider">
          Actionable Optimization Recommendation
        </span>
      </div>

      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 shadow-xs space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">{rec.title}</span>
                {rec.impact && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 border border-blue-200">
                    {rec.impact}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#475569] leading-relaxed font-medium">
                {rec.description}
              </p>
            </div>
          </div>

          {rec.actionPrompt && (
            <button
              type="button"
              onClick={() => onActionClick && onActionClick(rec.actionPrompt!)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-black text-white text-[11px] font-bold transition-all shadow-xs"
            >
              <span>{rec.actionLabel || 'Apply Recommendation'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
