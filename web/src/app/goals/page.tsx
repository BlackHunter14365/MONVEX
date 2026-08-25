'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Plane,
  Trash2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Compass,
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
import { useGoalsQuery } from '@/hooks/queries/useGoalsQuery';
import {
  useCreateGoalMutation,
  useContributeGoalMutation,
  useDeleteGoalMutation,
} from '@/hooks/mutations/useGoalMutations';
import { AnimatedValue, CardReveal } from '@/components/motion';

import { triggerConfetti } from '@/components/ui/ConfettiCelebration';

export default function GoalsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: rawGoals, isLoading } = useGoalsQuery();
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
      toast.success('Savings goal established!');
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
      toast.error('Please enter a valid contribution amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await contributeGoalMutation.mutateAsync({
        goalId: selectedGoal.id,
        amount,
      });
      triggerConfetti();
      toast.success(`Allocated ${formatCurrency(amount, user?.currency)} to ${selectedGoal.title || selectedGoal.name}`);
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
      toast.success('Goal removed.');
    } catch {
      toast.error('Failed to delete goal.');
    }
  };

  const totalTarget = goals.reduce((acc: number, g: any) => acc + (parseFloat(g.target_amount) || 0), 0);
  const totalSaved = goals.reduce((acc: number, g: any) => acc + (parseFloat(g.current_amount) || 0), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Savings goals"
          description="Build toward the things that matter with proactive velocity tracking and monthly accumulation targets."
          actionSlot={
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create goal
            </Button>
          }
        />

        {/* Overview Stat Card */}
        <CardReveal className="editorial-card p-6 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <span className="swiss-eyebrow">Total target</span>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="swiss-metric text-2xl text-[#172033]">
                  <AnimatedValue value={totalTarget} currency={user?.currency} />
                </div>
              )}
              <span className="text-[11px] text-[#858D9A] block">Cumulative targets</span>
            </div>

            <div className="space-y-1.5">
              <span className="swiss-eyebrow">Total accumulated</span>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="swiss-metric text-2xl text-[#059669]">
                  <AnimatedValue value={totalSaved} currency={user?.currency} />
                </div>
              )}
              <span className="text-[11px] font-bold text-[#059669] block">
                {overallPct}% of target reached
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="swiss-eyebrow">Remaining buffer</span>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="swiss-metric text-2xl text-[#172033]">
                  <AnimatedValue value={Math.max(0, totalTarget - totalSaved)} currency={user?.currency} />
                </div>
              )}
              <span className="text-[11px] text-[#858D9A] block">Across all active goals</span>
            </div>
          </div>
        </CardReveal>

        {/* Goals Grid */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-52 w-full rounded-2xl" />
              <Skeleton className="h-52 w-full rounded-2xl" />
            </div>
          ) : goals.length === 0 ? (
            <EmptyState
              title="No savings goals established"
              description="Define short and long-term milestones to track your wealth accumulation velocity."
              actionLabel="Create your first goal"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((g: any, gIdx: number) => {
                const cur = parseFloat(g.current_amount) || 0;
                const tar = parseFloat(g.target_amount) || 1;
                const pct = Math.min(100, Math.round((cur / tar) * 100));
                const deadline = g.deadline || g.target_date;

                let requiredMonthly = null;
                if (deadline) {
                  const now = new Date();
                  const end = new Date(deadline);
                  const monthsRemaining = Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
                  const remainingToSave = Math.max(0, tar - cur);
                  requiredMonthly = Math.round(remainingToSave / monthsRemaining);
                }

                return (
                  <CardReveal
                    key={g.id}
                    index={gIdx}
                    hoverLift={true}
                    className="editorial-card p-5 sm:p-6 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#059669] shrink-0">
                            <Plane className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[#172033] block leading-tight">
                              {g.title || g.name}
                            </h3>
                            <span className="text-[11px] font-medium text-[#5F6878]">
                              {formatCurrency(cur, user?.currency)} of {formatCurrency(tar, user?.currency)}
                            </span>
                          </div>
                        </div>
                        <span className="text-lg font-black text-[#059669]">
                          {pct}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-[#F0EFEA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Target Date & Required Pace */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E2DC] text-[11px]">
                        <div>
                          <span className="text-[#858D9A] block">Target date</span>
                          <span className="font-bold text-[#172033]">
                            {deadline
                              ? new Date(deadline).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Ongoing'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#858D9A] block">Required monthly</span>
                          <span className="font-bold text-[#172033]">
                            {requiredMonthly
                              ? `${formatCurrency(requiredMonthly, user?.currency)}`
                              : 'Flexible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#E4E2DC] flex items-center justify-between gap-2">
                      <Button
                        onClick={() => {
                          setSelectedGoal(g);
                          setIsContributeOpen(true);
                        }}
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                      >
                        + Add funds
                      </Button>

                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-[#858D9A] hover:text-[#E11D48] p-1.5 rounded-lg hover:bg-[#FFF1F2] transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardReveal>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Goal Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Savings Goal"
          description="Establish an aspirational milestone and required accumulation pace."
          maxWidth="sm"
        >
          <form onSubmit={handleCreateGoal} className="space-y-4 pt-1">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1 block">Goal Name</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Travel Fund, Emergency Buffer"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#5F6878] mb-1 block">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5F6878] mb-1 block">Starting Saved</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1 block">Target Completion Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#172033] focus:border-[#172033] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Establish Goal
              </Button>
            </div>
          </form>
        </Modal>

        {/* Contribute Funds Modal */}
        <Modal
          isOpen={isContributeOpen}
          onClose={() => setIsContributeOpen(false)}
          title={`Add Funds: ${selectedGoal?.title || selectedGoal?.name || 'Goal'}`}
          description="Allocate saved cash toward this milestone."
          maxWidth="sm"
        >
          <form onSubmit={handleContribute} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-[#5F6878] mb-1 block">Contribution Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsContributeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Confirm Allocation
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
