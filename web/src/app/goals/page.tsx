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
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
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
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        {/* =========================================================================
            1. HEADER & OVERVIEW
            ========================================================================= */}
        <PageHeader
          eyebrow="CAPITAL ACCUMULATION"
          title="Savings Milestones & Goals"
          description="Structured capital accumulation telemetry: target deadlines, progress tracking, and required monthly velocity."
          actionSlot={
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-[#6865E8] hover:bg-[#5b58db] text-white shadow-xs rounded-2xl px-5 py-2.5 font-semibold text-xs"
            >
              Create Milestone
            </Button>
          }
        />

        {/* =========================================================================
            2. SUMMARY STAT CARDS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Cumulative Target Capital
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalTarget} currency={user?.currency} size="2xl" type="neutral" />
              <p className="text-xs text-[#77798A] font-medium mt-1">Total capital across all milestones</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Accumulated Balance
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalSaved} currency={user?.currency} size="2xl" type="income" />
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8FBF4] text-[#16745C]">
                  {overallPct}% reached
                </span>
                <span className="text-xs text-[#77798A]">of aggregate targets</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Active Programs
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">{goals.length} Concurrent Milestones</div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Real-time progress telemetry</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. GOALS GRID
            ========================================================================= */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
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
                <div
                  key={g.id}
                  className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs hover:border-[#6865E8]/40 hover:shadow-md transition-all flex flex-col justify-between h-full space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header Row: Icon + Title + Percent Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ECEBFF] text-[#6865E8] shrink-0">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#20212B] block leading-tight">
                            {g.title || g.name}
                          </h3>
                          {deadline ? (
                            <span className="text-[10px] font-mono text-[#77798A]">
                              Target: {new Date(deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#77798A]">Open Horizon</span>
                          )}
                        </div>
                      </div>

                      <span className={cn(
                        'text-xs font-mono font-bold px-2.5 py-1 rounded-full border',
                        pct >= 100
                          ? 'bg-[#E8FBF4] text-[#16745C] border-[#B6F0DE]'
                          : 'bg-[#ECEBFF] text-[#6865E8] border-[#D8D5FB]'
                      )}>
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Track & Amounts */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-mono font-bold text-[#20212B]">
                            {formatCurrency(cur, user?.currency)}
                          </span>
                          <span className="text-xs font-mono text-[#77798A]">
                            of {formatCurrency(tar, user?.currency)}
                          </span>
                        </div>
                        <span className="text-xs text-[#77798A] font-medium">
                          {formatCurrency(remaining, user?.currency)} to go
                        </span>
                      </div>

                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${g.title || g.name} milestone progress`}
                        className="w-full h-2.5 bg-[#ECEBFF] rounded-full overflow-hidden"
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            pct >= 100 ? 'bg-[#75DCC0]' : 'bg-[#6865E8]'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Planning Telemetry */}
                    <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] text-xs space-y-2">
                      <div className="flex justify-between items-center text-[#77798A]">
                        <span>Remaining Capital:</span>
                        <span className="font-mono font-bold text-[#20212B]">
                          {formatCurrency(remaining, user?.currency)}
                        </span>
                      </div>
                      {requiredMonthly !== null && (
                        <div className="flex justify-between items-center text-[#77798A]">
                          <span>Required Run-Rate:</span>
                          <span className="font-mono font-bold text-[#6865E8]">
                            {formatCurrency(requiredMonthly, user?.currency)} / mo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-[#E7E6F0] flex items-center justify-between">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Coins className="h-3.5 w-3.5 text-[#6865E8]" />}
                      onClick={() => {
                        setSelectedGoal(g);
                        setContributeAmount('');
                        setIsContributeOpen(true);
                      }}
                      className="rounded-xl font-semibold text-xs border-[#E7E6F0] hover:bg-[#ECEBFF] hover:text-[#6865E8]"
                    >
                      Contribute Funds
                    </Button>

                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECDD3] transition-all focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none"
                      aria-label={`Delete savings goal ${g.title || g.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
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
          description="Track capital accumulation towards your major milestones with automated runway calculations."
        >
          <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECDD3] text-xs font-bold text-[#E76D7A]">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Milestone Title</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Emergency Reserve, Real Estate Down Payment"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">
                  Target Amount ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Current Capital Seeded</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Target Maturity Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
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
          description="Record a capital contribution to accelerate this milestone's maturity."
        >
          <form onSubmit={handleContribute} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#77798A]">Current Progress:</span>
                <span className="font-mono font-bold text-[#20212B]">
                  {formatCurrency(selectedGoal?.current_amount || 0, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#77798A]">Target Goal:</span>
                <span className="font-mono font-bold text-[#20212B]">
                  {formatCurrency(selectedGoal?.target_amount || 0, user?.currency)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">
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
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setIsContributeOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
                Allocate Capital
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
