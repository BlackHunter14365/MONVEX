'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Download,
  Utensils,
  ShoppingBag,
  Home,
  Car,
  ShoppingBasket,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, TableSkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Tooltip } from '@/components/ui/Tooltip';
import { PageHeader } from '@/components/layout/PageHeader';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTransactionsQuery } from '@/hooks/queries/useTransactionsQuery';
import { useDeleteTransactionMutation } from '@/hooks/mutations/useTransactionMutations';
import { CardReveal } from '@/components/motion';

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
  const [sortBy, setSortBy] = useState<'date_desc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  useEffect(() => {
    const handleTxAdded = () => refetch();
    window.addEventListener('monvex:transaction-added', handleTxAdded);
    return () => window.removeEventListener('monvex:transaction-added', handleTxAdded);
  }, [refetch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Transaction deleted successfully.');
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
  const filtered = transactions
    .filter((tx: any) => {
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
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

  // Category Icon & Badge Resolver
  const getCategoryStyles = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) {
      return { badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]' };
    }
    if (lower.includes('shop')) {
      return { badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]' };
    }
    if (lower.includes('bill') || lower.includes('util') || lower.includes('rent')) {
      return { badgeBg: 'bg-[#E0F2FE]', badgeText: 'text-[#0369A1]' };
    }
    if (lower.includes('grocer')) {
      return { badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]' };
    }
    if (lower.includes('trans') || lower.includes('travel') || lower.includes('cab')) {
      return { badgeBg: 'bg-[#F3E8FF]', badgeText: 'text-[#7E22CE]' };
    }
    return { badgeBg: 'bg-[#F0EFEA]', badgeText: 'text-[#625D69]' };
  };

  // Merchant Logo Resolver
  const getMerchantLogo = (merchantName: string, categoryName: string) => {
    const lower = (merchantName || categoryName || '').toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EA580C] text-white text-xs font-black shadow-sm shrink-0">
          S
        </div>
      );
    }
    if (lower.includes('amazon')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A1F3D] text-amber-400 text-xs font-black shadow-sm shrink-0">
          a
        </div>
      );
    }
    if (lower.includes('uber') || lower.includes('ola')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white text-xs font-black shadow-sm shrink-0">
          U
        </div>
      );
    }
    if (lower.includes('netflix') || lower.includes('spotify')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E11D48] text-white text-xs font-black shadow-sm shrink-0">
          N
        </div>
      );
    }
    if (lower.includes('apple') || lower.includes('icloud')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#191522] text-white text-xs font-black shadow-sm shrink-0">
          
        </div>
      );
    }
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEEAF7] text-[#3B2D54] text-xs font-black shadow-sm border border-[#625477]/20 shrink-0">
        {(merchantName || categoryName || 'TX').slice(0, 1).toUpperCase()}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Transactions"
          description="Detailed record of all inflows, outflows, merchant categories, and deterministic accounting telemetry."
          actionSlot={
            <div className="flex items-center gap-2">
              <Tooltip content="Export complete ledger as CSV">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  isLoading={isExporting}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  className="hidden sm:inline-flex"
                >
                  Export CSV
                </Button>
              </Tooltip>

              <Button
                onClick={() => {
                  setEditingTx(null);
                  setIsAddModalOpen(true);
                }}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add transaction
              </Button>
            </div>
          }
        />

        {/* Filter & Search Bar */}
        <CardReveal index={0} className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E4E2DC] shadow-subtle">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#898390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant or description..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] text-xs font-semibold text-[#191522] placeholder:text-[#898390] focus:border-[#4056A1] focus:ring-2 focus:ring-[#4056A1]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Type Filters & Sort */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Pills */}
            <div className="flex rounded-lg bg-[#F6F5F1] p-1 border border-[#E4E2DC]">
              {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none',
                    typeFilter === t
                      ? 'bg-[#2A1F3D] text-white shadow-sm'
                      : 'text-[#625D69] hover:text-[#191522]'
                  )}
                >
                  {t === 'ALL' ? 'All' : t === 'EXPENSE' ? 'Expenses' : 'Income'}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:ring-2 focus:ring-[#4056A1]/15 focus:outline-none"
            >
              <option value="date_desc">Newest first</option>
              <option value="amount_desc">Highest amount</option>
              <option value="amount_asc">Lowest amount</option>
            </select>
          </div>
        </CardReveal>

        {/* Transactions Container */}
        <CardReveal index={1} className="editorial-card overflow-hidden">
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
                searchQuery
                  ? 'No records match your search criteria.'
                  : 'Start tracking your cash flow by adding your first transaction.'
              }
              onAction={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('monvex:open-add-transaction'));
                }
              }}
            />
          ) : (
            <>
              {/* 1. Mobile Adaptive Stacked Card View (sm:hidden) */}
              <div className="sm:hidden divide-y divide-[#F0EFEA]">
                {filtered.map((tx: any) => {
                  const isExp = tx.type === 'EXPENSE';
                  const catStyles = getCategoryStyles(tx.category_name);

                  return (
                    <div key={`mob-${tx.id}`} className="p-4 space-y-2.5 hover:bg-[#FAF9F6] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getMerchantLogo(tx.merchant_name, tx.category_name)}
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#191522] block truncate">
                              {tx.merchant_name || tx.description || 'Transaction'}
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

                        <div
                          className={cn(
                            'font-black text-sm tabular-nums whitespace-nowrap text-right',
                            isExp ? 'text-[#E11D48]' : 'text-[#059669]'
                          )}
                        >
                          {isExp ? '- ' : '+ '}
                          {formatCurrency(tx.amount, user?.currency)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                              catStyles.badgeBg,
                              catStyles.badgeText,
                              'border-[#E4E2DC]/80'
                            )}
                          >
                            {tx.category_name || 'General'}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-[#898390] px-1.5 py-0.5 rounded bg-[#F6F5F1] border border-[#E4E2DC]">
                            {tx.source || 'MANUAL'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTx(tx)}
                            className="text-[#898390] hover:text-[#2563EB] p-1.5 rounded-lg hover:bg-[#EFF6FF] transition-all"
                            aria-label="Edit transaction"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-[#898390] hover:text-[#E11D48] p-1.5 rounded-lg hover:bg-[#FFF1F2] transition-all"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Desktop High-Density Table View (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="ref-table">
                  <thead>
                    <tr>
                      <th className="w-[14%]">Date</th>
                      <th className="w-[32%]">Merchant</th>
                      <th className="w-[18%]">Category</th>
                      <th className="w-[12%]">Source</th>
                      <th className="w-[14%] text-right">Amount</th>
                      <th className="w-[10%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx: any) => {
                      const isExp = tx.type === 'EXPENSE';
                      const catStyles = getCategoryStyles(tx.category_name);

                      return (
                        <tr key={tx.id}>
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
                                  {tx.merchant_name || tx.description || 'Transaction'}
                                </span>
                                {tx.description && tx.merchant_name && (
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
                                'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border',
                                catStyles.badgeBg,
                                catStyles.badgeText,
                                'border-[#E4E2DC]/80'
                              )}
                            >
                              {tx.category_name || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-[11px] font-bold text-[#898390] px-2 py-0.5 rounded bg-[#F6F5F1] border border-[#E4E2DC]">
                              {tx.source || 'MANUAL'}
                            </span>
                          </td>
                          <td
                            className={cn(
                              'text-right font-black text-xs sm:text-sm tabular-nums whitespace-nowrap',
                              isExp ? 'text-[#E11D48]' : 'text-[#059669]'
                            )}
                          >
                            {isExp ? '- ' : '+ '}
                            {formatCurrency(tx.amount, user?.currency)}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Tooltip content="Edit transaction record">
                                <button
                                  onClick={() => setEditingTx(tx)}
                                  className="text-[#898390] hover:text-[#2563EB] p-1.5 rounded-lg hover:bg-[#EFF6FF] border border-transparent hover:border-[#BFDBFE] transition-all"
                                  aria-label="Edit transaction"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Delete transaction record">
                                <button
                                  onClick={() => handleDelete(tx.id)}
                                  className="text-[#898390] hover:text-[#E11D48] p-1.5 rounded-lg hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] transition-all"
                                  aria-label="Delete transaction"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </Tooltip>
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
        </CardReveal>

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
