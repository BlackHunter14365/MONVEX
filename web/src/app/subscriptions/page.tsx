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

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterFrequency, setFilterFrequency] = useState<string>('ALL');

  // Add Subscription Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecurringPayments();
      setSubscriptions(Array.isArray(data) ? data : data?.results || []);
    } catch {
      toast.error('Failed to load subscriptions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

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
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Recurring Obligations & Subscriptions"
          description="Audit recurring monthly cash drain, track upcoming renewal schedules, and eliminate silent subscription creep."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubscriptions}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold touch-target"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-sm touch-target"
              >
                Add Subscription
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. DOUBLE-BEZEL RECURRING BURN HERO
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 7 cols: Aggregates */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2 text-[#898390]">
                  <Repeat className="h-4 w-4 text-[#2563EB]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    Automated Recurring Burn Rate
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-6 sm:gap-8">
                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase tracking-wider">
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

                  <div className="h-10 w-px bg-[#E4E2DC] hidden sm:block self-center" />

                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase tracking-wider">
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

                  <div className="h-10 w-px bg-[#E4E2DC] hidden sm:block self-center" />

                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase tracking-wider">
                      Active Subscriptions
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-[#191522] tnum">
                      {subscriptions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Telemetry */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#E4E2DC] lg:pl-6">
                <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1">
                  <span className="text-[10px] font-mono text-[#625D69] block uppercase">Next 30 Days Due</span>
                  <div className="text-xl font-mono font-black text-[#E11D48] tnum">
                    {formatCurrency(upcoming30DaysTotal, user?.currency)}
                  </div>
                  <span className="text-[10px] text-[#625D69] font-medium block">
                    {upcomingRenewals.filter((s) => s.diffDays >= 0 && s.diffDays <= 30).length} upcoming bills
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1">
                  <span className="text-[10px] font-mono text-[#625D69] block uppercase">Avg Cost / Service</span>
                  <div className="text-xl font-mono font-black text-[#191522] tnum">
                    {formatCurrency(avgCostPerService, user?.currency)}
                  </div>
                  <span className="text-[10px] text-[#059669] font-bold block">
                    Per active provider
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. RENEWAL TIMELINE STRIP (Upcoming Deadlines)
            ========================================================================= */}
        {upcomingRenewals.length > 0 && (
          <div className="double-bezel">
            <div className="double-bezel-inner p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#4056A1]" />
                  <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                    Chronological Renewal Horizon
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#898390]">
                  Sorted by payment deadline
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {upcomingRenewals.slice(0, 6).map((sub) => {
                  const isUrgent = sub.diffDays <= 3 && sub.diffDays >= 0;
                  const isPast = sub.diffDays < 0;

                  return (
                    <div
                      key={sub.id}
                      className={cn(
                        'min-w-[190px] p-3.5 rounded-xl border flex-shrink-0 space-y-2',
                        isUrgent
                          ? 'bg-[#FFF1F2] border-[#FECDD3]'
                          : isPast
                          ? 'bg-[#F6F5F1] border-[#E4E2DC]'
                          : 'bg-white border-[#E4E2DC]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#191522] truncate max-w-[110px]">
                          {sub.name}
                        </span>
                        <Badge
                          variant={isUrgent ? 'danger' : isPast ? 'outline' : 'neutral'}
                          size="sm"
                        >
                          {isPast
                            ? 'Overdue'
                            : sub.diffDays === 0
                            ? 'Today'
                            : sub.diffDays === 1
                            ? 'Tomorrow'
                            : `${sub.diffDays}d left`}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#E4E2DC]/60">
                        <span className="text-[10px] font-mono text-[#898390]">
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
          </div>
        )}

        {/* =========================================================================
            3. SUBSCRIPTIONS DIRECTORY & MANAGEMENT
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 space-y-5">
            {/* Filter Pills & Directory Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC]">
              <div>
                <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                  Managed Subscriptions ({subscriptions.length})
                </h3>
                <span className="text-[10px] text-[#898390] block">
                  Click any subscription to audit or remove
                </span>
              </div>

              {/* Frequency Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['ALL', 'MONTHLY', 'YEARLY', 'WEEKLY'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFilterFrequency(freq)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all touch-target',
                      filterFrequency === freq
                        ? 'bg-[#2A1F3D] text-white shadow-sm'
                        : 'bg-[#F6F5F1] text-[#625D69] hover:bg-[#EAE8E1]'
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriptions Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <EmptyState
                title={
                  subscriptions.length === 0
                    ? 'No subscriptions registered'
                    : `No ${filterFrequency.toLowerCase()} subscriptions found`
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubscriptions.map((sub) => {
                  const Icon = getServiceIcon(sub.name);
                  const amt = Number(sub.amount) || 0;
                  const monthlyEquiv =
                    sub.frequency === 'YEARLY'
                      ? amt / 12
                      : sub.frequency === 'WEEKLY'
                      ? amt * 4.33
                      : amt;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-white border border-[#E4E2DC] hover:border-[#CBD5E1] transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#F6F5F1] text-[#2A1F3D] flex items-center justify-center font-bold border border-[#E4E2DC]">
                            <Icon className="h-4 w-4 text-[#4056A1]" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#191522] block">{sub.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] uppercase">
                              {sub.frequency}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id)}
                          className="text-[#898390] hover:text-[#E11D48] p-1.5 transition-colors touch-target"
                          title="Remove subscription"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-[#E4E2DC] flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-[#898390] uppercase block">Next Due</span>
                          <span className="text-xs font-bold text-[#191522]">
                            {sub.next_due_date || 'Upcoming'}
                          </span>
                        </div>

                        <div className="text-right">
                          <FinancialAmount
                            amount={amt}
                            currency={user?.currency}
                            size="md"
                            type="neutral"
                            showSign={false}
                          />
                          {sub.frequency === 'YEARLY' && (
                            <span className="text-[9px] font-mono text-[#898390] block">
                              ~{formatCurrency(monthlyEquiv, user?.currency)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            4. ADD SUBSCRIPTION MODAL
            ========================================================================= */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Register Recurring Subscription"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#625D69] mb-1 block">Service Name</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Spotify Premium, Cult.fit, AWS Cloud"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Billing Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="649.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Billing Cycle</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly / Annual</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#625D69] mb-1 block">Next Renewal Date</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                required
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E2DC]">
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                Record Subscription
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
