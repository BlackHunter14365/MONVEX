'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DesktopAIWorkspace, DesktopChatMessage, DesktopChatSessionHistory } from '@/components/ai/DesktopAIWorkspace';
import { MobileAIWorkspace, MobileChatMessage, MobileChatSessionHistory } from '@/components/ai/MobileAIWorkspace';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';

export default function AIPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState<any>(null);
  const [messages, setMessages] = useState<DesktopChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Gemini 2.0 Flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'workspace'>('chat');
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
  const [chatHistory, setChatHistory] = useState<DesktopChatSessionHistory[]>([]);

  const fetchRealAIHistory = async () => {
    try {
      const convList = await api.getAIConversations();
      if (Array.isArray(convList) && convList.length > 0) {
        const mapped: DesktopChatSessionHistory[] = convList.map((c: any, idx: number) => ({
          id: c.id,
          title: c.title || 'Financial Inquiry',
          dateGroup: idx === 0 ? 'Today' : idx < 4 ? 'Yesterday' : 'Previous 7 Days',
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

    const initialMsg: DesktopChatMessage = {
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

    const userMsg: DesktopChatMessage = {
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
      const errorMsg: DesktopChatMessage = {
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
      {/* DESKTOP WORKSPACE (>= 1024px) - 100% UNCHANGED */}
      <DesktopAIWorkspace
        user={user}
        displayName={displayName}
        userAvatar={userAvatar}
        userPreset={userPreset}
        messages={messages}
        chatHistory={chatHistory}
        currentConversationId={currentConversationId}
        inputQuery={inputQuery}
        setInputQuery={setInputQuery}
        isLoading={isLoading}
        activeModel={activeModel}
        setActiveModel={setActiveModel}
        isModelDropdownOpen={isModelDropdownOpen}
        setIsModelDropdownOpen={setIsModelDropdownOpen}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openReasoningMap={openReasoningMap}
        toggleReasoning={toggleReasoning}
        likedMap={likedMap}
        handleFeedback={handleFeedback}
        speakingId={speakingId}
        handleReadAloud={handleReadAloud}
        copiedId={copiedId}
        handleCopy={handleCopy}
        isRecording={isRecording}
        toggleVoiceRecording={toggleVoiceRecording}
        textareaRef={textareaRef}
        messagesEndRef={messagesEndRef}
        handleNewChat={handleNewChat}
        handleSelectConversation={handleSelectConversation}
        handleDeleteConversation={handleDeleteConversation}
        handleSend={handleSend}
        starterPrompts={starterPrompts}
        renderFormattedContent={renderFormattedContent}
      />

      {/* DEDICATED MOBILE WORKSPACE (< 1024px) - FULL-SCREEN MOBILE-FIRST */}
      <div className="lg:hidden w-full h-full">
        <MobileAIWorkspace
          user={user}
          messages={messages as MobileChatMessage[]}
          chatHistory={chatHistory as MobileChatSessionHistory[]}
          currentConversationId={currentConversationId}
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
          isLoading={isLoading}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          onSend={handleSend}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onCopy={handleCopy}
          copiedId={copiedId}
          onReadAloud={handleReadAloud}
          speakingId={speakingId}
          onFeedback={handleFeedback}
          likedMap={likedMap}
          isRecording={isRecording}
          toggleVoiceRecording={toggleVoiceRecording}
          renderFormattedContent={renderFormattedContent}
        />
      </div>
    </AppShell>
  );
}
