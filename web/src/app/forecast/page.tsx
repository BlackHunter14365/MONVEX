'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useForecastQuery } from '@/hooks/queries/useForecastQuery';

export default function ForecastPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [days, setDays] = useState(30);
  const { data: forecast, isLoading } = useForecastQuery(days);

  // Scenario Simulator levers
  const [incomeDelta, setIncomeDelta] = useState(0);
  const [expenseDelta, setExpenseDelta] = useState(0);

  // Dynamically compute adjusted trajectory based on simulation levers
  const simulatedTrajectory = (forecast?.daily_trajectory || []).map((point: any, idx: number) => {
    const dayProgress = (idx + 1) / days;
    const netMonthlyDelta = (incomeDelta - expenseDelta) * (days / 30) * dayProgress;
    return {
      ...point,
      day: `Day ${point.day_number || idx + 1}`,
      projected_balance: Math.round(point.projected_balance + netMonthlyDelta),
      upper_bound: Math.round(point.upper_bound + netMonthlyDelta),
      lower_bound: Math.round(point.lower_bound + netMonthlyDelta),
    };
  });

  const baseEndBalance = forecast?.projected_end_balance || 0;
  const simulatedEndBalance = Math.round(baseEndBalance + (incomeDelta - expenseDelta) * (days / 30));
  const hasSufficientData = Boolean(
    forecast?.has_sufficient_data ??
    (forecast?.daily_burn_rate > 0 || (forecast?.starting_balance && forecast.starting_balance !== 0))
  );

  // Custom Forecast Tooltip
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl bg-white border border-[#E7E6F0] p-4 shadow-xl space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-[#E7E6F0] pb-2">
            <span className="text-xs font-mono font-bold text-[#20212B]">{label}</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECEBFF] text-[#6865E8]">
              Forecast Model
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex items-center justify-between text-xs font-bold gap-3">
              <span className="flex items-center gap-1.5 text-[#77798A]">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] truncate">{entry.name}:</span>
              </span>
              <span className="text-[#20212B] font-mono tabular-nums">
                {formatCurrency(entry.value, user?.currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="PREDICTIVE INTELLIGENCE"
          title="Predictive Cash Flow & Runway Forecast"
          description="Probabilistic time-series forward trajectory modeling. Projects end-of-period liquidity with empirical confidence intervals and scenario sensitivity levers."
          actionSlot={
            <div className="flex items-center p-1 rounded-2xl bg-white border border-[#E7E6F0] shadow-xs" role="group" aria-label="Forecast timeframe">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  aria-pressed={days === d}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    days === d
                      ? 'bg-[#6865E8] text-white shadow-xs'
                      : 'text-[#77798A] hover:text-[#20212B]'
                  )}
                >
                  {d} Days
                </button>
              ))}
            </div>
          }
        />

        {/* Forecast Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : !hasSufficientData ? (
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECEBFF] text-[#6865E8]">
              <Info className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#20212B]">
                Insufficient Telemetry for Probabilistic Forecast
              </h3>
              <p className="text-xs text-[#77798A] max-w-md mx-auto leading-relaxed">
                Our predictive time-series model requires historical income, expenses, or recurring obligations to compute empirical burn rates and forward liquidity bounds.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/transactions"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#6865E8] px-6 py-3 text-xs font-bold text-white hover:bg-[#5b58db] transition-all shadow-xs"
              >
                <span>Record First Transaction</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 3 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                    Projected {days}-Day Balance
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <FinancialAmount
                    amount={simulatedEndBalance}
                    currency={user?.currency}
                    size="2xl"
                    type={simulatedEndBalance >= 0 ? 'income' : 'expense'}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#77798A]">
                      Base model: {formatCurrency(baseEndBalance, user?.currency)}
                    </span>
                    {simulatedEndBalance !== baseEndBalance && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECEBFF] text-[#6865E8]">
                        Adjusted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                    Daily Cash Burn Rate
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <FinancialAmount
                    amount={forecast?.daily_burn_rate || 0}
                    currency={user?.currency}
                    size="2xl"
                    type="expense"
                    showSign={false}
                  />
                  <p className="text-xs text-[#77798A] font-medium mt-1">
                    Historical 30-day velocity
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                    Model Confidence Horizon
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-[#20212B]">95% Empirical Bounds</div>
                  <p className="text-xs text-[#16745C] font-semibold mt-1">
                    Normal variance distribution
                  </p>
                </div>
              </div>
            </div>

            {/* Trajectory Area Chart Container */}
            <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7E6F0]">
                <div>
                  <h3 className="text-base font-bold text-[#20212B]">
                    Projected Forward Liquidity Curve ({days} Days)
                  </h3>
                  <p className="text-xs text-[#77798A] mt-0.5">
                    Solid violet line represents mean projection; shaded bands indicate 95% confidence intervals
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#6865E8]" />
                    <span className="text-[#20212B]">Projected Mean</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#75DCC0]" />
                    <span className="text-[#77798A]">Upper Bound</span>
                  </div>
                </div>
              </div>

              <div className="h-80 w-full pt-2">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={simulatedTrajectory}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6865E8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6865E8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#75DCC0" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#75DCC0" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EFFE" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="#77798A"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={{ stroke: '#E7E6F0' }}
                      />
                      <YAxis
                        stroke="#77798A"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={{ stroke: '#E7E6F0' }}
                        tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      />
                      <Tooltip content={<CustomForecastTooltip />} />
                      <ReferenceLine y={0} stroke="#E76D7A" strokeDasharray="4 4" />
                      <Area
                        type="monotone"
                        dataKey="upper_bound"
                        name="Upper Bound"
                        stroke="#75DCC0"
                        strokeWidth={1.5}
                        fill="url(#upperGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="projected_balance"
                        name="Projected Mean"
                        stroke="#6865E8"
                        strokeWidth={2.5}
                        fill="url(#projectedGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 w-full animate-pulse bg-[#F8F7FC] rounded-2xl" />
                )}
              </div>
            </div>

            {/* Scenario Sensitivity Levers Laboratory */}
            <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                    <Sliders className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#20212B]">
                      Scenario Sensitivity Laboratory
                    </h3>
                    <p className="text-xs text-[#77798A]">
                      Adjust hypothetical income and expense shifts to model forward impact
                    </p>
                  </div>
                </div>

                {(incomeDelta !== 0 || expenseDelta !== 0) && (
                  <button
                    onClick={() => {
                      setIncomeDelta(0);
                      setExpenseDelta(0);
                    }}
                    className="text-xs font-bold text-[#6865E8] hover:underline"
                  >
                    Reset Levers
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Income Delta Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[#20212B]">Monthly Income Shift</span>
                    <span className="font-mono text-[#16745C]">
                      {incomeDelta >= 0 ? `+${formatCurrency(incomeDelta, user?.currency)}` : formatCurrency(incomeDelta, user?.currency)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50000"
                    max="100000"
                    step="5000"
                    value={incomeDelta}
                    onChange={(e) => setIncomeDelta(Number(e.target.value))}
                    className="w-full accent-[#6865E8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                    <span>-₹50k</span>
                    <span>Baseline (0)</span>
                    <span>+₹100k</span>
                  </div>
                </div>

                {/* Expense Delta Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[#20212B]">Monthly Spending Reduction / Increase</span>
                    <span className="font-mono text-[#E76D7A]">
                      {expenseDelta >= 0 ? `+${formatCurrency(expenseDelta, user?.currency)}` : formatCurrency(expenseDelta, user?.currency)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50000"
                    max="50000"
                    step="2500"
                    value={expenseDelta}
                    onChange={(e) => setExpenseDelta(Number(e.target.value))}
                    className="w-full accent-[#6865E8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#77798A]">
                    <span>-₹50k (Frugal)</span>
                    <span>Baseline (0)</span>
                    <span>+₹50k (Expansion)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
