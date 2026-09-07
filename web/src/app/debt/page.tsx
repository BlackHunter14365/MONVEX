'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Plus,
  RefreshCw,
  Trash2,
  Percent,
  Layers,
  ArrowUpRight,
  Clock,
  PiggyBank,
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
import { CardReveal } from '@/components/motion';

export default function DebtPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [debtOverview, setDebtOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prepayment Simulator Parameters
  const [selectedLoanId, setSelectedLoanId] = useState<string>('custom');
  const [selectedPrincipal, setSelectedPrincipal] = useState<number>(500000);
  const [selectedRate, setSelectedRate] = useState<number>(10.5);
  const [selectedEmi, setSelectedEmi] = useState<number>(10747);
  const [extraPayment, setExtraPayment] = useState<number>(2500);

  // Simulation Result
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Add Liability Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanLender, setLoanLender] = useState('');
  const [loanType, setLoanType] = useState('PERSONAL_LOAN');
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanRate, setLoanRate] = useState('10.5');
  const [loanTenure, setLoanTenure] = useState('24');
  const [isSavingLoan, setIsSavingLoan] = useState(false);

  const fetchDebtData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDebtPlanner();
      setDebtOverview(data);

      // Auto-select first loan if available
      if (data?.items && data.items.length > 0) {
        const first = data.items[0];
        setSelectedLoanId(first.id);
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
    if (selectedPrincipal <= 0 || selectedEmi <= 0) return;
    setIsSimulating(true);
    try {
      const res = await api.simulateDebt({
        principal: selectedPrincipal,
        interest_rate: selectedRate,
        current_emi: selectedEmi,
        extra_payment: extraPayment,
      });
      setSimResult(res);
    } catch {
      // Handled silently
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    fetchDebtData();
  }, []);

  useEffect(() => {
    runSimulation();
  }, [selectedPrincipal, selectedRate, selectedEmi, extraPayment]);

  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    if (loanId === 'custom') {
      setSelectedPrincipal(500000);
      setSelectedRate(10.5);
      setSelectedEmi(10747);
      return;
    }

    const item = debtOverview?.items?.find((i: any) => i.id === loanId);
    if (item) {
      setSelectedPrincipal(item.remaining_balance || item.principal_amount);
      setSelectedRate(item.interest_rate_pct);
      setSelectedEmi(item.monthly_emi);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName || !loanPrincipal) return;
    setIsSavingLoan(true);

    try {
      await api.createLiability({
        name: loanName,
        lender: loanLender,
        liability_type: loanType,
        principal_amount: Number(loanPrincipal),
        remaining_balance: Number(loanPrincipal),
        interest_rate_pct: Number(loanRate),
        tenure_months: Number(loanTenure),
      });
      toast.success(`✓ Loan obligation "${loanName}" recorded.`);
      setIsAddModalOpen(false);
      setLoanName('');
      setLoanLender('');
      setLoanPrincipal('');
      fetchDebtData();
    } catch {
      toast.error('Failed to record loan.');
    } finally {
      setIsSavingLoan(false);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await api.deleteLiability(id);
      toast.info('Loan obligation removed.');
      fetchDebtData();
    } catch {
      toast.error('Failed to delete loan.');
    }
  };

  // Calculated Metrics
  const items = debtOverview?.items || [];
  const totalPrincipal = debtOverview?.total_remaining_balance || 0;
  const totalMonthlyEmi = debtOverview?.total_monthly_emi || 0;
  const totalInterestRemaining = useMemo(() => {
    return items.reduce((sum: number, item: any) => sum + (item.total_interest_payable || 0), 0);
  }, [items]);

  const avgApr = useMemo(() => {
    if (items.length === 0) return 0;
    const weightedSum = items.reduce((sum: number, item: any) => {
      const bal = item.remaining_balance || item.principal_amount;
      return sum + bal * item.interest_rate_pct;
    }, 0);
    return totalPrincipal > 0 ? weightedSum / totalPrincipal : 0;
  }, [items, totalPrincipal]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Debt & Loan Amortization Studio"
          description="Deterministic loan amortization modeling, active EMI burden tracking, and accelerated payoff scenarios."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDebtData}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold touch-target"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-sm touch-target"
              >
                Record Loan
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. DOUBLE-BEZEL DEBT PORTFOLIO HERO
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 7 cols: Primary Debt Aggregates */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2 text-[#898390]">
                  <CreditCard className="h-4 w-4 text-[#E11D48]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    Portfolio Liability Baseline
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-6 sm:gap-8">
                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase tracking-wider">
                      Outstanding Principal
                    </span>
                    <FinancialAmount
                      amount={totalPrincipal}
                      currency={user?.currency}
                      size="2xl"
                      type="expense"
                      showSign={false}
                    />
                  </div>

                  <div className="h-10 w-px bg-[#E4E2DC] hidden sm:block self-center" />

                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase tracking-wider">
                      Monthly EMI Outflow
                    </span>
                    <FinancialAmount
                      amount={totalMonthlyEmi}
                      currency={user?.currency}
                      size="xl"
                      type="neutral"
                      showSign={false}
                    />
                  </div>

                  <div className="h-10 w-px bg-[#E4E2DC] hidden sm:block self-center" />

                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase tracking-wider">
                      Est. Interest Payable
                    </span>
                    <FinancialAmount
                      amount={totalInterestRemaining}
                      currency={user?.currency}
                      size="xl"
                      type="neutral"
                      showSign={false}
                    />
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Telemetry & Prepayment Potential */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#E4E2DC] lg:pl-6">
                <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1">
                  <span className="text-[10px] font-mono text-[#625D69] block uppercase">Weighted Avg APR</span>
                  <div className="text-xl font-mono font-black text-[#191522] tnum">
                    {avgApr > 0 ? `${avgApr.toFixed(2)}%` : '0.00%'}
                  </div>
                  <span className="text-[10px] text-[#625D69] font-medium block">
                    Across {items.length} active {items.length === 1 ? 'account' : 'accounts'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-1">
                  <span className="text-[10px] font-mono text-[#059669] block uppercase font-bold">
                    Prepayment Upside
                  </span>
                  <div className="text-xl font-mono font-black text-[#059669] tnum">
                    {simResult?.months_saved ? `-${simResult.months_saved} Mos` : '0 Mos'}
                  </div>
                  <span className="text-[10px] text-[#059669] font-bold block">
                    Save {formatCurrency(simResult?.interest_saved || 0, user?.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TWO-COLUMN DEBT OPTIMIZATION LAB
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: ACCELERATED PREPAYMENT SIMULATOR */}
          <div className="lg:col-span-6 space-y-4">
            <div className="double-bezel h-full">
              <div className="double-bezel-inner p-6 space-y-5 flex flex-col justify-between h-full">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                          Prepayment Simulator
                        </h3>
                        <span className="text-[10px] text-[#898390] block">
                          Calculate accelerated loan payoff curves
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Deterministic</Badge>
                  </div>

                  {/* Loan Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#898390] uppercase tracking-wider block">
                      Target Loan for Simulation
                    </label>
                    <select
                      value={selectedLoanId}
                      onChange={(e) => handleSelectLoan(e.target.value)}
                      className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2.5 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1] touch-target"
                    >
                      {items.map((i: any) => (
                        <option key={i.id} value={i.id}>
                          {i.name} — Balance: {formatCurrency(i.remaining_balance, user?.currency)} @ {i.interest_rate_pct}% APR
                        </option>
                      ))}
                      <option value="custom">Custom Hypothetical Loan (₹5,00,000 @ 10.5%)</option>
                    </select>
                  </div>

                  {/* Manual Parameters if Custom is Selected */}
                  {selectedLoanId === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC]">
                      <div>
                        <span className="text-[10px] font-mono text-[#898390] block">Principal</span>
                        <input
                          type="number"
                          value={selectedPrincipal}
                          onChange={(e) => setSelectedPrincipal(Number(e.target.value))}
                          className="w-full bg-white rounded-lg border border-[#E4E2DC] px-2.5 py-1.5 min-h-[44px] text-base sm:text-xs font-mono font-bold text-[#191522]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#898390] block">Rate (% APR)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedRate}
                          onChange={(e) => setSelectedRate(Number(e.target.value))}
                          className="w-full bg-white rounded-lg border border-[#E4E2DC] px-2.5 py-1.5 min-h-[44px] text-base sm:text-xs font-mono font-bold text-[#191522]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#898390] block">Monthly EMI</span>
                        <input
                          type="number"
                          value={selectedEmi}
                          onChange={(e) => setSelectedEmi(Number(e.target.value))}
                          className="w-full bg-white rounded-lg border border-[#E4E2DC] px-2.5 py-1.5 min-h-[44px] text-base sm:text-xs font-mono font-bold text-[#191522]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Extra Monthly Prepayment Controls */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#191522]">
                        Extra Monthly Principal Prepayment
                      </span>
                      <span className="text-sm font-mono font-black text-[#059669]">
                        +{formatCurrency(extraPayment, user?.currency)}/mo
                      </span>
                    </div>

                    <input
                      type="range"
                      min="500"
                      max="25000"
                      step="500"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(Number(e.target.value))}
                      className="w-full accent-[#059669] cursor-pointer h-2 bg-[#E4E2DC] rounded-lg"
                    />

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {[1000, 2500, 5000, 10000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setExtraPayment(preset)}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all touch-target',
                            extraPayment === preset
                              ? 'bg-[#059669] text-white border-[#059669]'
                              : 'bg-white text-[#625D69] border-[#E4E2DC] hover:border-[#CBD5E1]'
                          )}
                        >
                          +{preset >= 1000 ? `₹${preset / 1000}k` : `₹${preset}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comparative Payoff Timelines */}
                  {simResult && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Baseline */}
                        <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1">
                          <span className="text-[10px] font-mono text-[#898390] uppercase font-bold block">
                            Standard Payoff
                          </span>
                          <div className="text-sm font-black text-[#191522]">
                            {simResult.baseline_payoff_date}
                          </div>
                          <div className="text-[11px] font-mono text-[#625D69] pt-1 space-y-0.5">
                            <div>Tenure: {simResult.baseline_tenure_months} months</div>
                            <div>
                              Interest: {formatCurrency(simResult.baseline_total_interest, user?.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Accelerated */}
                        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-1">
                          <span className="text-[10px] font-mono text-[#059669] uppercase font-bold block">
                            Accelerated Payoff
                          </span>
                          <div className="text-sm font-black text-[#059669]">
                            {simResult.accelerated_payoff_date}
                          </div>
                          <div className="text-[11px] font-mono text-[#047857] pt-1 space-y-0.5">
                            <div>Tenure: {simResult.accelerated_tenure_months} months</div>
                            <div>
                              Interest: {formatCurrency(simResult.accelerated_total_interest, user?.currency)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Savings Hero Card */}
                      <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-[#898390] uppercase font-bold block">
                            Direct Interest Savings
                          </span>
                          <FinancialAmount
                            amount={simResult.interest_saved || 0}
                            currency={user?.currency}
                            size="xl"
                            type="income"
                            showSign={false}
                          />
                        </div>

                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] font-mono text-[#898390] uppercase font-bold block">
                            Debt-Free Date
                          </span>
                          <span className="text-sm font-mono font-black text-[#2563EB] block">
                            {simResult.months_saved} Months Sooner
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cash Flow Summary Footer */}
                {simResult && (
                  <div className="pt-3 border-t border-[#E4E2DC] text-[11px] font-mono text-[#625D69] flex justify-between items-center">
                    <span>New Monthly Cash Outflow:</span>
                    <span className="font-black text-[#191522]">
                      {formatCurrency(simResult.accelerated_emi, user?.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: REGISTERED LOANS & AMORTIZATION LEDGER */}
          <div className="lg:col-span-6 space-y-4">
            <div className="double-bezel h-full">
              <div className="double-bezel-inner p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1F2] text-[#E11D48]">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                          Active Loan Portfolio ({items.length})
                        </h3>
                        <span className="text-[10px] text-[#898390] block">
                          Verified lending liabilities and amortizing debt
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-xs font-bold text-[#2A1F3D] hover:underline touch-target"
                    >
                      + Add Obligation
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full rounded-xl" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                  ) : items.length === 0 ? (
                    <EmptyState
                      title="Zero active debt liabilities"
                      description="You currently have no registered debt obligations on your balance sheet."
                      actionLabel="Record Loan Obligation"
                      onAction={() => setIsAddModalOpen(true)}
                    />
                  ) : (
                    <div className="space-y-3">
                      {items.map((loan: any) => {
                        const balance = loan.remaining_balance || loan.principal_amount;
                        const isSimulated = selectedLoanId === loan.id;

                        return (
                          <div
                            key={loan.id}
                            className={cn(
                              'p-4 rounded-xl border transition-all space-y-3',
                              isSimulated
                                ? 'bg-white border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]/20'
                                : 'bg-white border-[#E4E2DC] hover:border-[#CBD5E1]'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#191522]">{loan.name}</span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] uppercase">
                                    {loan.liability_type}
                                  </span>
                                  {isSimulated && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-bold">
                                      Simulating
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-[#898390] block">
                                  {loan.lender || 'Institutional Creditor'} • {loan.interest_rate_pct}% APR
                                </span>
                              </div>

                              <div className="text-right">
                                <FinancialAmount
                                  amount={-balance}
                                  currency={user?.currency}
                                  size="sm"
                                  showSign={false}
                                />
                                <span className="text-[10px] font-mono text-[#898390] block">
                                  Principal: {formatCurrency(loan.principal_amount, user?.currency)}
                                </span>
                              </div>
                            </div>

                            {/* Principal Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono font-bold text-[#625D69]">
                                <span>Paid: {loan.progress_pct}%</span>
                                <span>Monthly EMI: {formatCurrency(loan.monthly_emi, user?.currency)}</span>
                              </div>
                              <div className="h-2 rounded-full bg-[#F6F5F1] overflow-hidden border border-[#E4E2DC]">
                                <div
                                  className="h-full bg-[#059669] rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.max(4, loan.progress_pct))}%` }}
                                />
                              </div>
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#E4E2DC]/60 text-[11px]">
                              <span className="text-[10px] font-mono text-[#898390]">
                                Est. Remaining Interest: {formatCurrency(loan.total_interest_payable, user?.currency)}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectLoan(loan.id)}
                                  className="text-[11px] font-bold text-[#2563EB] hover:underline touch-target"
                                >
                                  Simulate
                                </button>
                                <span className="text-[#E4E2DC]">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLoan(loan.id)}
                                  className="text-[11px] font-bold text-[#898390] hover:text-[#E11D48] transition-colors p-1 touch-target"
                                  title="Remove debt obligation"
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
                </div>

                {/* Portfolio Summary Bottom Badge */}
                <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#625D69]">
                    <ShieldCheck className="h-4 w-4 text-[#059669]" />
                    <span className="font-mono text-[11px]">Amortization Schedules Verified</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#191522]">
                    {items.length} Active Positions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. RECORD LOAN MODAL
            ========================================================================= */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Record Loan Obligation"
        >
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#625D69] mb-1 block">Loan Title / Description</label>
              <input
                type="text"
                required
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                placeholder="e.g. SBI Home Loan, Axis Auto Loan, Education Loan"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[48px] text-base sm:text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Creditor / Lending Bank</label>
                <input
                  type="text"
                  value={loanLender}
                  onChange={(e) => setLoanLender(e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI, SBI"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[48px] text-base sm:text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Obligation Type</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[48px] text-base sm:text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                >
                  <option value="MORTGAGE">Home Loan / Mortgage</option>
                  <option value="AUTO_LOAN">Auto Loan</option>
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="STUDENT_LOAN">Education Loan</option>
                  <option value="CREDIT_CARD">Credit Card Outstanding</option>
                  <option value="OTHER">Other Debt Obligation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Principal Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[48px] text-base sm:text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Rate (% APR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={(e) => setLoanRate(e.target.value)}
                  placeholder="10.5"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[48px] text-base sm:text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Tenure (Months)</label>
                <input
                  type="number"
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(e.target.value)}
                  placeholder="24"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 min-h-[48px] text-base sm:text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingLoan}>
                Record Obligation
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
