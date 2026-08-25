'use client';

import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Zap,
  Mic,
  MicOff,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingUp,
  PieChart,
  BrainCircuit,
  Search,
  Plus,
  SquarePen,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Pin,
  Square,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { DesktopChatMessage, DesktopChatSessionHistory, AIStarterPrompt } from '@/types/ai';
import { DynamicAIChart } from './charts/DynamicAIChart';
import {
  AIMetricCardBlock,
  AIInsightBlock,
  AIRecommendationBlock,
  AIActionChipsBlock,
  AIToolExecutionBlock,
} from './blocks';
import { CardReveal } from '@/components/motion';

interface DesktopAIWorkspaceProps {
  user: any;
  displayName: string;
  userAvatar: string | null;
  userPreset: any;
  messages: DesktopChatMessage[];
  chatHistory: DesktopChatSessionHistory[];
  currentConversationId: string | null;
  inputQuery: string;
  setInputQuery: (val: string) => void;
  isLoading: boolean;
  activeModel: string;
  setActiveModel: (m: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeTab: 'chat' | 'workspace';
  setActiveTab: (tab: 'chat' | 'workspace') => void;
  openReasoningMap: Record<string, boolean>;
  toggleReasoning: (id: string) => void;
  likedMap: Record<string, 'like' | 'dislike' | null>;
  handleFeedback: (id: string, type: 'like' | 'dislike') => void;
  speakingId: string | null;
  handleReadAloud: (id: string, text: string) => void;
  copiedId: string | null;
  handleCopy: (id: string, text: string) => void;
  isRecording: boolean;
  toggleVoiceRecording: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleNewChat: () => void;
  handleSelectConversation: (id: string) => void;
  handleDeleteConversation: (e: React.MouseEvent, id: string) => void;
  handleSend: (queryText?: string) => void;
  starterPrompts: AIStarterPrompt[];
  renderFormattedContent: (content: string) => React.ReactNode;
}

export const DesktopAIWorkspace: React.FC<DesktopAIWorkspaceProps> = ({
  user,
  displayName,
  userAvatar,
  userPreset,
  messages,
  chatHistory,
  currentConversationId,
  inputQuery,
  setInputQuery,
  isLoading,
  activeModel,
  setActiveModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  openReasoningMap,
  toggleReasoning,
  likedMap,
  handleFeedback,
  speakingId,
  handleReadAloud,
  copiedId,
  handleCopy,
  isRecording,
  toggleVoiceRecording,
  textareaRef,
  messagesEndRef,
  handleNewChat,
  handleSelectConversation,
  handleDeleteConversation,
  handleSend,
  starterPrompts,
  renderFormattedContent,
}) => {
  const toast = useToast();
  const [searchHistory, setSearchHistory] = useState('');

  const filteredHistory = chatHistory.filter((c) =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const todaySessions = filteredHistory.filter((c) => c.dateGroup === 'Today');
  const yesterdaySessions = filteredHistory.filter((c) => c.dateGroup === 'Yesterday');
  const previousSessions = filteredHistory.filter((c) => c.dateGroup === 'Previous 7 Days');

  return (
    <div className="hidden lg:flex h-[calc(100vh-6.5rem)] rounded-3xl overflow-hidden border border-[#E4E2DC] shadow-xl bg-[#FBFBFA]">
      {/* =========================================================================
          1. LEFT SIDEBAR (History, Search, Model Selector, Profile)
          ========================================================================= */}
      <aside
        className={cn(
          'flex flex-col justify-between shrink-0 bg-[#F7F6F3] border-r border-[#E4E2DC] transition-all duration-300 select-none z-20',
          isSidebarOpen ? 'w-72 p-3.5' : 'w-0 p-0 overflow-hidden border-r-0'
        )}
      >
        <div className="space-y-3.5 overflow-hidden flex flex-col flex-1">
          {/* Top Actions: Toggle Sidebar & New Chat Button */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-white hover:bg-[#F1EFEA] border border-[#E4E2DC] shadow-2xs text-xs font-bold text-[#172033] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="h-4 w-4 text-[#2563EB]" />
              <span>New Conversation</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-xl text-[#858D9A] hover:text-[#172033] hover:bg-white border border-transparent hover:border-[#E4E2DC] transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Search History */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#858D9A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E4E2DC] text-[11.5px] font-semibold text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#172033]/40"
            />
          </div>

          {/* Session History Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {filteredHistory.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <BrainCircuit className="h-6 w-6 text-[#858D9A] mx-auto stroke-1" />
                <span className="text-xs text-[#858D9A] font-medium block">No history found</span>
              </div>
            ) : (
              <>
                {/* Today */}
                {todaySessions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider px-2">
                      Today
                    </span>
                    {todaySessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectConversation(session.id)}
                        className={cn(
                          'group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all',
                          currentConversationId === session.id
                            ? 'bg-white text-[#172033] shadow-xs border border-[#E4E2DC]'
                            : 'text-[#5F6878] hover:bg-white/60 hover:text-[#172033]'
                        )}
                      >
                        <span className="truncate flex-1 pr-2">{session.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {session.pinned && <Pin className="h-3 w-3 text-amber-600 fill-amber-600" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(e, session.id)}
                            className="p-1 text-[#858D9A] hover:text-[#E11D48]"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yesterday */}
                {yesterdaySessions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider px-2">
                      Yesterday
                    </span>
                    {yesterdaySessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectConversation(session.id)}
                        className={cn(
                          'group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all',
                          currentConversationId === session.id
                            ? 'bg-white text-[#172033] shadow-xs border border-[#E4E2DC]'
                            : 'text-[#5F6878] hover:bg-white/60 hover:text-[#172033]'
                        )}
                      >
                        <span className="truncate flex-1 pr-2">{session.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {session.pinned && <Pin className="h-3 w-3 text-amber-600 fill-amber-600" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(e, session.id)}
                            className="p-1 text-[#858D9A] hover:text-[#E11D48]"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous 7 Days */}
                {previousSessions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider px-2">
                      Previous 7 Days
                    </span>
                    {previousSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectConversation(session.id)}
                        className={cn(
                          'group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all',
                          currentConversationId === session.id
                            ? 'bg-white text-[#172033] shadow-xs border border-[#E4E2DC]'
                            : 'text-[#5F6878] hover:bg-white/60 hover:text-[#172033]'
                        )}
                      >
                        <span className="truncate flex-1 pr-2">{session.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {session.pinned && <Pin className="h-3 w-3 text-amber-600 fill-amber-600" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(e, session.id)}
                            className="p-1 text-[#858D9A] hover:text-[#E11D48]"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Profile Pill */}
        <div className="pt-3 border-t border-[#E4E2DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-[#172033] text-white flex items-center justify-center text-[10.5px] font-black shrink-0 shadow-xs">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#172033] block truncate">{displayName}</span>
              <span className="text-[10px] text-[#858D9A] block truncate font-medium">Enterprise Tier</span>
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONSOLE CANVAS
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF] relative overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-[#E4E2DC] px-5 flex items-center justify-between bg-[#FBFBFA] z-10 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1] transition-colors"
                title="Open history sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xs p-1">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-black text-[#172033] tracking-tight block leading-none">
                  MONVEX AI
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 leading-tight">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini 2.0 Flash • Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F5F1] border border-[#E4E2DC] text-xs font-bold text-[#172033] transition-all shadow-2xs"
            >
              <SquarePen className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Message Canvas */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-thin">
          {messages.length === 0 ? (
            /* EMPTY CANVAS / WELCOME SCREEN */
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center text-center space-y-8 py-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <div className="h-16 w-16 mx-auto rounded-3xl overflow-hidden shadow-xl p-1 bg-gradient-to-br from-blue-600 to-indigo-800">
                  <img src="/ai-logo.png" alt="MONVEX AI" className="h-full w-full object-cover rounded-2xl" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                  Next-Generation Financial Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-[#5F6878] font-medium max-w-md mx-auto">
                  Ask anything about your spending trends, budget caps, runway forecasts, or run deterministic what-if simulations.
                </p>
              </div>

              {/* Central Floating Composer Capsule */}
              <div className="w-full rounded-3xl border border-[#E4E2DC] bg-white shadow-xl p-4 space-y-3 transition-all hover:border-[#172033]/30">
                <textarea
                  ref={textareaRef}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isRecording
                      ? '🎙️ Listening... Speak your inquiry'
                      : 'Ask MONVEX AI (e.g. Why did spending increase?, Forecast 30-day balance, Simulate saving ₹5,000)...'
                  }
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1 border-t border-[#F1EFEA]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5F6878]">
                    <button
                      type="button"
                      onClick={() => toast.info('Statement / CSV Ingestion: Telemetry Active.')}
                      className="p-1.5 rounded-lg hover:bg-[#F6F5F1] text-[#858D9A] hover:text-[#172033] transition-colors"
                      title="Attach Statement or CSV"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 font-semibold">
                      <ShieldCheck className="h-3 w-3 text-amber-600" />
                      <span>Deterministic Math</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={cn(
                        'p-2 rounded-full transition-all',
                        isRecording
                          ? 'bg-[#E11D48] text-white animate-pulse shadow-md'
                          : 'text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1]'
                      )}
                      title="Voice Input"
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!inputQuery.trim() || isLoading}
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-sm',
                        inputQuery.trim()
                          ? 'bg-[#172033] hover:bg-black text-white'
                          : 'bg-[#E4E2DC] text-[#858D9A] cursor-not-allowed'
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Quick Starter Cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {starterPrompts.map((st) => (
                  <button
                    key={st.title}
                    onClick={() => handleSend(st.prompt)}
                    className="p-3.5 rounded-2xl bg-white hover:bg-[#F6F5F1] border border-[#E4E2DC] hover:border-[#172033]/40 shadow-xs hover:shadow-md transition-all text-left space-y-1 group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-base">{st.icon}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#858D9A] group-hover:text-[#2563EB] transition-colors" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-[#172033] block">{st.title}</span>
                      <span className="text-[10.5px] font-medium text-[#858D9A] block truncate">{st.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ACTIVE CONVERSATION STREAM WITH RICH BLOCKS */
            <div className="max-w-3xl mx-auto space-y-6 pb-28">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const userFeedback = likedMap[msg.id];
                const isSpeaking = speakingId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300',
                      isUser ? 'ml-auto flex-row-reverse max-w-xl' : 'max-w-3xl'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-xs mt-0.5',
                        isUser ? 'bg-[#172033] text-white text-[11px] font-black' : 'ring-1 ring-blue-500/20 bg-white'
                      )}
                    >
                      {isUser ? (
                        userAvatar ? (
                          <img src={userAvatar} alt="User" className="h-full w-full object-cover" />
                        ) : userPreset ? (
                          <span>{userPreset.emoji}</span>
                        ) : (
                          <span>{displayName.slice(0, 1)}</span>
                        )
                      ) : (
                        <img src="/ai-logo.png" alt="MONVEX AI" className="h-full w-full object-cover" />
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div
                        className={cn(
                          'p-4 sm:p-5 rounded-2xl text-[13.5px] leading-relaxed shadow-xs transition-all',
                          isUser
                            ? 'bg-[#172033] text-white rounded-tr-xs'
                            : 'bg-white border border-[#E4E2DC] text-[#0F172A] rounded-tl-xs shadow-slate-100'
                        )}
                      >
                        {/* Tool Execution Status */}
                        {!isUser && (
                          <AIToolExecutionBlock
                            toolsUsed={msg.toolsUsed}
                            toolActivity={msg.toolActivity}
                            duration={msg.thoughtDuration || '1.2s'}
                          />
                        )}

                        {/* Verified Financial KPI Cards */}
                        {!isUser && msg.metrics && msg.metrics.length > 0 && (
                          <AIMetricCardBlock metrics={msg.metrics} />
                        )}

                        {/* Dynamic Visual Financial Charts */}
                        {!isUser && msg.charts && msg.charts.length > 0 && (
                          <div className="space-y-3 my-2">
                            {msg.charts.map((chart, cIdx) => (
                              <DynamicAIChart key={`${chart.title}-${cIdx}`} chart={chart} />
                            ))}
                          </div>
                        )}

                        {/* Markdown Text Response */}
                        <div className="prose prose-sm max-w-none text-[#0F172A] dark:text-[#0F172A]">
                          {renderFormattedContent(msg.content)}
                        </div>

                        {/* Variance Drivers & Telemetry Insights */}
                        {!isUser && msg.insights && msg.insights.length > 0 && (
                          <AIInsightBlock insights={msg.insights} />
                        )}

                        {/* Actionable Recommendations */}
                        {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                          <AIRecommendationBlock
                            recommendations={msg.recommendations}
                            onActionClick={(prompt) => handleSend(prompt)}
                          />
                        )}

                        {/* Context-Aware Follow-Up Actions */}
                        {!isUser && msg.actions && msg.actions.length > 0 && !msg.isStreaming && (
                          <AIActionChipsBlock
                            actions={msg.actions}
                            onActionClick={(prompt) => handleSend(prompt)}
                            disabled={isLoading}
                          />
                        )}
                      </div>

                      {/* Footer Actions (Copy, TTS, Feedback) */}
                      {!isUser && !msg.isStreaming && (
                        <div className="flex items-center gap-2 text-[11px] text-[#858D9A] px-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-[#172033] transition-colors p-1 rounded-md hover:bg-[#F6F5F1]"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReadAloud(msg.id, msg.content)}
                            className={cn(
                              'flex items-center gap-1 transition-colors p-1 rounded-md hover:bg-[#F6F5F1]',
                              isSpeaking ? 'text-[#2563EB] font-bold' : 'hover:text-[#172033]'
                            )}
                          >
                            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
                          </button>

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'like')}
                              className={cn(
                                'p-1 rounded-md transition-colors',
                                userFeedback === 'like' ? 'text-emerald-600 bg-emerald-50' : 'hover:text-[#172033]'
                              )}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'dislike')}
                              className={cn(
                                'p-1 rounded-md transition-colors',
                                userFeedback === 'dislike' ? 'text-rose-600 bg-rose-50' : 'hover:text-[#172033]'
                              )}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E4E2DC] shadow-xs text-xs text-[#5F6878] animate-pulse">
                  <Sparkles className="h-4 w-4 text-[#2563EB] animate-spin" />
                  <span className="font-semibold">Synthesizing live verified financial telemetry...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Floating Composer Bar (Active Chat) */}
        {messages.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 max-w-3xl mx-auto z-20">
            <div className="rounded-3xl border border-[#E4E2DC] bg-white/95 backdrop-blur-md shadow-2xl p-3 space-y-2">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isRecording
                    ? '🎙️ Listening... Speak your inquiry'
                    : 'Ask MONVEX AI (e.g. Can I afford this?, Compare with last month)...'
                }
                rows={1}
                className="w-full resize-none bg-transparent text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none leading-relaxed max-h-36"
              />

              <div className="flex items-center justify-between pt-1 border-t border-[#F1EFEA]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5F6878]">
                  <button
                    type="button"
                    onClick={() => toast.info('Ledger Attachment Active.')}
                    className="p-1.5 rounded-lg hover:bg-[#F6F5F1] text-[#858D9A] hover:text-[#172033] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] text-[#858D9A] font-mono">
                    Enter to send • Shift+Enter for newline
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={cn(
                      'p-2 rounded-full transition-all',
                      isRecording
                        ? 'bg-[#E11D48] text-white animate-pulse shadow-md'
                        : 'text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1]'
                    )}
                    title="Voice Input"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputQuery.trim() || isLoading}
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-sm',
                      inputQuery.trim()
                        ? 'bg-[#172033] hover:bg-black text-white'
                        : 'bg-[#E4E2DC] text-[#858D9A] cursor-not-allowed'
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
