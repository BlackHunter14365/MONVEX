'use client';

import React from 'react';
import { DesktopChatMessage } from '@/types/ai';
import { AIMessageRenderer } from './AIMessageRenderer';
import { AIActivityIndicator } from './AIActivityIndicator';
import { AIIdentityIcon } from './AIIdentityIcon';
import {
  Activity,
  Sliders,
  Calendar,
  CreditCard,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIConversationWorkspaceProps {
  messages: DesktopChatMessage[];
  isLoading: boolean;
  userAvatar?: string | null;
  userPreset?: any;
  displayName?: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  speakingId: string | null;
  onReadAloud: (id: string, text: string) => void;
  likedMap: Record<string, 'like' | 'dislike' | null>;
  onFeedback: (id: string, type: 'like' | 'dislike') => void;
  onExecutePrompt: (prompt: string) => void;
  renderFormattedContent: (content: string) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

const COMMAND_MATRIX_CAPABILITIES = [
  {
    id: 'anomalies',
    title: 'Outlier & Anomaly Detection',
    description: 'Statistical Z-score scanning over ledger expenses to isolate abnormal spikes.',
    prompt: 'Did I have any unusual expense or outlier spending spike this month?',
    icon: Activity,
    tag: 'Statistical Audit',
  },
  {
    id: 'budget-health',
    title: 'Budget Runway Analysis',
    description: 'Real-time category burn velocity evaluation against deterministic budget allocations.',
    prompt: 'Analyze my budget utilization across all categories and flag over-budget risks.',
    icon: ShieldCheck,
    tag: 'Ledger Grounded',
  },
  {
    id: 'cashflow-trajectory',
    title: '30-Day Cashflow Modeling',
    description: 'Forecast runway trajectory and balance sheet volatility bounds.',
    prompt: 'Forecast my cashflow trajectory for the next 30 days based on run-rate.',
    icon: Calendar,
    tag: 'Deterministic',
  },
  {
    id: 'what-if-sandbox',
    title: 'What-If Scenario Sandbox',
    description: 'Simulate compounding annual capital surplus by adjusting discretionary allocations.',
    prompt: 'What happens if I cut Food & Dining spending by 20% for the next 6 months?',
    icon: Sliders,
    tag: 'Simulation Engine',
  },
];

export const AIConversationWorkspace: React.FC<AIConversationWorkspaceProps> = ({
  messages,
  isLoading,
  userAvatar,
  userPreset,
  displayName,
  copiedId,
  onCopy,
  speakingId,
  onReadAloud,
  likedMap,
  onFeedback,
  onExecutePrompt,
  renderFormattedContent,
  messagesEndRef,
  className,
}) => {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 flex flex-col justify-between space-y-4 select-text',
        className
      )}
    >
      {/* 1. INITIAL EMPTY STATE: COMMAND CENTER CAPABILITIES MATRIX */}
      {messages.length === 0 ? (
        <div className="max-w-3xl mx-auto w-full my-auto py-6 sm:py-8 space-y-6">
          {/* Executive Operating System Badge */}
          <div className="rounded-3xl border border-[#D0C9E0] bg-white p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider font-bold text-[#2563EB] bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                    Financial OS Active
                  </span>
                  <span className="text-[11px] font-mono text-[#898390]">v2.4 Core Engine</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
                  Financial Intelligence Command Center
                </h2>
                <p className="text-xs sm:text-sm text-[#625D69] font-medium leading-relaxed max-w-xl">
                  Grounding queries directly into isolated double-entry ledger records. Execute deterministic cashflow forecasting, outlier detection, and capital simulations with zero hallucination.
                </p>
              </div>

              <div className="hidden sm:block">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2A1F3D] to-[#1D152B] p-2.5 flex items-center justify-center shadow-md">
                  <AIIdentityIcon size={34} glow animated />
                </div>
              </div>
            </div>

            {/* Capability Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#ECE9E0]">
              <div className="flex items-center gap-2 text-xs text-[#475569]">
                <Database className="h-4 w-4 text-[#0EA5E9] shrink-0" />
                <span className="font-semibold">Isolated Database Grounding</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#475569]">
                <Cpu className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Deterministic Arithmetic</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#475569]">
                <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="font-semibold">Zero Telemetry Fabrication</span>
              </div>
            </div>
          </div>

          {/* Adaptive Command Matrix (Clickable Execution Prompts) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold text-[#898390] uppercase tracking-wider">
                Telemetry Execution Launchpad
              </span>
              <span className="text-[10px] text-[#898390] font-mono">Select command to run</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMMAND_MATRIX_CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.id}
                    onClick={() => onExecutePrompt(cap.prompt)}
                    className="group p-4 rounded-2xl border border-[#E2DFD7] bg-white hover:bg-[#FAF9FD] hover:border-[#625477]/30 shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-[#EEEAF7] group-hover:bg-blue-50 text-[#2A1F3D] group-hover:text-[#2563EB] flex items-center justify-center transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-xs text-[#191522] group-hover:text-[#2563EB] transition-colors">
                          {cap.title}
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono font-semibold bg-[#F1EFEA] text-[#625D69] px-2 py-0.5 rounded-md shrink-0">
                        {cap.tag}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-[#625D69] leading-relaxed">
                      {cap.description}
                    </p>

                    <div className="pt-1 flex items-center gap-1.5 text-[10.5px] font-bold text-[#2563EB] group-hover:translate-x-0.5 transition-transform">
                      <span>Execute Command</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE CONVERSATION FEED: STRUCTURED INTELLIGENCE BLOCKS */
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <AIMessageRenderer
              key={message.id}
              message={message}
              userAvatar={userAvatar}
              userPreset={userPreset}
              displayName={displayName}
              copiedId={copiedId}
              onCopy={onCopy}
              speakingId={speakingId}
              onReadAloud={onReadAloud}
              likedMap={likedMap}
              onFeedback={onFeedback}
              onExecutePrompt={onExecutePrompt}
              renderFormattedContent={renderFormattedContent}
            />
          ))}

          {/* Animated Process Indicator during loading */}
          {isLoading && <AIActivityIndicator isLoading={isLoading} />}
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} className="h-2 shrink-0" />
    </main>
  );
};
