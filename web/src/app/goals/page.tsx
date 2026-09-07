'use client';

import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  Coins,
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
import { useGoalsQuery } from '@/hooks/queries/useGoalsQuery';
import {
  useCreateGoalMutation,
  useContributeGoalMutation,
  useDeleteGoalMutation,
} from '@/hooks/mutations/useGoalMutations';
import { triggerConfetti } from '@/components/ui/ConfettiCelebration';

export default function GoalsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: rawGoals, isLoading, isError, refetch } = useGoalsQuery();
  const createGoalMutation = useCreateGoalMutation();
  const contributeGoalMutation = useContributeGoalMutation();
  const deleteGoalMutation = useDeleteGoalMutation();

  const goals = Array.isArray(rawGoals) ? rawGoals : (rawGoals as any)?.results || [];

  // New Goal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Contribute Funds Modal State
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const tAmount = parseFloat(targetAmount);
    const cAmount = parseFloat(currentAmount) || 0;

    if (isNaN(tAmount) || tAmount <= 0) {
      setErrorMsg('Please enter a valid positive target amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createGoalMutation.mutateAsync({
        title: goalName.trim(),
        name: goalName.trim(),
        target_amount: tAmount,
        current_amount: cAmount,
        deadline: targetDate || null,
        target_date: targetDate || null,
      });

      triggerConfetti();
      toast.success('Savings goal established.');
      setIsModalOpen(false);
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create savings goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0 || !selectedGoal) {
      toast.error('Please enter a valid positive contribution amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await contributeGoalMutation.mutateAsync({
        goalId: selectedGoal.id,
        amount,
      });
      triggerConfetti();
      toast.success(`Allocated ${formatCurrency(amount, user?.currency)} to "${selectedGoal.title || selectedGoal.name}".`);
      setIsContributeOpen(false);
      setContributeAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to remove this savings goal?')) return;
    try {
      await deleteGoalMutation.mutateAsync(id);
      toast.success('Savings goal removed.');
    } catch {
      toast.error('Failed to delete goal.');
    }
  };

  const totalTarget = goals.reduce((acc: number, g: any) => acc + (parseFloat(g.target_amount) || 0), 0);
  const totalSaved = goals.reduce((acc: number, g: any) => acc + (parseFloat(g.current_amount) || 0), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            1. HEADER & OVERVIEW
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E2DC]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
              Capital Accumulation & Goals
            </h1>
            <p className="text-xs text-[#625D69] font-medium mt-0.5">
              Structured milestone tracking, target deadlines, and required monthly capital run-rates.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="touch-target"
          >
            Create Goal
          </Button>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#898390] block">
              Cumulative Target Capital
            </span>
            <FinancialAmount amount={totalTarget} currency={user?.currency} size="xl" type="neutral" />
            <span className="text-[10px] text-[#625D69] block">Total capital across all milestones</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669] block">
              Accumulated Balance
            </span>
            <FinancialAmount amount={totalSaved} currency={user?.currency} size="xl" type="income" />
            <span className="text-[10px] text-[#059669] font-bold block">{overallPct}% of target reached</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4056A1] block">
              Active Programs
            </span>
            <div className="text-xl font-mono font-black text-[#191522]">{goals.length} Concurrent Milestones</div>
            <span className="text-[10px] text-[#625D69] block">Real-time progress telemetry</span>
          </div>
        </div>

        {/* =========================================================================
            2. GOALS GRID
            ========================================================================= */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        ) : isError && goals.length === 0 ? (
          <ErrorState
            title="Unable to load goals"
            description="Failed to retrieve your savings milestones. Check your connection or retry."
            onRetry={() => refetch()}
          />
        ) : goals.length === 0 ? (
          <EmptyState
            title="No savings milestones established"
            description="Define financial goals to track capital accumulation and calculate exact monthly savings velocity."
            actionLabel="Create First Goal"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g: any) => {
              const cur = parseFloat(g.current_amount) || 0;
              const tar = parseFloat(g.target_amount) || 1;
              const pct = Math.min(100, Math.round((cur / tar) * 100));
              const remaining = Math.max(0, tar - cur);
              const deadline = g.deadline || g.target_date;

              let requiredMonthly: number | null = null;
              let monthsRemaining: number | null = null;
              if (deadline) {
                const now = new Date();
                const end = new Date(deadline);
                monthsRemaining = Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
                requiredMonthly = Math.round(remaining / monthsRemaining);
              }

              return (
                <div key={g.id} className="double-bezel">
                  <div className="double-bezel-inner p-5 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9EDFA] text-[#4056A1] shrink-0">
                            <Target className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[#191522] block leading-tight">
                              {g.title || g.name}
                            </h3>
                            {deadline && (
                              <span className="text-[10px] font-mono text-[#898390]">
                                Target: {new Date(deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-mono font-black text-[#059669]">
                          {pct}%
                        </span>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs items-baseline">
                          <span className="font-mono font-bold text-[#191522]">
                            {formatCurrency(cur, user?.currency)}
                          </span>
                          <span className="font-mono text-[#898390] text-[11px]">
                            of {formatCurrency(tar, user?.currency)}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-[#F1F0EC] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              pct >= 100 ? 'bg-[#059669]' : 'bg-[#4056A1]'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Planning Telemetry */}
                      <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E4E2DC] text-[11px] space-y-1">
                        <div className="flex justify-between text-[#625D69]">
                          <span>Remaining Capital:</span>
                          <span className="font-mono font-bold text-[#191522]">
                            {formatCurrency(remaining, user?.currency)}
                          </span>
                        </div>
                        {requiredMonthly !== null && (
                          <div className="flex justify-between text-[#625D69]">
                            <span>Required Run-Rate:</span>
                            <span className="font-mono font-bold text-[#4056A1]">
                              {formatCurrency(requiredMonthly, user?.currency)} / mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#E4E2DC] flex items-center justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Coins className="h-3 w-3" />}
                        onClick={() => {
                          setSelectedGoal(g);
                          setContributeAmount('');
                          setIsContributeOpen(true);
                        }}
                        className="touch-target"
                      >
                        Contribute Funds
                      </Button>

                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1.5 rounded-lg text-[#898390] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-all"
                        aria-label="Delete goal"
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

        {/* Modal: Create Goal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Establish Savings Milestone"
        >
          <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-xs font-bold text-[#DC2626]">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#191522] block">Milestone Title</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Emergency Reserve, Down Payment"
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#191522] block">Target Amount ({user?.currency || 'INR'})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#191522] block">Current Capital Seeded</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#191522] block">Target Maturity Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Establish Goal
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Contribute Capital */}
        <Modal
          isOpen={isContributeOpen}
          onClose={() => setIsContributeOpen(false)}
          title={`Allocate Capital to "${selectedGoal?.title || selectedGoal?.name}"`}
        >
          <form onSubmit={handleContribute} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E4E2DC] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#898390]">Current Progress:</span>
                <span className="font-mono font-bold text-[#191522]">
                  {formatCurrency(selectedGoal?.current_amount || 0, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898390]">Target Goal:</span>
                <span className="font-mono font-bold text-[#191522]">
                  {formatCurrency(selectedGoal?.target_amount || 0, user?.currency)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#191522] block">
                Contribution Amount ({user?.currency || 'INR'})
              </label>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] p-2.5 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsContributeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Allocate Capital
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
