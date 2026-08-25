'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingDown,
  Sparkles,
  Zap,
  Calendar,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Sliders,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function DebtPage() {
  const toast = useToast();

  const [debtOverview, setDebtOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prepayment Simulator Parameters
  const [selectedPrincipal, setSelectedPrincipal] = useState<number>(500000);
  const [selectedRate, setSelectedRate] = useState<number>(10.5);
  const [selectedEmi, setSelectedEmi] = useState<number>(10747);
  const [extraPayment, setExtraPayment] = useState<number>(2500);

  // Simulation Result
  const [simResult, setSimResult] = useState<any>(null);

  const fetchDebtData = async () => {
    try {
      const data = await api.getDebtPlanner();
      setDebtOverview(data);

      // Auto-select first loan if available
      if (data?.items && data.items.length > 0) {
        const first = data.items[0];
        setSelectedPrincipal(first.remaining_balance || first.principal_amount);
        setSelectedRate(first.interest_rate_pct);
        setSelectedEmi(first.monthly_emi);
      }
    } catch {
      toast.error('Failed to load debt overview.');
    } finally {
      setIsLoading(false);
    }
  };

  const runSimulation = async () => {
    try {
      const res = await api.simulateDebt({
        principal: selectedPrincipal,
        interest_rate: selectedRate,
        current_emi: selectedEmi,
        extra_payment: extraPayment,
      });
      setSimResult(res);
    } catch {
      // handled
    }
  };

  useEffect(() => {
    fetchDebtData();
  }, []);

  useEffect(() => {
    runSimulation();
  }, [selectedPrincipal, selectedRate, selectedEmi, extraPayment]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Debt & Loan Amortization Planner"
          description="Track active EMIs, view remaining loan interest liabilities, and simulate accelerated payoff scenarios to become debt-free faster."
        />

        {/* TOP METRICS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardReveal index={0} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Total Outstanding Principal</span>
            <div className="text-xl sm:text-2xl font-black text-[#E11D48] tracking-tight">
              <AnimatedValue value={debtOverview?.total_remaining_balance || 0} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              Across {debtOverview?.total_liabilities_count || 0} active loans
            </span>
          </CardReveal>

          <CardReveal index={1} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Total Monthly EMI Outflow</span>
            <div className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              <AnimatedValue value={debtOverview?.total_monthly_emi || 0} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              Fixed monthly obligation
            </span>
          </CardReveal>

          <CardReveal index={2} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Simulated Interest Saved</span>
            <div className="text-xl sm:text-2xl font-black text-[#059669] tracking-tight">
              <AnimatedValue value={simResult?.interest_saved || 0} />
            </div>
            <span className="text-[11px] text-[#059669] font-bold block">
              With +{formatCurrency(extraPayment)}/mo extra
            </span>
          </CardReveal>

          <CardReveal index={3} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Repayment Acceleration</span>
            <div className="text-xl sm:text-2xl font-black text-[#2563EB] tracking-tight">
              <AnimatedValue value={simResult?.months_saved || 0} type="number" decimals={0} suffix=" Months" />
            </div>
            <span className="text-[11px] text-[#2563EB] font-bold block">
              Earlier debt-free date!
            </span>
          </CardReveal>
        </div>

        {/* 2-COLUMN DEBT LAB */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: EXTRA PREPAYMENT SIMULATOR */}
          <div className="lg:col-span-6 space-y-5">
            <div className="editorial-card p-6 rounded-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#2563EB]" />
                  <h3 className="text-sm font-black text-[#172033]">
                    Accelerated Prepayment Simulator
                  </h3>
                </div>
                <Badge variant="success" size="sm">Deterministic Engine</Badge>
              </div>

              {/* Loan Selector if user has loans */}
              {(debtOverview?.items || []).length > 0 && (
                <div className="space-y-1.5">
                  <label className="swiss-eyebrow block">Select Active Loan to Simulate</label>
                  <select
                    onChange={(e) => {
                      const item = debtOverview.items.find((i: any) => i.id === e.target.value);
                      if (item) {
                        setSelectedPrincipal(item.remaining_balance || item.principal_amount);
                        setSelectedRate(item.interest_rate_pct);
                        setSelectedEmi(item.monthly_emi);
                      }
                    }}
                    className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033]"
                  >
                    {debtOverview.items.map((i: any) => (
                      <option key={i.id} value={i.id}>
                        {i.name} — Balance: {formatCurrency(i.remaining_balance)} @ {i.interest_rate_pct}%
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sliders */}
              <div className="space-y-4 pt-2 border-t border-[#E4E2DC]/80">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">Extra Monthly Prepayment</span>
                    <span className="font-mono font-bold text-[#059669]">
                      +{formatCurrency(extraPayment)} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="500"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                    className="w-full accent-[#059669] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#858D9A] font-semibold">
                    <span>+₹500/mo</span>
                    <span>+₹5,000/mo</span>
                    <span>+₹15,000/mo</span>
                  </div>
                </div>
              </div>

              {/* Accelerated Comparison Card */}
              {simResult && (
                <div className="p-5 rounded-2xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-white border border-[#E4E2DC] space-y-1">
                      <span className="text-[10px] text-[#858D9A] block font-sans font-bold uppercase">Standard Timeline</span>
                      <div className="text-xs font-bold text-[#5F6878]">{simResult.baseline_payoff_date}</div>
                      <span className="text-[10px] text-[#858D9A] block">Tenure: {simResult.baseline_tenure_months}M</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <span className="text-[10px] text-[#059669] block font-sans font-bold uppercase">Accelerated Timeline</span>
                      <div className="text-xs font-black text-[#059669]">{simResult.accelerated_payoff_date}</div>
                      <span className="text-[10px] text-[#059669] font-bold block">Tenure: {simResult.accelerated_tenure_months}M</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">Total Interest Reduction:</span>
                    <span className="font-mono font-black text-[#059669]">
                      Save {formatCurrency(simResult.interest_saved)}!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: REGISTERED LOANS & AMORTIZATION BREAKDOWN */}
          <div className="lg:col-span-6 space-y-4">
            <div className="editorial-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                <h3 className="text-sm font-black text-[#172033]">
                  Active Loan Liabilities ({debtOverview?.items?.length || 0})
                </h3>
              </div>

              {(debtOverview?.items || []).length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
                  No active loans found. Add your loan in the Net Worth / Liabilities section to track amortization.
                </div>
              ) : (
                <div className="space-y-3">
                  {debtOverview.items.map((loan: any) => (
                    <div
                      key={loan.id}
                      className="p-4 rounded-2xl bg-white border border-[#E4E2DC] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-[#172033] block">{loan.name}</span>
                          <span className="text-[11px] text-[#858D9A] font-mono">
                            {loan.lender || 'Lending Institution'} • {loan.interest_rate_pct}% APR
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-[#E11D48]">
                          {formatCurrency(loan.remaining_balance)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-[#858D9A] font-mono font-bold">
                          <span>Principal Paid: {loan.progress_pct}%</span>
                          <span>Monthly EMI: {formatCurrency(loan.monthly_emi)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F6F5F1] overflow-hidden border border-[#E4E2DC]">
                          <div
                            className="h-full bg-[#10B981] rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, loan.progress_pct))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
