'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  CreditCard,
  Tv,
  Wifi,
  Dumbbell,
  Zap,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSubscriptionsQuery } from '@/hooks/queries/useSubscriptionsQuery';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: rawSubscriptions, isLoading, refetch: fetchSubscriptions } = useSubscriptionsQuery();
  const subscriptions: any[] = useMemo(() => {
    return Array.isArray(rawSubscriptions) ? rawSubscriptions : rawSubscriptions?.results || [];
  }, [rawSubscriptions]);

  const [filterFrequency, setFilterFrequency] = useState<string>('ALL');

  // Add Subscription Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setIsSaving(true);

    try {
      await api.createRecurringPayment({
        name,
        amount: Number(amount),
        frequency,
        next_due_date: nextDueDate,
      });
      toast.success(`✓ Subscription "${name}" added.`);
      setIsAddOpen(false);
      setName('');
      setAmount('');
      setNextDueDate(new Date().toISOString().split('T')[0]);
      fetchSubscriptions();
    } catch {
      toast.error('Failed to save subscription.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRecurringPayment(id);
      toast.info('Subscription removed.');
      fetchSubscriptions();
    } catch {
      toast.error('Failed to delete subscription.');
    }
  };

  // Calculations
  const totalMonthly = useMemo(() => {
    return subscriptions.reduce((acc, s) => {
      const amt = Number(s.amount) || 0;
      if (s.frequency === 'YEARLY') return acc + amt / 12;
      if (s.frequency === 'WEEKLY') return acc + amt * 4.33;
      if (s.frequency === 'DAILY') return acc + amt * 30;
      return acc + amt;
    }, 0);
  }, [subscriptions]);

  const totalAnnual = totalMonthly * 12;

  const avgCostPerService = useMemo(() => {
    return subscriptions.length > 0 ? totalMonthly / subscriptions.length : 0;
  }, [subscriptions, totalMonthly]);

  // Upcoming renewals within 30 days
  const upcomingRenewals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions
      .filter((s) => s.next_due_date)
      .map((s) => {
        const dueDate = new Date(s.next_due_date);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...s, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [subscriptions]);

  const upcoming30DaysTotal = useMemo(() => {
    return upcomingRenewals
      .filter((s) => s.diffDays >= 0 && s.diffDays <= 30)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [upcomingRenewals]);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (filterFrequency === 'ALL') return subscriptions;
    return subscriptions.filter((s) => s.frequency === filterFrequency);
  }, [subscriptions, filterFrequency]);

  const getServiceIcon = (serviceName: string) => {
    const lower = (serviceName || '').toLowerCase();
    if (lower.includes('netflix') || lower.includes('prime') || lower.includes('disney') || lower.includes('youtube') || lower.includes('tv')) {
      return Tv;
    }
    if (lower.includes('wifi') || lower.includes('broadband') || lower.includes('fiber') || lower.includes('internet')) {
      return Wifi;
    }
    if (lower.includes('gym') || lower.includes('fitness') || lower.includes('cult')) {
      return Dumbbell;
    }
    if (lower.includes('electricity') || lower.includes('power') || lower.includes('gas')) {
      return Zap;
    }
    return Repeat;
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="RECURRING OBLIGATIONS"
          title="Subscriptions & Recurring Cash Drain"
          description="Audit recurring monthly cash drain, track upcoming renewal schedules, and eliminate silent subscription creep."
          actionSlot={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => { fetchSubscriptions(); }}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B]"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAddOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-[#6865E8] hover:bg-[#5b58db] text-white text-xs font-semibold rounded-2xl shadow-xs"
              >
                Add Subscription
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. RECURRING BURN HERO (Aurora Glass)
            ========================================================================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E6F0] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 7 cols: Aggregates */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-[#77798A]">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                  <Repeat className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                  Automated Recurring Burn Rate
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-6 sm:gap-10">
                <div>
                  <span className="text-[11px] font-mono text-[#77798A] block uppercase tracking-wider font-semibold">
                    Monthly Burn Rate
                  </span>
                  <FinancialAmount
                    amount={totalMonthly}
                    currency={user?.currency}
                    size="2xl"
                    type="expense"
                    showSign={false}
                  />
                </div>

                <div className="h-12 w-px bg-[#E7E6F0] hidden sm:block self-center" />

                <div>
                  <span className="text-[11px] font-mono text-[#77798A] block uppercase tracking-wider font-semibold">
                    Annualized Drain
                  </span>
                  <FinancialAmount
                    amount={totalAnnual}
                    currency={user?.currency}
                    size="xl"
                    type="expense"
                    showSign={false}
                  />
                </div>

                <div className="h-12 w-px bg-[#E7E6F0] hidden sm:block self-center" />

                <div>
                  <span className="text-[11px] font-mono text-[#77798A] block uppercase tracking-wider font-semibold">
                    Active Services
                  </span>
                  <span className="text-2xl font-mono font-bold text-[#20212B]">
                    {subscriptions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Telemetry Capsules */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#E7E6F0] lg:pl-8">
              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1.5">
                <span className="text-[10px] font-mono text-[#77798A] block uppercase font-bold">Next 30 Days Due</span>
                <div className="text-xl font-mono font-bold text-[#E76D7A]">
                  {formatCurrency(upcoming30DaysTotal, user?.currency)}
                </div>
                <span className="text-[11px] text-[#77798A] font-medium block">
                  {upcomingRenewals.filter((s) => s.diffDays >= 0 && s.diffDays <= 30).length} upcoming bills
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1.5">
                <span className="text-[10px] font-mono text-[#77798A] block uppercase font-bold">Avg Cost / Service</span>
                <div className="text-xl font-mono font-bold text-[#20212B]">
                  {formatCurrency(avgCostPerService, user?.currency)}
                </div>
                <span className="text-[11px] text-[#16745C] font-semibold block">
                  Per active provider
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. RENEWAL TIMELINE STRIP (Upcoming Deadlines - Monvex Schedule)
            ========================================================================= */}
        {upcomingRenewals.length > 0 && (
          <div className="rounded-3xl bg-white border border-[#E7E6F0] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-bold text-[#20212B]">
                  Upcoming Payment Schedule
                </h3>
              </div>
              <span className="text-xs font-mono text-[#77798A]">
                Sorted by payment deadline
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {upcomingRenewals.slice(0, 6).map((sub) => {
                const isUrgent = sub.diffDays <= 3 && sub.diffDays >= 0;
                const isPast = sub.diffDays < 0;
                const Icon = getServiceIcon(sub.name);

                return (
                  <div
                    key={sub.id}
                    className={cn(
                      'min-w-[210px] p-4 rounded-2xl border flex-shrink-0 space-y-3 transition-all',
                      isUrgent
                        ? 'bg-[#FEF2F2] border-[#FECDD3]'
                        : isPast
                        ? 'bg-[#F8F7FC] border-[#E7E6F0]'
                        : 'bg-white border-[#E7E6F0] hover:border-[#6865E8]/40 hover:shadow-xs'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[#20212B] truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          isUrgent
                            ? 'bg-[#FDEEF0] text-[#E76D7A] border-[#FECDD3]'
                            : isPast
                            ? 'bg-[#F8F7FC] text-[#77798A] border-[#E7E6F0]'
                            : 'bg-[#ECEBFF] text-[#6865E8] border-[#D8D5FB]'
                        )}
                      >
                        {isPast
                          ? 'Overdue'
                          : sub.diffDays === 0
                          ? 'Today'
                          : sub.diffDays === 1
                          ? 'Tomorrow'
                          : `${sub.diffDays}d left`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E7E6F0]">
                      <span className="text-[11px] font-mono text-[#77798A]">
                        {sub.next_due_date}
                      </span>
                      <FinancialAmount
                        amount={sub.amount}
                        currency={user?.currency}
                        size="sm"
                        showSign={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            3. SUBSCRIPTIONS DIRECTORY & MANAGEMENT
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] shadow-xs p-7 space-y-6">
          {/* Filter Pills & Directory Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E6F0]">
            <div>
              <h3 className="text-base font-bold text-[#20212B]">
                Active Subscriptions ({subscriptions.length})
              </h3>
              <p className="text-xs text-[#77798A] mt-0.5">
                Manage recurring retainers, software licenses, and utility bills
              </p>
            </div>

            {/* Frequency Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0]" role="group" aria-label="Filter subscriptions by frequency">
              {['ALL', 'MONTHLY', 'YEARLY', 'WEEKLY'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFilterFrequency(freq)}
                  aria-pressed={filterFrequency === freq}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filterFrequency === freq
                      ? 'bg-[#6865E8] text-white shadow-xs'
                      : 'text-[#77798A] hover:text-[#20212B]'
                  )}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Subscriptions Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Skeleton className="h-40 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <EmptyState
              title={
                filterFrequency !== 'ALL'
                  ? `No ${filterFrequency.toLowerCase()} subscriptions`
                  : 'No subscriptions active'
              }
              description={
                subscriptions.length === 0
                  ? 'Track Netflix, Spotify, gym memberships, utilities, or SaaS bills to prevent subscription creep.'
                  : 'Try selecting a different frequency filter.'
              }
              actionLabel={subscriptions.length === 0 ? 'Add First Subscription' : undefined}
              onAction={subscriptions.length === 0 ? () => setIsAddOpen(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubscriptions.map((sub) => {
                const Icon = getServiceIcon(sub.name);
                const amt = Number(sub.amount) || 0;

                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-3xl bg-white border border-[#E7E6F0] hover:border-[#6865E8]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-[#20212B] block">{sub.name}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F8F7FC] text-[#6865E8] border border-[#E7E6F0] uppercase">
                            {sub.frequency}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECDD3] transition-all focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none"
                        aria-label={`Remove subscription ${sub.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[#E7E6F0] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#77798A] uppercase block">Next Due</span>
                        <span className="text-xs font-bold text-[#20212B]">
                          {sub.next_due_date || 'Upcoming'}
                        </span>
                      </div>

                      <div className="text-right">
                        <FinancialAmount
                          amount={amt}
                          currency={user?.currency}
                          size="lg"
                          type="neutral"
                          showSign={false}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Add Subscription */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Establish Recurring Subscription"
          description="Register automated services and periodic liabilities for forward burn modeling."
        >
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Service / Vendor Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Netflix, AWS, Cult.fit, Fiber Broadband"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">
                  Billing Amount ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 649"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Frequency Cadence</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Next Payment Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setIsAddOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
                Save Subscription
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
