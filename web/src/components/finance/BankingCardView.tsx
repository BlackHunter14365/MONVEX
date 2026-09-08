'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Lock, RotateCw, ShieldCheck } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export type CardTheme = 'obsidian' | 'sapphire' | 'emerald' | 'amber' | 'gold' | 'platinum';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX';

export interface BankingCardViewProps {
  bankName: string;
  cardholderName?: string;
  accountName?: string;
  cardNumber?: string;
  rawCardNumber?: string;
  expiryDate?: string;
  balance: number;
  currency?: string;
  theme?: CardTheme;
  network?: CardNetwork;
  isFrozen?: boolean;
  isCredit?: boolean;
  className?: string;
  showControls?: boolean;
  isSelected?: boolean;
  isFlipped?: boolean;
  showNumber?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  onSelect?: () => void;
}

export function detectCardNetwork(cardNumber: string): CardNetwork {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD';
  if (/^(34|37)/.test(clean)) return 'AMEX';
  if (/^(60|65|81|82|508)/.test(clean)) return 'RUPAY';
  return 'VISA';
}

export function formatCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '').slice(0, 16);
  const parts = clean.match(/.{1,4}/g);
  return parts ? parts.join(' ') : clean;
}

export function formatExpiryDate(val: string): string {
  const clean = val.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}

export const BankingCardView: React.FC<BankingCardViewProps> = ({
  bankName,
  cardholderName = 'CARDHOLDER',
  accountName,
  cardNumber = '•••• •••• •••• 8821',
  rawCardNumber,
  expiryDate = '12/28',
  balance,
  currency = 'INR',
  theme = 'obsidian',
  network = 'VISA',
  isFrozen = false,
  isCredit = false,
  className = '',
  showControls = true,
  isSelected = false,
  isFlipped: controlledFlipped,
  showNumber,
  onFlipChange,
  onSelect,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const toggleFlipped = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !isFlipped;
    if (onFlipChange) onFlipChange(next);
    else setInternalFlipped(next);
  };

  const [internalNumberRevealed, setInternalNumberRevealed] = useState(false);
  const isNumberRevealed = showNumber !== undefined ? (showNumber || internalNumberRevealed) : internalNumberRevealed;
  const [isCopied, setIsCopied] = useState(false);

  // Derive display card number
  const full16 = rawCardNumber ? formatCardNumber(rawCardNumber) : cardNumber;
  const last4 = full16.replace(/\D/g, '').slice(-4) || '1639';
  const displayedNumber = isNumberRevealed
    ? (rawCardNumber ? formatCardNumber(rawCardNumber) : (full16.includes('•') ? full16 : formatCardNumber(full16)))
    : `•••• •••• •••• ${last4}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = rawCardNumber ? rawCardNumber.replace(/\D/g, '') : `•••• •••• •••• ${last4}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
  };

  const getThemeClasses = (th: CardTheme) => {
    switch (th) {
      case 'sapphire':
        return 'bg-gradient-to-br from-[#1E3A8A] via-[#1E293B] to-[#0F172A] border-[#3B82F6]/40 shadow-blue-950/20';
      case 'emerald':
        return 'bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#022C22] border-[#10B981]/40 shadow-emerald-950/20';
      case 'amber':
        return 'bg-gradient-to-br from-[#78350F] via-[#451A03] to-[#291102] border-[#F59E0B]/40 shadow-amber-950/20';
      case 'gold':
        return 'bg-gradient-to-br from-[#715214] via-[#523A0B] to-[#2D2005] border-[#FBBF24]/50 shadow-yellow-950/20';
      case 'platinum':
        return 'bg-gradient-to-br from-[#334155] via-[#1E293B] to-[#0F172A] border-[#94A3B8]/40 shadow-slate-950/20';
      case 'obsidian':
      default:
        return 'bg-gradient-to-br from-[#2A1F3D] via-[#1D152B] to-[#120E1A] border-[#4A3A68]/50 shadow-purple-950/20';
    }
  };

  return (
    <div
      className={cn('relative w-full select-none perspective-[1000px]', className)}
      style={{ perspective: '1000px' }}
    >
      <div
        className={cn(
          'relative w-full h-[210px] sm:h-[220px] rounded-2xl transition-all duration-500 transform-style-3d cursor-pointer shadow-lg',
          isSelected ? 'ring-2 ring-white/90 shadow-2xl' : 'hover:opacity-95',
          isFlipped ? 'rotate-y-180' : ''
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => {
          if (onSelect) onSelect();
        }}
      >
        {/* =========================================================================
            FRONT FACE OF BANKING CARD
            ========================================================================= */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 border flex flex-col justify-between overflow-hidden backface-hidden',
            getThemeClasses(theme)
          )}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Specular Hologram Reflection & Subtle Circuit Geometry */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 left-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-2xl pointer-events-none" />

          {/* Top Row: Institution Name, Account Nickname, EMV Chip & Contactless */}
          <div className="flex items-start justify-between relative z-10">
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase block truncate">
                {bankName || 'BANK INSTITUTION'}
              </span>
              <span className="text-xs font-bold text-white block tracking-tight truncate mt-0.5">
                {accountName || (isCredit ? 'Credit Line Card' : 'Primary Checking')}
              </span>
            </div>

            {/* Micro Controls: Flip & Freeze */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {isFrozen && (
                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-[8px] font-bold text-rose-300 flex items-center gap-0.5 mr-1">
                  <Lock className="h-2 w-2" /> Frozen
                </span>
              )}

              {showControls && (
                <button
                  type="button"
                  onClick={toggleFlipped}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-[10px] font-mono transition-colors"
                  title="Flip to back (Signature & EMV Token)"
                >
                  <RotateCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Flip</span>
                </button>
              )}
            </div>
          </div>

          {/* Middle Row: EMV Chip & Contactless Payment Wave */}
          <div className="flex items-center justify-between relative z-10 my-1">
            <div className="flex items-center gap-3">
              {/* Metallic EMV Smart Chip */}
              <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-100/90 shadow-sm relative overflow-hidden flex items-center justify-center shrink-0">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-800/40" />
                <div className="absolute inset-y-0 left-1/3 w-[1px] bg-amber-800/40" />
                <div className="absolute inset-y-0 right-1/3 w-[1px] bg-amber-800/40" />
                <div className="h-3 w-4 rounded-xs border border-amber-800/40 bg-amber-400/30" />
              </div>

              {/* Contactless Wave Icon */}
              <svg className="h-4 w-4 text-white/70 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
                <path d="M12 19a8.5 8.5 0 0 1 0-14" strokeLinecap="round" />
                <path d="M15.5 21.5a12 12 0 0 1 0-19" strokeLinecap="round" />
              </svg>
            </div>

            {/* Quick Balance Preview */}
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/60 block">
                {isCredit ? 'Balance' : 'Available'}
              </span>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white tabular-nums">
                {formatCurrency(balance, currency)}
              </span>
            </div>
          </div>

          {/* 16-Digit Card Number with Reveal/Mask and Copy */}
          <div className="relative z-10 font-mono tracking-widest text-sm sm:text-base text-white font-bold flex items-center justify-between bg-black/20 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/10">
            <span className="tracking-[0.18em] text-white text-xs sm:text-sm drop-shadow-xs truncate font-mono">
              {displayedNumber}
            </span>

            {showControls && (
              <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setInternalNumberRevealed(!isNumberRevealed)}
                  className="p-1 rounded bg-white/10 hover:bg-white/25 text-white transition-all"
                  title={isNumberRevealed ? 'Mask card number' : 'Reveal card number'}
                >
                  {isNumberRevealed ? <EyeOff className="h-3 w-3 text-amber-300" /> : <Eye className="h-3 w-3 text-white/80" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded bg-white/10 hover:bg-white/25 text-white transition-all"
                  title="Copy card number"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/80" />}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Row: Cardholder Name, Expiry Date & Network Emblem */}
          <div className="flex items-end justify-between relative z-10 pt-1">
            <div className="min-w-0 pr-2">
              <span className="text-[8px] font-mono uppercase tracking-wider text-white/60 block">
                CARDHOLDER
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white truncate block">
                {cardholderName || 'CARDHOLDER'}
              </span>
            </div>

            <div className="text-center px-2">
              <span className="text-[8px] font-mono uppercase tracking-wider text-white/60 block">
                VALID THRU
              </span>
              <span className="text-xs font-mono font-semibold tracking-wider text-white">
                {expiryDate || '12/28'}
              </span>
            </div>

            {/* Network Brand Vector Logo */}
            <div className="text-right shrink-0">
              {network === 'MASTERCARD' ? (
                <div className="flex items-center -space-x-2">
                  <div className="h-6 w-6 rounded-full bg-[#EB001B] opacity-90" />
                  <div className="h-6 w-6 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
              ) : network === 'RUPAY' ? (
                <div className="text-xs font-black italic tracking-tighter text-white font-mono flex items-center gap-0.5 bg-white/15 px-1.5 py-0.5 rounded">
                  <span className="text-orange-400">Ru</span>
                  <span className="text-emerald-400">Pay</span>
                </div>
              ) : network === 'AMEX' ? (
                <div className="text-[10px] font-black tracking-widest text-white border border-white/40 px-1.5 py-0.5 rounded font-mono">
                  AMEX
                </div>
              ) : (
                <span className="text-base sm:text-lg font-black italic tracking-wider text-white font-serif">
                  VISA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BACK FACE OF BANKING CARD (MAGNETIC STRIPE, SIGNATURE, EMV TOKEN BADGE)
            ========================================================================= */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-2xl border flex flex-col justify-between overflow-hidden rotate-y-180 backface-hidden py-4',
            getThemeClasses(theme)
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Black Magnetic Stripe */}
          <div className="w-full h-10 bg-[#0A0A0A] border-y border-black/40 shadow-inner" />

          {/* Signature Panel & Secure EMV Token Strip */}
          <div className="px-5 space-y-1">
            <div className="flex items-center justify-between text-[8px] font-mono text-white/60 tracking-wider">
              <span>AUTHORIZED SIGNATURE</span>
              <span>SECURITY VERIFICATION</span>
            </div>

            <div className="flex items-center gap-2">
              {/* White/Silver Signature Strip with Tamper Hatching */}
              <div className="flex-1 h-9 bg-[#F8F9FA] rounded-md border border-white/30 flex items-center px-3 relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#000_0,#000_2px,transparent_0,transparent_6px)]" />
                <span className="text-[11px] font-serif italic text-slate-800 tracking-wider relative z-10">
                  {cardholderName || 'Authorized Signature'}
                </span>
              </div>

              {/* Secure EMV Token Box */}
              <div
                className="h-9 px-2.5 rounded-md bg-white/10 border border-white/30 flex items-center gap-1.5 shadow-xs shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[9px] font-bold text-white tracking-wider">
                  EMV TOKEN
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Compliance & Micro-Print */}
          <div className="px-5 flex items-end justify-between pt-1 text-[8px] text-white/50 leading-tight">
            <p className="max-w-[240px]">
              This card is property of {bankName || 'Issuing Financial Institution'}. Misuse is a criminal offense. Protected by MONVEX Ledger Core.
            </p>

            <button
              type="button"
              onClick={toggleFlipped}
              className="inline-flex items-center gap-1 text-[9px] font-mono text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition-colors"
            >
              <RotateCw className="h-2.5 w-2.5" />
              <span>Front</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
