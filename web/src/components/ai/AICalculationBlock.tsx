'use client';

import React, { useState } from 'react';
import { Calculator, CheckCircle2, ChevronDown, ChevronUp, Cpu, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalculationParameter {
  label: string;
  value: string | number;
  annotation?: string;
}

export interface AICalculationBlockProps {
  title?: string;
  formula?: string;
  parameters?: CalculationParameter[];
  steps?: string[];
  resultLabel?: string;
  resultValue?: string | number;
  className?: string;
}

export const AICalculationBlock: React.FC<AICalculationBlockProps> = ({
  title = 'Deterministic Capital Calculation',
  formula,
  parameters = [],
  steps = [],
  resultLabel = 'Calculated Telemetry Result',
  resultValue,
  className,
}) => {
  const [isStepsOpen, setIsStepsOpen] = useState(false);

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#D0C9E0] bg-[#FAF9FD] p-3.5 sm:p-4 text-xs space-y-3 shadow-2xs',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E4F2] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[#EEEAF7] border border-[#625477]/20 flex items-center justify-center text-[#2A1F3D]">
            <Calculator className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-[#191522] block leading-tight">{title}</span>
            <span className="text-[10px] font-mono text-[#898390] uppercase tracking-wider">
              Deterministic Engine • Zero Hallucination
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>VERIFIED</span>
        </div>
      </div>

      {/* Formula Display if provided */}
      {formula && (
        <div className="bg-white rounded-xl border border-[#E2DFD7] p-2.5 font-mono text-xs text-[#2A1F3D] overflow-x-auto flex items-center gap-2">
          <Binary className="h-3.5 w-3.5 text-[#0EA5E9] shrink-0" />
          <code>{formula}</code>
        </div>
      )}

      {/* Parameters Grid */}
      {parameters.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {parameters.map((param, idx) => (
            <div
              key={idx}
              className="bg-white/90 rounded-xl border border-[#E4E2DC] p-2 space-y-0.5"
            >
              <span className="text-[10px] font-semibold text-[#898390] block truncate">
                {param.label}
              </span>
              <span className="font-mono text-xs font-bold text-[#191522] block truncate">
                {String(param.value)}
              </span>
              {param.annotation && (
                <span className="text-[9.5px] text-[#625D69] block truncate">
                  {param.annotation}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toggleable Arithmetic Steps */}
      {steps.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsStepsOpen(!isStepsOpen)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2563EB] hover:underline"
          >
            <span>{isStepsOpen ? 'Hide computation audit steps' : 'View computation audit steps'}</span>
            {isStepsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {isStepsOpen && (
            <div className="mt-2 pl-3 border-l-2 border-[#2563EB]/40 space-y-1 py-1 font-mono text-[11px] text-[#475569] animate-in fade-in duration-150">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#898390] select-none">{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Final Calculated Result Banner */}
      {resultValue !== undefined && (
        <div className="mt-2 rounded-xl bg-gradient-to-r from-[#2A1F3D] to-[#1D152B] p-3 text-white flex items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block">
              {resultLabel}
            </span>
            <span className="text-base sm:text-lg font-black tracking-tight text-white block">
              {String(resultValue)}
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
            <Cpu className="h-3 w-3" />
            <span>EXACT PROJECTION</span>
          </div>
        </div>
      )}
    </div>
  );
};
