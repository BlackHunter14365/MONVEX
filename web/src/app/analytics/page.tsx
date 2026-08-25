'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';

import { useAnalyticsQuery } from '@/hooks/queries/useAnalyticsQuery';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: analyticsData, isLoading } = useAnalyticsQuery();

  const summary = analyticsData?.summary || null;
  const categoryData = Array.isArray(analyticsData?.spendingByCategory) ? analyticsData.spendingByCategory : [];
  const monthlyTrend = Array.isArray(analyticsData?.monthlyTrend) ? analyticsData.monthlyTrend : [];

  // Advanced Chart State
  const [chartHorizon, setChartHorizon] = useState<'3M' | '6M' | '12M'>('6M');
  const [chartView, setChartView] = useState<'AREA' | 'BAR'>('AREA');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const totalIncome = summary?.monthly_income ?? summary?.total_income ?? 0;
  const totalExpense = summary?.monthly_expense ?? summary?.total_expense ?? 0;
  const netSavings = summary?.net_savings ?? Math.max(0, totalIncome - totalExpense);
  const savingsRate = summary?.savings_rate ?? summary?.savings_rate_pct ?? (totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0);

  // Financial Health Score Calculation (0-100)
  const healthScore = summary?.health_score?.score ?? Math.min(
    100,
    Math.max(0, Math.round(parseFloat(String(savingsRate)) * 2.5 + (netSavings > 0 ? 30 : 0)))
  );

  // Dynamic Trend Dataset for Horizon
  const trendDataset = React.useMemo(() => {
    if (monthlyTrend.length > 0) {
      return monthlyTrend.map((m: any) => ({
        month: m.month || m.name || 'Period',
        income: parseFloat(m.income || 0),
        expense: parseFloat(m.expense || m.expenses || 0),
        net: parseFloat(m.income || 0) - parseFloat(m.expense || m.expenses || 0),
      }));
    }

    const months6 = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const months3 = ['Jun', 'Jul', 'Aug'];
    const months12 = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

    const targetList = chartHorizon === '3M' ? months3 : chartHorizon === '12M' ? months12 : months6;

    return targetList.map((m) => {
      return {
        month: m,
        income: totalIncome > 0 ? Math.round(totalIncome / targetList.length) : 0,
        expense: totalExpense > 0 ? Math.round(totalExpense / targetList.length) : 0,
        net: totalIncome > 0 || totalExpense > 0 ? Math.round((totalIncome - totalExpense) / targetList.length) : 0,
      };
    });
  }, [monthlyTrend, chartHorizon, totalIncome, totalExpense]);

  // Donut Palette
  const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

  // Normalized Category Pie Dataset
  const pieDataset = React.useMemo(() => {
    if (categoryData.length > 0) {
      return categoryData.map((c: any) => ({
        name: c.category || c.name || 'Category',
        value: parseFloat(c.total || c.amount || c.value || 0),
      }));
    }
    return [];
  }, [categoryData]);

  // Custom Rich Tooltip for Analytics
  const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-white border border-[#E4E2DC] p-3 shadow-lg space-y-1.5 min-w-[150px]">
          <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-1">
            <span className="text-[11px] font-bold text-[#858D9A]">{label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
              Verified
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
          title="Analytics"
          description="Understand where your money is going with cash flow trajectories, category breakdowns, and financial health metrics."
        />

        {/* 1. Core Health KPI Grid with Animated Spark Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Health Score */}
          <CardReveal index={0} hoverLift={true} className="editorial-card p-6 space-y-1.5">
            <span className="swiss-eyebrow block">
              Financial health score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="swiss-metric text-3xl sm:text-4xl text-[#172033]">
                {isLoading ? <Skeleton className="h-9 w-16" /> : <AnimatedValue value={healthScore} type="number" decimals={0} />}
              </span>
              <span className="text-xs text-[#858D9A] font-bold">/ 100</span>
            </div>
            <span className="text-[11px] text-[#059669] font-bold block">
              {healthScore >= 70 ? 'Excellent capital retention' : 'Moderate capital velocity'}
            </span>
          </CardReveal>

          {/* Income */}
          <CardReveal index={1} hoverLift={true} className="editorial-card p-6 space-y-1.5">
            <span className="swiss-eyebrow block">
              Monthly income
            </span>
            <div className="swiss-metric text-2xl sm:text-3xl text-[#172033]">
              {isLoading ? <Skeleton className="h-8 w-24" /> : <AnimatedValue value={totalIncome} currency={user?.currency} />}
            </div>
            <span className="text-[11px] text-[#059669] font-bold flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Inflow verified</span>
            </span>
          </CardReveal>

          {/* Spending */}
          <CardReveal index={2} hoverLift={true} className="editorial-card p-6 space-y-1.5">
            <span className="swiss-eyebrow block">
              Monthly spending
            </span>
            <div className="swiss-metric text-2xl sm:text-3xl text-[#E11D48]">
              {isLoading ? <Skeleton className="h-8 w-24" /> : <AnimatedValue value={totalExpense} currency={user?.currency} />}
            </div>
            <span className="text-[11px] text-[#E11D48] font-bold flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>Outflow total</span>
            </span>
          </CardReveal>

          {/* Savings Rate */}
          <CardReveal index={3} hoverLift={true} className="editorial-card p-6 space-y-1.5">
            <span className="swiss-eyebrow block">
              Savings rate
            </span>
            <div className="swiss-metric text-2xl sm:text-3xl text-[#059669]">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedValue value={savingsRate} type="percentage" decimals={1} />}
            </div>
            <span className="text-[11px] text-[#5F6878] font-semibold block">
              {isLoading ? '--' : <AnimatedValue value={netSavings} currency={user?.currency} />} retained
            </span>
          </CardReveal>
        </div>

        {/* 2. Main Charts Section (Trajectory & Donut Matrix) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Monthly Trajectory Stream (7 cols) */}
          <div className="lg:col-span-7 editorial-card p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  Cash flow trajectory
                </h3>
                <p className="text-xs text-[#5F6878]">
                  Monthly income vs expense dynamics
                </p>
              </div>

              {/* Controls: View Mode & Horizon */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex rounded-lg bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                  <button
                    onClick={() => setChartView('AREA')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
                      chartView === 'AREA' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5F6878] hover:text-[#172033]'
                    )}
                  >
                    Spline
                  </button>
                  <button
                    onClick={() => setChartView('BAR')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
                      chartView === 'BAR' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5F6878] hover:text-[#172033]'
                    )}
                  >
                    Bars
                  </button>
                </div>

                <div className="flex rounded-lg bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                  {(['3M', '6M', '12M'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setChartHorizon(h)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
                        chartHorizon === h ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5F6878] hover:text-[#172033]'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'AREA' ? (
                    <AreaChart data={trendDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" vertical={false} />
                      <XAxis dataKey="month" stroke="#858D9A" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#E4E2DC' }} dy={6} />
                      <YAxis stroke="#858D9A" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#E4E2DC' }} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                      <Tooltip cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomAnalyticsTooltip />} />
                      <Area type="monotone" dataKey="income" name="Inflow (Income)" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#incGrad)" dot={{ r: 3, fill: '#FFFFFF', stroke: '#059669', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="expense" name="Outflow (Expense)" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#expGrad)" dot={{ r: 3, fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }} />
                    </AreaChart>
                  ) : (
                    <BarChart data={trendDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" vertical={false} />
                      <XAxis dataKey="month" stroke="#858D9A" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#E4E2DC' }} dy={6} />
                      <YAxis stroke="#858D9A" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#E4E2DC' }} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                      <Tooltip content={<CustomAnalyticsTooltip />} />
                      <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="expense" name="Expense" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Spending Donut Matrix (5 cols) */}
          <div className="lg:col-span-5 editorial-card p-6 sm:p-7 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Spending by category
              </h3>
              <p className="text-xs text-[#5F6878]">
                Interactive allocation breakdown
              </p>
            </div>

            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : pieDataset.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E4E2DC] rounded-xl space-y-2">
                <PieIcon className="h-8 w-8 text-[#858D9A]" />
                <p className="text-xs font-bold text-[#172033]">No category spending recorded</p>
                <p className="text-[11px] text-[#5F6878]">Add transactions with categories to see your spending allocation breakdown.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Donut Chart with Center Total */}
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E2DC',
                          borderRadius: '10px',
                          boxShadow: '0 4px 12px rgba(23, 32, 51, 0.08)',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#172033',
                        }}
                        formatter={(val: any) => [formatCurrency(val, user?.currency)]}
                      />
                      <Pie
                        data={pieDataset}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        {pieDataset.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="#FFFFFF"
                            strokeWidth={activePieIndex === index ? 3 : 1}
                            className="transition-all duration-200 cursor-pointer"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Metric Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-[#858D9A] uppercase tracking-wider">
                      Total
                    </span>
                    <span className="text-sm font-black text-[#172033] tabular-nums">
                      {formatCurrency(totalExpense, user?.currency)}
                    </span>
                  </div>
                </div>

                {/* Interactive Legend List */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {pieDataset.slice(0, 5).map((cat: any, index: number) => {
                    const amt = cat.value;
                    const pct = totalExpense > 0 ? Math.min(100, Math.round((amt / totalExpense) * 100)) : 0;
                    const isHovered = activePieIndex === index;

                    return (
                      <div
                        key={cat.name}
                        onMouseEnter={() => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                        className={cn(
                          'p-2.5 rounded-xl border transition-all cursor-pointer space-y-1',
                          isHovered
                            ? 'bg-white border-[#172033] shadow-sm scale-[1.01]'
                            : 'bg-white/70 border-[#E4E2DC]'
                        )}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="text-[#172033] truncate max-w-[130px]">{cat.name}</span>
                          </div>
                          <span className="text-[#5F6878] tabular-nums font-semibold">
                            {formatCurrency(amt, user?.currency)} ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Editorial Intelligence Observation Block */}
        <div className="editorial-card p-6 sm:p-7 space-y-2 border-l-4 border-l-[#2563EB]">
          <h4 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <span>Analyst observation</span>
          </h4>
          <p className="text-xs text-[#5F6878] leading-relaxed">
            {totalIncome === 0 && totalExpense === 0
              ? 'Your analytics pipeline is initialized and listening for incoming transaction logs. As soon as you record income or expenses, predictive variance models and savings benchmarks will update here automatically.'
              : totalIncome > totalExpense
              ? `You are generating a net positive monthly surplus of ${formatCurrency(netSavings, user?.currency)} with a ${savingsRate}% retention rate. Continuing this pace will accelerate emergency and milestone goal completion.`
              : `Monthly outlays exceed recorded inflows by ${formatCurrency(Math.abs(totalIncome - totalExpense), user?.currency)}. Consider auditing discretionary food and shopping categories to restore positive liquidity.`}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
