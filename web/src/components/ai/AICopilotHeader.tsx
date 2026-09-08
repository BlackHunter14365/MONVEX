'use client';

import React from 'react';
import {
  ShieldCheck,
  ChevronDown,
  History,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  Activity,
  Zap,
} from 'lucide-react';
import { AIIdentityIcon } from './AIIdentityIcon';
import { cn } from '@/lib/utils';

interface AICopilotHeaderProps {
  activeModel: string;
  setActiveModel: (model: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  onOpenHistory: () => void;
  historyCount: number;
  onNewChat: () => void;
  isContextPanelOpen: boolean;
  setIsContextPanelOpen: (open: boolean) => void;
  className?: string;
}

const AVAILABLE_MODELS = [
  {
    id: 'Autonomous Reasoner v2.4',
    name: 'Autonomous Reasoner v2.4',
    desc: 'Deep multi-step financial logic & runway forecasting',
    badge: 'Recommended',
  },
  {
    id: 'Precision Financial Math',
    name: 'Precision Financial Math',
    desc: 'Deterministic double-entry audit & interest calculations',
    badge: 'Strict Audit',
  },
];

export const AICopilotHeader: React.FC<AICopilotHeaderProps> = ({
  activeModel,
  setActiveModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  onOpenHistory,
  historyCount,
  onNewChat,
  isContextPanelOpen,
  setIsContextPanelOpen,
  className,
}) => {
  return (
    <header
      className={cn(
        'w-full border-b border-[#E4E2DC] bg-[#FBFBFA] px-4 py-3 flex items-center justify-between gap-3 select-none shrink-0',
        className
      )}
    >
      {/* Left: Brand Identity & Telemetry Status */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2A1F3D] to-[#1D152B] p-1.5 flex items-center justify-center shadow-xs">
          <AIIdentityIcon size={20} glow />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm sm:text-base text-[#191522] tracking-tight leading-none">
              MONVEX <span className="text-[#2563EB]">Copilot</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
          <p className="text-[10.5px] font-mono text-[#898390] pt-0.5 hidden sm:block">
            Financial Operating System • Zero-Hallucination Verified
          </p>
        </div>
      </div>

      {/* Center / Right: Engine Selector & Session Controls */}
      <div className="flex items-center gap-2">
        {/* Model Engine Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1F8] border border-[#E2DFD7] text-xs font-bold text-[#191522] shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-[#0EA5E9]" />
            <span className="hidden md:inline">{activeModel}</span>
            <span className="md:hidden">v2.4 Core</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#898390]" />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white border border-[#E2DFD7] shadow-xl p-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 border-b border-[#F1EFEA] mb-1">
                <span className="text-[10px] font-mono text-[#898390] uppercase tracking-wider block">
                  Select Intelligence Engine
                </span>
              </div>
              <div className="space-y-1">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveModel(m.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl text-xs transition-colors',
                      activeModel === m.id
                        ? 'bg-[#EEEAF7] text-[#191522] font-bold border border-[#625477]/20'
                        : 'hover:bg-[#FAF9FD] text-[#625D69]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#191522]">{m.name}</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#898390] pt-0.5 font-normal leading-snug">
                      {m.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Start Fresh Session */}
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1F8] border border-[#E2DFD7] text-xs font-bold text-[#191522] shadow-2xs transition-colors cursor-pointer"
          title="Start fresh conversation"
        >
          <Plus className="h-3.5 w-3.5 text-[#2563EB]" />
          <span className="hidden sm:inline">Fresh Session</span>
        </button>

        {/* History Archive Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1F8] border border-[#E2DFD7] text-xs font-bold text-[#625D69] hover:text-[#191522] shadow-2xs transition-colors cursor-pointer"
          title="Open Intelligence History (Ctrl+H)"
        >
          <History className="h-3.5 w-3.5 text-[#898390]" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="h-4 px-1 rounded-full bg-[#EEEAF7] text-[10px] font-mono font-bold text-[#2A1F3D] flex items-center justify-center">
              {historyCount}
            </span>
          )}
        </button>

        {/* Desktop Context Panel Toggle */}
        <button
          type="button"
          onClick={() => setIsContextPanelOpen(!isContextPanelOpen)}
          className={cn(
            'hidden lg:flex items-center p-1.5 rounded-xl border transition-colors cursor-pointer',
            isContextPanelOpen
              ? 'bg-[#EEEAF7] text-[#2A1F3D] border-[#625477]/30 shadow-2xs'
              : 'bg-white hover:bg-[#F3F1F8] text-[#898390] border-[#E2DFD7]'
          )}
          title={isContextPanelOpen ? 'Collapse Context Panel' : 'Expand Context Panel'}
        >
          {isContextPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
};
