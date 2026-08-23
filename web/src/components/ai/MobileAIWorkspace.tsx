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

export interface MobileChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  toolActivity?: string[];
  citations?: Array<{ title: string; url: string }>;
  intent?: string;
  data?: any;
  reasoningSteps?: string[];
  thoughtDuration?: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface MobileChatSessionHistory {
  id: string;
  title: string;
  dateGroup: 'Today' | 'Yesterday' | 'Previous 7 Days';
  pinned?: boolean;
}

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
  const toast = useToast();
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [openReasoningMap, setOpenReasoningMap] = useState<Record<string, boolean>>({});
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Dynamic textarea sizing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputQuery]);

  const toggleReasoning = (id: string) => {
    setOpenReasoningMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mobile Starter Suggestions
  const mobileStarterPrompts = [
    {
      title: 'Monthly Spending Spikes',
      prompt: 'Where did I spend the most this month, and are there any outlier expense spikes?',
    },
    {
      title: 'Affordability & Savings',
      prompt: 'How much money can I safely allocate to savings this month without hurting my runway?',
    },
    {
      title: 'Analyze Recent Outflows',
      prompt: 'Analyze my recent transactions and give me a 3-bullet spending optimization breakdown.',
    },
    {
      title: 'Goal Progress Check',
      prompt: 'Am I on track with my savings goals based on my current monthly cashflow retention?',
    },
  ];

  const filteredHistory = chatHistory.filter((c) =>
    historySearchQuery.trim() ? c.title.toLowerCase().includes(historySearchQuery.toLowerCase()) : true
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-[#FBFBFA] relative overflow-hidden select-none">
      {/* =========================================================================
          1. COMPACT STICKY MOBILE AI HEADER
          ========================================================================= */}
      <header className="h-14 px-3.5 bg-white/95 border-b border-[#E4E2DC] flex items-center justify-between backdrop-blur-md sticky top-0 z-30 shrink-0">
        {/* Left: History Drawer Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center justify-center h-11 w-11 -ml-1.5 rounded-xl text-[#172033] hover:bg-[#F6F5F1] active:scale-95 transition-all"
            aria-label="Open chat history"
            title="Chat History"
          >
            <Clock className="h-5 w-5 text-[#172033]" />
          </button>

          {/* MONVEX AI Brand Title + Online Status */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[#172033] tracking-tight">MONVEX AI</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <span className="text-[10px] font-semibold text-[#858D9A] leading-none">
              Gemini • Online
            </span>
          </div>
        </div>

        {/* Right: New Chat & Model Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F6F5F1] text-[11px] font-bold text-[#172033] border border-[#E4E2DC] active:scale-95 transition-all"
          >
            <Sparkles className="h-3 w-3 text-[#2563EB]" />
            <span className="truncate max-w-[80px]">{activeModel.split(' ')[0]}</span>
            <ChevronDown className="h-3 w-3 text-[#858D9A]" />
          </button>

          <button
            onClick={onNewChat}
            className="flex items-center justify-center h-11 w-11 rounded-xl text-[#172033] hover:bg-[#F6F5F1] active:scale-95 transition-all"
            aria-label="Start new chat"
            title="New Chat"
          >
            <SquarePen className="h-5 w-5 text-[#172033]" />
          </button>
        </div>

        {/* Model Switcher Dropdown */}
        {isModelMenuOpen && (
          <div className="absolute right-3 top-14 mt-1 w-64 rounded-2xl bg-white border border-[#E4E2DC] shadow-2xl p-2 space-y-1 z-40 animate-in fade-in zoom-in-95">
            {[
              { id: 'Gemini 2.0 Flash', desc: 'Fast, real-time financial intelligence' },
              { id: 'Gemini 1.5 Pro', desc: 'Deep multi-step reasoning & math' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModel(m.id);
                  setIsModelMenuOpen(false);
                  toast.info(`Switched model to ${m.id}`);
                }}
                className={cn(
                  'w-full p-2.5 rounded-xl text-left transition-all',
                  activeModel === m.id ? 'bg-[#F6F5F1] text-[#172033]' : 'hover:bg-[#FAFAF7] text-[#5F6878]'
                )}
              >
                <span className="text-xs font-bold text-[#172033] block">{m.id}</span>
                <span className="text-[10px] text-[#858D9A]">{m.desc}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* =========================================================================
          2. SLIDE-OUT MOBILE HISTORY DRAWER
          ========================================================================= */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#172033]/60 backdrop-blur-sm"
            onClick={() => setIsHistoryDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <div className="fixed inset-y-0 left-0 w-[85vw] max-w-[340px] bg-[#FBFBFA] border-r border-[#E4E2DC] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E4E2DC] flex items-center justify-between bg-white/80">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#2563EB]" />
                <span className="text-xs font-extrabold text-[#172033] uppercase tracking-wider">
                  Chat History
                </span>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="flex items-center justify-center h-9 w-9 rounded-xl text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Action: New Chat */}
            <div className="p-3 pb-0">
              <button
                onClick={() => {
                  onNewChat();
                  setIsHistoryDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#172033] text-white text-xs font-bold shadow-sm active:scale-98 transition-all"
              >
                <SquarePen className="h-4 w-4" />
                <span>Start New Chat</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#858D9A]" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search past sessions..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E4E2DC] text-xs font-semibold text-[#172033] placeholder:text-[#858D9A] focus:outline-none focus:border-[#172033]"
                />
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-4 scrollbar-thin">
              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#858D9A] space-y-1">
                  <p className="font-bold">No sessions found</p>
                  <p className="text-[11px]">Start a conversation to create history.</p>
                </div>
              ) : (
                ['Today', 'Yesterday', 'Previous 7 Days'].map((grp) => {
                  const items = filteredHistory.filter((c) => c.dateGroup === grp);
                  if (items.length === 0) return null;

                  return (
                    <div key={grp} className="space-y-1">
                      <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider px-2 block">
                        {grp}
                      </span>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            onSelectConversation(item.id);
                            setIsHistoryDrawerOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer group',
                            currentConversationId === item.id
                              ? 'bg-white text-[#172033] shadow-xs border border-[#E4E2DC]'
                              : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                          )}
                        >
                          <span className="truncate pr-2 flex-1">{item.title}</span>
                          <button
                            onClick={(e) => onDeleteConversation(e, item.id)}
                            className="p-1 text-[#858D9A] hover:text-rose-600 rounded"
                            title="Delete session"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer User Capsule */}
            <div className="p-3.5 border-t border-[#E4E2DC] bg-white/90">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-[#172033] block truncate">
                    {user?.first_name || user?.username || 'User'}
                  </span>
                  <span className="text-[10px] text-[#858D9A] block truncate">
                    @{user?.username || 'user'}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                  Pro Engine
                </span>
              </div>
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
            {/* Identity Badge */}
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
                Suggested Prompts
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
              const isReasoningOpen = openReasoningMap[msg.id];
              const userFeedback = likedMap[msg.id];
              const isSpeaking = speakingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col animate-in fade-in duration-200',
                    isUser ? 'items-end' : 'items-start'
                  )}
                >
                  {/* Message Bubble Container */}
                  <div
                    className={cn(
                      'flex items-start gap-2 max-w-[94%]',
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Left Avatar for AI */}
                    {!isUser && (
                      <div className="h-6 w-6 rounded-lg overflow-hidden shrink-0 mt-0.5 shadow-2xs border border-[#E4E2DC] bg-white">
                        <img src="/ai-logo.png" alt="AI" className="h-full w-full object-cover" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={cn(
                        'p-3.5 rounded-2xl text-xs leading-relaxed transition-all break-words',
                        isUser
                          ? 'bg-[#172033] text-white rounded-tr-xs shadow-xs font-medium'
                          : 'bg-white border border-[#E4E2DC] text-[#172033] rounded-tl-xs shadow-2xs space-y-2'
                      )}
                    >
                      {/* Collapsible Reasoning for AI */}
                      {!isUser && ((msg.toolActivity && msg.toolActivity.length > 0) || (msg.reasoningSteps && msg.reasoningSteps.length > 0)) && (
                        <div className="border-b border-[#F1EFEA] pb-2">
                          <button
                            onClick={() => toggleReasoning(msg.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#2563EB]"
                          >
                            <BrainCircuit className="h-3 w-3" />
                            <span>
                              {msg.toolsUsed && msg.toolsUsed.length > 0
                                ? `Telemetry Tools (${msg.toolsUsed.length})`
                                : `Thought for ${msg.thoughtDuration || '1.4s'}`}
                            </span>
                            {isReasoningOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          {isReasoningOpen && (
                            <div className="mt-1.5 p-2 rounded-lg bg-[#F6F5F1] text-[10.5px] font-mono text-[#5F6878] space-y-1">
                              {(msg.toolActivity || msg.reasoningSteps || []).map((st, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1.5">
                                  <span className="text-[#2563EB]">✓</span>
                                  <span className="truncate">{st}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <>
                            {renderFormattedContent(msg.content)}
                            {msg.isStreaming && (
                              <span className="inline-block w-1 h-3 ml-1 bg-[#2563EB] animate-pulse align-middle" />
                            )}

                            {/* Citations */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-[#F1EFEA] space-y-1">
                                <span className="text-[10px] font-bold text-[#858D9A] block">
                                  Sources
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.citations.map((c, cIdx) => (
                                    <a
                                      key={cIdx}
                                      href={c.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F6F5F1] text-[10px] font-semibold text-[#172033] border border-[#E4E2DC]"
                                    >
                                      <span className="truncate max-w-[140px]">{c.title || c.url}</span>
                                      <ExternalLink className="h-2.5 w-2.5 text-[#858D9A]" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row for AI message */}
                  {!isUser && !msg.isStreaming && (
                    <div className="flex items-center gap-1 text-[#858D9A] text-[11px] pt-1 pl-8">
                      <button
                        onClick={() => onCopy(msg.id, msg.content)}
                        className="flex items-center justify-center h-11 w-11 rounded-lg hover:bg-white text-[#858D9A] hover:text-[#172033]"
                        aria-label="Copy response"
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-[#059669]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onReadAloud(msg.id, msg.content)}
                        className={cn(
                          'flex items-center justify-center h-11 w-11 rounded-lg hover:bg-white',
                          isSpeaking ? 'text-[#2563EB]' : 'text-[#858D9A] hover:text-[#172033]'
                        )}
                        aria-label="Read response aloud"
                        title="Read aloud"
                      >
                        {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={() => onFeedback(msg.id, 'like')}
                        className={cn(
                          'flex items-center justify-center h-11 w-11 rounded-lg hover:bg-white',
                          userFeedback === 'like' ? 'text-[#059669]' : 'text-[#858D9A] hover:text-[#172033]'
                        )}
                        aria-label="Positive feedback"
                        title="Good response"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onFeedback(msg.id, 'dislike')}
                        className={cn(
                          'flex items-center justify-center h-11 w-11 rounded-lg hover:bg-white',
                          userFeedback === 'dislike' ? 'text-[#E11D48]' : 'text-[#858D9A] hover:text-[#172033]'
                        )}
                        aria-label="Negative feedback"
                        title="Bad response"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onSend(messages[messages.length - 2]?.content || 'Regenerate')}
                        className="flex items-center gap-1 px-2.5 h-11 rounded-lg hover:bg-white text-[#858D9A] hover:text-[#172033] font-bold text-[10px]"
                        aria-label="Retry response"
                        title="Retry"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading / Thinking Bubble */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[94%] animate-in fade-in">
                <div className="h-6 w-6 rounded-lg overflow-hidden shrink-0 mt-0.5 border border-[#E4E2DC] bg-white">
                  <img src="/ai-logo.png" alt="AI" className="h-full w-full object-cover animate-pulse" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#E4E2DC] rounded-tl-xs shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB]">
                    <Activity className="h-3 w-3 animate-pulse" />
                    <span>Analyzing live telemetry...</span>
                  </div>
                  <div className="flex gap-1 pt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-bounce" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-bounce [animation-delay:0.15s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* =========================================================================
          4. DEDICATED MOBILE COMPOSER
          ========================================================================= */}
      <div className="p-2.5 bg-white/95 border-t border-[#E4E2DC] backdrop-blur-md shrink-0 space-y-1.5">
        {/* Active Microphone Listening Bar */}
        {isRecording && (
          <div className="px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-bold text-rose-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
              <span>Listening to voice...</span>
            </div>
            <button onClick={toggleVoiceRecording} className="text-[11px] underline">
              Stop
            </button>
          </div>
        )}

        {/* Input Capsule */}
        <div className="flex items-end gap-1.5 bg-[#F6F5F1] rounded-2xl border border-[#E4E2DC] p-1.5 px-2 focus-within:border-[#172033] focus-within:ring-2 focus-within:ring-[#172033]/15 transition-all shadow-2xs w-full">
          {/* Plus Attachment Simulator */}
          <button
            type="button"
            onClick={() => toast.info('Ledger Attachment Simulator: Ready.')}
            className="flex items-center justify-center h-11 w-11 rounded-xl text-[#858D9A] hover:text-[#172033] shrink-0"
            aria-label="Attach statement"
            title="Attach CSV/Statement"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Multiline Expanding Textarea */}
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
            placeholder={isRecording ? '🎙️ Listening to voice...' : 'Ask MONVEX AI...'}
            rows={1}
            className="w-full min-w-0 resize-none bg-transparent text-xs font-semibold text-[#172033] placeholder:text-[#858D9A] focus:outline-none leading-relaxed py-2.5 max-h-28"
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={cn(
              'flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0',
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-[#858D9A] hover:text-[#172033]'
            )}
            aria-label="Voice input"
            title="Voice input"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!inputQuery.trim() || isLoading}
            className={cn(
              'flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0 shadow-xs',
              inputQuery.trim()
                ? 'bg-[#172033] active:bg-black text-white'
                : 'bg-[#E4E2DC] text-[#858D9A] cursor-not-allowed'
            )}
            aria-label="Send query"
            title="Send query"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
