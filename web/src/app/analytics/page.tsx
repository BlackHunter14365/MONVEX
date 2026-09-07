'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
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

const CATEGORY_COLORS = ['#2563EB', '#059669', '#D97706', '#E11D48', '#7C3AED', '#06B6D4', '#64748B'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, isError, refetch } = useAnalyticsQuery();

  const summary = analyticsData?.summary || null;
  const categoryData = Array.isArray(analyticsData?.spendingByCategory) ? analyticsData.spendingByCategory : [];
  const monthlyTrend = Array.isArray(analyticsData?.monthlyTrend) ? analyticsData.monthlyTrend : [];

  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const totalIncome = summary?.monthly_income ?? summary?.total_income ?? 0;
  const totalExpense = summary?.monthly_expense ?? summary?.total_expense ?? 0;
  const netSavings = summary?.net_savings ?? Math.max(0, totalIncome - totalExpense);
  const savingsRate = summary?.savings_rate ?? summary?.savings_rate_pct ?? (totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0);

  // Health Score Calculation (0-100)
  const healthScore = summary?.health_score?.score ?? Math.min(
    100,
    Math.max(10, Math.round(parseFloat(String(savingsRate)) * 2.5 + (netSavings > 0 ? 30 : 0)))
  );

  // Real Trend Dataset (Zero Fake Data)
  const trendDataset = useMemo(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) return [];
    return monthlyTrend.map((m: any) => ({
      month: m.month || m.name || 'Period',
      income: parseFloat(m.income || 0),
      expense: parseFloat(m.expense || m.expenses || 0),
      net: parseFloat(m.income || 0) - parseFloat(m.expense || m.expenses || 0),
    }));
  }, [monthlyTrend]);

  // Derived category breakdown with percentage
  const formattedCategoryData = useMemo(() => {
    const totalCatSpend = categoryData.reduce((acc: number, c: any) => acc + (parseFloat(c.amount || c.total || c.value) || 0), 0);
    return categoryData.map((c: any, idx: number) => {
      const val = parseFloat(c.amount || c.total || c.value) || 0;
      const pct = totalCatSpend > 0 ? Math.round((val / totalCatSpend) * 100) : 0;
      return {
        name: c.category_name || c.name || 'General',
        value: val,
        percentage: pct,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    });
  }, [categoryData]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            1. HEADER & ANALYTICAL NARRATIVE STRIP
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E2DC]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
              Financial Intelligence & Analytics
            </h1>
            <p className="text-xs text-[#625D69] font-medium mt-0.5">
              Deterministic capital telemetry: spending distribution, burn velocity, and health diagnostics.
            </p>
          </div>

          <Link href="/forecast">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F6F5F1] text-[#191522] border border-[#E4E2DC] text-xs font-bold shadow-2xs transition-all cursor-pointer">
              <TrendingUp className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>90-Day Forecast Runway &rarr;</span>
            </button>
          </Link>
        </div>

        {/* NARRATIVE SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669] block">
              Net Inflows
            </span>
            <FinancialAmount amount={totalIncome} currency={user?.currency} size="xl" type="income" />
            <span className="text-[10px] text-[#625D69] block">Total monthly revenue</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E11D48] block">
              Net Outflows
            </span>
            <FinancialAmount amount={totalExpense} currency={user?.currency} size="xl" type="expense" />
            <span className="text-[10px] text-[#625D69] block">Total monthly expenditure</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#898390] block">
              Retained Capital
            </span>
            <FinancialAmount amount={netSavings} currency={user?.currency} size="xl" type="neutral" />
            <span className="text-[10px] text-[#059669] font-bold block">{savingsRate}% savings rate</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E2DC] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4056A1] block">
              Health Diagnostics
            </span>
            <div className="text-xl font-mono font-black text-[#191522]">{healthScore} / 100</div>
            <span className="text-[10px] text-[#625D69] block">
              {healthScore >= 75 ? 'Optimal Capital Shield' : 'Active Optimization Needed'}
            </span>
          </div>
        </div>

        {isError && !analyticsData ? (
          <ErrorState
            title="Unable to load analytics"
            description="Failed to retrieve analytics telemetry. Check your connection or retry."
            onRetry={() => refetch()}
          />
        ) : (
          /* =========================================================================
              2. TWO-COLUMN ANALYTICAL NARRATIVE GRID
              ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SPENDING BREAKDOWN BY CATEGORY (5 COLS) */}
            <div className="lg:col-span-5 double-bezel">
              <div className="double-bezel-inner p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                  <div>
                    <h2 className="text-sm font-bold text-[#191522]">Where Money Went</h2>
                    <p className="text-[11px] text-[#625D69]">Outflow allocation across normalized categories</p>
                  </div>
                  <PieIcon className="h-4 w-4 text-[#898390]" />
                </div>

                {isLoading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : formattedCategoryData.length === 0 ? (
                  <EmptyState
                    title="No category spending recorded"
                    description="Record transactions with categories to generate allocation donut telemetry."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="h-56 w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formattedCategoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                            onMouseLeave={() => setActivePieIndex(null)}
                          >
                            {formattedCategoryData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="#FFFFFF"
                                strokeWidth={activePieIndex === index ? 3 : 1.5}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: any) => formatCurrency(val, user?.currency)}
                            contentStyle={{
                              borderRadius: '12px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E4E2DC',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category List */}
                    <div className="space-y-2 pt-2 border-t border-[#E4E2DC]">
                      {formattedCategoryData.map((cat, idx) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-[#191522]">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[#898390] text-[11px]">{cat.percentage}%</span>
                            <span className="font-mono text-[#191522] font-bold">
                              {formatCurrency(cat.value, user?.currency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* HISTORICAL TRENDS & REVELATIONS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cashflow Velocity History */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                    <div>
                      <h2 className="text-sm font-bold text-[#191522]">Cash Flow Velocity Over Time</h2>
                      <p className="text-[11px] text-[#625D69]">Historical income vs expense progression</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#898390]">
                      {trendDataset.length} Periods Analyzed
                    </span>
                  </div>

                  {isLoading ? (
                    <Skeleton className="h-64 w-full rounded-xl" />
                  ) : trendDataset.length < 2 ? (
                    <div className="py-16 px-6 rounded-xl border border-dashed border-[#E4E2DC] text-center space-y-2 bg-[#FAF9F6]/50">
                      <BarChart3 className="h-8 w-8 text-[#898390] mx-auto" />
                      <h4 className="text-xs font-bold text-[#191522]">
                        Insufficient data for velocity trend
                      </h4>
                      <p className="text-[11px] text-[#625D69] max-w-sm mx-auto">
                        Historical charts strictly reflect verified past months. Log transactions across multiple billing periods to unlock velocity trends.
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke="#858D9A"
                            fontSize={11}
                            fontWeight={600}
                            tickLine={false}
                            axisLine={{ stroke: '#E4E2DC' }}
                          />
                          <YAxis
                            stroke="#858D9A"
                            fontSize={11}
                            fontWeight={600}
                            tickLine={false}
                            axisLine={{ stroke: '#E4E2DC' }}
                            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                          />
                          <Tooltip
                            formatter={(val: any) => formatCurrency(val, user?.currency)}
                            contentStyle={{
                              borderRadius: '12px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E4E2DC',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          />
                          <Bar dataKey="income" name="Inflow" fill="#059669" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Outflow" fill="#E11D48" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIONABLE RECOMMENDATIONS CARD */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#191522]">
                    <Sparkles className="h-4 w-4 text-[#4056A1]" />
                    <span>Prescriptive Financial Recommendations</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E4E2DC] space-y-1">
                      <span className="font-bold text-[#191522] block">1. Maintain High-Yield Reserve</span>
                      <p className="text-[11px] text-[#625D69] leading-relaxed">
                        With net monthly savings of {formatCurrency(netSavings, user?.currency)}, ensure at least 3 months of emergency runway is parked in liquid capital instruments.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E4E2DC] space-y-1">
                      <span className="font-bold text-[#191522] block">2. Category Acceleration Telemetry</span>
                      <p className="text-[11px] text-[#625D69] leading-relaxed">
                        Track discretionary spending daily to preserve positive cashflow before end-of-month reconciliation.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/ai"
                      className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Query AI Copilot for Personalized Plan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
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
