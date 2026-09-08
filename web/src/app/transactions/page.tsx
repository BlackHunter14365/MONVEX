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
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
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
    return { inflow, outflow, transfers, count: filtered.length };
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
    return { icon: CreditCard, badgeBg: 'bg-[#F1F0EC]', badgeText: 'text-[#625D69]' };
  };

  const getMerchantLogo = (merchantName: string, categoryName: string) => {
    const lower = (merchantName || categoryName || '').toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EA580C] text-white text-xs font-black shadow-xs shrink-0">
          S
        </div>
      );
    }
    if (lower.includes('amazon')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A1F3D] text-amber-400 text-xs font-black shadow-xs shrink-0">
          a
        </div>
      );
    }
    if (lower.includes('uber') || lower.includes('ola')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white text-xs font-black shadow-xs shrink-0">
          U
        </div>
      );
    }
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEEAF7] text-[#3B2D54] text-xs font-black shadow-xs border border-[#625477]/20 shrink-0">
        {(merchantName || categoryName || 'TX').slice(0, 1).toUpperCase()}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            1. PAGE HEADER & TELEMETRY STRIP
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E2DC]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
              Financial Ledger
            </h1>
            <p className="text-xs text-[#625D69] font-medium mt-0.5">
              Comprehensive double-entry transaction record, merchant normalization, and reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              isLoading={isExporting}
              leftIcon={<Download className="h-3.5 w-3.5" />}
              className="touch-target hidden sm:inline-flex"
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
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="touch-target"
            >
              Add Record
            </Button>
          </div>
        </div>

        {/* LEDGER SUMMARY METRICS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669] flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> Total Inflows Filtered
            </span>
            <FinancialAmount amount={filteredMetrics.inflow} currency={user?.currency} size="xl" type="income" />
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E11D48] flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5" /> Total Outflows Filtered
            </span>
            <FinancialAmount amount={filteredMetrics.outflow} currency={user?.currency} size="xl" type="expense" />
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#898390] flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Filtered Records
            </span>
            <div className="text-xl font-mono font-black text-[#191522]">{filteredMetrics.count} Entries</div>
          </div>
        </div>

        {/* =========================================================================
            2. TOOLBAR: SEARCH, FILTERS, CATEGORIES, SORT
            ========================================================================= */}
        <div className="p-4 rounded-2xl bg-white border border-[#E4E2DC] shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, notes, or category..."
                className="w-full pl-10 pr-3.5 py-2 min-h-[48px] rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] text-base sm:text-xs font-semibold text-[#191522] placeholder:text-[#898390] focus:border-[#4056A1] focus:ring-2 focus:ring-[#4056A1]/15 focus:outline-none transition-all"
              />
            </div>

            {/* Type & Sort Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
              {/* Type Filter Pills */}
              <div className="flex rounded-xl bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      typeFilter === t ? 'bg-[#2A1F3D] text-white shadow-xs' : 'text-[#625D69]'
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
                className="rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[44px] text-base sm:text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
              >
                <option value="date_desc">Newest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Category Quick Filter Pills */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
              <span className="text-[10px] font-mono font-bold uppercase text-[#898390] shrink-0 mr-1">
                Category:
              </span>
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer',
                  categoryFilter === 'ALL'
                    ? 'bg-[#EEEAF7] text-[#2A1F3D] border border-[#625477]/30'
                    : 'bg-[#F6F5F1] text-[#625D69] hover:text-[#191522]'
                )}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer',
                    categoryFilter === cat
                      ? 'bg-[#EEEAF7] text-[#2A1F3D] border border-[#625477]/30'
                      : 'bg-[#F6F5F1] text-[#625D69] hover:text-[#191522]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            3. MAIN LEDGER CONTAINER
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner overflow-hidden">
            {isLoading ? (
              <div className="p-4 sm:p-6 space-y-1">
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
                <div className="sm:hidden divide-y divide-[#F0EFEA]">
                  {filtered.map((tx: any) => {
                    const isExp = tx.type === 'EXPENSE';
                    const catStyles = getCategoryStyles(tx.category_name);

                    return (
                      <div
                        key={`mob-${tx.id}`}
                        onClick={() => setSelectedTx(tx)}
                        className="p-4 space-y-2.5 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getMerchantLogo(tx.merchant_name, tx.category_name)}
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-[#191522] block truncate">
                                {getTransactionDisplayName(tx)}
                              </span>
                              <span className="text-[11px] text-[#898390] block">
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
                              'border-[#E4E2DC]'
                            )}
                          >
                            {tx.category_name || 'General'}
                          </span>
                          <span className="text-[11px] text-[#2563EB] font-bold">Details &rarr;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop High-Density Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="ref-table">
                    <thead>
                      <tr>
                        <th className="w-[15%]">Date</th>
                        <th className="w-[35%]">Merchant / Description</th>
                        <th className="w-[18%]">Category</th>
                        <th className="w-[12%]">Source</th>
                        <th className="w-[12%] text-right">Amount</th>
                        <th className="w-[8%] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((tx: any) => {
                        const isExp = tx.type === 'EXPENSE';
                        const catStyles = getCategoryStyles(tx.category_name);

                        return (
                          <tr
                            key={tx.id}
                            onClick={() => setSelectedTx(tx)}
                            className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                          >
                            <td className="text-xs font-semibold text-[#625D69] whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                {getMerchantLogo(tx.merchant_name, tx.category_name)}
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-[#191522] block truncate max-w-[280px]">
                                    {getTransactionDisplayName(tx)}
                                  </span>
                                  {tx.description && tx.merchant_name && !isUuid(tx.description) && (
                                    <span className="text-[11px] text-[#898390] block truncate max-w-[280px]">
                                      {tx.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={cn(
                                  'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border',
                                  catStyles.badgeBg,
                                  catStyles.badgeText,
                                  'border-[#E4E2DC]'
                                )}
                              >
                                {tx.category_name || 'General'}
                              </span>
                            </td>
                            <td>
                              <span className="font-mono text-[10px] font-bold text-[#898390] px-2 py-0.5 rounded-md bg-[#F6F5F1] border border-[#E4E2DC]">
                                {tx.source || 'MANUAL'}
                              </span>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <FinancialAmount
                                amount={tx.amount}
                                currency={user?.currency}
                                type={isExp ? 'expense' : 'income'}
                                showSign={true}
                                sign={isExp ? '-' : '+'}
                                size="sm"
                              />
                            </td>
                            <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingTx(tx)}
                                  className="text-[#898390] hover:text-[#2563EB] p-1.5 rounded-lg hover:bg-[#EFF6FF] border border-transparent hover:border-[#BFDBFE] transition-all"
                                  aria-label="Edit transaction"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(tx.id)}
                                  className="text-[#898390] hover:text-[#E11D48] p-1.5 rounded-lg hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] transition-all"
                                  aria-label="Delete transaction"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
        </div>

        {/* =========================================================================
            4. SLIDE-OVER DETAIL INSPECTION DRAWER
            ========================================================================= */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DC]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#898390]">
                    Transaction Record
                  </span>
                  <h3 className="text-base font-black text-[#191522]">
                    {getTransactionDisplayName(selectedTx)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#F6F5F1] text-[#898390] hover:text-[#191522] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Amount Display */}
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E4E2DC] text-center space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#898390] block">Recorded Amount</span>
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
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#898390] font-medium">Accounting Date</span>
                  <span className="font-bold text-[#191522]">
                    {new Date(selectedTx.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#898390] font-medium">Category</span>
                  <span className="font-bold text-[#191522]">{selectedTx.category_name || 'General'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#898390] font-medium">Flow Type</span>
                  <span className="font-bold text-[#191522]">
                    {selectedTx.type === 'EXPENSE' ? 'Discretionary Outflow' : 'Income Inflow'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#898390] font-medium">Capture Ingestion</span>
                  <span className="font-mono font-bold text-[#898390]">{selectedTx.source || 'MANUAL'}</span>
                </div>
                {selectedTx.description && !isUuid(selectedTx.description) && (
                  <div className="py-2 border-b border-[#F0EFEA] space-y-1">
                    <span className="text-[#898390] font-medium block">Description / Memo</span>
                    <p className="font-medium text-[#191522] bg-[#F6F5F1] p-2.5 rounded-lg leading-relaxed">
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
                  className="flex-1 touch-target"
                >
                  Edit Record
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleDelete(selectedTx.id)}
                  className="touch-target"
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
