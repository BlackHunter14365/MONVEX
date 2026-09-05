'use client';

import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Cpu, Database, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  toolsUsed?: string[];
  toolActivity?: string[];
  duration?: string;
  model?: string;
}

export const AIToolExecutionBlock: React.FC<Props> = ({
  toolsUsed = [],
  toolActivity = [],
  duration = '1.2s',
  model = 'Gemini 2.0 Flash',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if ((!toolsUsed || toolsUsed.length === 0) && (!toolActivity || toolActivity.length === 0)) {
    return null;
  }

  return (
    <div className="my-2 rounded-2xl border border-[#06B6D4]/30 bg-[#DDF7FA]/60 p-2.5 text-xs text-[#0E7490] space-y-2">
      {/* High-level execution header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 text-left hover:text-[#0E7490] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-[#0E7490]">
            {toolsUsed.length > 0
              ? `Executed ${toolsUsed.length} verified domain ${toolsUsed.length === 1 ? 'tool' : 'tools'}`
              : 'Verified financial telemetry ingested'}
          </span>
          <span className="text-[10px] text-[#0891B2] font-mono">({duration})</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10.5px] text-[#0891B2]">
          <span className="font-semibold">{isOpen ? 'Hide breakdown' : 'View steps'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expanded Safe Execution Steps (No Chain of Thought) */}
      {isOpen && (
        <div className="pt-2 border-t border-[#06B6D4]/20 space-y-1.5 animate-in fade-in duration-200">
          {toolActivity.map((act, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px] text-[#475569]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{act}</span>
            </div>
          ))}
          {toolsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {toolsUsed.map((t, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] bg-white text-[#0891B2] px-2 py-0.5 rounded-md border border-[#06B6D4]/25 shadow-2xs"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
