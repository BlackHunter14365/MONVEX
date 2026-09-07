'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Sliders,
  Calendar,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  CheckCircle2,
  PieChart,
  DollarSign,
  Layers,
  ChevronRight,
  Clock,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function SimulatorPage() {
  const toast = useToast();

  // Control Parameters State
  const [incomeDelta, setIncomeDelta] = useState<number>(0);
  const [foodCut, setFoodCut] = useState<number>(20);
  const [shoppingCut, setShoppingCut] = useState<number>(15);
  const [transportCut, setTransportCut] = useState<number>(10);
  const [extraSavings, setExtraSavings] = useState<number>(5000);
  const [extraDebt, setExtraDebt] = useState<number>(0);
  const [timeframeMonths, setTimeframeMonths] = useState<number>(12);

  // Results State
  const [simResults, setSimResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.runFullSimulation({
        income_delta: incomeDelta,
        category_cuts: {
          'Food & Dining': foodCut,
          'Shopping': shoppingCut,
          'Transportation': transportCut,
        },
        extra_monthly_savings: extraSavings,
        extra_debt_payment: extraDebt,
        timeframe_months: timeframeMonths,
      });

      if (res && res.success) {
        setSimResults(res);
      }
    } catch {
      toast.error('Simulation calculation failed.');
    } finally {
      setIsLoading(false);
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    fetchSimulation();
  }, [incomeDelta, foodCut, shoppingCut, transportCut, extraSavings, extraDebt, timeframeMonths]);

  const handleReset = () => {
    setIncomeDelta(0);
    setFoodCut(0);
    setShoppingCut(0);
    setTransportCut(0);
    setExtraSavings(0);
    setExtraDebt(0);
    setTimeframeMonths(12);
    toast.info('Parameters reset to baseline.');
  };

  const applyPreset = (preset: 'balanced' | 'aggressive' | 'promotion') => {
    if (preset === 'balanced') {
      setIncomeDelta(2500);
      setFoodCut(15);
      setShoppingCut(15);
      setTransportCut(10);
      setExtraSavings(3000);
      setExtraDebt(0);
      setTimeframeMonths(12);
      toast.success('Applied Balanced Optimization preset.');
    } else if (preset === 'aggressive') {
      setIncomeDelta(0);
      setFoodCut(30);
      setShoppingCut(25);
      setTransportCut(20);
      setExtraSavings(7500);
      setExtraDebt(2500);
      setTimeframeMonths(12);
      toast.success('Applied Aggressive Frugal preset.');
    } else if (preset === 'promotion') {
      setIncomeDelta(25000);
      setFoodCut(10);
      setShoppingCut(10);
      setTransportCut(0);
      setExtraSavings(15000);
      setExtraDebt(5000);
      setTimeframeMonths(24);
      toast.success('Applied Career Promotion preset.');
    }
  };

  const monthlySurplusDelta = simResults?.simulated?.monthly_surplus_delta || 0;
  const isPositiveDelta = monthlySurplusDelta >= 0;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <PageHeader
          title="What-If Financial Intelligence Simulator"
          description="Deterministic mathematical scenario laboratory. Model discretionary cuts, income shifts, and accelerated SIP allocations to calculate exact milestone dates and 5-year compounding trajectory."
          actionSlot={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                className="text-xs font-bold shrink-0"
              >
                Reset Baseline
              </Button>
            </div>
          }
        />

        {/* PRESET QUICK-SCENARIOS STRIP */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-mono font-bold text-[#898390] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#2563EB]" />
            Quick Scenarios:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F5F1] border border-[#E2DFD7] text-xs font-bold text-[#191522] shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Balanced Boost (+₹2.5k, 15% cuts)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('aggressive')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F5F1] border border-[#E2DFD7] text-xs font-bold text-[#191522] shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aggressive Frugal (30% cuts, ₹10k surplus)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('promotion')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F5F1] border border-[#E2DFD7] text-xs font-bold text-[#191522] shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Career Raise (+₹25k income, 24M)
          </button>
        </div>

        {/* TOP FOUR DOUBLE-BEZEL METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Monthly Surplus */}
          <div className="p-1.5 rounded-[22px] bg-white border border-[#E2DFD7] shadow-sm">
            <div className="p-4 sm:p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                Simulated Monthly Surplus
              </span>
              <div className="flex items-baseline gap-2">
                <FinancialAmount
                  amount={simResults?.simulated?.monthly_surplus || 0}
                  type="income"
                  size="xl"
                />
                <span className="text-[10px] font-mono text-[#898390]">/ mo</span>
              </div>
              <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                <span className="text-[#625D69] font-medium">Shift vs Baseline:</span>
                <span className={cn('font-mono font-bold', isPositiveDelta ? 'text-[#059669]' : 'text-[#E11D48]')}>
                  {isPositiveDelta ? '+' : ''}{formatCurrency(monthlySurplusDelta)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* 2. Projected Savings Rate */}
          <div className="p-1.5 rounded-[22px] bg-white border border-[#E2DFD7] shadow-sm">
            <div className="p-4 sm:p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                Projected Savings Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-mono font-black text-[#2563EB] tracking-tight">
                  {simResults?.simulated?.savings_rate || 0}%
                </span>
                <span className="text-[10px] font-medium text-[#625D69]">of income</span>
              </div>
              <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                <span className="text-[#625D69] font-medium">Baseline Pace:</span>
                <span className="font-mono font-bold text-[#191522]">
                  {simResults?.baseline?.savings_rate || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. Accumulated Capital */}
          <div className="p-1.5 rounded-[22px] bg-white border border-[#E2DFD7] shadow-sm">
            <div className="p-4 sm:p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                Accumulated Liquidity ({timeframeMonths}M)
              </span>
              <div className="flex items-baseline gap-2">
                <FinancialAmount
                  amount={simResults?.simulated?.total_wealth_created || 0}
                  type="neutral"
                  size="xl"
                />
              </div>
              <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                <span className="text-[#625D69] font-medium">Model Type:</span>
                <span className="font-mono font-bold text-[#059669]">
                  Retained Cash
                </span>
              </div>
            </div>
          </div>

          {/* 4. 5-Year Compounded Corpus */}
          <div className="p-1.5 rounded-[22px] bg-white border border-[#E2DFD7] shadow-sm">
            <div className="p-4 sm:p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                5-Year Compounded Corpus
              </span>
              <div className="flex items-baseline gap-2">
                <FinancialAmount
                  amount={simResults?.compounded_growth?.five_year_horizon?.simulated_corpus || 0}
                  type="neutral"
                  size="xl"
                  className="text-[#7C3AED]"
                />
              </div>
              <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                <span className="text-[#625D69] font-medium">Extra Wealth Boost:</span>
                <span className="font-mono font-bold text-[#059669]">
                  +{formatCurrency(simResults?.compounded_growth?.five_year_horizon?.additional_wealth || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN SIMULATOR STUDIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: INTERACTIVE SCENARIO LEVERS (5 COLS) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
              <div className="p-5 sm:p-6 rounded-[22px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-6">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Sliders className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#191522] tracking-tight">
                        Scenario Control Levers
                      </h3>
                      <span className="text-[10.5px] text-[#625D69] font-medium">
                        Adjust parameters to project outcome
                      </span>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm" className="font-mono">
                    {timeframeMonths}M Window
                  </Badge>
                </div>

                {/* 1. Timeframe Horizon Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10.5px] font-mono font-bold text-[#898390] uppercase tracking-wider">
                      Projection Horizon
                    </span>
                    <span className="font-mono text-xs font-bold text-[#191522]">
                      {timeframeMonths} Months ({Math.round((timeframeMonths / 12) * 10) / 10} yrs)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 12, 24, 36].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTimeframeMonths(m)}
                        className={cn(
                          'py-2.5 rounded-xl text-xs font-bold transition-all border min-h-[44px]',
                          timeframeMonths === m
                            ? 'bg-[#2A1F3D] text-white border-[#2A1F3D] shadow-xs'
                            : 'bg-white text-[#625D69] border-[#E4E2DC] hover:bg-[#F6F5F1] hover:text-[#191522]'
                        )}
                      >
                        {m}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Monthly Income Shift Lever */}
                <div className="space-y-2 pt-4 border-t border-[#E4E2DC]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#191522]">Monthly Inflow Delta</span>
                    <span className={cn('font-mono font-bold', incomeDelta >= 0 ? 'text-[#059669]' : 'text-[#E11D48]')}>
                      {incomeDelta >= 0 ? `+${formatCurrency(incomeDelta)}` : formatCurrency(incomeDelta)}/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20000"
                    max="50000"
                    step="2500"
                    value={incomeDelta}
                    onChange={(e) => setIncomeDelta(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                    <span>-₹20k (Cut)</span>
                    <span>Baseline (₹0)</span>
                    <span>+₹50k (Raise)</span>
                  </div>
                </div>

                {/* 3. Discretionary Expense Optimization Cuts */}
                <div className="space-y-4 pt-4 border-t border-[#E4E2DC]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-mono font-bold text-[#898390] uppercase tracking-wider">
                      Discretionary Expense Cuts
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      Direct Retained Cash
                    </span>
                  </div>

                  {/* Food Cut */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#191522]">Food & Dining Optimization</span>
                      <span className="font-mono font-bold text-[#E11D48]">-{foodCut}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={foodCut}
                      onChange={(e) => setFoodCut(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                      <span>0% (As-is)</span>
                      <span>30%</span>
                      <span>60% (Strict)</span>
                    </div>
                  </div>

                  {/* Shopping Cut */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#191522]">Shopping & Lifestyle Optimization</span>
                      <span className="font-mono font-bold text-[#E11D48]">-{shoppingCut}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={shoppingCut}
                      onChange={(e) => setShoppingCut(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                      <span>0% (As-is)</span>
                      <span>30%</span>
                      <span>60% (Strict)</span>
                    </div>
                  </div>

                  {/* Transport Cut */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#191522]">Transport / Cabs Optimization</span>
                      <span className="font-mono font-bold text-[#E11D48]">-{transportCut}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={transportCut}
                      onChange={(e) => setTransportCut(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>

                {/* 4. Direct Additional Monthly SIP Investment */}
                <div className="space-y-2 pt-4 border-t border-[#E4E2DC]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#191522]">Additional Monthly SIP</span>
                    <span className="font-mono font-bold text-[#2563EB]">
                      +{formatCurrency(extraSavings)}/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30000"
                    step="1000"
                    value={extraSavings}
                    onChange={(e) => setExtraSavings(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                    <span>₹0</span>
                    <span>₹15,000</span>
                    <span>₹30,000/mo</span>
                  </div>
                </div>

                {/* 5. Additional Accelerated Debt Paydown */}
                <div className="space-y-2 pt-4 border-t border-[#E4E2DC]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#191522]">Extra Debt Principal Paydown</span>
                    <span className="font-mono font-bold text-[#D97706]">
                      +{formatCurrency(extraDebt)}/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25000"
                    step="1000"
                    value={extraDebt}
                    onChange={(e) => setExtraDebt(Number(e.target.value))}
                    className="w-full accent-[#D97706] cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                    <span>₹0</span>
                    <span>₹12,500</span>
                    <span>₹25,000/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE DETERMINISTIC PROJECTION & GOALS VELOCITY (7 COLS) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Category Reductions Ledger */}
            <div className="p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
              <div className="p-5 sm:p-6 rounded-[22px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#191522] tracking-tight">
                      Discretionary Retained Cash Flow
                    </h3>
                    <span className="text-[10.5px] text-[#625D69] font-medium">
                      Calculated monthly optimization per category
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    Total Retained: +{formatCurrency(simResults?.category_reductions?.reduce((acc: number, c: any) => acc + c.monthly_saved, 0) || 0)}/mo
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(simResults?.category_reductions || []).map((cat: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-between shadow-2xs hover:border-[#2563EB]/40 transition-all"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-[#191522] block">{cat.category}</span>
                        <span className="text-[11px] text-[#625D69] font-mono">
                          Base: {formatCurrency(cat.current_monthly_spend)}/mo • Cut: {cat.reduction_pct}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-[#059669] block">
                          +{formatCurrency(cat.monthly_saved)}/mo
                        </span>
                        <span className="text-[10.5px] text-[#898390] font-mono">
                          {formatCurrency(cat.total_saved_over_horizon)} in {timeframeMonths}M
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Savings Goals Acceleration Impact */}
            <div className="p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
              <div className="p-5 sm:p-6 rounded-[22px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Target className="h-4 w-4 text-[#059669]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#191522] tracking-tight">
                        Savings Goals Milestone Acceleration
                      </h3>
                      <span className="text-[10.5px] text-[#625D69] font-medium">
                        50% of simulated monthly surplus routed to active goals
                      </span>
                    </div>
                  </div>
                </div>

                {(simResults?.goal_impacts || []).length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center space-y-2 bg-white">
                    <Target className="h-8 w-8 text-[#898390] mx-auto stroke-1" />
                    <p className="text-xs font-bold text-[#191522]">No active savings goals found</p>
                    <p className="text-[11px] text-[#625D69]">
                      Create capital goals in the Goals section to see timeline acceleration and completion pull-forward!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {simResults.goal_impacts.map((g: any) => (
                      <div
                        key={g.goal_id}
                        className="p-4 rounded-2xl bg-white border border-[#E4E2DC] space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#191522]">{g.title}</span>
                          {g.months_saved > 0 ? (
                            <span className="text-[10.5px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              ✓ {g.months_saved} Months Earlier!
                            </span>
                          ) : (
                            <Badge variant="neutral" size="sm">On Schedule</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-[#E4E2DC]">
                          <div>
                            <span className="text-[10px] text-[#898390] block uppercase font-sans font-bold">
                              Baseline Target
                            </span>
                            <span className="font-bold text-[#625D69]">{g.baseline_finish_date}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#059669] block uppercase font-sans font-bold">
                              Accelerated Completion
                            </span>
                            <span className="font-bold text-[#059669]">{g.simulated_finish_date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Compounded Wealth Growth Engine (12% CAGR Benchmark) */}
            <div className="p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
              <div className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-br from-[#2A1F3D] to-[#1E162D] text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black tracking-tight text-white uppercase">
                        Compounded SIP Wealth Creation (12% CAGR Benchmark)
                      </h4>
                      <span className="text-[10px] text-slate-300">
                        Monthly surplus compounded continuously over institutional horizons
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-mono font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    Deterministic Math
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                      3-Year Horizon Corpus
                    </span>
                    <div className="text-xl font-mono font-black text-white">
                      {formatCurrency(simResults?.compounded_growth?.three_year_horizon?.simulated_corpus || 0)}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                      +{formatCurrency(simResults?.compounded_growth?.three_year_horizon?.additional_wealth || 0)} extra boost
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                      5-Year Horizon Corpus
                    </span>
                    <div className="text-xl font-mono font-black text-emerald-400">
                      {formatCurrency(simResults?.compounded_growth?.five_year_horizon?.simulated_corpus || 0)}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 font-bold block">
                      +{formatCurrency(simResults?.compounded_growth?.five_year_horizon?.additional_wealth || 0)} extra boost
                    </span>
                  </div>
                </div>

                <p className="text-[11.5px] text-slate-300 font-medium leading-relaxed pt-1">
                  💡 By maintaining this simulated monthly surplus of <strong className="text-white font-mono">{formatCurrency(simResults?.simulated?.monthly_surplus || 0)}</strong>, your retained capital continuously accelerates your financial independence timeline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
