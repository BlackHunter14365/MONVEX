'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Copy,
  Check,
  Plus,
  SquarePen,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Search,
  X,
  Clock,
  Trash2,
  Pin,
  ExternalLink,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import {
  DesktopChatMessage as MobileChatMessage,
  DesktopChatSessionHistory as MobileChatSessionHistory,
} from '@/types/ai';
import { DynamicAIChart } from './charts/DynamicAIChart';
import {
  AIMetricCardBlock,
  AIInsightBlock,
  AIRecommendationBlock,
  AIActionChipsBlock,
} from './blocks';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [openReasoningMap, setOpenReasoningMap] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleReasoning = (id: string) => {
    setOpenReasoningMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputQuery]);

  const filteredHistory = chatHistory.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const mobileStarterPrompts = [
    {
      title: 'Analyze spending spikes',
      prompt: 'Did I have any unusual expense or outlier spending spike this month?',
    },
    {
      title: 'Affordability check',
      prompt: 'Can I afford to buy an iPhone for ₹79,900 next month without hurting my runway?',
    },
    {
      title: '30-Day cashflow forecast',
      prompt: 'Forecast my cashflow trajectory for the next 30 days based on run-rate',
    },
    {
      title: 'Simulate 20% dining cut',
      prompt: 'What happens if I cut Food & Dining spending by 20% for the next 6 months?',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-[#FBFBFA] relative overflow-hidden select-none">
      {/* =========================================================================
          1. COMPACT MOBILE HEADER
          ========================================================================= */}
      <header className="h-13 border-b border-[#E4E2DC] px-3.5 flex items-center justify-between bg-white shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-xl bg-[#F6F5F1] text-[#172033] border border-[#E4E2DC] active:scale-95"
            title="History"
          >
            <Clock className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-0.5 shadow-2xs">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-black text-[#172033] tracking-tight">
              MONVEX AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsModelSheetOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F6F5F1] border border-[#E4E2DC] text-[11px] font-bold text-[#172033] active:scale-95"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[85px]">{activeModel.replace('Gemini ', '')}</span>
            <ChevronDown className="h-3 w-3 text-[#858D9A]" />
          </button>

          <button
            type="button"
            onClick={onNewChat}
            className="p-1.5 rounded-xl bg-[#172033] text-white shadow-2xs active:scale-95"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. SLIDE-OVER HISTORY DRAWER
          ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-[#F7F6F3] h-full shadow-2xl flex flex-col justify-between p-3.5 z-10 border-r border-[#E4E2DC] animate-in slide-in-from-left duration-200">
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#172033] uppercase tracking-wider">
                  Conversation History
                </span>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-[#858D9A] hover:text-[#172033]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 text-[#858D9A] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search history..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-white border border-[#E4E2DC] text-[11px] font-semibold text-[#172033] focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {filteredHistory.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectConversation(s.id);
                      setIsDrawerOpen(false);
                    }}
                    className={cn(
                      'group flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer',
                      currentConversationId === s.id
                        ? 'bg-white text-[#172033] shadow-2xs border border-[#E4E2DC]'
                        : 'text-[#5F6878] hover:bg-white/60'
                    )}
                  >
                    <span className="truncate flex-1 pr-2">{s.title}</span>
                    <button
                      type="button"
                      onClick={(e) => onDeleteConversation(e, s.id)}
                      className="p-1 text-[#858D9A] hover:text-[#E11D48]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E4E2DC] flex items-center justify-between">
              <span className="text-[10px] text-[#858D9A] font-semibold">Deterministic Math Active</span>
              <span className="text-[10px] text-emerald-600 font-bold">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. SCROLLABLE CONVERSATION CANVAS
          ========================================================================= */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          /* MOBILE WELCOME STATE */
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <div className="h-12 w-12 mx-auto rounded-2xl overflow-hidden shadow-lg p-0.5 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <img src="/ai-logo.png" alt="MONVEX AI" className="h-full w-full object-cover rounded-xl" />
              </div>
              <h2 className="text-xl font-black text-[#172033] tracking-tight">
                MONVEX AI
              </h2>
              <p className="text-xs text-[#5F6878] font-medium max-w-xs mx-auto leading-relaxed">
                Your personal financial intelligence assistant. Ask about your spending, budgets, savings, or cash flow.
              </p>
            </div>

            {/* Suggestion Buttons Grid */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider block">
                Suggested Inquiries
              </span>
              <div className="grid grid-cols-1 gap-2">
                {mobileStarterPrompts.map((st) => (
                  <button
                    key={st.title}
                    onClick={() => onSend(st.prompt)}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-[#F6F5F1] border border-[#E4E2DC] shadow-2xs hover:shadow-xs transition-all text-left flex items-center justify-between active:scale-98"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-xs font-bold text-[#172033] block">{st.title}</span>
                      <span className="text-[11px] text-[#5F6878] block truncate">{st.prompt}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#2563EB] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE MESSAGES STREAM */
          <div className="space-y-4 pb-2">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSpeaking = speakingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col animate-in fade-in duration-200',
                    isUser ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-start gap-2 max-w-[96%]',
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {!isUser && (
                      <div className="h-6 w-6 rounded-lg overflow-hidden shrink-0 mt-0.5 shadow-2xs border border-[#E4E2DC] bg-white">
                        <img src="/ai-logo.png" alt="AI" className="h-full w-full object-cover" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'p-3.5 rounded-2xl text-xs leading-relaxed transition-all break-words space-y-2',
                        isUser
                          ? 'bg-[#172033] text-white rounded-tr-xs shadow-xs font-medium'
                          : 'bg-white border border-[#E4E2DC] text-[#172033] rounded-tl-xs shadow-2xs'
                      )}
                    >
                      {/* Tool execution badge */}
                      {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-[#2563EB] font-bold pb-1 border-b border-[#F1EFEA]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{msg.toolsUsed.length} verified domain tools executed</span>
                        </div>
                      )}

                      {/* Verified Financial KPI Cards */}
                      {!isUser && msg.metrics && msg.metrics.length > 0 && (
                        <AIMetricCardBlock metrics={msg.metrics} />
                      )}

                      {/* Dynamic Visual Financial Charts */}
                      {!isUser && msg.charts && msg.charts.length > 0 && (
                        <div className="space-y-2 my-2">
                          {msg.charts.map((chart, cIdx) => (
                            <DynamicAIChart key={`${chart.title}-${cIdx}`} chart={chart} />
                          ))}
                        </div>
                      )}

                      {/* Markdown Text Response */}
                      <div>{renderFormattedContent(msg.content)}</div>

                      {/* Variance Drivers & Telemetry Insights */}
                      {!isUser && msg.insights && msg.insights.length > 0 && (
                        <AIInsightBlock insights={msg.insights} />
                      )}

                      {/* Actionable Recommendations */}
                      {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                        <AIRecommendationBlock
                          recommendations={msg.recommendations}
                          onActionClick={(prompt) => onSend(prompt)}
                        />
                      )}

                      {/* Context-Aware Follow-Up Actions */}
                      {!isUser && msg.actions && msg.actions.length > 0 && !msg.isStreaming && (
                        <AIActionChipsBlock
                          actions={msg.actions}
                          onActionClick={(prompt) => onSend(prompt)}
                          disabled={isLoading}
                        />
                      )}

                      {/* Footer Actions */}
                      {!isUser && !msg.isStreaming && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#F1EFEA] text-[10px] text-[#858D9A]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onCopy(msg.id, msg.content)}
                              className="hover:text-[#172033]"
                            >
                              {copiedId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onReadAloud(msg.id, msg.content)}
                              className={cn('hover:text-[#172033]', isSpeaking && 'text-[#2563EB] font-bold')}
                            >
                              {isSpeaking ? 'Stop' : 'Read'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#E4E2DC] text-[11px] text-[#5F6878] animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-[#2563EB] animate-spin" />
                <span>Synthesizing live verified financial telemetry...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* =========================================================================
          4. COMPACT MOBILE COMPOSER
          ========================================================================= */}
      <footer className="p-2.5 bg-white border-t border-[#E4E2DC] shrink-0">
        <div className="flex items-end gap-2 bg-[#F6F5F1] p-1.5 rounded-2xl border border-[#E4E2DC]">
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={cn(
              'p-2 rounded-xl transition-all',
              isRecording ? 'bg-[#E11D48] text-white animate-pulse' : 'text-[#858D9A]'
            )}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <textarea
            ref={textareaRef}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={isRecording ? '🎙️ Listening...' : 'Ask MONVEX AI...'}
            rows={1}
            className="flex-1 bg-transparent text-xs font-semibold text-[#172033] placeholder:text-[#94A3B8] focus:outline-none py-1.5 resize-none max-h-24"
          />

          <button
            type="button"
            onClick={() => onSend()}
            disabled={!inputQuery.trim() || isLoading}
            className={cn(
              'p-2 rounded-xl transition-all',
              inputQuery.trim() ? 'bg-[#172033] text-white' : 'bg-[#E4E2DC] text-[#858D9A]'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
