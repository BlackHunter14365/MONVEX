'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minus,
  Maximize2,
  ChevronDown,
  RefreshCw,
  Zap,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Target,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  timestamp: string;
}

export const FloatingAICopilot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Hello **${user?.username || 'there'}**! I am your **MONVEX Financial Copilot**.\n\nI can analyze your live transactions, forecast 90-day cash flow trajectories, or check budget velocities.\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.askAICopilot(textToSend);
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: res.answer || res.response || 'Financial telemetry analysis complete.',
        toolsUsed: res.tools_used || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        content: 'I encountered an error querying live financial telemetry. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        content: `Session refreshed. Ask me anything about your cash flow, budgets, or savings goals.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    'Analyze this month’s cash flow',
    'How are my budgets pacing?',
    'What is my 90-day trajectory?',
    'Top expense categories',
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-surface-100 hover:bg-surface-200 border border-brand-500/40 hover:border-brand-400 shadow-xl shadow-brand-500/10 hover:shadow-brand-500/20 text-white transition-all duration-200 active:scale-95"
            title="Open MONVEX Financial AI Copilot"
          >
            {/* Ambient Pulse Glow */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 opacity-20 blur group-hover:opacity-40 transition-opacity" />

            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>

            <div className="relative flex flex-col items-start text-left">
              <span className="text-xs font-black tracking-tight leading-tight flex items-center gap-1.5">
                AI Copilot
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
              <span className="text-[9px] text-zinc-400 font-medium">Financial Intelligence</span>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div
          className={cn(
            'fixed right-4 lg:right-6 z-50 transition-all duration-200 flex flex-col bg-surface-100/95 backdrop-blur-xl border border-surface-border shadow-2xl rounded-2xl overflow-hidden',
            isMinimized
              ? 'bottom-20 lg:bottom-6 w-72 h-14'
              : 'bottom-20 lg:bottom-6 w-[92vw] sm:w-[420px] h-[560px] max-h-[82vh]'
          )}
        >
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-surface-border bg-surface-200/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-sm">
                <Bot className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border-2 border-surface-100" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  MONVEX Copilot
                  <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 text-[9px] font-mono font-medium">
                    AI
                  </span>
                </h4>
                <p className="text-[10px] text-zinc-400 font-mono">Live telemetry active</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-surface-300 transition-colors"
                title="Close Copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'flex flex-col max-w-[88%] space-y-1',
                      m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'p-3 rounded-2xl leading-relaxed whitespace-pre-wrap',
                        m.sender === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                          : 'bg-surface-200 border border-surface-border text-zinc-200 rounded-bl-none'
                      )}
                    >
                      {m.content}

                      {/* Tool Execution Badges */}
                      {m.toolsUsed && m.toolsUsed.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-surface-border/50 flex flex-wrap gap-1">
                          {m.toolsUsed.map((tool, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-300/60 text-[9px] font-mono text-brand-300"
                            >
                              <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono px-1">{m.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="mr-auto flex items-center gap-2 p-3 rounded-2xl bg-surface-200 border border-surface-border text-zinc-400 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400 animate-spin" />
                    <span>Analyzing live telemetry...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 border-t border-surface-border/60 bg-surface-200/30 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-300/70 hover:bg-brand-500/20 hover:text-brand-300 text-[10px] text-zinc-400 font-medium transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-surface-border bg-surface-200/50 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask Copilot about finances, burn rate..."
                  className="flex-1 rounded-xl bg-surface-300/80 border border-surface-border px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="h-8 w-8 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 flex items-center justify-center text-white transition-all shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
