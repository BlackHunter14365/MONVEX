'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  History,
  Plus,
  Zap,
  Activity,
  ChevronDown,
  X,
  Database,
  ShieldCheck,
  Search,
  Trash2,
  Sliders,
} from 'lucide-react';
import {
  DesktopChatMessage as MobileChatMessage,
  DesktopChatSessionHistory as MobileChatSessionHistory,
} from '@/types/ai';
import { AIIdentityIcon } from './AIIdentityIcon';
import { AIMessageRenderer } from './AIMessageRenderer';
import { AIActivityIndicator } from './AIActivityIndicator';
import { FinancialCommandBar } from './FinancialCommandBar';
import { AIContextPanel } from './AIContextPanel';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PRESET_AVATARS } from '@/components/profile/UserProfileModal';

export type { MobileChatMessage, MobileChatSessionHistory };

interface MobileAIWorkspaceProps {
  user: any;
  messages: MobileChatMessage[];
  chatHistory: MobileChatSessionHistory[];
  currentConversationId: string | null;
  inputQuery: string;
  setInputQuery: (val: string) => void;
  isLoading: boolean;
  activeModel: string;
  setActiveModel: (m: string) => void;
  onSend: (text?: string) => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onCopy: (id: string, text: string) => void;
  copiedId: string | null;
  onReadAloud: (id: string, text: string) => void;
  speakingId: string | null;
  onFeedback: (id: string, type: 'like' | 'dislike') => void;
  likedMap: Record<string, 'like' | 'dislike' | null>;
  isRecording: boolean;
  toggleVoiceRecording: () => void;
  renderFormattedContent: (content: string) => React.ReactNode;
}

export const MobileAIWorkspace: React.FC<MobileAIWorkspaceProps> = ({
  user,
  messages,
  chatHistory,
  currentConversationId,
  inputQuery,
  setInputQuery,
  isLoading,
  activeModel,
  setActiveModel,
  onSend,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onCopy,
  copiedId,
  onReadAloud,
  speakingId,
  onFeedback,
  likedMap,
  isRecording,
  toggleVoiceRecording,
  renderFormattedContent,
}) => {
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isTelemetrySheetOpen, setIsTelemetrySheetOpen] = useState(false);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [summary, setSummary] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userAvatar = user?.avatar_url || null;
  const userPreset = user?.avatar_preset ? PRESET_AVATARS.find((p) => p.id === user.avatar_preset) : null;
  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'You';

  useEffect(() => {
    api.getAnalyticsSummary().then(setSummary).catch(() => null);
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const filteredHistory = chatHistory.filter((c) =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-5.5rem)] bg-[#FAF9FD] overflow-hidden relative">
      {/* 1. COMPACT MOBILE INTELLIGENCE HEADER */}
      <header className="px-3 py-2.5 bg-white border-b border-[#E4E2DC] flex items-center justify-between gap-2 shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#2A1F3D] p-1 flex items-center justify-center">
            <AIIdentityIcon size={16} glow />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-xs text-[#191522]">MONVEX Copilot</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button
              type="button"
              onClick={() => setIsModelSheetOpen(true)}
              className="text-[9.5px] font-mono text-[#2563EB] flex items-center gap-0.5 pt-0.5"
            >
              <span>{activeModel.split(' ')[0]} v2.4</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Live Telemetry Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsTelemetrySheetOpen(true)}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white hover:bg-[#F3F1F8] border border-[#E2DFD7] text-[#0EA5E9]"
            title="Open Balance Telemetry"
            aria-label="Balance Telemetry"
          >
            <Activity className="h-4 w-4" />
          </button>

          {/* Fresh Session */}
          <button
            type="button"
            onClick={onNewChat}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white hover:bg-[#F3F1F8] border border-[#E2DFD7] text-[#2563EB]"
            title="Fresh Session"
            aria-label="Fresh Session"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* History Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white hover:bg-[#F3F1F8] border border-[#E2DFD7] text-[#625D69]"
            title="Session Archive"
            aria-label="Session Archive"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN MOBILE CONVERSATION FEED */}
      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="py-6 space-y-4 text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-[#2A1F3D] p-2.5 flex items-center justify-center shadow-md">
              <AIIdentityIcon size={26} glow animated />
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold text-[#2563EB] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Financial OS Online
              </span>
              <h2 className="text-base font-black text-[#191522]">MONVEX Copilot</h2>
              <p className="text-xs text-[#625D69] max-w-xs mx-auto leading-relaxed">
                Deterministic ledger intelligence, runway forecasting, and cashflow modeling.
              </p>
            </div>

            {/* Quick Action Matrix for Mobile */}
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block px-1">
                Quick Telemetry Commands
              </span>
              <div className="space-y-1.5">
                {[
                  { label: 'Analyze Outlier Spikes', prompt: 'Did I have any unusual expense or outlier spending spike this month?' },
                  { label: 'Check Budget Runway', prompt: 'Analyze my budget utilization across all categories and flag over-budget risks.' },
                  { label: '30-Day Cashflow Forecast', prompt: 'Forecast my cashflow trajectory for the next 30 days based on run-rate.' },
                  { label: 'Simulate 20% Dining Cut', prompt: 'What happens if I cut Food & Dining spending by 20% for the next 6 months?' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSend(item.prompt)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2DFD7] text-left text-xs font-semibold text-[#191522] shadow-2xs hover:bg-[#FAF9FD] active:scale-[0.99] transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
                onExecutePrompt={onSend}
                renderFormattedContent={renderFormattedContent}
              />
            ))}

            {isLoading && <AIActivityIndicator isLoading={isLoading} />}
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* 3. STICKY MOBILE COMMAND BAR */}
      <div className="p-2.5 bg-white border-t border-[#E4E2DC] shrink-0 shadow-lg">
        <FinancialCommandBar
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
          onSend={onSend}
          isLoading={isLoading}
          isRecording={isRecording}
          toggleVoiceRecording={toggleVoiceRecording}
          textareaRef={textareaRef}
          compact
        />
      </div>

      {/* 4. MOBILE HISTORY DRAWER */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsHistoryDrawerOpen(false)}
          />
          <div className="relative w-[85vw] max-w-sm bg-[#FBFBFA] h-full shadow-2xl z-10 flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#ECE9E0] pb-3">
                <div className="flex items-center gap-2">
                  <AIIdentityIcon size={18} />
                  <span className="font-bold text-sm text-[#191522]">Session History</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-lg text-[#898390] hover:text-[#191522]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  setIsHistoryDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#2A1F3D] text-white font-bold text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Start Fresh Session</span>
              </button>

              <div className="space-y-1.5 pt-2">
                {chatHistory.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectConversation(s.id);
                      setIsHistoryDrawerOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold',
                      s.id === currentConversationId
                        ? 'bg-[#EEEAF7] text-[#191522] border-[#625477]/30'
                        : 'bg-white text-[#625D69] border-[#E4E2DC]'
                    )}
                  >
                    <span className="truncate flex-1">{s.title}</span>
                    <button
                      type="button"
                      onClick={(e) => onDeleteConversation(e, s.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MOBILE TELEMETRY CONTEXT SHEET */}
      {isTelemetrySheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsTelemetrySheetOpen(false)}
          />
          <div className="relative w-full max-h-[80vh] bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col p-4 overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-3">
            <div className="flex items-center justify-between border-b border-[#ECE9E0] pb-2">
              <span className="font-bold text-sm text-[#191522]">Live Balance Telemetry</span>
              <button
                type="button"
                onClick={() => setIsTelemetrySheetOpen(false)}
                className="p-1 text-[#898390]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <AIContextPanel
              summary={summary}
              onSelectPrompt={(p) => {
                onSend(p);
                setIsTelemetrySheetOpen(false);
              }}
              className="w-full border-l-0 p-0 bg-transparent"
            />
          </div>
        </div>
      )}

      {/* 6. MODEL SELECTOR SHEET */}
      {isModelSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsModelSheetOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl z-10 p-4 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#ECE9E0] pb-2">
              <span className="font-bold text-sm text-[#191522]">Select Reasoner Engine</span>
              <button
                type="button"
                onClick={() => setIsModelSheetOpen(false)}
                className="p-1 text-[#898390]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {['Autonomous Reasoner v2.4', 'Precision Financial Math'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setActiveModel(m);
                  setIsModelSheetOpen(false);
                }}
                className={cn(
                  'w-full text-left p-3 rounded-xl border text-xs font-bold transition-all',
                  activeModel === m
                    ? 'bg-[#EEEAF7] text-[#191522] border-[#625477]/30'
                    : 'bg-white text-[#625D69] border-[#E4E2DC]'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
