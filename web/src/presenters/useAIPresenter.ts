"use client";

/**
 * [P] PRESENTER: AI Copilot & Financial Intelligence Workspace ViewModel
 * Encapsulates multi-turn messaging, structured payload parsing, voice input, and speech synthesis.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { DesktopChatMessage, DesktopChatSessionHistory } from '@/models';

export interface AIWorkspaceState {
  conversations: DesktopChatSessionHistory[];
  currentConversationId: string | null;
  messages: DesktopChatMessage[];
  inputMessage: string;
  isStreaming: boolean;
  isLoadingHistory: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  searchQuery: string;
}

export function useAIPresenter() {
  const [conversations, setConversations] = useState<DesktopChatSessionHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DesktopChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const recognitionRef = useRef<any>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.getAIConversations();
      const list = (res as any)?.results || (Array.isArray(res) ? res : []);
      setConversations(list);
    } catch {
      // Fallback local list
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Send message
  const sendMessage = useCallback(async (customPrompt?: string) => {
    const text = (customPrompt || inputMessage).trim();
    if (!text || isStreaming) return;

    setInputMessage('');
    const userMsgId = `usr_${Date.now()}`;
    const assistantMsgId = `ast_${Date.now() + 1}`;

    const userMsg: DesktopChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAssistantMsg: DesktopChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);

    try {
      const res: any = await api.askAICopilot(text, currentConversationId || undefined);
      
      if (res.conversation_id && !currentConversationId) {
        setCurrentConversationId(res.conversation_id);
        loadConversations();
      }

      const fullContent = res.response || res.message || 'I have analyzed your financial records.';
      let charIdx = 0;
      const streamInterval = setInterval(() => {
        charIdx += Math.min(12, fullContent.length - charIdx);
        const chunk = fullContent.slice(0, charIdx);

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: chunk,
                  toolsUsed: res.tools_used,
                  toolActivity: res.tool_activity,
                  metrics: res.metrics,
                  charts: res.charts,
                  insights: res.insights,
                  recommendations: res.recommendations,
                  actions: res.actions,
                  isStreaming: charIdx < fullContent.length,
                }
              : m
          )
        );

        if (charIdx >= fullContent.length) {
          clearInterval(streamInterval);
          setIsStreaming(false);
        }
      }, 25);
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ Error: ${err?.message || 'Unable to communicate with Financial Intelligence agent.'}`,
                isStreaming: false,
              }
            : m
        )
      );
      setIsStreaming(false);
    }
  }, [inputMessage, isStreaming, currentConversationId, loadConversations]);

  // Voice recognition
  const toggleVoiceInput = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';

    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
  }, [isListening]);

  // Text-to-speech
  const speakMessage = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const clean = text.replace(/[*#_`]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  }, [isSpeaking]);

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
    setIsLoadingHistory(true);
    try {
      const hist: any = await api.getAIHistory();
      const msgs = (hist?.messages || hist || []).map((m: any) => ({
        id: m.id || `msg_${Date.now()}`,
        sender: m.role === 'user' || m.is_user ? 'user' : 'assistant',
        content: m.content || m.message || '',
        timestamp: m.timestamp || new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metrics: m.metrics,
        charts: m.charts,
        insights: m.insights,
        recommendations: m.recommendations,
        actions: m.actions,
      }));
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.deleteAIConversation(id);
      if (currentConversationId === id) {
        startNewConversation();
      }
      loadConversations();
    } catch {}
  }, [currentConversationId, startNewConversation, loadConversations]);

  return {
    state: {
      conversations,
      currentConversationId,
      messages,
      inputMessage,
      isStreaming,
      isLoadingHistory,
      isListening,
      isSpeaking,
      searchQuery,
    },
    actions: {
      setInputMessage,
      setSearchQuery,
      sendMessage,
      startNewConversation,
      selectConversation,
      deleteConversation,
      toggleVoiceInput,
      speakMessage,
      refreshConversations: loadConversations,
    },
  };
}
