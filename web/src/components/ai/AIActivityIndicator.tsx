'use client';

import React, { useState, useEffect } from 'react';
import { AIIdentityIcon } from './AIIdentityIcon';
import { ShieldCheck, Database, Cpu, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIActivityIndicatorProps {
  isLoading: boolean;
  queryIntent?: string;
  className?: string;
}

const EXECUTION_STAGES = [
  { icon: Database, label: 'Accessing isolated ledger database...' },
  { icon: Activity, label: 'Computing statistical variance & category run-rate...' },
  { icon: Cpu, label: 'Running deterministic math & runway modeling...' },
  { icon: ShieldCheck, label: 'Verifying zero-hallucination constraints...' },
  { icon: Activity, label: 'Formatting structured telemetry blocks...' },
];

export const AIActivityIndicator: React.FC<AIActivityIndicatorProps> = ({
  isLoading,
  queryIntent,
  className,
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStageIndex(0);
      setElapsedMs(0);
      return;
    }

    const start = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 100);

    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % EXECUTION_STAGES.length);
    }, 1200);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stageInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const currentStage = EXECUTION_STAGES[stageIndex];
  const StageIcon = currentStage.icon;
  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  return (
    <div
      className={cn(
        'my-3 rounded-2xl border border-[#D0C9E0] bg-white/90 p-4 shadow-xs space-y-2.5 animate-in fade-in duration-200',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#ECE9E0] pb-2">
        <div className="flex items-center gap-2.5">
          <AIIdentityIcon size={18} animated glow />
          <span className="font-bold text-xs text-[#191522] tracking-tight">
            MONVEX Financial Reasoner
          </span>
          <span className="font-mono text-[10px] text-[#898390]">v2.4</span>
        </div>

        <div className="flex items-center gap-2 text-[10.5px] font-mono text-[#625D69]">
          <Clock className="h-3 w-3 text-[#0EA5E9]" />
          <span>{elapsedSec}s elapsed</span>
        </div>
      </div>

      {/* Dynamic Status Row */}
      <div className="flex items-center gap-3 pt-0.5">
        <div className="relative flex items-center justify-center">
          <div className="h-7 w-7 rounded-xl bg-[#EEEAF7] flex items-center justify-center text-[#2A1F3D]">
            <StageIcon className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="space-y-0.5 min-w-0 flex-1">
          <span className="font-mono text-[11px] font-bold text-[#2A1F3D] block truncate">
            {currentStage.label}
          </span>
          <span className="text-[10px] text-[#898390] block truncate">
            Querying verified database telemetry • Zero fabrication
          </span>
        </div>
      </div>

      {/* Progress Telemetry Line */}
      <div className="h-1 w-full bg-[#EEEAF7] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2563EB] via-[#0EA5E9] to-[#10B981] rounded-full transition-all duration-300"
          style={{ width: `${Math.min(((stageIndex + 1) / EXECUTION_STAGES.length) * 100, 95)}%` }}
        />
      </div>
    </div>
  );
};
