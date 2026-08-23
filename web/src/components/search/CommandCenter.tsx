'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  ArrowRight,
  Plus,
  Compass,
  Wallet,
  Receipt,
  PieChart,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  Settings,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  CornerDownLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  amount?: number;
  badge?: string;
  destination?: string;
  actionId?: string;
  date?: string;
}

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTransaction?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  isOpen,
  onClose,
  onOpenAddTransaction,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    navigation: SearchResultItem[];
    transactions: SearchResultItem[];
    accounts: SearchResultItem[];
    budgets: SearchResultItem[];
    goals: SearchResultItem[];
    conversations: SearchResultItem[];
  }>({
    navigation: [],
    transactions: [],
    accounts: [],
    budgets: [],
    goals: [],
    conversations: [],
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Pre-defined quick actions
  const quickActions: SearchResultItem[] = [
    {
      id: 'act-add-tx',
      type: 'action',
      title: 'Add New Transaction',
      subtitle: 'Record an income or expense into the ledger',
      badge: 'ACTION',
      actionId: 'open-add-transaction',
    },
    {
      id: 'act-ai-chat',
      type: 'action',
      title: 'Ask MONVEX Financial AI',
      subtitle: 'Query spending habits, affordability & forecasts',
      badge: 'AI COPILOT',
      destination: '/ai',
    },
    {
      id: 'act-receipts',
      type: 'action',
      title: 'Scan Receipt OCR',
      subtitle: 'Upload bill image and extract line items',
      badge: 'VISION',
      destination: '/receipts',
    },
    {
      id: 'act-simulator',
      type: 'action',
      title: 'Simulate What-If Scenario',
      subtitle: 'Test 12% CAGR compounding and discretionary cuts',
      badge: 'SIMULATION',
      destination: '/simulator',
    },
  ];

  // Flatten currently visible items for keyboard navigation index calculation
  const getFlattenedItems = useCallback((): SearchResultItem[] => {
    const list: SearchResultItem[] = [];
    
    // When query is empty, show Quick Actions at the top
    if (!query.trim()) {
      list.push(...quickActions);
    }

    if (results.navigation.length > 0) list.push(...results.navigation);
    if (results.transactions.length > 0) list.push(...results.transactions);
    if (results.accounts.length > 0) list.push(...results.accounts);
    if (results.budgets.length > 0) list.push(...results.budgets);
    if (results.goals.length > 0) list.push(...results.goals);
    if (results.conversations.length > 0) list.push(...results.conversations);

    return list;
  }, [query, results]);

  const flattenedItems = getFlattenedItems();

  // Fetch search results from backend API
  const performSearch = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.search(q, 5);
      if (res && res.results) {
        setResults({
          navigation: res.results.navigation || [],
          transactions: res.results.transactions || [],
          accounts: res.results.accounts || [],
          budgets: res.results.budgets || [],
          goals: res.results.goals || [],
          conversations: res.results.conversations || [],
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to complete search.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen, performSearch]);

  // Reset state when opening / closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      performSearch('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, performSearch]);

  // Keep selected index in bound
  useEffect(() => {
    if (selectedIndex >= flattenedItems.length) {
      setSelectedIndex(Math.max(0, flattenedItems.length - 1));
    }
  }, [flattenedItems.length, selectedIndex]);

  // Execute selected item action
  const executeItem = useCallback(
    (item: SearchResultItem) => {
      onClose();

      if (item.actionId === 'open-add-transaction') {
        if (onOpenAddTransaction) {
          onOpenAddTransaction();
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('monvex:open-add-transaction'));
        }
        return;
      }

      if (item.destination) {
        router.push(item.destination);
      }
    },
    [onClose, onOpenAddTransaction, router]
  );

  // Global & Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < flattenedItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flattenedItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flattenedItems[selectedIndex];
        if (item) {
          executeItem(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, flattenedItems, selectedIndex, executeItem]);

  if (!isOpen) return null;

  const getItemIcon = (type: string, badge?: string) => {
    switch (type) {
      case 'action':
        return <Plus className="h-4 w-4 text-[#172033]" />;
      case 'navigation':
        return <Compass className="h-4 w-4 text-[#2563EB]" />;
      case 'transaction':
        return <Receipt className="h-4 w-4 text-[#059669]" />;
      case 'account':
        return <Wallet className="h-4 w-4 text-[#D97706]" />;
      case 'budget':
        return <PieChart className="h-4 w-4 text-[#7C3AED]" />;
      case 'goal':
        return <Target className="h-4 w-4 text-[#E11D48]" />;
      case 'conversation':
        return <Sparkles className="h-4 w-4 text-[#2563EB]" />;
      default:
        return <ArrowRight className="h-4 w-4 text-[#858D9A]" />;
    }
  };

  let globalRunningIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-[#172033]/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#E4E2DC] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Universal Command Center"
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E4E2DC] bg-[#FAF9F6] gap-3">
          <Search className="h-5 w-5 text-[#858D9A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, accounts, budgets, goals, AI chats, commands..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#172033] placeholder-[#858D9A] focus:outline-hidden"
          />
          {isLoading && <Loader2 className="h-4 w-4 text-[#2563EB] animate-spin shrink-0" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#858D9A] hover:text-[#172033] hover:bg-[#E4E2DC]/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#F0EFEA] border border-[#E4E2DC] text-[11px] font-mono font-bold text-[#5F6878]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4 divide-y divide-[#F0EFEA]"
        >
          {error && (
            <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-center my-2">
              <AlertCircle className="h-5 w-5 text-[#E11D48] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#E11D48]">{error}</p>
              <button
                onClick={() => performSearch(query)}
                className="mt-2 text-[11px] font-bold text-[#172033] underline"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* 1. Quick Actions (Shown when query is empty) */}
          {!query.trim() && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 pt-1 block">
                Quick Actions
              </span>
              {quickActions.map((act) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={act.id}
                    onClick={() => executeItem(act)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all text-xs group',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC] text-[#172033]'
                        )}
                      >
                        {getItemIcon(act.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{act.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {act.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-white/80 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Navigation Results */}
          {results.navigation.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 block">
                Navigation & Views
              </span>
              {results.navigation.map((nav) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={nav.id}
                    onClick={() => executeItem(nav)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC]'
                        )}
                      >
                        {getItemIcon(nav.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{nav.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {nav.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Transactions Results */}
          {results.transactions.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 block">
                Transactions Ledger
              </span>
              {results.transactions.map((tx) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={tx.id}
                    onClick={() => executeItem(tx)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC]'
                        )}
                      >
                        {getItemIcon(tx.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{tx.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {tx.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div
                        className={cn(
                          'font-mono font-bold tabular-nums',
                          isSelected
                            ? 'text-white'
                            : tx.badge === 'INCOME'
                            ? 'text-[#059669]'
                            : 'text-[#172033]'
                        )}
                      >
                        {tx.badge === 'INCOME' ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 4. Accounts & Assets Results */}
          {results.accounts.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 block">
                Accounts & Assets
              </span>
              {results.accounts.map((acc) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={acc.id}
                    onClick={() => executeItem(acc)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC]'
                        )}
                      >
                        {getItemIcon(acc.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{acc.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {acc.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className={cn('font-mono font-bold tabular-nums', isSelected ? 'text-white' : 'text-[#172033]')}>
                        ₹{acc.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 5. Budgets Results */}
          {results.budgets.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 block">
                Budgets
              </span>
              {results.budgets.map((bg) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={bg.id}
                    onClick={() => executeItem(bg)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC]'
                        )}
                      >
                        {getItemIcon(bg.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{bg.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {bg.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 6. Savings Goals Results */}
          {results.goals.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 block">
                Savings Goals
              </span>
              {results.goals.map((g) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={g.id}
                    onClick={() => executeItem(g)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC]'
                        )}
                      >
                        {getItemIcon(g.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{g.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {g.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 7. AI Conversation Sessions */}
          {results.conversations.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#858D9A] px-3 block">
                AI Intelligence Sessions
              </span>
              {results.conversations.map((c) => {
                const currentIndex = globalRunningIndex++;
                const isSelected = selectedIndex === currentIndex;
                return (
                  <button
                    key={c.id}
                    onClick={() => executeItem(c)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs',
                      isSelected
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'hover:bg-[#FAF9F6] text-[#172033]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                          isSelected
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#F6F5F1] border-[#E4E2DC]'
                        )}
                      >
                        {getItemIcon(c.type)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{c.title}</div>
                        <div
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-white/70' : 'text-[#5F6878]'
                          )}
                        >
                          {c.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {query.trim() &&
            !isLoading &&
            flattenedItems.length === 0 &&
            !error && (
              <div className="py-12 px-4 text-center">
                <Search className="h-8 w-8 text-[#858D9A] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-[#172033]">
                  No matching results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-[#5F6878] mt-1">
                  Try searching for merchant names, categories, banks, budgets, or navigation terms.
                </p>
              </div>
            )}
        </div>

        {/* Command Center Keyboard Footer */}
        <div className="px-4 py-2.5 border-t border-[#E4E2DC] bg-[#FAF9F6] flex items-center justify-between text-[11px] text-[#5F6878] font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-sm bg-[#FFFFFF] border border-[#E4E2DC] font-mono text-[10px] font-bold text-[#172033]">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-sm bg-[#FFFFFF] border border-[#E4E2DC] font-mono text-[10px] font-bold text-[#172033]">
                ↵
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-sm bg-[#FFFFFF] border border-[#E4E2DC] font-mono text-[10px] font-bold text-[#172033]">
                ESC
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#858D9A]">
            <Command className="h-3 w-3" />
            <span>MONVEX COMMAND CENTER</span>
          </div>
        </div>
      </div>
    </div>
  );
};
