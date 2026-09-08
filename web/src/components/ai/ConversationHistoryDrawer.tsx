'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Clock,
  Trash2,
  Pin,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DesktopChatSessionHistory } from '@/types/ai';
import { AIIdentityIcon } from './AIIdentityIcon';
import { cn } from '@/lib/utils';

interface ConversationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: DesktopChatSessionHistory[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onNewChat: () => void;
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  chatHistory,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredHistory = chatHistory.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todaySessions = filteredHistory.filter((c) => c.dateGroup === 'Today');
  const yesterdaySessions = filteredHistory.filter((c) => c.dateGroup === 'Yesterday');
  const olderSessions = filteredHistory.filter((c) => c.dateGroup === 'Previous 7 Days');

  const renderSessionGroup = (groupTitle: string, sessions: DesktopChatSessionHistory[]) => {
    if (sessions.length === 0) return null;

    return (
      <div className="space-y-1.5 pt-2">
        <span className="font-mono text-[10px] font-bold text-[#898390] uppercase tracking-wider block px-2">
          {groupTitle}
        </span>
        <div className="space-y-1">
          {sessions.map((session) => {
            const isActive = session.id === currentConversationId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectConversation(session.id);
                  onClose();
                }}
                className={cn(
                  'group flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none',
                  isActive
                    ? 'bg-[#EEEAF7] text-[#191522] border-[#625477]/30 shadow-2xs'
                    : 'bg-white hover:bg-[#FAF9FD] text-[#625D69] hover:text-[#191522] border-[#E4E2DC]'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      isActive ? 'bg-[#2A1F3D]' : 'bg-[#C9C4D4]'
                    )}
                  />
                  <span className="truncate">{session.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => onDeleteConversation(e, session.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-sm bg-[#FBFBFA] border-l border-[#E4E2DC] shadow-2xl h-full flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250">
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#ECE9E0] pb-3">
            <div className="flex items-center gap-2.5">
              <AIIdentityIcon size={18} />
              <div>
                <h3 className="font-bold text-sm text-[#191522] leading-tight">
                  Intelligence History
                </h3>
                <span className="font-mono text-[10px] text-[#898390]">
                  Session Archive & Telemetry Logs
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#898390] hover:text-[#191522] hover:bg-[#EEEAF7] transition-colors"
              aria-label="Close history drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* New Conversation Button */}
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#2A1F3D] hover:bg-[#3B2D54] text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Start Fresh Session</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#898390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous inquiries..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E2DFD7] text-xs text-[#191522] placeholder:text-[#898390] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Session Timeline Feed */}
          {chatHistory.length === 0 ? (
            <div className="p-6 text-center space-y-2 border border-dashed border-[#D8D2E7] rounded-2xl bg-white/50">
              <Clock className="h-6 w-6 text-[#898390] mx-auto" />
              <span className="text-xs font-bold text-[#191522] block">No Previous Sessions</span>
              <p className="text-[11px] text-[#625D69]">
                Inquiries will automatically be archived in this timeline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {renderSessionGroup('Today', todaySessions)}
              {renderSessionGroup('Yesterday', yesterdaySessions)}
              {renderSessionGroup('Previous 7 Days', olderSessions)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#ECE9E0] bg-white text-[10.5px] text-[#898390] flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Private Tenant Storage</span>
          </span>
          <span>{chatHistory.length} Sessions</span>
        </div>
      </div>
    </div>
  );
};
