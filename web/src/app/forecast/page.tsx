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

export default function ForecastPage() {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  // Scenario Simulator levers
  const [incomeDelta, setIncomeDelta] = useState(0);
  const [expenseDelta, setExpenseDelta] = useState(0);

  const loadForecast = async (selectedDays: number) => {
    setIsLoading(true);
    try {
      const res = await api.getCashflowForecast(selectedDays);
      setForecast(res);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(days);
  }, [days]);

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
        <div className="rounded-2xl bg-white border border-[#E2DFD7] p-3.5 shadow-xl space-y-2 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-[#ECE9E0] pb-1.5">
            <span className="text-xs font-mono font-bold text-[#191522]">{label}</span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB]">
              Model v2.4
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex items-center justify-between text-xs font-bold gap-3">
              <span className="flex items-center gap-1.5 text-[#625D69]">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] truncate">{entry.name}:</span>
              </span>
              <span className="text-[#191522] font-mono tabular-nums">
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
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <PageHeader
          title="Predictive Cash Flow & Runway Forecast"
          description="Probabilistic time-series forward trajectory modeling. Projects end-of-period liquidity with empirical confidence intervals and scenario sensitivity levers."
          actionSlot={
            <div className="flex items-center p-1 rounded-2xl bg-white border border-[#E2DFD7] shadow-2xs">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all min-h-[36px]',
                    days === d
                      ? 'bg-[#2A1F3D] text-white shadow-xs'
                      : 'text-[#625D69] hover:text-[#191522]'
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full rounded-[24px]" />
            <Skeleton className="h-28 w-full rounded-[24px]" />
            <Skeleton className="h-28 w-full rounded-[24px]" />
          </div>
        ) : !hasSufficientData ? (
          <div className="p-1.5 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
            <div className="p-10 rounded-[22px] border border-[#ECE9E0] bg-[#FBFBFA] text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200">
                <Info className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-[#191522]">
                  Insufficient Telemetry for Probabilistic Forecast
                </h3>
                <p className="text-xs text-[#625D69] max-w-md mx-auto leading-relaxed font-medium">
                  Our predictive time-series model requires historical income, expenses, or recurring obligations to compute empirical burn rates and forward liquidity bounds.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2A1F3D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3B2D54] transition-all shadow-xs active:scale-98 min-h-[44px]"
                >
                  <span>Record First Transaction</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TOP THREE DOUBLE-BEZEL METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Starting Balance */}
              <div className="p-1.5 rounded-[24px] bg-white border border-[#E2DFD7] shadow-sm">
                <div className="p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                    Starting Ledger Balance
                  </span>
                  <div className="flex items-baseline gap-2">
                    <FinancialAmount
                      amount={forecast?.starting_balance || 0}
                      type="neutral"
                      size="xl"
                    />
                  </div>
                  <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                    <span className="text-[#625D69] font-medium">Baseline Status:</span>
                    <span className="font-mono font-bold text-[#059669]">Verified Ledger Balance</span>
                  </div>
                </div>
              </div>

              {/* 2. Daily Average Burn */}
              <div className="p-1.5 rounded-[24px] bg-white border border-[#E2DFD7] shadow-sm">
                <div className="p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                    Daily Average Burn Velocity
                  </span>
                  <div className="flex items-baseline gap-2">
                    <FinancialAmount
                      amount={forecast?.daily_burn_rate || 0}
                      type="expense"
                      size="xl"
                    />
                    <span className="text-[11px] font-mono text-[#898390]">/ day</span>
                  </div>
                  <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                    <span className="text-[#625D69] font-medium">Historical Window:</span>
                    <span className="font-mono font-bold text-[#191522]">30-Day Run-Rate</span>
                  </div>
                </div>
              </div>

              {/* 3. Projected Balance in N Days */}
              <div className="p-1.5 rounded-[24px] bg-white border border-[#E2DFD7] shadow-sm">
                <div className="p-5 rounded-[18px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                    Projected Balance ({days} Days)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <FinancialAmount
                      amount={simulatedEndBalance}
                      type={simulatedEndBalance >= 0 ? 'income' : 'expense'}
                      size="xl"
                    />
                  </div>
                  <div className="pt-1 border-t border-[#ECE9E0] flex items-center justify-between text-[11px]">
                    <span className="text-[#625D69] font-medium">Sensitivity:</span>
                    <span className={cn('font-mono font-bold', (incomeDelta !== 0 || expenseDelta !== 0) ? 'text-[#2563EB]' : 'text-[#625D69]')}>
                      {(incomeDelta !== 0 || expenseDelta !== 0) ? 'Active Levers Adjusted' : 'Deterministic Baseline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN TRAJECTORY CHART (DOUBLE-BEZEL) */}
            <div className="p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
              <div className="p-5 sm:p-6 rounded-[22px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E2DC] pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#191522] tracking-tight">
                      Projected Liquidity Trajectory & Confidence Interval
                    </h3>
                    <p className="text-xs text-[#625D69] font-medium">
                      Upper and lower empirical bounds expand dynamically reflecting time horizon variance
                    </p>
                  </div>
                  {(incomeDelta !== 0 || expenseDelta !== 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIncomeDelta(0);
                        setExpenseDelta(0);
                      }}
                      className="text-xs font-bold"
                    >
                      Reset Levers
                    </Button>
                  )}
                </div>

                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulatedTrajectory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECE9E0" vertical={false} />
                      <XAxis dataKey="day" stroke="#858D9A" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#E4E2DC' }} dy={6} />
                      <YAxis stroke="#858D9A" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#E4E2DC' }} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                      <Tooltip cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomForecastTooltip />} />
                      <ReferenceLine y={0} stroke="#E11D48" strokeDasharray="3 3" label={{ value: 'Zero Balance', fill: '#E11D48', fontSize: 10, position: 'right', fontWeight: 700 }} />

                      {/* Upper Bound */}
                      <Area
                        type="monotone"
                        name="Upper Bound (Optimistic)"
                        dataKey="upper_bound"
                        stroke="#93C5FD"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#upperGrad)"
                      />

                      {/* Projected Expected */}
                      <Area
                        type="monotone"
                        name="Projected Balance"
                        dataKey="projected_balance"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#projectedGrad)"
                        dot={{ r: 3, fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 2 }}
                        activeDot={{ r: 5.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                      />

                      {/* Lower Bound */}
                      <Area
                        type="monotone"
                        name="Lower Bound (Conservative)"
                        dataKey="lower_bound"
                        stroke="#FCA5A5"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        fillOpacity={0}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* REAL-TIME SCENARIO LEVERS (DOUBLE-BEZEL) */}
            <div className="p-1.5 sm:p-2 rounded-[28px] bg-white border border-[#E2DFD7] shadow-sm">
              <div className="p-5 sm:p-6 rounded-[22px] border border-[#ECE9E0] bg-[#FBFBFA] space-y-5">
                <div className="flex items-center gap-2 border-b border-[#E4E2DC] pb-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <Sliders className="h-4 w-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#191522] tracking-tight">
                      Scenario Sensitivity Levers
                    </h3>
                    <p className="text-[10.5px] text-[#625D69] font-medium">
                      Simulate income shifts and discretionary spending optimizations
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Income Adjustment Lever */}
                  <div className="space-y-2 p-4 rounded-2xl bg-white border border-[#E4E2DC] shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#191522]">Monthly Inflow Adjustment</span>
                      <span className={cn('font-mono font-bold', incomeDelta >= 0 ? 'text-[#059669]' : 'text-[#E11D48]')}>
                        {incomeDelta >= 0 ? '+' : ''}{formatCurrency(incomeDelta, user?.currency)}/mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-25000"
                      max="50000"
                      step="2500"
                      value={incomeDelta}
                      onChange={(e) => setIncomeDelta(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                      <span>-₹25k (Paycut)</span>
                      <span>Baseline (₹0)</span>
                      <span>+₹50k (Raise)</span>
                    </div>
                  </div>

                  {/* Expense Reduction Lever */}
                  <div className="space-y-2 p-4 rounded-2xl bg-white border border-[#E4E2DC] shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#191522]">Monthly Spending Reduction</span>
                      <span className={cn('font-mono font-bold', expenseDelta >= 0 ? 'text-[#059669]' : 'text-[#E11D48]')}>
                        {expenseDelta >= 0 ? '-' : '+'}{formatCurrency(Math.abs(expenseDelta), user?.currency)}/mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-15000"
                      max="30000"
                      step="1500"
                      value={expenseDelta}
                      onChange={(e) => setExpenseDelta(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#898390]">
                      <span>+₹15k (Extra Burn)</span>
                      <span>Baseline (₹0)</span>
                      <span>-₹30k (Frugal)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
