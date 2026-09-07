'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Utensils,
  ShoppingBag,
  Home,
  Car,
  ShoppingBasket,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useBudgetsQuery, useCategoriesQuery } from '@/hooks/queries/useBudgetsQuery';
import {
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} from '@/hooks/mutations/useBudgetMutations';

export default function BudgetsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: rawBudgets, isLoading: isBudgetsLoading, isError: isBudgetsError, refetch } = useBudgetsQuery();
  const { data: rawCategories, isLoading: isCategoriesLoading } = useCategoriesQuery();

  const createBudgetMutation = useCreateBudgetMutation();
  const updateBudgetMutation = useUpdateBudgetMutation();
  const deleteBudgetMutation = useDeleteBudgetMutation();

  const budgets = Array.isArray(rawBudgets) ? rawBudgets : (rawBudgets as any)?.results || [];
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const isLoading = isBudgetsLoading || isCategoriesLoading;

  // Budget Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('Food & Dining');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [period, setPeriod] = useState('MONTHLY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetAmount);
    if (isNaN(limit) || limit <= 0) {
      setErrorMsg('Please enter a valid positive budget limit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const selectedCat = categories.find((c: any) => c.name === categoryName);
    try {
      if (editingBudget) {
        await updateBudgetMutation.mutateAsync({
          id: editingBudget.id,
          data: {
            limit_amount: limit,
            amount: limit,
            period,
          },
        });
        toast.success('Budget limit updated successfully.');
      } else {
        await createBudgetMutation.mutateAsync({
          category: selectedCat?.id,
          category_id: selectedCat?.id,
          category_name: categoryName,
          limit_amount: limit,
          amount: limit,
          period,
        });
        toast.success('Budget guardrail established.');
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      setBudgetAmount('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this budget guardrail?')) return;
    try {
      await deleteBudgetMutation.mutateAsync(id);
      toast.success('Budget guardrail removed.');
    } catch {
      toast.error('Failed to remove budget.');
    }
  };

  // Aggregated figures
  const totalAllocated = budgets.reduce((acc: number, b: any) => acc + (parseFloat(b.limit_amount ?? b.amount) || 0), 0);
  const totalSpent = budgets.reduce((acc: number, b: any) => acc + (parseFloat(b.spent_amount ?? b.current_spent) || 0), 0);
  const totalRemaining = Math.max(0, totalAllocated - totalSpent);
  const overallPct = totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;

  // Category Icon & Color Resolver
  const getCategoryStyles = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) {
      return { icon: Utensils, bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', barColor: 'bg-[#10B981]' };
    }
    if (lower.includes('shop')) {
      return { icon: ShoppingBag, bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', barColor: 'bg-[#F59E0B]' };
    }
    if (lower.includes('bill') || lower.includes('util') || lower.includes('rent')) {
      return { icon: Home, bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', barColor: 'bg-[#2563EB]' };
    }
    if (lower.includes('grocer')) {
      return { icon: ShoppingBasket, bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', barColor: 'bg-[#10B981]' };
    }
    if (lower.includes('trans') || lower.includes('travel') || lower.includes('cab')) {
      return { icon: Car, bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', barColor: 'bg-[#8B5CF6]' };
    }
    return { icon: CreditCard, bg: 'bg-[#F1F0EC]', text: 'text-[#625D69]', barColor: 'bg-[#2A1F3D]' };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            1. HEADER & OVERVIEW BAR
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E2DC]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
              Spending Guardrails & Budgets
            </h1>
            <p className="text-xs text-[#625D69] font-medium mt-0.5">
              Deterministic allocation limits to enforce capital preservation and prevent discretionary burn.
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingBudget(null);
              setBudgetAmount('');
              setIsModalOpen(true);
            }}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="touch-target"
          >
            Create Guardrail
          </Button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#898390] block">
              Total Budgeted Cap
            </span>
            <FinancialAmount amount={totalAllocated} currency={user?.currency} size="xl" type="neutral" />
            <span className="text-[10px] text-[#625D69] block">Cumulative monthly limit</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E11D48] block">
              Spent This Month
            </span>
            <FinancialAmount amount={totalSpent} currency={user?.currency} size="xl" type="expense" />
            <span className="text-[10px] text-[#E11D48] font-bold block">{overallPct}% of allowance utilized</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669] block">
              Remaining Buffer
            </span>
            <FinancialAmount amount={totalRemaining} currency={user?.currency} size="xl" type="income" />
            <span className="text-[10px] text-[#059669] font-bold block">Available discretionary capital</span>
          </div>
        </div>

        {/* =========================================================================
            2. BUDGET CARDS GRID
            ========================================================================= */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : isBudgetsError && budgets.length === 0 ? (
          <ErrorState
            title="Unable to load budgets"
            description="Failed to retrieve your category allocations. Check your connection and retry."
            onRetry={() => refetch()}
          />
        ) : budgets.length === 0 ? (
          <EmptyState
            title="No spending guardrails set"
            description="Establish category spending limits to proactively protect your monthly savings goals."
            actionLabel="Create First Budget"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((b: any) => {
              const spent = parseFloat(b.spent_amount ?? b.current_spent) || 0;
              const limit = parseFloat(b.limit_amount ?? b.amount) || 1;
              const pct = Math.min(100, Math.round((spent / limit) * 100));
              const remaining = Math.max(0, limit - spent);
              const isOver = spent > limit;
              const catStyles = getCategoryStyles(b.category_name || b.name);
              const Icon = catStyles.icon;

              const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
              const daysLeft = Math.max(1, daysInMonth - new Date().getDate());
              const dailyAllowance = Math.round(remaining / daysLeft);

              return (
                <div key={b.id} className="double-bezel">
                  <div className="double-bezel-inner p-5 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', catStyles.bg, catStyles.text)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[#191522] block leading-tight">
                              {b.category_name || b.name}
                            </h3>
                            <span className="text-[10px] font-mono text-[#898390] uppercase">{b.period || 'Monthly'}</span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                            isOver
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECDD3]'
                              : pct >= 80
                              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                              : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                          )}
                        >
                          {isOver ? 'EXCEEDED' : pct >= 80 ? 'APPROACHING' : 'ON TRACK'}
                        </span>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-mono text-[#191522] font-bold">
                            {formatCurrency(spent, user?.currency)}
                          </span>
                          <span className="font-mono text-[#898390]">
                            / {formatCurrency(limit, user?.currency)} ({pct}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-[#F1F0EC] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              isOver ? 'bg-[#E11D48]' : pct >= 80 ? 'bg-[#D97706]' : 'bg-[#059669]'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Telemetry info */}
                      <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E4E2DC] text-[11px] space-y-1">
                        <div className="flex justify-between text-[#625D69]">
                          <span>Remaining Cap:</span>
                          <span className="font-mono font-bold text-[#191522]">{formatCurrency(remaining, user?.currency)}</span>
                        </div>
                        <div className="flex justify-between text-[#625D69]">
                          <span>Daily Allowance:</span>
                          <span className="font-mono font-bold text-[#059669]">
                            {isOver ? '₹0 / day' : `${formatCurrency(dailyAllowance, user?.currency)} / day`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#E4E2DC] flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingBudget(b);
                          setCategoryName(b.category_name || b.name);
                          setBudgetAmount(String(b.limit_amount ?? b.amount));
                          setPeriod(b.period || 'MONTHLY');
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#898390] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all"
                        aria-label="Edit budget"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="p-1.5 rounded-lg text-[#898390] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-all"
                        aria-label="Delete budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Budget */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
          }}
          title={editingBudget ? 'Edit Spending Guardrail' : 'Establish Spending Guardrail'}
        >
          <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-xs font-bold text-[#DC2626]">
                {errorMsg}
              </div>
            )}

            {!editingBudget && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#191522] block">Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 min-h-[48px] text-base sm:text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#191522] block">Monthly Cap Limit ({user?.currency || 'INR'})</label>
              <input
                type="number"
                step="0.01"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 min-h-[48px] text-base sm:text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#191522] block">Period Cadence</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 min-h-[48px] text-base sm:text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBudget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {editingBudget ? 'Save Changes' : 'Establish Guardrail'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
