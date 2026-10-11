'use client';

import React, { useState, useMemo } from 'react';
import { useSimulatorQuery } from '@/hooks/queries/useSimulatorQuery';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
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

  const simParams = useMemo(() => ({
    income_delta: incomeDelta,
    category_cuts: {
      'Food & Dining': foodCut,
      'Shopping': shoppingCut,
      'Transportation': transportCut,
    },
    extra_monthly_savings: extraSavings,
    extra_debt_payment: extraDebt,
    timeframe_months: timeframeMonths,
  }), [incomeDelta, foodCut, shoppingCut, transportCut, extraSavings, extraDebt, timeframeMonths]);

  const { data: simResults, isLoading, isFetching: isSimulating } = useSimulatorQuery(simParams);

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
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="SCENARIO LABORATORY"
          title="What-If Financial Intelligence Simulator"
          description="Deterministic mathematical scenario laboratory. Model discretionary cuts, income shifts, and accelerated SIP allocations to calculate exact milestone dates and 5-year compounding trajectory."
          actionSlot={
            <Button
              variant="outline"
              size="md"
              onClick={handleReset}
              leftIcon={<RotateCcw className="h-4 w-4" />}
              className="text-xs font-bold rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B]"
            >
              Reset Baseline
            </Button>
          }
        />

        {/* =========================================================================
            1. PRESET QUICK-SCENARIOS STRIP (Aurora Glass)
            ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" role="region" aria-label="Quick scenarios presets">
          <span className="text-[11px] font-mono font-bold text-[#77798A] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#6865E8]" aria-hidden="true" />
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="shrink-0 px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF9FC] border border-[#E7E6F0] text-xs font-bold text-[#20212B] shadow-xs transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="h-2 w-2 rounded-full bg-[#6865E8]" aria-hidden="true" />
            Balanced Boost (+₹2.5k, 15% cuts)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('aggressive')}
            className="shrink-0 px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF9FC] border border-[#E7E6F0] text-xs font-bold text-[#20212B] shadow-xs transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="h-2 w-2 rounded-full bg-[#16745C]" aria-hidden="true" />
            Aggressive Frugal (30% cuts, ₹10k surplus)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('promotion')}
            className="shrink-0 px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF9FC] border border-[#E7E6F0] text-xs font-bold text-[#20212B] shadow-xs transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="h-2 w-2 rounded-full bg-[#E8A54B]" aria-hidden="true" />
            Career Promotion (+₹25k income)
          </button>
        </div>

        {/* =========================================================================
            2. TOP 3 SIMULATED OUTCOMES (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Monthly Surplus Delta
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#16745C]">
                {isPositiveDelta ? `+${formatCurrency(monthlySurplusDelta)}` : formatCurrency(monthlySurplusDelta)} / mo
              </div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Incremental retained capital</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                {timeframeMonths}-Month Cumulative Liquidity
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">
                {formatCurrency((simResults?.simulated?.projected_balance || 0))}
              </div>
              <p className="text-xs text-[#6865E8] font-semibold mt-1">
                +{(formatCurrency(monthlySurplusDelta * timeframeMonths))} simulated boost
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                5-Year Wealth Compounding
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">
                {formatCurrency((simResults?.simulated?.compounded_5yr_wealth || (monthlySurplusDelta * 60 * 1.35)))}
              </div>
              <p className="text-xs text-[#16745C] font-semibold mt-1">
                Assuming 12% equity CAGR reinvestment
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. INTERACTIVE LEVERS LABORATORY GRID
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* DISCRETIONARY CUTS */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#20212B]">Discretionary Spending Reductions</h3>
                  <p className="text-xs text-[#77798A]">Trim lifestyle inflation to fund investments</p>
                </div>
              </div>
            </div>

            {/* Food Cut Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#20212B]">Dining Out & Food Delivery Cut:</span>
                <span className="font-mono text-[#E76D7A]">{foodCut}% Reduction</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={foodCut}
                onChange={(e) => setFoodCut(Number(e.target.value))}
                className="w-full accent-[#6865E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Shopping Cut Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#20212B]">Shopping & Discretionary Goods Cut:</span>
                <span className="font-mono text-[#E76D7A]">{shoppingCut}% Reduction</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={shoppingCut}
                onChange={(e) => setShoppingCut(Number(e.target.value))}
                className="w-full accent-[#6865E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Transport Cut Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#20212B]">Cabs & Commute Optimization:</span>
                <span className="font-mono text-[#E76D7A]">{transportCut}% Reduction</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={transportCut}
                onChange={(e) => setTransportCut(Number(e.target.value))}
                className="w-full accent-[#6865E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
          </div>

          {/* CAPITAL SHIFTS */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#20212B]">Strategic Capital Inflows</h3>
                  <p className="text-xs text-[#77798A]">Model salary increments, freelancing, and SIP boosts</p>
                </div>
              </div>
            </div>

            {/* Income Delta Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#20212B]">Monthly Income Shift:</span>
                <span className="font-mono text-[#16745C]">
                  {incomeDelta >= 0 ? `+${formatCurrency(incomeDelta)}` : formatCurrency(incomeDelta)} / mo
                </span>
              </div>
              <input
                type="range"
                min="-20000"
                max="50000"
                step="2500"
                value={incomeDelta}
                onChange={(e) => setIncomeDelta(Number(e.target.value))}
                className="w-full accent-[#6865E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                <span>-₹20k</span>
                <span>0</span>
                <span>+₹50k</span>
              </div>
            </div>

            {/* Extra SIP Savings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#20212B]">Extra Monthly SIP Allocation:</span>
                <span className="font-mono text-[#6865E8]">+{formatCurrency(extraSavings)} / mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="30000"
                step="1000"
                value={extraSavings}
                onChange={(e) => setExtraSavings(Number(e.target.value))}
                className="w-full accent-[#6865E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                <span>₹0</span>
                <span>₹15k</span>
                <span>₹30k</span>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#20212B]">Simulation Horizon:</span>
                <span className="font-mono text-[#20212B]">{timeframeMonths} Months</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[6, 12, 24, 36].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTimeframeMonths(m)}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold transition-all',
                      timeframeMonths === m
                        ? 'bg-[#6865E8] text-white shadow-xs'
                        : 'bg-[#F8F7FC] text-[#77798A] hover:text-[#20212B]'
                    )}
                  >
                    {m} Mo
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
