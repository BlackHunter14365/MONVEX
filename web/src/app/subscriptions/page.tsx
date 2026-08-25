'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function SubscriptionsPage() {
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Subscription Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubscriptions = async () => {
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

  const totalMonthly = subscriptions.reduce((acc, s) => {
    const amt = Number(s.amount) || 0;
    if (s.frequency === 'YEARLY') return acc + amt / 12;
    if (s.frequency === 'WEEKLY') return acc + amt * 4;
    return acc + amt;
  }, 0);

  const totalAnnual = totalMonthly * 12;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Recurring Obligations & Subscriptions"
          description="Audit recurring monthly cash drain, track upcoming renewal dates, and eliminate duplicate or forgotten memberships."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubscriptions}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-bold shadow-md"
              >
                Add Subscription
              </Button>
            </div>
          }
        />

        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardReveal index={0} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Monthly Recurring Burn</span>
            <div className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              <AnimatedValue value={totalMonthly} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              Fixed commitments per month
            </span>
          </CardReveal>

          <CardReveal index={1} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Annualized Obligation</span>
            <div className="text-xl sm:text-2xl font-black text-[#E11D48] tracking-tight">
              <AnimatedValue value={totalAnnual} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              12-month projected drain
            </span>
          </CardReveal>

          <CardReveal index={2} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Active Memberships</span>
            <div className="text-xl sm:text-2xl font-black text-[#2563EB] tracking-tight">
              <AnimatedValue value={subscriptions.length} type="number" decimals={0} />
            </div>
            <span className="text-[11px] text-[#059669] font-bold block">
              ✓ Continuous audit active
            </span>
          </CardReveal>

          <CardReveal index={3} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Optimization Potential</span>
            <div className="text-xl sm:text-2xl font-black text-[#059669] tracking-tight">
              <AnimatedValue value={totalMonthly * 0.25} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              By pruning unused services
            </span>
          </CardReveal>
        </div>

        {/* SUBSCRIPTIONS GRID */}
        <div className="editorial-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
            <h3 className="text-sm font-black text-[#172033]">
              Active Recurring Services & Fixed Bills
            </h3>
            <span className="text-xs font-mono font-bold text-[#5F6878]">
              {subscriptions.length} Tracked
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
              No recurring payments recorded. Click "Add Subscription" to track Netflix, Spotify, Rent, or Wi-Fi.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="editorial-card p-5 rounded-xl space-y-3 flex flex-col justify-between hover:border-[#172033]/40 transition-all shadow-subtle"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-[#172033] text-white flex items-center justify-center font-bold">
                        <Repeat className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-[#172033] block">{sub.name}</span>
                        <span className="text-[10px] text-[#858D9A] font-mono">{sub.frequency}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-[#858D9A] hover:text-[#E11D48] p-1 transition-all"
                      title="Remove subscription"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#E4E2DC]/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#858D9A] block uppercase font-mono font-bold">Next Due</span>
                      <span className="text-xs font-bold text-[#172033]">{sub.next_due_date || 'Upcoming'}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#858D9A] block uppercase font-mono font-bold">Amount</span>
                      <span className="text-sm font-mono font-black text-[#172033]">
                        {formatCurrency(sub.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ADD MODAL */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add Recurring Obligation"
          subtitle="Track recurring streaming services, gym memberships, utilities, or SaaS bills."
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="swiss-eyebrow mb-1 block">Service / Provider Name</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Spotify Premium, Cult.fit Gym, ACT Broadband"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="swiss-eyebrow mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="649"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                />
              </div>

              <div>
                <label className="swiss-eyebrow mb-1 block">Billing Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly / Annual</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>
            </div>

            <div>
              <label className="swiss-eyebrow mb-1 block">Next Renewal / Due Date</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                required
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E2DC]">
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                Save Subscription
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
