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
  HelpCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="What-If Financial Intelligence Simulator"
          description="Model discretionary spending cuts, income expansions, and debt paydown to instantly compute exact goal acceleration and compounded wealth growth."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                className="text-xs font-bold"
              >
                Reset Baseline
              </Button>
            </div>
          }
        />

        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardReveal index={0} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Simulated Monthly Surplus</span>
            <div className="text-xl sm:text-2xl font-black text-[#059669] tracking-tight">
              <AnimatedValue value={simResults?.simulated?.monthly_surplus || 0} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-bold block">
              + {formatCurrency(simResults?.simulated?.monthly_surplus_delta || 0)} / mo vs baseline
            </span>
          </CardReveal>

          <CardReveal index={1} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Projected Savings Rate</span>
            <div className="text-xl sm:text-2xl font-black text-[#2563EB] tracking-tight">
              <AnimatedValue value={simResults?.simulated?.savings_rate || 0} type="percentage" decimals={1} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              Baseline: {simResults?.baseline?.savings_rate || 0}%
            </span>
          </CardReveal>

          <CardReveal index={2} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Accumulated Capital ({timeframeMonths}M)</span>
            <div className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              <AnimatedValue value={simResults?.simulated?.total_wealth_created || 0} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              Direct retained liquidity
            </span>
          </CardReveal>

          <CardReveal index={3} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">5-Year Compounded Corpus</span>
            <div className="text-xl sm:text-2xl font-black text-[#7C3AED] tracking-tight">
              <AnimatedValue value={simResults?.compounded_growth?.five_year_horizon?.simulated_corpus || 0} />
            </div>
            <span className="text-[11px] text-[#059669] font-bold block">
              + {formatCurrency(simResults?.compounded_growth?.five_year_horizon?.additional_wealth || 0)} extra
            </span>
          </CardReveal>
        </div>

        {/* 2-COLUMN SIMULATOR LAB */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: INTERACTIVE LEVERS PANEL */}
          <div className="lg:col-span-5 space-y-5">
            <div className="editorial-card p-6 rounded-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#2563EB]" />
                  <h3 className="text-sm font-black text-[#172033]">
                    Scenario Parameters
                  </h3>
                </div>
                <Badge variant="neutral" size="sm">
                  {timeframeMonths} Months Horizon
                </Badge>
              </div>

              {/* Timeframe selector */}
              <div className="space-y-1.5">
                <label className="swiss-eyebrow block">Simulation Horizon</label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 12, 24, 36].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTimeframeMonths(m)}
                      className={cn(
                        'py-1.5 rounded-xl text-xs font-bold transition-all border',
                        timeframeMonths === m
                          ? 'bg-[#172033] text-white border-[#172033] shadow-xs'
                          : 'bg-white text-[#5F6878] border-[#E4E2DC] hover:border-[#172033]'
                      )}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflow Lever */}
              <div className="space-y-2 pt-2 border-t border-[#E4E2DC]/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#172033]">Monthly Income Shift</span>
                  <span className="font-mono font-bold text-[#059669]">
                    {incomeDelta >= 0 ? `+${formatCurrency(incomeDelta)}` : formatCurrency(incomeDelta)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20000"
                  max="50000"
                  step="2500"
                  value={incomeDelta}
                  onChange={(e) => setIncomeDelta(Number(e.target.value))}
                  className="w-full accent-[#172033] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#858D9A] font-semibold">
                  <span>-₹20k (Paycut)</span>
                  <span>Baseline</span>
                  <span>+₹50k (Promotion/Raise)</span>
                </div>
              </div>

              {/* Category Levers */}
              <div className="space-y-4 pt-2 border-t border-[#E4E2DC]/80">
                <span className="swiss-eyebrow block">Discretionary Category Cuts</span>

                {/* Food Cut */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">Food & Dining Cut</span>
                    <span className="font-mono font-bold text-[#E11D48]">-{foodCut}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={foodCut}
                    onChange={(e) => setFoodCut(Number(e.target.value))}
                    className="w-full accent-[#172033] cursor-pointer"
                  />
                </div>

                {/* Shopping Cut */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">Shopping & Lifestyle Cut</span>
                    <span className="font-mono font-bold text-[#E11D48]">-{shoppingCut}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={shoppingCut}
                    onChange={(e) => setShoppingCut(Number(e.target.value))}
                    className="w-full accent-[#172033] cursor-pointer"
                  />
                </div>

                {/* Transport Cut */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">Transportation / Cabs Cut</span>
                    <span className="font-mono font-bold text-[#E11D48]">-{transportCut}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={transportCut}
                    onChange={(e) => setTransportCut(Number(e.target.value))}
                    className="w-full accent-[#172033] cursor-pointer"
                  />
                </div>
              </div>

              {/* Direct Extra Savings SIP Lever */}
              <div className="space-y-2 pt-2 border-t border-[#E4E2DC]/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#172033]">Direct Additional Monthly SIP</span>
                  <span className="font-mono font-bold text-[#2563EB]">+{formatCurrency(extraSavings)}/mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="1000"
                  value={extraSavings}
                  onChange={(e) => setExtraSavings(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE MATHEMATICAL PROJECTION & GOALS VELOCITY */}
          <div className="lg:col-span-7 space-y-5">
            {/* Category Reductions Breakdown */}
            <div className="editorial-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                <h3 className="text-sm font-black text-[#172033]">
                  Monthly Category Optimization Impact
                </h3>
                <span className="text-xs font-mono font-bold text-[#059669]">
                  Total Saved: +{formatCurrency(simResults?.category_reductions?.reduce((acc: number, c: any) => acc + c.monthly_saved, 0) || 0)}/mo
                </span>
              </div>

              <div className="space-y-3">
                {(simResults?.category_reductions || []).map((cat: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-black text-[#172033] block">{cat.category}</span>
                      <span className="text-[11px] text-[#5F6878] font-mono">
                        Base: {formatCurrency(cat.current_monthly_spend)}/mo • Cut: {cat.reduction_pct}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-[#059669] block">
                        +{formatCurrency(cat.monthly_saved)}/mo
                      </span>
                      <span className="text-[10px] text-[#858D9A] font-mono">
                        {formatCurrency(cat.total_saved_over_horizon)} in {timeframeMonths}M
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Goals Acceleration Impact */}
            <div className="editorial-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#059669]" />
                  <h3 className="text-sm font-black text-[#172033]">
                    Savings Goals Acceleration
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#2563EB]">
                  50% Surplus Allocation
                </span>
              </div>

              {(simResults?.goal_impacts || []).length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
                  No active savings goals found. Create a goal in the Goals section to see timeline acceleration!
                </div>
              ) : (
                <div className="space-y-3">
                  {simResults.goal_impacts.map((g: any) => (
                    <div
                      key={g.goal_id}
                      className="p-4 rounded-2xl bg-white border border-[#E4E2DC] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#172033]">{g.title}</span>
                        {g.months_saved > 0 ? (
                          <span className="brutalist-tag-emerald text-[10px] py-0.5 px-2">
                            ✓ {g.months_saved} Months Earlier!
                          </span>
                        ) : (
                          <Badge variant="neutral" size="sm">On Schedule</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-[#E4E2DC]/60">
                        <div>
                          <span className="text-[10px] text-[#858D9A] block uppercase font-sans">Baseline Target</span>
                          <span className="font-bold text-[#5F6878]">{g.baseline_finish_date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#059669] block uppercase font-sans font-bold">Accelerated Target</span>
                          <span className="font-bold text-[#059669]">{g.simulated_finish_date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compounded Wealth Growth Summary */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#172033] to-[#0F172A] text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-black tracking-tight text-white uppercase">
                    Compounded SIP Growth (12% CAGR Benchmark)
                  </h4>
                </div>
                <span className="brutalist-tag-emerald text-[9px] py-0 px-2">
                  Deterministic Wealth Model
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">3-Year Projected Corpus</span>
                  <div className="text-lg font-black text-white">
                    {formatCurrency(simResults?.compounded_growth?.three_year_horizon?.simulated_corpus || 0)}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium block">
                    +{formatCurrency(simResults?.compounded_growth?.three_year_horizon?.additional_wealth || 0)} wealth boost
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">5-Year Projected Corpus</span>
                  <div className="text-lg font-black text-emerald-400">
                    {formatCurrency(simResults?.compounded_growth?.five_year_horizon?.simulated_corpus || 0)}
                  </div>
                  <span className="text-[11px] text-emerald-300 font-medium block">
                    +{formatCurrency(simResults?.compounded_growth?.five_year_horizon?.additional_wealth || 0)} wealth boost
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                💡 By sustaining this simulated monthly surplus of <strong>{formatCurrency(simResults?.simulated?.monthly_surplus || 0)}</strong>, your capital works continuously through compounding, accelerating your financial independence trajectory.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
