'use client';

import React from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  User,
  AlertTriangle,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { DesktopChatMessage } from '@/types/ai';
import { AIIdentityIcon } from './AIIdentityIcon';
import { AIInsightCard } from './AIInsightCard';
import { AICalculationBlock } from './AICalculationBlock';
import { AIRecommendationCard } from './AIRecommendationCard';
import { AIMetricCardBlock } from './blocks/AIMetricCardBlock';
import { AIActionChipsBlock } from './blocks/AIActionChipsBlock';
import { AIToolExecutionBlock } from './blocks/AIToolExecutionBlock';
import { DynamicAIChart } from './charts/DynamicAIChart';
import { cn } from '@/lib/utils';

interface AIMessageRendererProps {
  message: DesktopChatMessage;
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
}

export const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({
  message,
  userAvatar,
  userPreset,
  displayName = 'You',
  copiedId,
  onCopy,
  speakingId,
  onReadAloud,
  likedMap,
  onFeedback,
  onExecutePrompt,
  renderFormattedContent,
}) => {
  const isUser = message.sender === 'user';
  const isSpeaking = speakingId === message.id;
  const isCopied = copiedId === message.id;
  const feedback = likedMap[message.id];

  // =========================================================================
  // 1. USER REQUEST CARD (Distinct from AI Analysis, High Information Hierarchy)
  // =========================================================================
  if (isUser) {
    return (
      <div className="w-full max-w-2xl ml-auto my-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="rounded-2xl border border-[#D8D2E7] bg-white p-3.5 sm:p-4 shadow-xs space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[#F1EFEA] pb-2 text-[10.5px]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-[#2A1F3D] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt="User" className="h-full w-full object-cover" />
                ) : userPreset ? (
                  <span>{userPreset.emoji}</span>
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="font-bold text-[#191522]">{displayName}</span>
              <span className="text-[#898390] font-mono">• Financial Command</span>
            </div>

            <span className="font-mono text-[#898390] text-[10px]">{message.timestamp}</span>
          </div>

          {/* Query Text */}
          <p className="text-xs sm:text-[13px] font-medium text-[#191522] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AI INTELLIGENCE ANALYSIS BLOCK (Fintech Operating System Block)
  // =========================================================================
  return (
    <div className="w-full my-4 animate-in fade-in slide-in-from-bottom-3 duration-250">
      <div className="rounded-2xl sm:rounded-3xl border border-[#D0C9E0] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Intelligence Block Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[#ECE9E0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#2A1F3D] to-[#1D152B] flex items-center justify-center p-1.5 shadow-2xs">
              <AIIdentityIcon size={18} glow />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-[#191522] tracking-tight">
                  MONVEX Financial Copilot
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  VERIFIED RUNWAY
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#898390] block">
                {message.intent
                  ? `Intent: ${message.intent.replace(/_/g, ' ')}`
                  : 'Deterministic Financial Telemetry'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-[#898390]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{message.timestamp}</span>
          </div>
        </div>

        {/* Tool Execution Audit Block (collapsible verification) */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <AIToolExecutionBlock
            toolsUsed={message.toolsUsed}
            toolActivity={message.toolActivity}
            duration={message.thoughtDuration || '1.1s'}
          />
        )}

        {/* Metric Cards Block (actual calculated values) */}
        {message.metrics && message.metrics.length > 0 && (
          <AIMetricCardBlock metrics={message.metrics} />
        )}

        {/* Dynamic Financial Charts */}
        {message.charts && message.charts.length > 0 && (
          <div className="my-3 space-y-3">
            {message.charts.map((chart, idx) => (
              <DynamicAIChart key={idx} chart={chart} />
            ))}
          </div>
        )}

        {/* Core Markdown Financial Analysis Text */}
        <div className="pt-1">
          {renderFormattedContent(message.content)}
        </div>

        {/* Structured Insights List */}
        {message.insights && message.insights.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
              Observed Telemetry Findings
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {message.insights.map((ins, idx) => (
                <AIInsightCard key={idx} insight={ins} />
              ))}
            </div>
          </div>
        )}

        {/* Warnings / Risk Indicators */}
        {message.warnings && message.warnings.length > 0 && (
          <div className="space-y-2 pt-2">
            {message.warnings.map((w, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-950 text-xs"
              >
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <span className="font-bold block">Risk Exposure Warning</span>
                  <p className="text-[11.5px] leading-relaxed text-rose-800">{w.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Structured Recommendations List */}
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
              Strategic Recommendations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {message.recommendations.map((rec, idx) => (
                <AIRecommendationCard
                  key={idx}
                  recommendation={rec}
                  onExecutePrompt={onExecutePrompt}
                />
              ))}
            </div>
          </div>
        )}

        {/* Interactive Action Chips */}
        {message.actions && message.actions.length > 0 && (
          <div className="pt-2">
            <AIActionChipsBlock
              actions={message.actions}
              onActionClick={(prompt) => onExecutePrompt(prompt)}
            />
          </div>
        )}

        {/* Citations / Database Sources */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-2 border-t border-[#F1EFEA] flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-[#898390]">Sources:</span>
            {message.citations.map((c, idx) => (
              <a
                key={idx}
                href={c.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10.5px] text-[#2563EB] bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded-lg hover:underline"
              >
                <span>{c.title}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}

        {/* Footer Utility Toolbar (TTS, Copy, Feedback, Zero-Hallucination Stamp) */}
        <div className="pt-3 border-t border-[#ECE9E0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#625D69]">
          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              type="button"
              onClick={() => onCopy(message.id, message.content)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-[#625D69] hover:text-[#191522] hover:bg-[#F3F1F8] transition-colors cursor-pointer"
              title="Copy response"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Read Aloud (TTS) */}
            <button
              type="button"
              onClick={() => onReadAloud(message.id, message.content)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer',
                isSpeaking
                  ? 'bg-blue-50 text-[#2563EB] font-bold border border-blue-200'
                  : 'text-[#625D69] hover:text-[#191522] hover:bg-[#F3F1F8]'
              )}
              title={isSpeaking ? 'Stop reading' : 'Read aloud with text-to-speech'}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
            </button>

            {/* Helpful Feedback */}
            <div className="flex items-center border-l border-[#E2DFD7] pl-2 ml-1 gap-0.5">
              <button
                type="button"
                onClick={() => onFeedback(message.id, 'like')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  feedback === 'like'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-[#898390] hover:text-[#191522] hover:bg-[#F3F1F8]'
                )}
                title="Helpful analysis"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onFeedback(message.id, 'dislike')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  feedback === 'dislike'
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-[#898390] hover:text-[#191522] hover:bg-[#F3F1F8]'
                )}
                title="Needs correction"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#898390]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Zero-Hallucination Telemetry Audit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
