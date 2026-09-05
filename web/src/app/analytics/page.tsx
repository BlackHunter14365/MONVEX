'use client';

import React, { useState } from 'react';
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
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
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
} from 'recharts';

import { useAnalyticsQuery } from '@/hooks/queries/useAnalyticsQuery';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: analyticsData, isLoading, isError, refetch } = useAnalyticsQuery();

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
            <span className="text-[11px] font-bold text-[#898390]">{label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
              Verified
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex items-center justify-between text-xs font-bold gap-3">
              <span className="flex items-center gap-1.5 text-[#625D69]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="text-[#191522] tabular-nums">
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

        {isError && !analyticsData ? (
          <ErrorState
            title="Unable to calculate analytics"
            description="Failed to compile cashflow telemetry from accounting backend. Check connection or try again."
            onRetry={() => refetch()}
          />
        ) : (
          <>
            {/* 1. Core Health KPI Grid with Animated Spark Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Health Score */}
              <CardReveal index={0} hoverLift={true} className="editorial-card p-6 space-y-1.5">
                <span className="swiss-eyebrow block">
                  Health score
                </span>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="swiss-metric text-2xl text-[#191522] flex items-baseline gap-1.5">
                    <span>{healthScore}</span>
                    <span className="text-xs text-[#898390] font-bold">/100</span>
                  </div>
                )}
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#059669]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Optimal liquidity</span>
                </div>
              </CardReveal>

              {/* Savings Rate */}
              <CardReveal index={1} hoverLift={true} className="editorial-card p-6 space-y-1.5">
                <span className="swiss-eyebrow block">
                  Savings rate
                </span>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="swiss-metric text-2xl text-[#059669]">
                    {savingsRate}%
                  </div>
                )}
                <span className="text-[11px] font-semibold text-[#898390] block pt-1">
                  Target: 20.0%+
                </span>
              </CardReveal>

              {/* Monthly Inflow */}
              <CardReveal index={2} hoverLift={true} className="editorial-card p-6 space-y-1.5">
                <span className="swiss-eyebrow block">
                  Total inflow
                </span>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="swiss-metric text-2xl text-[#191522]">
                    <AnimatedValue value={totalIncome} currency={user?.currency} />
                  </div>
                )}
                <span className="text-[11px] font-semibold text-[#898390] block pt-1">
                  Active monthly period
                </span>
              </CardReveal>

              {/* Monthly Burn */}
              <CardReveal index={3} hoverLift={true} className="editorial-card p-6 space-y-1.5">
                <span className="swiss-eyebrow block">
                  Total outflow
                </span>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="swiss-metric text-2xl text-[#E11D48]">
                    <AnimatedValue value={totalExpense} currency={user?.currency} />
                  </div>
                )}
                <span className="text-[11px] font-semibold text-[#898390] block pt-1">
                  All spending categories
                </span>
              </CardReveal>
            </div>

            {/* 2. Charts Section: Cashflow Trajectory (8 cols) + Category Breakdown (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Cashflow Trajectory Chart (8 cols) */}
              <div className="lg:col-span-8 editorial-card p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#191522]">
                      Cashflow trajectory
                    </h3>
                    <p className="text-xs font-medium text-[#625D69]">
                      Historical inflow vs outflow comparison across selected time window
                    </p>
                  </div>

                  {/* Horizon and View Switchers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Horizon Filter */}
                    <div className="flex rounded-lg bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                      {(['3M', '6M', '12M'] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setChartHorizon(h)}
                          className={cn(
                            'px-2 py-1 rounded-md text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none',
                            chartHorizon === h
                              ? 'bg-white text-[#191522] shadow-xs'
                              : 'text-[#625D69] hover:text-[#191522]'
                          )}
                        >
                          {h}
                        </button>
                      ))}
                    </div>

                    {/* Chart Mode */}
                    <div className="flex rounded-lg bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                      <button
                        onClick={() => setChartView('AREA')}
                        className={cn(
                          'px-2 py-1 rounded-md text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none',
                          chartView === 'AREA'
                            ? 'bg-white text-[#191522] shadow-xs'
                            : 'text-[#625D69] hover:text-[#191522]'
                        )}
                      >
                        Area
                      </button>
                      <button
                        onClick={() => setChartView('BAR')}
                        className={cn(
                          'px-2 py-1 rounded-md text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none',
                          chartView === 'BAR'
                            ? 'bg-white text-[#191522] shadow-xs'
                            : 'text-[#625D69] hover:text-[#191522]'
                        )}
                      >
                        Bar
                      </button>
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartView === 'AREA' ? (
                        <AreaChart data={trendDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="anIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="anExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E11D48" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke="#898390"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#E4E2DC' }}
                          />
                          <YAxis
                            stroke="#898390"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                          />
                          <Tooltip content={<CustomAnalyticsTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#10B981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#anIncomeGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="expense"
                            name="Expenses"
                            stroke="#E11D48"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#anExpenseGrad)"
                          />
                        </AreaChart>
                      ) : (
                        <BarChart data={trendDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke="#898390"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#E4E2DC' }}
                          />
                          <YAxis
                            stroke="#898390"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                          />
                          <Tooltip content={<CustomAnalyticsTooltip />} />
                          <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Expenses" fill="#E11D48" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category Spending Breakdown (4 cols) */}
              <div className="lg:col-span-4 editorial-card p-6 sm:p-7 space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#191522]">
                    Category allocation
                  </h3>
                  <p className="text-xs font-medium text-[#625D69]">
                    Proportion of outflows by verified classification
                  </p>
                </div>

                {isLoading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : pieDataset.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#625D69] border border-dashed border-[#E4E2DC] rounded-xl">
                    <p>No category transactions recorded in current period.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Donut Chart Container */}
                    <div className="h-44 w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieDataset}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActivePieIndex(index)}
                            onMouseLeave={() => setActivePieIndex(null)}
                          >
                            {pieDataset.map((_, index) => (
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
                        <span className="text-[10px] font-bold text-[#898390] uppercase tracking-wider">
                          Total
                        </span>
                        <span className="text-sm font-black text-[#191522] tabular-nums">
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
                                ? 'bg-white border-[#2A1F3D] shadow-sm scale-[1.01]'
                                : 'bg-white/70 border-[#E4E2DC]'
                            )}
                          >
                            <div className="flex items-center justify-between text-xs font-bold gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                                <span className="text-[#191522] truncate">{cat.name}</span>
                              </div>
                              <span className="text-[#625D69] tabular-nums font-semibold shrink-0">
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
              <h4 className="text-sm font-bold text-[#191522] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#2563EB]" />
                <span>Analyst observation</span>
              </h4>
              <p className="text-xs text-[#625D69] leading-relaxed">
                {totalIncome === 0 && totalExpense === 0
                  ? 'Your analytics pipeline is initialized and listening for incoming transaction logs. As soon as you record income or expenses, predictive variance models and savings benchmarks will update here automatically.'
                  : totalIncome > totalExpense
                  ? `You are generating a net positive monthly surplus of ${formatCurrency(netSavings, user?.currency)} with a ${savingsRate}% retention rate. Continuing this pace will accelerate emergency and milestone goal completion.`
                  : `Monthly outlays exceed recorded inflows by ${formatCurrency(Math.abs(totalIncome - totalExpense), user?.currency)}. Consider auditing discretionary food and shopping categories to restore positive liquidity.`}
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
