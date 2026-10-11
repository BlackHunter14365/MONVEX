'use client';

import React from 'react';
import { DesktopChatMessage } from '@/types/ai';
import { AIMessageRenderer } from './AIMessageRenderer';
import { AIActivityIndicator } from './AIActivityIndicator';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Wallet,
  FileText,
  Target,
  ArrowRight,
  Sparkles,
  Bot,
  Circle,
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

const MONVEX_PROMPT_CARDS = [
  {
    id: 'spending-trend',
    question: 'How much did i spend last month?',
    icon: TrendingUp,
  },
  {
    id: 'recurring-costs',
    question: 'What is my largest recurring subscription?',
    icon: Receipt,
  },
  {
    id: 'safe-savings',
    question: 'How much can I safely save this month?',
    icon: PiggyBank,
  },
  {
    id: 'wallet-runway',
    question: 'Analyze my cash flow runway and burn rate',
    icon: Wallet,
  },
  {
    id: 'budget-overrun',
    question: 'What are my top budget overruns this quarter?',
    icon: FileText,
  },
  {
    id: 'invest-simulator',
    question: 'Simulate savings if I invest $500 monthly',
    icon: Target,
  },
];

export const AIConversationWorkspace: React.FC<AIConversationWorkspaceProps> = ({
  messages,
  isLoading,
  userAvatar,
  userPreset,
  displayName = 'ILmix Design',
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
        'flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col justify-between space-y-6 select-text',
        className
      )}
    >
      {/* 1. INITIAL EMPTY STATE: EXACT NEXORA HERO (Image 2) */}
      {messages.length === 0 ? (
        <div className="max-w-4xl mx-auto w-full my-auto space-y-8 animate-in fade-in duration-300">
          {/* Top Hero Section: Greeting + Title + 3D Robot Mascot */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-xs sm:text-sm font-semibold text-[#77798A] flex items-center justify-center md:justify-start gap-1.5">
                Good Morning, {displayName.split(' ')[0] || 'ILmix Design'} <span className="text-base">👋</span>
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-[#20212B] tracking-tight leading-[1.15]">
                How Can I{' '}
                <span className="bg-gradient-to-r from-[#6865E8] to-[#9F7AEA] bg-clip-text text-transparent">
                  Assist You
                </span>{' '}
                Today?
              </h2>

              <p className="text-xs sm:text-sm text-[#77798A] font-medium leading-relaxed max-w-md">
                Your AI finance assistant to simplify, analyze and help you make smarter financial decisions.
              </p>
            </div>

            {/* 3D Robot Mascot / Avatar Graphic (Image 2) */}
            <div className="relative shrink-0 flex items-center justify-center">
              {/* Soft Ambient Radial Halo */}
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#ECEBFF] via-[#DDD8F5] to-transparent blur-2xl absolute pointer-events-none" />

              {/* Robot Character Graphic */}
              <div className="relative z-10 w-36 sm:w-44 h-36 sm:h-44 rounded-full bg-gradient-to-b from-white to-[#F0EEF9] border-2 border-white shadow-xl flex items-center justify-center p-3">
                {/* Robot Head */}
                <div className="w-28 sm:w-32 h-24 sm:h-28 rounded-3xl bg-gradient-to-b from-[#FAF9FC] to-[#E9E7F6] border-2 border-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Visor Screen */}
                  <div className="w-20 sm:w-24 h-12 sm:h-14 rounded-2xl bg-[#20212B] flex items-center justify-center gap-3 shadow-inner">
                    {/* Glowing Purple Eyes */}
                    <div className="w-3.5 h-3.5 rounded-full bg-[#A855F7] shadow-[0_0_12px_#A855F7] animate-pulse" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#A855F7] shadow-[0_0_12px_#A855F7] animate-pulse" />
                  </div>
                  {/* Smiling Mouth Light */}
                  <div className="w-5 h-1 rounded-full bg-[#A855F7]/80 mt-1" />
                </div>

                {/* Floating Orbit Bubbles */}
                <div className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-[#ECEBFF] border border-white shadow-xs" />
                <div className="absolute bottom-2 -left-2 w-3 h-3 rounded-full bg-[#DDD8F5] border border-white shadow-xs" />
              </div>
            </div>
          </div>

          {/* Prompt Section: "Try Asking Monvex." */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#20212B]">
              Try Asking Monvex.
            </h3>

            {/* 6 Prompt Cards Grid (3 cols x 2 rows) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MONVEX_PROMPT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => onExecutePrompt(card.question)}
                    className="group p-4 rounded-2xl bg-white border border-[#E7E6F0] hover:border-[#6865E8]/40 shadow-xs hover:shadow-md transition-all flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="h-9 w-9 rounded-xl bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center shrink-0 group-hover:bg-[#6865E8] group-hover:text-white transition-colors">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#20212B] group-hover:text-[#6865E8] transition-colors line-clamp-2">
                        {card.question}
                      </span>
                    </div>

                    <div className="h-7 w-7 rounded-lg bg-[#FAF9FC] group-hover:bg-[#ECEBFF] text-[#77798A] group-hover:text-[#6865E8] flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE CONVERSATION STREAM */
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {messages.map((message) => (
            <AIMessageRenderer
              key={message.id}
              message={message}
              displayName={displayName}
              userAvatar={userAvatar}
              userPreset={userPreset}
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

          {isLoading && <AIActivityIndicator isLoading={isLoading} />}
          <div ref={messagesEndRef} />
        </div>
      )}
    </main>
  );
};
