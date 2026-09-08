'use client';

import React, { useState, useEffect } from 'react';
import { DesktopChatMessage, DesktopChatSessionHistory, AIStarterPrompt } from '@/types/ai';
import { AICopilotHeader } from './AICopilotHeader';
import { AIConversationWorkspace } from './AIConversationWorkspace';
import { FinancialCommandBar } from './FinancialCommandBar';
import { AIContextPanel } from './AIContextPanel';
import { ConversationHistoryDrawer } from './ConversationHistoryDrawer';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  renderFormattedContent,
}) => {
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  // Fetch real balance sheet telemetry for the Contextual Insight Panel
  useEffect(() => {
    api.getAnalyticsSummary().then(setSummary).catch(() => null);
  }, [messages.length]);

  // Keyboard shortcut Ctrl+H to toggle History Archive
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
  const currentIntent = latestAssistantMsg?.intent;

  return (
    <div className="hidden lg:block p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
      <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-[22px] overflow-hidden border border-[#ECE9E0] shadow-inner bg-[#FBFBFA]">
        {/* 1. INTELLIGENCE COMMAND HEADER */}
        <AICopilotHeader
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          isModelDropdownOpen={isModelDropdownOpen}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          historyCount={chatHistory.length}
          onNewChat={handleNewChat}
          isContextPanelOpen={isContextPanelOpen}
          setIsContextPanelOpen={setIsContextPanelOpen}
        />

        {/* 2. MAIN WORKSPACE BODY: CONVERSATION FEED + CONTEXTUAL PANEL */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Intelligence Feed & Command Bar Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9FD]/50">
            {/* Conversation Feed */}
            <AIConversationWorkspace
              messages={messages}
              isLoading={isLoading}
              userAvatar={userAvatar}
              userPreset={userPreset}
              displayName={displayName}
              copiedId={copiedId}
              onCopy={handleCopy}
              speakingId={speakingId}
              onReadAloud={handleReadAloud}
              likedMap={likedMap}
              onFeedback={handleFeedback}
              onExecutePrompt={(prompt) => handleSend(prompt)}
              renderFormattedContent={renderFormattedContent}
              messagesEndRef={messagesEndRef}
            />

            {/* Financial Command Terminal Bar */}
            <div className="p-3 sm:p-4 bg-white/95 border-t border-[#E4E2DC] shrink-0">
              <div className="max-w-4xl mx-auto w-full">
                <FinancialCommandBar
                  inputQuery={inputQuery}
                  setInputQuery={setInputQuery}
                  onSend={handleSend}
                  isLoading={isLoading}
                  isRecording={isRecording}
                  toggleVoiceRecording={toggleVoiceRecording}
                  textareaRef={textareaRef}
                />
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC CONTEXTUAL FINANCIAL INSIGHT PANEL */}
          {isContextPanelOpen && (
            <AIContextPanel
              summary={summary}
              currentIntent={currentIntent}
              onSelectPrompt={(prompt) => handleSend(prompt)}
            />
          )}
        </div>

        {/* 4. SLIDE-OVER CONVERSATION HISTORY DRAWER */}
        <ConversationHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          chatHistory={chatHistory}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
};
