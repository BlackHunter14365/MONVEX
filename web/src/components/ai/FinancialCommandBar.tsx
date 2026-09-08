'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff, Terminal, X, CornerDownLeft, Sparkles } from 'lucide-react';
import { AIIdentityIcon } from './AIIdentityIcon';
import { AIQuickActions } from './AIQuickActions';
import { cn } from '@/lib/utils';

interface FinancialCommandBarProps {
  inputQuery: string;
  setInputQuery: (val: string) => void;
  onSend: (text?: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  toggleVoiceRecording: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  compact?: boolean;
  className?: string;
}

export const FinancialCommandBar: React.FC<FinancialCommandBarProps> = ({
  inputQuery,
  setInputQuery,
  onSend,
  isLoading,
  isRecording,
  toggleVoiceRecording,
  textareaRef,
  compact = false,
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputQuery.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const handleClear = () => {
    setInputQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  return (
    <div className={cn('w-full space-y-2 select-none', className)}>
      {/* Quick Financial Action Chips Tray */}
      <div className="px-1">
        <AIQuickActions
          onSelectAction={(prompt) => onSend(prompt)}
          disabled={isLoading}
          compact={compact}
        />
      </div>

      {/* Main Command Console Bezel */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#D8D2E7] bg-white p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15">
        <div className="flex items-start gap-2 sm:gap-2.5">
          {/* Terminal Command Prompt Indicator */}
          <div className="pt-2 pl-1.5 shrink-0 hidden sm:flex items-center gap-1 text-[#898390]">
            <Terminal className="h-4 w-4 text-[#2563EB]" />
          </div>

          {/* Dynamic Auto-resizing Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your financial command...'
                : 'Command financial copilot (e.g. "Can I afford ₹45,000 for a trip next month?", "Analyze my spending outliers")...'
            }
            disabled={isLoading}
            className="w-full resize-none bg-transparent py-2 px-1 text-xs sm:text-sm font-medium text-[#191522] placeholder:text-[#898390] focus:outline-none disabled:opacity-60 max-h-36 leading-relaxed"
          />

          {/* Clear button if text typed */}
          {inputQuery.trim() && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-[#898390] hover:text-[#191522] hover:bg-[#F3F1F8] transition-colors shrink-0 mt-1.5"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Voice Input Trigger */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={cn(
              'p-2 rounded-xl border transition-all shrink-0 mt-0.5 cursor-pointer',
              isRecording
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-white hover:bg-[#F6F5F1] text-[#625D69] border-[#E4E2DC] hover:text-[#191522]'
            )}
            title={isRecording ? 'Stop voice recording' : 'Voice command (Speech Recognition)'}
            aria-label="Voice input"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Primary Execute Button */}
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!inputQuery.trim() || isLoading}
            className={cn(
              'inline-flex items-center justify-center p-2 rounded-xl font-bold transition-all shrink-0 mt-0.5 shadow-xs cursor-pointer',
              inputQuery.trim() && !isLoading
                ? 'bg-[#2A1F3D] hover:bg-[#3B2D54] text-white hover:scale-105 active:scale-95'
                : 'bg-[#EEEAF7] text-[#898390] cursor-not-allowed opacity-70'
            )}
            aria-label="Execute command"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom Utility & Keyboard Shortcut Hint Bar */}
        <div className="mt-1 pt-1.5 border-t border-[#F1EFEA] flex items-center justify-between px-1 text-[10px] text-[#898390] font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Deterministic Ledger Grounding</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#F1EFEA] border border-[#E4E2DC] text-[9.5px] font-bold text-[#625D69]">
              Enter ↵
            </kbd>
            <span>to execute</span>
          </div>
        </div>
      </div>
    </div>
  );
};
