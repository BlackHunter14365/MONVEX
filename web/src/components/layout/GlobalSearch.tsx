'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Compass,
  Receipt,
  Wallet,
  PieChart,
  Target,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SearchResultGroup } from '@/lib/api/types';
import { cn, formatCurrency } from '@/lib/utils';

export interface FlatSearchResultItem {
  id: string;
  category: 'navigation' | 'transactions' | 'accounts' | 'budgets' | 'goals' | 'conversations';
  type: string;
  title: string;
  subtitle: string;
  amount?: number;
  badge?: string;
  destination: string;
  date?: string;
}

export const GlobalSearch: React.FC = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResults, setRawResults] = useState<SearchResultGroup | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Global Ctrl+K / Cmd+K shortcut listener to focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setRawResults(null);
      setIsLoading(false);
      setError(null);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await api.search(trimmed, 6);
        if (response && response.results) {
          setRawResults(response.results);
          setSelectedIndex(-1);
        } else {
          setRawResults(null);
        }
      } catch (err: any) {
        // Fallback for offline or unauthorized
        setError(err.message || 'Failed to search records');
        setRawResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatItems = useMemo<FlatSearchResultItem[]>(() => {
    if (!rawResults) return [];
    const items: FlatSearchResultItem[] = [];

    if (rawResults.navigation?.length) {
      rawResults.navigation.forEach((item) =>
        items.push({ ...item, category: 'navigation' })
      );
    }
    if (rawResults.transactions?.length) {
      rawResults.transactions.forEach((item) =>
        items.push({ ...item, category: 'transactions' })
      );
    }
    if (rawResults.accounts?.length) {
      rawResults.accounts.forEach((item) =>
        items.push({ ...item, category: 'accounts' })
      );
    }
    if (rawResults.budgets?.length) {
      rawResults.budgets.forEach((item) =>
        items.push({ ...item, category: 'budgets' })
      );
    }
    if (rawResults.goals?.length) {
      rawResults.goals.forEach((item) =>
        items.push({ ...item, category: 'goals' })
      );
    }
    if (rawResults.conversations?.length) {
      rawResults.conversations.forEach((item) =>
        items.push({ ...item, category: 'conversations' })
      );
    }

    return items;
  }, [rawResults]);

  const handleSelect = useCallback(
    (item: FlatSearchResultItem) => {
      if (item.destination) {
        router.push(item.destination);
      }
      setIsOpen(false);
      setQuery('');
      inputRef.current?.blur();
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (flatItems.length === 0) return;
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        handleSelect(flatItems[selectedIndex]);
      } else if (query.trim()) {
        // Open universal command center if available
        window.dispatchEvent(new Event('monvex:open-command-center'));
        setIsOpen(false);
      }
    }
  };

  const getItemIcon = (category: FlatSearchResultItem['category']) => {
    switch (category) {
      case 'navigation':
        return <Compass className="h-4 w-4 text-[#6865E8]" />;
      case 'transactions':
        return <Receipt className="h-4 w-4 text-[#218358]" />;
      case 'accounts':
        return <Wallet className="h-4 w-4 text-[#3B82F6]" />;
      case 'budgets':
        return <PieChart className="h-4 w-4 text-[#E8A54B]" />;
      case 'goals':
        return <Target className="h-4 w-4 text-[#EC4899]" />;
      case 'conversations':
        return <Sparkles className="h-4 w-4 text-[#A855F7]" />;
      default:
        return <Compass className="h-4 w-4 text-[#77798A]" />;
    }
  };

  const getCategoryLabel = (category: FlatSearchResultItem['category']) => {
    switch (category) {
      case 'navigation':
        return 'Pages & Features';
      case 'transactions':
        return 'Transactions Ledger';
      case 'accounts':
        return 'Accounts & Balances';
      case 'budgets':
        return 'Budgets & Limits';
      case 'goals':
        return 'Savings Goals';
      case 'conversations':
        return 'AI Copilot Sessions';
      default:
        return 'Results';
    }
  };

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: { label: string; items: FlatSearchResultItem[] } } = {};
    flatItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = {
          label: getCategoryLabel(item.category),
          items: [],
        };
      }
      groups[item.category].items.push(item);
    });
    return Object.values(groups);
  }, [flatItems]);

  return (
    <div ref={containerRef} className="relative hidden md:block w-64 lg:w-80">
      {/* Input container */}
      <div className="relative">
        <label htmlFor="global-search-input" className="sr-only">
          Search Monvex
        </label>
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77798A] dark:text-[#A6A4B8] pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="global-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search records, pages... (⌘K)"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="global-search-dropdown"
          className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white dark:bg-[#161522] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA] placeholder:text-[#77798A] dark:placeholder:text-[#A6A4B8] focus:border-[#6865E8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/20 transition-all shadow-xs"
        />

        {/* Clear or loading indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 text-[#6865E8] animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-md text-[#77798A] hover:text-[#20212B] dark:text-[#A6A4B8] dark:hover:text-[#F4F3FA] cursor-pointer"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#9DA0B3] dark:text-[#77798A] bg-[#FAF9FC] dark:bg-[#1B1A2A] rounded border border-[#E7E6F0] dark:border-[#2D2B3F] pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Menu */}
      {isOpen && query.trim().length > 0 && (
        <div
          id="global-search-dropdown"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white/95 dark:bg-[#161522]/95 backdrop-blur-xl border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-2xl overflow-hidden max-h-[440px] flex flex-col animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Scrollable list */}
          <div ref={resultsListRef} className="overflow-y-auto divide-y divide-[#E7E6F0]/60 dark:divide-[#2D2B3F]/60">
            {isLoading && !rawResults ? (
              <div className="p-6 flex flex-col items-center justify-center gap-2 text-xs text-[#77798A] dark:text-[#A6A4B8]">
                <Loader2 className="h-5 w-5 text-[#6865E8] animate-spin" />
                <span>Searching ledger records & intelligence...</span>
              </div>
            ) : error ? (
              <div className="p-4 flex items-center gap-2.5 text-xs text-[#E76D7A] bg-[#FDEEF0]/50 dark:bg-[#E76D7A]/10">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : flatItems.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs font-bold text-[#20212B] dark:text-[#F4F3FA]">
                  No matches found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-[#77798A] dark:text-[#A6A4B8] max-w-xs mx-auto">
                  Search by transaction merchant, category, budget limit, or page name.
                </p>
              </div>
            ) : (
              groupedItems.map((group) => (
                <div key={group.label} className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-[#9DA0B3] dark:text-[#77798A]">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const itemGlobalIndex = flatItems.findIndex((fi) => fi.id === item.id);
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={cn(
                          'flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-[#EEEDF8] dark:bg-[#6865E8]/20 text-[#20212B] dark:text-[#F4F3FA]'
                            : 'hover:bg-[#FAF9FC] dark:hover:bg-[#1B1A2A] text-[#20212B] dark:text-[#F4F3FA]'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={cn(
                              'p-1.5 rounded-xl shrink-0',
                              isSelected
                                ? 'bg-[#6865E8] text-white'
                                : 'bg-[#FAF9FC] dark:bg-[#111019] text-[#77798A] dark:text-[#A6A4B8]'
                            )}
                          >
                            {getItemIcon(item.category)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block truncate leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-[#77798A] dark:text-[#A6A4B8] block truncate leading-tight">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.amount !== undefined && item.amount !== null && (
                            <span className="text-xs font-black text-[#20212B] dark:text-[#F4F3FA]">
                              {formatCurrency(item.amount)}
                            </span>
                          )}
                          {item.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EEEDF8] dark:bg-[#6865E8]/20 text-[#6865E8] dark:text-[#908EF2]">
                              {item.badge}
                            </span>
                          )}
                          {isSelected && (
                            <CornerDownLeft className="h-3 w-3 text-[#6865E8]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer keyboard guide */}
          {flatItems.length > 0 && (
            <div className="px-3.5 py-2 bg-[#FAF9FC] dark:bg-[#111019] border-t border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center justify-between text-[10px] text-[#9DA0B3] dark:text-[#77798A]">
              <span className="flex items-center gap-1.5">
                <span>Navigate</span>
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] font-mono">
                  ↑↓
                </kbd>
                <span>Select</span>
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] font-mono">
                  ↵
                </kbd>
              </span>
              <span>{flatItems.length} match{flatItems.length === 1 ? '' : 'es'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
