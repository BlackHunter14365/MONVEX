'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function BudgetsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Budget Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('Food & Dining');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [period, setPeriod] = useState('MONTHLY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBudgetsAndCategories = async () => {
    try {
      const [bData, cData] = await Promise.all([
        api.getBudgets(),
        api.getCategories().catch(() => []),
      ]);
      setBudgets(Array.isArray(bData) ? bData : bData?.results || []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsAndCategories();
  }, []);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetAmount);
    if (isNaN(limit) || limit <= 0) {
      setErrorMsg('Please enter a valid positive budget limit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const selectedCat = categories.find((c) => c.name === categoryName);
    try {
      if (editingBudget) {
        await api.updateBudget(editingBudget.id, {
          limit_amount: limit,
          amount: limit,
          period,
        });
        toast.success('Budget limit updated successfully!');
      } else {
        await api.createBudget({
          category: selectedCat?.id,
          category_id: selectedCat?.id,
          category_name: categoryName,
          limit_amount: limit,
          amount: limit,
          period,
        });
        toast.success('Budget created successfully!');
      }

      setIsModalOpen(false);
      setEditingBudget(null);
      setBudgetAmount('');
      fetchBudgetsAndCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this budget target?')) return;
    try {
      await api.deleteBudget(id);
      toast.success('Budget removed.');
      fetchBudgetsAndCategories();
    } catch {
      toast.error('Failed to remove budget.');
    }
  };

  // Aggregated figures
  const totalAllocated = budgets.reduce((acc, b) => acc + (parseFloat(b.limit_amount ?? b.amount) || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (parseFloat(b.spent_amount ?? b.current_spent) || 0), 0);
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
    return { icon: CreditCard, bg: 'bg-[#F0EFEA]', text: 'text-[#5F6878]', barColor: 'bg-[#172033]' };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Budgets"
          description="Stay on track with your monthly spending across all key spending categories."
          actionSlot={
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Set budget
            </Button>
          }
        />

        <div className="editorial-card p-6 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <span className="swiss-eyebrow">Total allocated</span>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="swiss-metric text-2xl text-[#172033]">
                  {formatCurrency(totalAllocated, user?.currency)}
                </div>
              )}
              <span className="text-[11px] font-semibold text-[#858D9A] block">Monthly target limit</span>
            </div>

            <div className="space-y-1.5">
              <span className="swiss-eyebrow">Spent this month</span>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="swiss-metric text-2xl text-[#E11D48]">
                  {formatCurrency(totalSpent, user?.currency)}
                </div>
              )}
              <span className="text-[11px] font-bold text-[#E11D48] block">
                {overallPct}% utilized
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="swiss-eyebrow">Remaining buffer</span>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="swiss-metric text-2xl text-[#059669]">
                  {formatCurrency(totalRemaining, user?.currency)}
                </div>
              )}
              <span className="text-[11px] font-bold text-[#059669] block">
                Available to spend
              </span>
            </div>
          </div>
        </div>

        {/* Budget Category Cards Grid */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : budgets.length === 0 ? (
            <EmptyState
              title="No budgets created yet"
              description="Establish monthly spending caps to control burn velocity and get proactive alerts."
              actionLabel="Set your first budget"
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
                const projected = Math.round((spent / Math.max(1, new Date().getDate())) * 30);
                const catStyles = getCategoryStyles(b.category_name || b.name);
                const Icon = catStyles.icon;

                return (
                  <div key={b.id} className="editorial-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', catStyles.bg, catStyles.text)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[#172033] block leading-tight">
                              {b.category_name || b.name}
                            </h3>
                            <span className="text-[10px] font-semibold text-[#858D9A] uppercase">
                              {b.period || 'Monthly'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingBudget(b);
                              setCategoryName(b.category_name || b.name || 'Food & Dining');
                              setBudgetAmount(String(b.limit_amount ?? b.amount ?? ''));
                              setPeriod(b.period || 'MONTHLY');
                              setIsModalOpen(true);
                            }}
                            className="text-[#858D9A] hover:text-[#2563EB] p-1 rounded-lg hover:bg-[#EFF6FF] transition-colors"
                            title="Edit budget limit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="text-[#858D9A] hover:text-[#E11D48] p-1 rounded-lg hover:bg-[#FFF1F2] transition-colors"
                            title="Remove budget"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-0.5">
                        <div className="flex items-baseline justify-between text-xs font-bold">
                          <span className="text-[#172033] tabular-nums">
                            {formatCurrency(spent, user?.currency)}
                          </span>
                          <span className="text-[#5F6878] font-medium tabular-nums">
                            of {formatCurrency(limit, user?.currency)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-[#F0EFEA] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              isOver ? 'bg-[#E11D48]' : pct > 80 ? 'bg-[#F59E0B]' : catStyles.barColor
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="pt-3 border-t border-[#E4E2DC] flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[#858D9A] block">Remaining</span>
                        <span className={cn('font-bold', isOver ? 'text-[#E11D48]' : 'text-[#059669]')}>
                          {isOver ? 'Over by ' : ''}{formatCurrency(remaining, user?.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#858D9A] block">Month-end projection</span>
                        <span className="font-bold text-[#172033]">
                          {formatCurrency(projected, user?.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Set / Edit Budget Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
          }}
          title={editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
          description={editingBudget ? 'Update your monthly spending parameter for this category.' : 'Establish monthly spending parameters for proactive tracking.'}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveBudget} className="space-y-4 pt-1">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1 block">Category</label>
              <select
                value={categoryName}
                disabled={Boolean(editingBudget)}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#172033] focus:border-[#172033] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Housing & Rent">Housing & Rent</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                    <option value="Shopping & Lifestyle">Shopping & Lifestyle</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="General">General</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1 block">
                Monthly Spending Limit
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="e.g. 8000"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBudget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {editingBudget ? 'Update Budget' : 'Save Budget'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
