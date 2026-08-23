'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  CornerDownLeft,
  Flame,
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
  Paperclip,
  Clock,
  Layers,
  HelpCircle,
  Pin,
  Bot,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';

interface ChatMessage {
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

interface ChatSessionHistory {
  id: string;
  title: string;
  dateGroup: 'Today' | 'Yesterday' | 'Previous 7 Days';
  pinned?: boolean;
}

export default function AIPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Gemini 2.0 Flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'workspace'>('chat');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);
  const [openReasoningMap, setOpenReasoningMap] = useState<Record<string, boolean>>({});
  const [likedMap, setLikedMap] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // User Profile
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userPreset, setUserPreset] = useState<any>(null);
  const [cachedName, setCachedName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real Chat History from Backend
  const [chatHistory, setChatHistory] = useState<ChatSessionHistory[]>([]);

  const fetchRealAIHistory = async () => {
    try {
      const convList = await api.getAIConversations();
      if (Array.isArray(convList) && convList.length > 0) {
        const mapped: ChatSessionHistory[] = convList.map((c: any, idx: number) => ({
          id: c.id,
          title: c.title || 'Financial Inquiry',
          dateGroup: idx === 0 ? 'Today' : (idx < 4 ? 'Yesterday' : 'Previous 7 Days'),
          pinned: c.is_pinned || false,
        }));
        setChatHistory(mapped);
      }
    } catch {
      // ignore
    }
  };

  const handleSelectConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const conv = await api.getAIConversation(convId);
      if (conv && conv.id) {
        setCurrentConversationId(conv.id);
        if (Array.isArray(conv.messages)) {
          setMessages(
            conv.messages.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              content: m.content,
              toolsUsed: m.tools_used || [],
              toolActivity: m.tool_activity || [],
              citations: m.citations || [],
              intent: m.intent,
              data: m.data,
              thoughtDuration: '1.4s',
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isStreaming: false,
            }))
          );
        }
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      toast.error('Failed to load conversation history');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await api.deleteAIConversation(convId);
      setChatHistory((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        handleNewChat();
      }
      toast.success('Conversation removed');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const loadProfileData = () => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`monvex_avatar_${user.username}`);
      if (raw) {
        if (raw.startsWith('data:image')) {
          setUserAvatar(raw);
          setUserPreset(null);
        } else if (raw.startsWith('{')) {
          setUserPreset(JSON.parse(raw));
          setUserAvatar(null);
        }
      }

      const pRaw = localStorage.getItem(`monvex_user_profile_${user.username}`);
      if (pRaw) {
        const parsed = JSON.parse(pRaw);
        if (parsed.firstName || parsed.lastName) {
          setCachedName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadProfileData();
    fetchRealAIHistory();
    const handleUpdate = () => loadProfileData();
    window.addEventListener('monvex:profile-updated', handleUpdate);
    return () => window.removeEventListener('monvex:profile-updated', handleUpdate);
  }, [user]);

  // Voice Recognition Hook
  const {
    isListening: isRecording,
    toggleListening: toggleVoiceRecording,
    stopListening,
  } = useSpeechRecognition({
    lang: 'en-IN',
    onResult: (liveText: string) => {
      setInputQuery(liveText);
    },
  });

  useEffect(() => {
    api.getAnalyticsSummary().then(setSummary).catch(() => null);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputQuery]);

  // Text-To-Speech (Read Aloud)
  const handleReadAloud = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`\-•]/g, '').slice(0, 400);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
    toast.info('🔊 Reading response aloud...');
  };

  // Streaming Typewriter Simulator
  const simulateStreamingResponse = (
    fullText: string,
    tools: string[],
    activity: string[],
    citations: Array<{ title: string; url: string }>,
    intent?: string
  ) => {
    const msgId = `ai_${Date.now()}`;
    const words = fullText.split(' ');
    let currentIdx = 0;

    const initialMsg: ChatMessage = {
      id: msgId,
      sender: 'assistant',
      content: '',
      toolsUsed: tools,
      toolActivity: activity.length > 0 ? activity : ['Ingested verified ledger telemetry'],
      reasoningSteps: activity.length > 0 ? activity : ['Queried verified database ledger', 'Synthesized risk-adjusted telemetry'],
      citations: citations,
      intent: intent,
      thoughtDuration: '1.6s',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialMsg]);

    const interval = setInterval(() => {
      currentIdx += 3;
      const partialText = words.slice(0, currentIdx).join(' ');

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              content: partialText,
              isStreaming: currentIdx < words.length,
            };
          }
          return m;
        })
      );

      if (currentIdx >= words.length) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m))
        );
      }
    }, 20);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    if (isRecording) {
      stopListening();
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res = await api.askAICopilot(textToSend, currentConversationId || undefined);
      setIsLoading(false);

      if (res.conversation_id && res.conversation_id !== currentConversationId) {
        setCurrentConversationId(res.conversation_id);
        fetchRealAIHistory();
      }

      const fullAnswer = res.answer || res.response || 'Analysis complete with live telemetry.';
      const tools = res.tools_used || [];
      const activity = res.tool_activity || [];
      const citations = res.citations || [];

      simulateStreamingResponse(fullAnswer, tools, activity, citations, res.intent);
    } catch {
      setIsLoading(false);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        content: 'I encountered an issue analyzing your live telemetry. Please verify your connection or try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleNewChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setMessages([]);
    setCurrentConversationId(null);
    setInputQuery('');
    setSpeakingId(null);
    toast.success('Started fresh chat session.');
  };


  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasoning = (id: string) => {
    setOpenReasoningMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setLikedMap((prev) => ({ ...prev, [id]: prev[id] === type ? null : type }));
    toast.success(type === 'like' ? 'Thanks for the positive feedback!' : 'Feedback recorded for model training.');
  };

  // Quick Starter Prompts
  const starterPrompts = [
    {
      title: 'Analyze monthly expense spikes',
      subtitle: 'Scan recent transactions for statistical outliers',
      icon: '📊',
      prompt: 'Did I have any unusual expense or outlier spending spike this month?',
    },
    {
      title: 'Affordability & Impulse Check',
      subtitle: 'Simulate purchase impact on emergency runway',
      icon: '🛍️',
      prompt: 'Can I afford to buy an iPhone for ₹79,900 next month without hurting my runway?',
    },
    {
      title: '5-Year SIP Wealth Simulation',
      subtitle: 'Compound monthly savings at 12% annual return',
      icon: '📈',
      prompt: 'How much wealth can I build if I invest my monthly savings for 5 years at 12% APY?',
    },
    {
      title: 'Cut Dining Out by 20%',
      subtitle: 'Calculate 6-month compounding surplus',
      icon: '🍕',
      prompt: 'What happens if I cut Food & Dining spending by 20% for the next 6 months?',
    },
  ];

  // Rich Markdown Renderer
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2.5 leading-relaxed text-[13.5px] text-[#1E293B]">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-extrabold text-[#0F172A] pt-3 pb-1 tracking-tight flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>{line.replace('### ', '')}</span>
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base font-black text-[#0F172A] pt-3 pb-1 tracking-tight">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('- ')) {
            const cleanLine = line.replace('- ', '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                <span className="text-[#2563EB] font-black text-sm leading-tight">•</span>
                <span
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#0F172A] bg-blue-50/70 px-1 py-0.5 rounded">$1</strong>'),
                  }}
                />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+\.)\s/)?.[1] || '';
            const rest = line.replace(/^(\d+\.)\s/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                  {num}
                </span>
                <span
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: rest.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#0F172A] bg-blue-50/70 px-1 py-0.5 rounded">$1</strong>'),
                  }}
                />
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p
              key={idx}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#0F172A]">$1</strong>'),
              }}
            />
          );
        })}
      </div>
    );
  };

  const displayName = cachedName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Danish';

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-6.5rem)] rounded-3xl overflow-hidden border border-[#E4E2DC] shadow-xl bg-[#FBFBFA]">
        {/* =========================================================================
            1. CHATGPT LEFT SIDEBAR (History, Projects, Model Selector, Profile)
            ========================================================================= */}
        <aside
          className={cn(
            'flex flex-col justify-between shrink-0 bg-[#F7F6F3] border-r border-[#E4E2DC] transition-all duration-300 select-none z-30',
            isSidebarOpen
              ? 'absolute md:relative inset-y-0 left-0 w-72 p-3.5 shadow-2xl md:shadow-none'
              : 'hidden md:flex md:w-0 md:p-0 md:overflow-hidden md:border-r-0'
          )}
        >
          {/* Top Section */}
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            {/* Header / New Chat Button */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleNewChat}
                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-[#EFECE6] text-xs font-bold text-[#172033] border border-[#E4E2DC] shadow-xs transition-all group"
                title="Start a new conversation"
              >
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md overflow-hidden shrink-0">
                    <img src="/ai-logo.png" alt="ChatGPT" className="h-full w-full object-cover" />
                  </div>
                  <span>New chat</span>
                </div>
                <SquarePen className="h-3.5 w-3.5 text-[#858D9A] group-hover:text-[#172033]" />
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl text-[#858D9A] hover:text-[#172033] hover:bg-white transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search history..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 border border-[#E4E2DC] text-[11px] font-semibold text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#172033]"
              />
            </div>

            {/* Recents Chat List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {['Today', 'Yesterday', 'Previous 7 Days'].map((grp) => {
                const groupItems = chatHistory.filter((c) => c.dateGroup === grp);
                if (groupItems.length === 0) return null;

                return (
                  <div key={grp} className="space-y-1">
                    <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider px-2 block">
                      {grp}
                    </span>
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectConversation(item.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition-all group cursor-pointer',
                          currentConversationId === item.id
                            ? 'bg-white text-[#0F172A] shadow-xs border border-[#E4E2DC]'
                            : 'text-[#334155] hover:text-[#0F172A] hover:bg-white/70'
                        )}
                      >
                        <span className="truncate pr-1 flex-1">{item.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.pinned && <Pin className="h-3 w-3 text-[#2563EB]" />}
                          <button
                            onClick={(e) => handleDeleteConversation(e, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#F6F5F1] rounded text-[#858D9A] hover:text-rose-600 transition-all"
                            title="Delete chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom User Pill Capsule */}
          <div className="pt-3 border-t border-[#E4E2DC]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E4E2DC] shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden shrink-0 bg-[#172033] text-white text-[10px] font-black">
                  {userAvatar ? (
                    <img src={userAvatar} alt="User" className="h-full w-full object-cover" />
                  ) : userPreset ? (
                    <span>{userPreset.emoji}</span>
                  ) : (
                    <span>{displayName.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold text-[#172033] block truncate leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#858D9A] font-mono block truncate">
                    @{user?.username || 'user'}
                  </span>
                </div>
              </div>
              <span className="brutalist-tag-emerald text-[9px] py-0 px-1.5 shrink-0">Pro</span>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            2. CHATGPT MAIN CANVAS (Top Navbar, Chat Stream / Welcome, Floating Dock)
            ========================================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-white relative">
          {/* Top Sticky Header Nav */}
          <header className="h-14 px-4 sm:px-6 border-b border-[#E4E2DC] flex items-center justify-between bg-white/90 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-xl text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1] transition-colors"
                  title="Open sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}

              {/* Model Switcher Pill */}
              <div className="relative">
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F6F5F1] text-xs font-black text-[#172033] transition-colors border border-transparent hover:border-[#E4E2DC]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>MONVEX {activeModel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#858D9A]" />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-white border border-[#E4E2DC] shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95">
                    {[
                      { id: '5.6 Terra Extra High', desc: 'Deep Multi-Step Financial Math & Reasoning', tag: 'Default' },
                      { id: 'Quantum-Finance 1.5 Pro', desc: 'Ultra-Fast Real-Time Telemetry & Insights', tag: 'Fast' },
                      { id: 'Autonomous Outlier Detective', desc: 'Statistical Z-score Anomaly Scanner', tag: 'Security' },
                    ].map((mod) => (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setActiveModel(mod.id);
                          setIsModelDropdownOpen(false);
                          toast.info(`Switched model to ${mod.id}`);
                        }}
                        className={cn(
                          'w-full p-2.5 rounded-xl text-left transition-all flex flex-col',
                          activeModel === mod.id ? 'bg-[#F6F5F1] text-[#172033]' : 'hover:bg-[#FAFAF7] text-[#5F6878]'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#172033]">{mod.id}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB]">
                            {mod.tag}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#858D9A] mt-0.5 font-medium">{mod.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Center Segmented Switcher */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC]">
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  'px-3.5 py-1 rounded-lg text-xs font-bold transition-all',
                  activeTab === 'chat' ? 'bg-white text-[#172033] shadow-xs' : 'text-[#858D9A] hover:text-[#172033]'
                )}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={cn(
                  'px-3.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                  activeTab === 'workspace' ? 'bg-white text-[#172033] shadow-xs' : 'text-[#858D9A] hover:text-[#172033]'
                )}
              >
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span>Financial Work</span>
              </button>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2">
              <span className="brutalist-tag-emerald text-[9px] py-0.5 px-2 hidden md:inline-flex">
                Live Telemetry Active
              </span>
              <button
                onClick={handleNewChat}
                className="p-2 rounded-xl text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1] transition-colors"
                title="New Chat"
              >
                <SquarePen className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* =======================================================================
              3. CENTER CANVAS (ChatGPT Empty Greeting OR Message Stream)
              ======================================================================= */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-thin">
            {messages.length === 0 ? (
              /* EMPTY CHATGPT WELCOME CANVAS */
              <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center text-center space-y-8 py-8 animate-in fade-in duration-300">
                {/* Big Greeting */}
                <div className="space-y-2">
                  <div className="h-16 w-16 mx-auto rounded-3xl overflow-hidden shadow-xl p-1 bg-gradient-to-br from-blue-500 to-indigo-700">
                    <img src="/ai-logo.png" alt="MONVEX AI" className="h-full w-full object-cover rounded-2xl" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                    What should we work on today?
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5F6878] font-medium max-w-md mx-auto">
                    Ask anything about your cashflow, budgets, runway, or run a what-if simulation grounded on your verified ledger.
                  </p>
                </div>

                {/* Central Floating Prompt Capsule (ChatGPT Style) */}
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
                        ? '🎙️ Listening... (Speak clearly into your microphone)'
                        : 'Work with MONVEX AI (e.g. Can I afford an iPhone?, Audit spending, Simulate savings)...'
                    }
                    rows={2}
                    className="w-full resize-none bg-transparent text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-[#F1EFEA]">
                    {/* Left Tools */}
                    <div className="flex items-center gap-2 text-xs font-bold text-[#5F6878]">
                      <button
                        type="button"
                        onClick={() => toast.info('Ledger Attachment Simulator: Active.')}
                        className="p-1.5 rounded-lg hover:bg-[#F6F5F1] text-[#858D9A] hover:text-[#172033] transition-colors"
                        title="Attach Statement or CSV"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 font-semibold">
                        <ShieldCheck className="h-3 w-3 text-amber-600" />
                        <span>Full access</span>
                      </div>

                      <span className="text-[10px] text-[#858D9A] font-mono hidden sm:inline">
                        5.6 terra Extra High
                      </span>
                    </div>

                    {/* Right Tools: Mic & Send Arrow */}
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
                        title="Voice Input (Microphone)"
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
              /* ACTIVE CONVERSATION STREAM */
              <div className="max-w-3xl mx-auto space-y-6 pb-24">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isReasoningOpen = openReasoningMap[msg.id];
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
                      {/* Avatar Icon */}
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-sm mt-0.5',
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
                          <img src="/ai-logo.png" alt="ChatGPT" className="h-full w-full object-cover" />
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Bubble */}
                        <div
                          className={cn(
                            'p-4 sm:p-5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm transition-all',
                            isUser
                              ? 'bg-[#172033] text-white rounded-tr-xs'
                              : 'bg-white border border-[#E4E2DC] text-[#0F172A] rounded-tl-xs shadow-slate-100'
                          )}
                        >
                          {/* Collapsible Reasoning & Tool Activity Drawer */}
                          {!isUser && ((msg.toolActivity && msg.toolActivity.length > 0) || (msg.reasoningSteps && msg.reasoningSteps.length > 0)) && (
                            <div className="mb-3 border-b border-[#F1EFEA] pb-2.5">
                              <button
                                onClick={() => toggleReasoning(msg.id)}
                                className="flex items-center gap-1.5 text-xs font-extrabold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                              >
                                <BrainCircuit className="h-3.5 w-3.5" />
                                <span>
                                  {msg.toolsUsed && msg.toolsUsed.length > 0
                                    ? `Executed ${msg.toolsUsed.length} Telemetry Tool${msg.toolsUsed.length > 1 ? 's' : ''}`
                                    : `Thought for ${msg.thoughtDuration || '1.6s'}`}
                                </span>
                                {isReasoningOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>

                              {isReasoningOpen && (
                                <div className="mt-2 p-3 rounded-xl bg-[#F6F5F1] text-[11px] font-mono text-[#5F6878] space-y-1.5 border border-[#E4E2DC] animate-in fade-in">
                                  {(msg.toolActivity || msg.reasoningSteps || []).map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-2">
                                      <span className="text-[#2563EB] font-bold">✓</span>
                                      <span className="text-[#334155] font-semibold">{step}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Content */}
                          <div>
                            {isUser ? (
                              <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                            ) : (
                              <>
                                {renderFormattedContent(msg.content)}
                                {msg.isStreaming && (
                                  <span className="inline-block w-1.5 h-4 ml-1 bg-[#2563EB] animate-pulse align-middle" />
                                )}

                                {/* Google Search Grounding Citations */}
                                {msg.citations && msg.citations.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-[#F1EFEA] space-y-1.5">
                                    <span className="text-[11px] font-bold text-[#5F6878] flex items-center gap-1">
                                      <Search className="h-3 w-3 text-[#2563EB]" /> Verified Web Sources (Google Search Grounding)
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.citations.map((c, cIdx) => (
                                        <a
                                          key={cIdx}
                                          href={c.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F6F5F1] hover:bg-[#EFECE6] text-[11px] font-semibold text-[#172033] border border-[#E4E2DC] transition-colors"
                                        >
                                          <span className="truncate max-w-[200px]">{c.title || c.url}</span>
                                          <ExternalLink className="h-3 w-3 text-[#858D9A]" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Bar for Assistant Messages (ChatGPT Style) */}
                        {!isUser && !msg.isStreaming && (
                          <div className="flex items-center gap-2 text-[#858D9A] text-xs pt-0.5">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-[#F6F5F1] hover:text-[#172033] transition-colors flex items-center gap-1"
                              title="Copy"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-3.5 w-3.5 text-[#059669]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => handleReadAloud(msg.id, msg.content)}
                              className={cn(
                                'p-1.5 rounded-lg hover:bg-[#F6F5F1] transition-colors flex items-center gap-1',
                                isSpeaking ? 'text-[#2563EB] font-bold' : 'hover:text-[#172033]'
                              )}
                              title={isSpeaking ? 'Stop speech' : 'Read aloud'}
                            >
                              {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </button>

                            <button
                              onClick={() => handleFeedback(msg.id, 'like')}
                              className={cn(
                                'p-1.5 rounded-lg hover:bg-[#F6F5F1] transition-colors',
                                userFeedback === 'like' ? 'text-[#059669]' : 'hover:text-[#172033]'
                              )}
                              title="Good response"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleFeedback(msg.id, 'dislike')}
                              className={cn(
                                'p-1.5 rounded-lg hover:bg-[#F6F5F1] transition-colors',
                                userFeedback === 'dislike' ? 'text-[#E11D48]' : 'hover:text-[#172033]'
                              )}
                              title="Bad response"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleSend(messages[messages.length - 2]?.content || 'Regenerate analysis')}
                              className="p-1.5 rounded-lg hover:bg-[#F6F5F1] hover:text-[#172033] transition-colors flex items-center gap-1 text-[11px] font-bold ml-1"
                              title="Regenerate"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Retry</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Thinking Pulse Loader */}
                {isLoading && (
                  <div className="flex items-start gap-3.5 max-w-md animate-in fade-in">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shrink-0 ring-1 ring-blue-500/20 bg-white shadow-sm">
                      <img src="/ai-logo.png" alt="MONVEX AI" className="h-full w-full object-cover animate-pulse" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-[#E4E2DC] rounded-tl-xs shadow-sm space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        <span>Thinking & synthesizing telemetry...</span>
                      </div>
                      <div className="flex gap-1.5 pt-0.5">
                        <div className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce [animation-delay:0.15s]" />
                        <div className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* =======================================================================
              4. FLOATING DOCKED PROMPT BAR (When messages exist)
              ======================================================================= */}
          {messages.length > 0 && (
            <div className="p-4 bg-gradient-to-t from-white via-white to-transparent border-t border-[#E4E2DC]/80">
              <div className="max-w-3xl mx-auto space-y-2">
                {isRecording && (
                  <div className="px-4 py-1.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-bold text-rose-700 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span>Microphone Active: Listening to your voice...</span>
                    </div>
                    <button onClick={toggleVoiceRecording} className="text-[11px] underline">
                      Stop
                    </button>
                  </div>
                )}

                <div className="rounded-3xl border border-[#E4E2DC] bg-white shadow-lg p-3 space-y-2 focus-within:border-[#172033] focus-within:shadow-xl transition-all">
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
                        ? 'Listening... Speak clearly'
                        : 'Message MONVEX AI (Enter to send, Shift+Enter for new line)...'
                    }
                    rows={1}
                    className="w-full resize-none bg-transparent text-xs sm:text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#858D9A]">
                      <button
                        type="button"
                        onClick={() => toast.info('File attachment tool')}
                        className="p-1 rounded-lg hover:bg-[#F6F5F1] hover:text-[#172033] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="text-[10px] font-mono text-[#858D9A] hidden sm:inline">
                        {activeModel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={cn(
                          'p-1.5 rounded-full transition-all',
                          isRecording
                            ? 'bg-[#E11D48] text-white animate-pulse'
                            : 'text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1]'
                        )}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSend()}
                        disabled={!inputQuery.trim() || isLoading}
                        className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center transition-all',
                          inputQuery.trim()
                            ? 'bg-[#172033] hover:bg-black text-white shadow-sm'
                            : 'bg-[#E4E2DC] text-[#858D9A] cursor-not-allowed'
                        )}
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-center text-[#94A3B8] font-medium">
                  MONVEX AI can make mistakes. Verify important financial and tax decisions.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
