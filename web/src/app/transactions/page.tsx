'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  Utensils,
  ShoppingBag,
  Home,
  Car,
  ShoppingBasket,
  CreditCard,
  X,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import { api } from '@/lib/api';
import { formatCurrency, cn, getTransactionDisplayName, isUuid } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTransactionsQuery } from '@/hooks/queries/useTransactionsQuery';
import { useDeleteTransactionMutation } from '@/hooks/mutations/useTransactionMutations';

export default function TransactionsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: rawTransactions, isLoading, isError, refetch } = useTransactionsQuery();
  const deleteMutation = useDeleteTransactionMutation();

  const transactions = Array.isArray(rawTransactions)
    ? rawTransactions
    : (rawTransactions as any)?.results || [];

  const [isMounted, setIsMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleTxAdded = () => refetch();
    window.addEventListener('monvex:transaction-added', handleTxAdded);
    return () => window.removeEventListener('monvex:transaction-added', handleTxAdded);
  }, [refetch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this transaction record?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Transaction deleted from ledger.');
      if (selectedTx?.id === id) setSelectedTx(null);
    } catch {
      toast.error('Failed to delete transaction.');
    }
  };

  // Secure CSV Export Handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const blob = await api.downloadTransactionsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monvex_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Financial ledger exported successfully.');
    } catch {
      toast.error('Unable to export transactions CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter & Sort
  const filtered = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'ALL' && tx.category_name !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const m = (tx.merchant_name || '').toLowerCase();
          const d = (tx.description || '').toLowerCase();
          const c = (tx.category_name || '').toLowerCase();
          return m.includes(q) || d.includes(q) || c.includes(q);
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'amount_desc') return parseFloat(b.amount) - parseFloat(a.amount);
        if (sortBy === 'amount_asc') return parseFloat(a.amount) - parseFloat(b.amount);
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [transactions, typeFilter, categoryFilter, searchQuery, sortBy]);

  // Aggregate Metrics for Active Filter
  const filteredMetrics = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let transfers = 0;
    filtered.forEach((tx: any) => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === 'INCOME') {
        inflow += amt;
      } else if (tx.type === 'EXPENSE') {
        outflow += amt;
      } else if (tx.type === 'TRANSFER') {
        transfers += amt;
      }
    });
    return { inflow, outflow, transfers, net: inflow - outflow, count: filtered.length };
  }, [filtered]);

  // Unique categories for filtering
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx: any) => {
      if (tx.category_name) set.add(tx.category_name);
    });
    return Array.from(set);
  }, [transactions]);

  // Category Icon & Color Resolver
  const getCategoryStyles = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) {
      return { icon: Utensils, badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]' };
    }
    if (lower.includes('shop')) {
      return { icon: ShoppingBag, badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]' };
    }
    if (lower.includes('bill') || lower.includes('util') || lower.includes('rent')) {
      return { icon: Home, badgeBg: 'bg-[#E0F2FE]', badgeText: 'text-[#0369A1]' };
    }
    if (lower.includes('grocer')) {
      return { icon: ShoppingBasket, badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]' };
    }
    if (lower.includes('trans') || lower.includes('travel') || lower.includes('cab')) {
      return { icon: Car, badgeBg: 'bg-[#F3E8FF]', badgeText: 'text-[#7E22CE]' };
    }
    return { icon: CreditCard, badgeBg: 'bg-[#ECEBFF]', badgeText: 'text-[#6865E8]' };
  };

  const getMerchantLogo = (merchantName: string, categoryName: string) => {
    const lower = (merchantName || categoryName || '').toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato')) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white text-xs font-black shadow-xs shrink-0">
          S
        </div>
      );
    }
    if (lower.includes('amazon')) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#20212B] text-amber-400 text-xs font-black shadow-xs shrink-0">
          a
        </div>
      );
    }
    if (lower.includes('uber') || lower.includes('ola')) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white text-xs font-black shadow-xs shrink-0">
          U
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8] text-xs font-black shadow-xs border border-[#6865E8]/20 shrink-0">
        {(merchantName || categoryName || 'TX').slice(0, 1).toUpperCase()}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            1. PAGE HEADER & ACTIONS
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E6F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECEBFF] text-[#6865E8] border border-[#6865E8]/20">
                <Sparkles className="w-3 h-3 text-[#6865E8]" />
                Institutional Ledger
              </span>
              <span className="text-[11px] text-[#77798A] font-mono">
                {transactions.length} Total Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20212B] tracking-tight mt-1">
              Transactions & Cash Flow
            </h1>
            <p className="text-xs sm:text-sm text-[#77798A] font-normal mt-0.5">
              Comprehensive double-entry transaction record, merchant normalization, and reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              isLoading={isExporting}
              leftIcon={<Download className="h-4 w-4" />}
              className="rounded-xl border-[#E7E6F0] bg-white hover:bg-[#FAF9FC] text-[#20212B] shadow-xs"
            >
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setEditingTx(null);
                setIsAddModalOpen(true);
              }}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              className="rounded-xl bg-[#6865E8] hover:bg-[#5754D6] text-white shadow-sm font-semibold"
            >
              Add Transaction
            </Button>
          </div>
        </div>

        {/* =========================================================================
            2. TELEMETRY CARDS (Filtered View)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E6F0] shadow-xs space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#16745C] flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-[#32B995]" /> Filtered Inflow
            </span>
            <FinancialAmount amount={filteredMetrics.inflow} currency={user?.currency} size="xl" type="income" />
            <p className="text-[11px] text-[#77798A]">From active filtered records</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E6F0] shadow-xs space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E76D7A] flex items-center gap-1.5">
              <ArrowDownRight className="h-4 w-4 text-[#E76D7A]" /> Filtered Outflow
            </span>
            <FinancialAmount amount={filteredMetrics.outflow} currency={user?.currency} size="xl" type="expense" />
            <p className="text-[11px] text-[#77798A]">Operational and personal expenses</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E6F0] shadow-xs space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6865E8] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#6865E8]" /> Net Position
            </span>
            <div className={cn(
              'text-xl font-bold font-mono tracking-tight',
              filteredMetrics.net >= 0 ? 'text-[#16745C]' : 'text-[#E76D7A]'
            )}>
              {filteredMetrics.net >= 0 ? '+' : ''}{formatCurrency(filteredMetrics.net, user?.currency)}
            </div>
            <p className="text-[11px] text-[#77798A]">Retained net surplus for period</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E6F0] shadow-xs space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77798A] flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#77798A]" /> Visible Volume
            </span>
            <div className="text-xl font-bold font-mono text-[#20212B]">
              {filteredMetrics.count} <span className="text-xs font-normal text-[#77798A]">Transactions</span>
            </div>
            <p className="text-[11px] text-[#77798A]">Showing matching ledger rows</p>
          </div>
        </div>

        {/* =========================================================================
            3. TOOLBAR: SEARCH, FILTERS, CATEGORIES, SORT
            ========================================================================= */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E6F0] shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-88">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77798A]" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, category, or memo..."
                aria-label="Search transactions"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF9FC] border border-[#E7E6F0] text-sm font-medium text-[#20212B] placeholder:text-[#77798A] focus:border-[#6865E8] focus:bg-white focus:ring-2 focus:ring-[#6865E8]/20 focus:outline-none transition-all"
              />
            </div>

            {/* Type & Sort Controls */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
              {/* Type Filter Pills */}
              <div className="flex rounded-xl bg-[#F4F3FA] p-1 border border-[#E7E6F0]" role="group" aria-label="Filter by type">
                {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    aria-pressed={typeFilter === t}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none',
                      typeFilter === t
                        ? 'bg-[#6865E8] text-white shadow-xs'
                        : 'text-[#77798A] hover:text-[#20212B]'
                    )}
                  >
                    {t === 'ALL' ? 'All' : t === 'EXPENSE' ? 'Outflows' : 'Inflows'}
                  </button>
                ))}
              </div>

              {/* Sort Select */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                aria-label="Sort transactions"
                className="rounded-xl bg-[#FAF9FC] border border-[#E7E6F0] px-3.5 py-2 text-xs font-semibold text-[#20212B] focus:border-[#6865E8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/20 transition-all"
              >
                <option value="date_desc">Newest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Category Quick Filter Pills */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none border-t border-[#F4F3FA]">
              <span className="text-[11px] font-semibold text-[#77798A] shrink-0 mr-1.5">
                Category:
              </span>
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer',
                  categoryFilter === 'ALL'
                    ? 'bg-[#ECEBFF] text-[#6865E8] border border-[#6865E8]/30 font-bold'
                    : 'bg-[#FAF9FC] text-[#77798A] hover:text-[#20212B] border border-[#E7E6F0]'
                )}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer',
                    categoryFilter === cat
                      ? 'bg-[#ECEBFF] text-[#6865E8] border border-[#6865E8]/30 font-bold'
                      : 'bg-[#FAF9FC] text-[#77798A] hover:text-[#20212B] border border-[#E7E6F0]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            4. MAIN LEDGER CONTAINER (Solid Surface Table)
            ========================================================================= */}
        <div className="rounded-2xl bg-white border border-[#E7E6F0] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <TableSkeletonRow />
              <TableSkeletonRow />
              <TableSkeletonRow />
              <TableSkeletonRow />
            </div>
          ) : isError && transactions.length === 0 ? (
            <ErrorState
              title="Unable to load transactions"
              description="Failed to communicate with the accounting database. Check your connection or retry."
              onRetry={() => refetch()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description={
                searchQuery || categoryFilter !== 'ALL'
                  ? 'No records match your active search or category filters.'
                  : 'Start tracking your cash flow by adding your first transaction.'
              }
              actionLabel="Record Entry"
              onAction={() => {
                setEditingTx(null);
                setIsAddModalOpen(true);
              }}
            />
          ) : (
            <>
              {/* Mobile Card List (sm:hidden) */}
              <div className="sm:hidden divide-y divide-[#E7E6F0]">
                {filtered.map((tx: any) => {
                  const isExp = tx.type === 'EXPENSE';
                  const catStyles = getCategoryStyles(tx.category_name);

                  return (
                    <div
                      key={`mob-${tx.id}`}
                      onClick={() => setSelectedTx(tx)}
                      className="p-4 space-y-2 hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {getMerchantLogo(tx.merchant_name, tx.category_name)}
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#20212B] block truncate">
                              {getTransactionDisplayName(tx)}
                            </span>
                            <span className="text-[11px] text-[#77798A] block">
                              {new Date(tx.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <FinancialAmount
                          amount={tx.amount}
                          currency={user?.currency}
                          type={isExp ? 'expense' : 'income'}
                          showSign={true}
                          sign={isExp ? '-' : '+'}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                            catStyles.badgeBg,
                            catStyles.badgeText,
                            'border-[#E7E6F0]'
                          )}
                        >
                          {tx.category_name || 'General'}
                        </span>
                        <span className="text-[11px] text-[#6865E8] font-bold flex items-center gap-0.5">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop High-Density Table View (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table aria-label="Financial transactions ledger" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E6F0] bg-[#FAF9FC]/80 text-[#77798A] text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 w-[14%]">Date</th>
                      <th className="py-3 px-4 w-[36%]">Merchant & Memo</th>
                      <th className="py-3 px-4 w-[18%]">Category</th>
                      <th className="py-3 px-4 w-[12%]">Ingestion</th>
                      <th className="py-3 px-4 w-[12%] text-right">Amount</th>
                      <th className="py-3 px-4 w-[8%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E6F0]">
                    {filtered.map((tx: any) => {
                      const isExp = tx.type === 'EXPENSE';
                      const catStyles = getCategoryStyles(tx.category_name);

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="hover:bg-[#FAF9FC] transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 text-xs font-semibold text-[#77798A] whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {getMerchantLogo(tx.merchant_name, tx.category_name)}
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-[#20212B] block truncate max-w-[280px]">
                                  {getTransactionDisplayName(tx)}
                                </span>
                                {tx.description && tx.merchant_name && !isUuid(tx.description) && (
                                  <span className="text-[11px] text-[#77798A] block truncate max-w-[280px]">
                                    {tx.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border',
                                catStyles.badgeBg,
                                catStyles.badgeText,
                                'border-[#E7E6F0]'
                              )}
                            >
                              {tx.category_name || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] font-bold text-[#77798A] px-2 py-0.5 rounded-md bg-[#FAF9FC] border border-[#E7E6F0]">
                              {tx.source || 'MANUAL'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <FinancialAmount
                              amount={tx.amount}
                              currency={user?.currency}
                              type={isExp ? 'expense' : 'income'}
                              showSign={true}
                              sign={isExp ? '-' : '+'}
                              size="sm"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingTx(tx)}
                                className="text-[#77798A] hover:text-[#6865E8] p-1.5 rounded-lg hover:bg-[#ECEBFF] transition-all cursor-pointer"
                                aria-label={`Edit transaction ${getTransactionDisplayName(tx)}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="text-[#77798A] hover:text-[#E76D7A] p-1.5 rounded-lg hover:bg-[#FDEEF0] transition-all cursor-pointer"
                                aria-label={`Delete transaction ${getTransactionDisplayName(tx)}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* =========================================================================
            5. SLIDE-OVER DETAIL INSPECTION DRAWER
            ========================================================================= */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E6F0]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                    Transaction Record
                  </span>
                  <h3 className="text-base font-extrabold text-[#20212B]">
                    {getTransactionDisplayName(selectedTx)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#FAF9FC] text-[#77798A] hover:text-[#20212B] transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Amount Display */}
              <div className="p-5 rounded-2xl bg-[#FAF9FC] border border-[#E7E6F0] text-center space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#77798A] block">Recorded Amount</span>
                <FinancialAmount
                  amount={selectedTx.amount}
                  currency={user?.currency}
                  type={selectedTx.type === 'EXPENSE' ? 'expense' : 'income'}
                  showSign={true}
                  sign={selectedTx.type === 'EXPENSE' ? '-' : '+'}
                  size="2xl"
                />
              </div>

              {/* Metadata Grid */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#E7E6F0]">
                  <span className="text-[#77798A] font-medium">Accounting Date</span>
                  <span className="font-bold text-[#20212B]">
                    {new Date(selectedTx.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7E6F0]">
                  <span className="text-[#77798A] font-medium">Category</span>
                  <span className="font-bold text-[#20212B]">{selectedTx.category_name || 'General'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7E6F0]">
                  <span className="text-[#77798A] font-medium">Flow Type</span>
                  <span className="font-bold text-[#20212B]">
                    {selectedTx.type === 'EXPENSE' ? 'Discretionary Outflow' : 'Income Inflow'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7E6F0]">
                  <span className="text-[#77798A] font-medium">Capture Ingestion</span>
                  <span className="font-mono font-bold text-[#77798A]">{selectedTx.source || 'MANUAL'}</span>
                </div>
                {selectedTx.description && !isUuid(selectedTx.description) && (
                  <div className="py-2 border-b border-[#E7E6F0] space-y-1">
                    <span className="text-[#77798A] font-medium block">Description / Memo</span>
                    <p className="font-medium text-[#20212B] bg-[#FAF9FC] p-3 rounded-xl leading-relaxed border border-[#E7E6F0]">
                      {selectedTx.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Actions */}
              <div className="pt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Edit2 className="h-4 w-4" />}
                  onClick={() => {
                    const toEdit = selectedTx;
                    setSelectedTx(null);
                    setEditingTx(toEdit);
                  }}
                  className="flex-1 rounded-xl bg-[#6865E8] hover:bg-[#5754D6] text-white shadow-sm font-semibold"
                >
                  Edit Record
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleDelete(selectedTx.id)}
                  className="rounded-xl"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddModalOpen || Boolean(editingTx)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTx(null);
          }}
          onSuccess={() => refetch()}
          initialTransaction={editingTx}
        />
      </div>
    </AppShell>
  );
}
