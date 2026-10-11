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
        'w-full border-b border-[#E7E6F0] bg-[#FAF9FC] px-4 py-3 flex items-center justify-between gap-3 select-none shrink-0',
        className
      )}
    >
      {/* Left: Brand Identity & Telemetry Status */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#6865E8] p-1.5 flex items-center justify-center shadow-xs">
          <AIIdentityIcon size={20} glow />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm sm:text-base text-[#20212B] tracking-tight leading-none">
              MONVEX <span className="text-[#6865E8]">Copilot</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E8FBF4] text-[#16745C] border border-[#B6F0DE]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75DCC0] animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
          <p className="text-[10.5px] font-mono text-[#77798A] pt-0.5 hidden sm:block">
            Financial Operating System • Zero-Hallucination Verified
          </p>
        </div>
      </div>

      {/* Center: Image 2 Pill Navigation (Overview | Transactions | Accounts | Budgets | Reports) */}
      <div className="hidden md:flex items-center bg-white px-2 py-1 rounded-full border border-[#E7E6F0] shadow-2xs">
        <a href="/dashboard" className="px-3 py-1 rounded-full text-xs font-semibold text-[#77798A] hover:text-[#20212B] transition-colors">
          Overview
        </a>
        <a href="/transactions" className="px-3 py-1 rounded-full text-xs font-semibold text-[#77798A] hover:text-[#20212B] transition-colors">
          Transactions
        </a>
        <a href="/net-worth" className="px-3 py-1 rounded-full text-xs font-semibold text-[#77798A] hover:text-[#20212B] transition-colors">
          Accounts
        </a>
        <a href="/budgets" className="px-3 py-1 rounded-full text-xs font-semibold text-[#77798A] hover:text-[#20212B] transition-colors">
          Budgets
        </a>
        <a href="/reports" className="px-3 py-1 rounded-full text-xs font-semibold text-[#77798A] hover:text-[#20212B] transition-colors">
          Reports
        </a>
      </div>

      {/* Center / Right: Engine Selector & Session Controls */}
      <div className="flex items-center gap-2">
        {/* Model Engine Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#EEEDF8] border border-[#E7E6F0] text-xs font-bold text-[#20212B] shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-[#6865E8]" />
            <span className="hidden md:inline">{activeModel}</span>
            <span className="md:hidden">v2.4 Core</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#77798A]" />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white border border-[#E7E6F0] shadow-xl p-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 border-b border-[#E7E6F0] mb-1">
                <span className="text-[10px] font-mono text-[#77798A] uppercase tracking-wider block">
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
                        ? 'bg-[#EEEDF8] text-[#20212B] font-bold border border-[#6865E8]/30'
                        : 'hover:bg-[#FAF9FC] text-[#77798A]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#20212B]">{m.name}</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#EEEDF8] text-[#6865E8]">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#77798A] pt-0.5 font-normal leading-snug">
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#EEEDF8] border border-[#E7E6F0] text-xs font-bold text-[#20212B] shadow-2xs transition-colors cursor-pointer"
          title="Start fresh conversation"
        >
          <Plus className="h-3.5 w-3.5 text-[#6865E8]" />
          <span className="hidden sm:inline">Fresh Session</span>
        </button>

        {/* History Archive Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#EEEDF8] border border-[#E7E6F0] text-xs font-bold text-[#77798A] hover:text-[#20212B] shadow-2xs transition-colors cursor-pointer"
          title="Open Intelligence History (Ctrl+H)"
        >
          <History className="h-3.5 w-3.5 text-[#77798A]" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="h-4 px-1 rounded-full bg-[#EEEDF8] text-[10px] font-mono font-bold text-[#6865E8] flex items-center justify-center">
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
              ? 'bg-[#EEEDF8] text-[#6865E8] border-[#6865E8]/30 shadow-2xs'
              : 'bg-white hover:bg-[#EEEDF8] text-[#77798A] border-[#E7E6F0]'
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
