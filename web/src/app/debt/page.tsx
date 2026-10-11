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
import { useDebtQuery } from '@/hooks/queries/useDebtQuery';

export default function DebtPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: debtOverview, isLoading, refetch: fetchDebtData } = useDebtQuery();

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

  // Auto-select first loan if available
  useEffect(() => {
    if (debtOverview?.items && debtOverview.items.length > 0 && selectedLoanId === 'custom') {
      const first = debtOverview.items[0];
      setSelectedLoanId(first.id);
      setSelectedPrincipal(first.remaining_balance || first.principal_amount);
      setSelectedRate(first.interest_rate_pct);
      setSelectedEmi(first.monthly_emi);
    }
  }, [debtOverview]);

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
      toast.error('Failed to delete loan obligation.');
    }
  };

  const totalOutstanding = debtOverview?.total_debt || 0;
  const totalMonthlyEmi = debtOverview?.total_monthly_emi || 0;
  const items = debtOverview?.items || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="DEBT FREEDOM ENGINE"
          title="Debt Snowball & Prepayment Simulator"
          description="Accelerated debt freedom: mathematically model extra monthly prepayments to calculate exact interest saved and tenure contraction."
          actionSlot={
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-[#6865E8] hover:bg-[#5b58db] text-white rounded-2xl shadow-xs"
            >
              Record Loan
            </Button>
          }
        />

        {/* =========================================================================
            1. TOP 3 METRICS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                Total Debt Outstanding
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount
                amount={totalOutstanding}
                currency={user?.currency}
                size="2xl"
                type="expense"
              />
              <p className="text-xs text-[#77798A] font-medium mt-1">
                {items.length} active loan obligations
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Monthly EMI Burden
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount
                amount={totalMonthlyEmi}
                currency={user?.currency}
                size="2xl"
                type="expense"
                showSign={false}
              />
              <p className="text-xs text-[#77798A] font-medium mt-1">
                Committed monthly principal + interest
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Interest Savings Potential
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount
                amount={simResult?.interest_saved || 0}
                currency={user?.currency}
                size="2xl"
                type="income"
              />
              <p className="text-xs text-[#16745C] font-semibold mt-1">
                {simResult?.months_saved || 0} months faster freedom
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. PREPAYMENT SIMULATOR LABORATORY (Aurora Glass)
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E6F0]">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                  <Sliders className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-base font-bold text-[#20212B]">
                  Prepayment Sensitivity Laboratory
                </h3>
              </div>
              <p className="text-xs text-[#77798A] mt-0.5">
                Model incremental monthly prepayments against loan principal
              </p>
            </div>

            {/* Loan Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleSelectLoan('custom')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                  selectedLoanId === 'custom'
                    ? 'bg-[#6865E8] text-white shadow-xs'
                    : 'bg-[#F8F7FC] text-[#77798A] hover:text-[#20212B]'
                )}
              >
                Custom Sandbox
              </button>
              {items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectLoan(item.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all truncate max-w-[140px]',
                    selectedLoanId === item.id
                      ? 'bg-[#6865E8] text-white shadow-xs'
                      : 'bg-[#F8F7FC] text-[#77798A] hover:text-[#20212B]'
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 7 cols: Controls & Sliders */}
            <div className="lg:col-span-7 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1">
                  <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Principal</span>
                  <input
                    type="number"
                    value={selectedPrincipal}
                    onChange={(e) => setSelectedPrincipal(Number(e.target.value))}
                    className="w-full bg-transparent font-mono font-bold text-sm text-[#20212B] focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1">
                  <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">APR Rate (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedRate}
                    onChange={(e) => setSelectedRate(Number(e.target.value))}
                    className="w-full bg-transparent font-mono font-bold text-sm text-[#20212B] focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1">
                  <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Current EMI</span>
                  <input
                    type="number"
                    value={selectedEmi}
                    onChange={(e) => setSelectedEmi(Number(e.target.value))}
                    className="w-full bg-transparent font-mono font-bold text-sm text-[#20212B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Extra Payment Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#20212B]">Extra Monthly Prepayment:</span>
                  <span className="font-mono text-[#16745C] text-sm">
                    +{formatCurrency(extraPayment, user?.currency)} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="500"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                  className="w-full accent-[#6865E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                  <span>₹0</span>
                  <span>₹10,000</span>
                  <span>₹25,000</span>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Accelerated Payoff Results Banner */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8] block">
                Accelerated Freedom Outcome
              </span>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#77798A]">Total Interest Saved:</span>
                  <span className="font-mono font-bold text-[#16745C] text-sm">
                    {formatCurrency(simResult?.interest_saved || 0, user?.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#77798A]">Time Horizon Reduced:</span>
                  <span className="font-mono font-bold text-[#6865E8] text-sm">
                    {simResult?.months_saved || 0} Months Earlier
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#77798A]">New Payoff Horizon:</span>
                  <span className="font-mono font-bold text-[#20212B]">
                    {simResult?.new_tenure_months || 0} Months Total
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E7E6F0] text-[11px] text-[#16745C] font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Adding {formatCurrency(extraPayment, user?.currency)}/mo cuts tenure by{' '}
                  {simResult?.months_saved || 0} months!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ACTIVE LOAN OBLIGATIONS DIRECTORY
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
            <div>
              <h3 className="text-base font-bold text-[#20212B]">
                Active Debt Obligations ({items.length})
              </h3>
              <p className="text-xs text-[#77798A] mt-0.5">
                Registered amortized loans and credit liabilities
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Skeleton className="h-40 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Zero debt obligations registered"
              description="Record loans or credit card balances to activate automated snowball payoff strategies."
              actionLabel="Record Loan"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-[#E7E6F0] hover:border-[#6865E8]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-[#FDEEF0] text-[#E76D7A] flex items-center justify-center shrink-0">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#20212B] block">{item.name}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F8F7FC] text-[#6865E8] border border-[#E7E6F0]">
                          {item.interest_rate_pct}% APR
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLoan(item.id)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] transition-colors"
                      aria-label={`Remove loan obligation ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#E7E6F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#77798A] uppercase block">Monthly EMI</span>
                      <span className="text-xs font-bold text-[#20212B]">
                        {formatCurrency(item.monthly_emi, user?.currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#77798A] uppercase block">Remaining</span>
                      <span className="text-sm font-mono font-bold text-[#E76D7A]">
                        {formatCurrency(item.remaining_balance || item.principal_amount, user?.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Add Loan Obligation */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Record Loan Obligation"
          description="Register amortized liabilities to model payoff trajectories."
        >
          <form onSubmit={handleCreateLoan} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Loan Title</label>
              <input
                type="text"
                required
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                placeholder="e.g. Home Mortgage, HDFC Auto Loan"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Lender / Institution</label>
                <input
                  type="text"
                  value={loanLender}
                  onChange={(e) => setLoanLender(e.target.value)}
                  placeholder="e.g. SBI, HDFC, ICICI"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Category</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                >
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="HOME_LOAN">Home Mortgage</option>
                  <option value="AUTO_LOAN">Auto Loan</option>
                  <option value="STUDENT_LOAN">Education Loan</option>
                  <option value="CREDIT_CARD">Credit Card Debt</option>
                  <option value="OTHER">Other Obligation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">
                  Principal ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  placeholder="500000"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">APR Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={loanRate}
                  onChange={(e) => setLoanRate(e.target.value)}
                  placeholder="10.5"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Tenure (Mo)</label>
                <input
                  type="number"
                  required
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(e.target.value)}
                  placeholder="24"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingLoan}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
                Save Obligation
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
