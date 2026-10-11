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
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
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
      return { icon: Utensils, bg: 'bg-[#E8FBF4]', text: 'text-[#16745C]', barColor: 'bg-[#75DCC0]' };
    }
    if (lower.includes('shop')) {
      return { icon: ShoppingBag, bg: 'bg-[#FEF6EB]', text: 'text-[#E8A54B]', barColor: 'bg-[#E8A54B]' };
    }
    if (lower.includes('bill') || lower.includes('util') || lower.includes('rent')) {
      return { icon: Home, bg: 'bg-[#ECEBFF]', text: 'text-[#6865E8]', barColor: 'bg-[#6865E8]' };
    }
    if (lower.includes('grocer')) {
      return { icon: ShoppingBasket, bg: 'bg-[#E8FBF4]', text: 'text-[#16745C]', barColor: 'bg-[#75DCC0]' };
    }
    if (lower.includes('trans') || lower.includes('travel') || lower.includes('cab')) {
      return { icon: Car, bg: 'bg-[#F3E8FF]', text: 'text-[#8B5CF6]', barColor: 'bg-[#8B5CF6]' };
    }
    return { icon: CreditCard, bg: 'bg-[#ECEBFF]', text: 'text-[#6865E8]', barColor: 'bg-[#6865E8]' };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        {/* =========================================================================
            1. HEADER & OVERVIEW BAR
            ========================================================================= */}
        <PageHeader
          eyebrow="CAPITAL GOVERNANCE"
          title="Spending Guardrails & Budgets"
          description="Deterministic allocation limits to enforce capital preservation, control burn velocity, and protect discretionary buffers."
          actionSlot={
            <Button
              onClick={() => {
                setEditingBudget(null);
                setBudgetAmount('');
                setIsModalOpen(true);
              }}
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-[#6865E8] hover:bg-[#5b58db] text-white shadow-xs rounded-2xl px-5 py-2.5 font-semibold text-xs"
            >
              Create Guardrail
            </Button>
          }
        />

        {/* =========================================================================
            2. SUMMARY STAT CARDS (Aurora Glass 3-Metric Strip)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Total Budgeted Cap
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalAllocated} currency={user?.currency} size="2xl" type="neutral" />
              <p className="text-xs text-[#77798A] font-medium mt-1">Cumulative monthly limit</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                Spent This Month
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalSpent} currency={user?.currency} size="2xl" type="expense" />
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDEEF0] text-[#E76D7A]">
                  {overallPct}% utilized
                </span>
                <span className="text-xs text-[#77798A]">of target cap</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Remaining Buffer
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalRemaining} currency={user?.currency} size="2xl" type="income" />
              <p className="text-xs text-[#16745C] font-semibold mt-1">Available discretionary capital</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. BUDGET CARDS GRID
            ========================================================================= */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
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
                <div
                  key={b.id}
                  className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs hover:border-[#6865E8]/40 hover:shadow-md transition-all flex flex-col justify-between h-full space-y-5"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Title + Status Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl shrink-0', catStyles.bg, catStyles.text)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#20212B] block leading-tight">
                            {b.category_name || b.name}
                          </h3>
                          <span className="text-[10px] font-mono font-medium text-[#77798A] uppercase">
                            {b.period || 'Monthly'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                          isOver
                            ? 'bg-[#FEF2F2] text-[#E76D7A] border-[#FECDD3]'
                            : pct >= 80
                            ? 'bg-[#FFFBEB] text-[#E8A54B] border-[#FDE68A]'
                            : 'bg-[#E8FBF4] text-[#16745C] border-[#B6F0DE]'
                        )}
                      >
                        {isOver ? 'EXCEEDED' : pct >= 80 ? 'APPROACHING' : 'ON TRACK'}
                      </span>
                    </div>

                    {/* Nexora-style Progress Bar & Fraction Badge */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-mono font-bold text-[#20212B]">
                            {formatCurrency(spent, user?.currency)}
                          </span>
                          <span className="text-xs font-mono text-[#77798A]">
                            / {formatCurrency(limit, user?.currency)}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#6865E8] bg-[#ECEBFF] px-2.5 py-0.5 rounded-full">
                          {pct}%
                        </span>
                      </div>

                      {/* Smooth Progress Track */}
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${b.category_name || b.name} spending limit utilization`}
                        className="w-full h-2.5 bg-[#ECEBFF] rounded-full overflow-hidden"
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isOver ? 'bg-[#E76D7A]' : pct >= 80 ? 'bg-[#E8A54B]' : 'bg-[#6865E8]'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Telemetry Capsule */}
                    <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] text-xs space-y-2">
                      <div className="flex justify-between items-center text-[#77798A]">
                        <span>Remaining Cap:</span>
                        <span className="font-mono font-bold text-[#20212B]">
                          {formatCurrency(remaining, user?.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#77798A]">
                        <span>Daily Allowance:</span>
                        <span className="font-mono font-bold text-[#16745C]">
                          {isOver ? '₹0 / day' : `${formatCurrency(dailyAllowance, user?.currency)} / day`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-[#E7E6F0] flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setCategoryName(b.category_name || b.name);
                        setBudgetAmount(String(b.limit_amount ?? b.amount));
                        setPeriod(b.period || 'MONTHLY');
                        setIsModalOpen(true);
                      }}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#6865E8] hover:bg-[#ECEBFF] border border-transparent hover:border-[#6865E8]/20 transition-all focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none"
                      aria-label={`Edit budget for ${b.category_name || b.name}`}
                    >
                      <Edit2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECDD3] transition-all focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none"
                      aria-label={`Delete budget for ${b.category_name || b.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
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
          description="Enforce category spending caps to protect your monthly savings velocity."
        >
          <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECDD3] text-xs font-bold text-[#E76D7A]">
                {errorMsg}
              </div>
            )}

            {!editingBudget && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">
                Monthly Cap Limit ({user?.currency || 'INR'})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Period Cadence</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBudget(null);
                }}
                className="rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
                {editingBudget ? 'Save Changes' : 'Establish Guardrail'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
