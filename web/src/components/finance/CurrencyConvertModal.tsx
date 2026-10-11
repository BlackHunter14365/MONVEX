'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ArrowRightLeft,
  RefreshCw,
  Info,
  Clock,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export interface CurrencyConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'USD', name: 'United States Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦' },
];

export const CurrencyConvertModal: React.FC<CurrencyConvertModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [ratesData, setRatesData] = useState<{
    rates: Record<string, number>;
    provider: string;
    lastUpdatedUtc: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch exchange rate data from reliable open API
  const fetchRates = useCallback(async (base: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch exchange rates (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.result !== 'success' || !data.rates) {
        throw new Error(data['error-type'] || 'Unable to load real-time foreign exchange data');
      }
      setRatesData({
        rates: data.rates,
        provider: data.provider || 'ExchangeRate-API',
        lastUpdatedUtc: data.time_last_update_utc || new Date().toUTCString(),
      });
    } catch (err: any) {
      setError(err.message || 'Network error fetching exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRates(fromCurrency);
    }
  }, [isOpen, fromCurrency, fetchRates]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const currentRate = ratesData?.rates?.[toCurrency] ?? null;
  const inverseRate = currentRate && currentRate > 0 ? 1 / currentRate : null;
  const convertedAmount = currentRate !== null && isValidAmount ? parsedAmount * currentRate : null;

  const fromCurrObj = SUPPORTED_CURRENCIES.find((c) => c.code === fromCurrency) || {
    code: fromCurrency,
    name: fromCurrency,
    symbol: fromCurrency,
    flag: '🌐',
  };
  const toCurrObj = SUPPORTED_CURRENCIES.find((c) => c.code === toCurrency) || {
    code: toCurrency,
    name: toCurrency,
    symbol: toCurrency,
    flag: '🌐',
  };

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    const prevTo = toCurrency;
    setFromCurrency(prevTo);
    setToCurrency(prevFrom);
  };

  const handleCopyResult = () => {
    if (convertedAmount !== null) {
      navigator.clipboard.writeText(
        `${parsedAmount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency} (Rate: 1 ${fromCurrency} = ${currentRate?.toFixed(4)} ${toCurrency})`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F0E17]/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#161522] border border-[#E7E6F0] dark:border-[#2D2B3F] p-6 sm:p-7 shadow-2xl transition-all z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#EEEDF8] dark:bg-[#6865E8]/20 text-[#6865E8]">
                <ArrowRightLeft className="h-4 w-4" />
              </span>
              <h2
                id="convert-modal-title"
                className="text-lg sm:text-xl font-extrabold text-[#20212B] dark:text-[#F4F3FA] tracking-tight"
              >
                Currency Converter
              </h2>
            </div>
            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] pl-8">
              Live foreign exchange estimates and valuation calculator
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#77798A] hover:text-[#20212B] dark:text-[#A6A4B8] dark:hover:text-[#F4F3FA] hover:bg-[#FAF9FC] dark:hover:bg-[#1F1E2E] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#20212B] dark:text-[#F4F3FA] block">
            Amount to Convert
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#77798A] dark:text-[#A6A4B8]">
              {fromCurrObj.symbol}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#111019] border border-[#E7E6F0] dark:border-[#2D2B3F] text-base font-extrabold text-[#20212B] dark:text-[#F4F3FA] focus:border-[#6865E8] focus:ring-2 focus:ring-[#6865E8]/20 focus:outline-none transition-all"
            />
          </div>

          {/* Quick Amount Chips */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {['100', '500', '1000', '5000', '10000'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer shrink-0',
                  amount === preset
                    ? 'bg-[#6865E8] text-white border-[#6865E8]'
                    : 'bg-white dark:bg-[#1B1A2A] text-[#77798A] dark:text-[#A6A4B8] border-[#E7E6F0] dark:border-[#2D2B3F] hover:border-[#6865E8]/40'
                )}
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selectors & Swap Button */}
        <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
          {/* Source Currency */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold text-[#77798A] dark:text-[#A6A4B8] uppercase tracking-wider block">
              From
            </label>
            <div className="relative">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#111019] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-bold text-[#20212B] dark:text-[#F4F3FA] focus:border-[#6865E8] focus:outline-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-white dark:bg-[#161522]">
                    {curr.flag} {curr.code} — {curr.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#77798A]">
                ▼
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="sm:col-span-1 flex justify-center pt-5 sm:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap source and target currencies"
              className="p-2.5 rounded-2xl bg-[#EEEDF8] dark:bg-[#1E1C30] text-[#6865E8] border border-[#6865E8]/20 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Destination Currency */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold text-[#77798A] dark:text-[#A6A4B8] uppercase tracking-wider block">
              To
            </label>
            <div className="relative">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#111019] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-bold text-[#20212B] dark:text-[#F4F3FA] focus:border-[#6865E8] focus:outline-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-white dark:bg-[#161522]">
                    {curr.flag} {curr.code} — {curr.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#77798A]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Result Box */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#F6F5FD] to-[#ECEBFF] dark:from-[#1A1830] dark:to-[#161426] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <span className="font-semibold">Converted Valuation</span>
            {ratesData && (
              <button
                type="button"
                onClick={() => fetchRates(fromCurrency)}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] font-bold text-[#6865E8] hover:underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
                <span>Refresh Rate</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-4 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-[#6865E8]">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Fetching live foreign exchange rate...</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-[#FDEEF0] dark:bg-[#E76D7A]/15 border border-[#F8B4BD] dark:border-[#E76D7A]/30 text-xs text-[#E76D7A] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
                <button
                  onClick={() => fetchRates(fromCurrency)}
                  className="ml-2 font-bold underline hover:no-underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : convertedAmount !== null && currentRate !== null ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-[#20212B] dark:text-[#F4F3FA] tracking-tight">
                  {toCurrObj.symbol}{' '}
                  {convertedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className="text-xs font-bold text-[#6865E8]">
                  {toCurrObj.code}
                </span>
              </div>

              {/* Rate Details */}
              <div className="flex items-center justify-between text-[11px] text-[#77798A] dark:text-[#A6A4B8] pt-1 border-t border-[#E7E6F0]/60 dark:border-[#2D2B3F]/60">
                <span>
                  1 {fromCurrency} ={' '}
                  <strong className="text-[#20212B] dark:text-[#F4F3FA]">
                    {currentRate < 0.01 ? currentRate.toPrecision(4) : currentRate.toFixed(4)} {toCurrency}
                  </strong>
                </span>
                {inverseRate && (
                  <span>
                    1 {toCurrency} ={' '}
                    <strong className="text-[#20212B] dark:text-[#F4F3FA]">
                      {inverseRate < 0.01 ? inverseRate.toPrecision(4) : inverseRate.toFixed(4)} {fromCurrency}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2 text-xs text-[#77798A] dark:text-[#A6A4B8] text-center">
              Enter a valid positive amount above to see live converted valuation.
            </div>
          )}
        </div>

        {/* Source Attribution & Timestamp */}
        {ratesData && (
          <div className="flex items-center justify-between text-[10px] text-[#9DA0B3] dark:text-[#77798A] px-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Source: {ratesData.provider.replace('https://www.', '').replace('https://', '')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {ratesData.lastUpdatedUtc}
            </span>
          </div>
        )}

        {/* Mandatory Financial Disclaimer */}
        <div className="rounded-2xl p-3.5 bg-[#FAF9FC] dark:bg-[#141320] border border-[#E7E6F0] dark:border-[#2D2B3F] flex items-start gap-2.5 text-[11px] text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
          <Info className="h-4 w-4 text-[#6865E8] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-[#20212B] dark:text-[#F4F3FA] block">
              Market Estimation Notice
            </strong>
            This calculator provides foreign exchange market estimates for financial modeling and portfolio planning. It does not execute a live bank transfer or modify account balances.
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleCopyResult}
            disabled={convertedAmount === null}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1B1A2A] text-xs font-bold text-[#20212B] dark:text-[#F4F3FA] border border-[#E7E6F0] dark:border-[#2D2B3F] hover:bg-[#FAF9FC] dark:hover:bg-[#222035] transition-all shadow-xs cursor-pointer disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#218358]" />
                <span className="text-[#218358]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#77798A]" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#6865E8] hover:bg-[#5754D6] text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
