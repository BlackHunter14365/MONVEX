'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { AnimatedValue, CardReveal } from '@/components/motion';
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

  // Custom Forecast Tooltip
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-white border border-[#E4E2DC] p-3.5 shadow-lg space-y-1.5 min-w-[160px]">
          <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-1">
            <span className="text-xs font-bold text-[#858D9A]">{label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB]">
              Forecast Model
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex items-center justify-between text-xs font-bold gap-3">
              <span className="flex items-center gap-1.5 text-[#5F6878]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="text-[#172033] tabular-nums">
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
      <div className="space-y-6">
        <PageHeader
          title="Predictive Cash Flow & Liquidity"
          description="90-day probabilistic time-series projections with uncertainty confidence intervals and scenario modeling."
          actionSlot={
            <div className="flex items-center rounded-lg bg-[#F6F5F1] p-1 border border-[#E4E2DC]">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-bold transition-all',
                    days === d
                      ? 'bg-white text-[#172033] shadow-sm'
                      : 'text-[#5F6878] hover:text-[#172033]'
                  )}
                >
                  {d} Days
                </button>
              ))}
            </div>
          }
        />

        {/* Forecast KPI Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <CardReveal index={0} hoverLift={true} className="editorial-card p-6 space-y-1.5">
              <span className="swiss-eyebrow block">Current Starting Balance</span>
              <div className="swiss-metric text-2xl sm:text-3xl text-[#172033]">
                <AnimatedValue value={forecast?.starting_balance || 0} currency={user?.currency} />
              </div>
              <span className="text-[11px] text-[#858D9A] block">Real-time baseline</span>
            </CardReveal>

            <CardReveal index={1} hoverLift={true} className="editorial-card p-6 space-y-1.5">
              <span className="swiss-eyebrow block">Daily Average Burn</span>
              <div className="swiss-metric text-2xl sm:text-3xl text-[#E11D48]">
                <AnimatedValue value={forecast?.daily_burn_rate || 0} currency={user?.currency} suffix=" / day" />
              </div>
              <span className="text-[11px] text-[#858D9A] block">30-day historical run-rate</span>
            </CardReveal>

            <CardReveal index={2} hoverLift={true} className="editorial-card p-6 space-y-1.5">
              <span className="swiss-eyebrow block">
                Projected Balance in {days} Days
              </span>
              <div
                className={cn(
                  'swiss-metric text-2xl sm:text-3xl',
                  simulatedEndBalance >= 0 ? 'text-[#059669]' : 'text-[#E11D48]'
                )}
              >
                <AnimatedValue value={simulatedEndBalance} currency={user?.currency} />
              </div>
              <span className="text-[11px] text-[#858D9A] block">
                {incomeDelta !== 0 || expenseDelta !== 0 ? (
                  <span className="text-[#2563EB] font-bold">Simulated with active adjustments</span>
                ) : (
                  'Estimated baseline liquidity'
                )}
              </span>
            </CardReveal>
          </div>
        )}

        {/* Main Trajectory Chart Card */}
        <div className="editorial-card p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Projected Liquidity Trajectory & Confidence Interval
              </h3>
              <p className="text-xs text-[#5F6878]">
                Confidence bounds expand dynamically reflecting time variance
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
              >
                Reset scenario
              </Button>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulatedTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" vertical={false} />
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
          )}
        </div>

        {/* Real-time Scenario Levers Card */}
        <div className="editorial-card p-6 sm:p-7 space-y-6">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#172033]">
              Scenario Levers: Simulate Behavioral Adjustments
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Adjustment Lever */}
            <div className="space-y-2 p-4 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC]">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#5F6878]">Monthly Income Delta</span>
                <span className={cn('tabular-nums', incomeDelta >= 0 ? 'text-[#059669]' : 'text-[#E11D48]')}>
                  {incomeDelta >= 0 ? '+' : ''}{formatCurrency(incomeDelta, user?.currency)}
                </span>
              </div>
              <input
                type="range"
                min="-25000"
                max="50000"
                step="2500"
                value={incomeDelta}
                onChange={(e) => setIncomeDelta(parseInt(e.target.value))}
                className="w-full h-2 bg-[#E4E2DC] rounded-lg appearance-none cursor-pointer accent-[#172033]"
              />
              <span className="text-[10px] text-[#858D9A] block">Simulate bonuses, freelance earnings, or wage shifts.</span>
            </div>

            {/* Expense Reduction Lever */}
            <div className="space-y-2 p-4 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC]">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#5F6878]">Monthly Spending Reduction</span>
                <span className={cn('tabular-nums', expenseDelta >= 0 ? 'text-[#059669]' : 'text-[#E11D48]')}>
                  {expenseDelta >= 0 ? '-' : '+'}{formatCurrency(Math.abs(expenseDelta), user?.currency)}
                </span>
              </div>
              <input
                type="range"
                min="-15000"
                max="30000"
                step="1500"
                value={expenseDelta}
                onChange={(e) => setExpenseDelta(parseInt(e.target.value))}
                className="w-full h-2 bg-[#E4E2DC] rounded-lg appearance-none cursor-pointer accent-[#172033]"
              />
              <span className="text-[10px] text-[#858D9A] block">Simulate trimming discretionary subscriptions or food burn.</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
