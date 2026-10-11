'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff, Paperclip, Send, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto select-none', className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.csv"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setInputQuery(`${inputQuery} [Attached: ${e.target.files[0].name}] `);
          }
        }}
      />

      {/* Main Input Bezel (Image 2 Nexora Style) */}
      <div className="rounded-3xl border border-[#E7E6F0] bg-white p-3 sm:p-4 shadow-sm focus-within:border-[#6865E8]/40 focus-within:ring-2 focus-within:ring-[#6865E8]/10 transition-all space-y-3">
        {/* Dynamic Auto-resizing Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Ask Finexa about your finances"
            placeholder={
              isRecording
                ? 'Listening to your financial voice command...'
                : 'Ask Finexa about your finances...'
            }
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-2 py-1 text-sm font-medium text-[#20212B] placeholder:text-[#77798A] focus:outline-none disabled:opacity-60 max-h-32 leading-relaxed"
          />

          {inputQuery.trim() && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-1 top-1 p-1 rounded-lg text-[#77798A] hover:text-[#20212B] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Row: Attach (Left) | Voice + Purple Send Button (Right) */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F4F3FA]">
          {/* Attach Button (Image 2) */}
          <button
            type="button"
            onClick={handleAttachClick}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7E6F0] bg-[#FAF9FC] hover:bg-white text-xs font-semibold text-[#77798A] hover:text-[#20212B] transition-all cursor-pointer shadow-2xs"
          >
            <Paperclip className="h-3.5 w-3.5 text-[#77798A]" />
            <span>Attach</span>
          </button>

          {/* Right Cluster: Voice + Send */}
          <div className="flex items-center gap-2">
            {/* Voice Pill Button (Image 2) */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-2xs text-xs font-semibold',
                isRecording
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-[#FAF9FC] hover:bg-white border-[#E7E6F0] text-[#77798A] hover:text-[#20212B]'
              )}
            >
              <Mic className={cn('h-3.5 w-3.5', isRecording ? 'text-white' : 'text-[#6865E8]')} />
              <span>Voice</span>
            </button>

            {/* Purple Circular Send Button (Image 2) */}
            <button
              type="button"
              onClick={() => onSend()}
              disabled={!inputQuery.trim() || isLoading}
              className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm',
                inputQuery.trim() && !isLoading
                  ? 'bg-[#6865E8] hover:bg-[#5754D6] text-white hover:scale-105 active:scale-95 shadow-[#6865E8]/30'
                  : 'bg-[#ECEBFF] text-[#6865E8]/50 cursor-not-allowed'
              )}
              aria-label="Send prompt"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
