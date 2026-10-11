'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { PageHeader } from '@/components/layout/PageHeader';
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
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useAnalyticsQuery } from '@/hooks/queries/useAnalyticsQuery';

const CATEGORY_COLORS = ['#6865E8', '#75DCC0', '#E8A54B', '#E76D7A', '#8B5CF6', '#3B82F6', '#64748B'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        {/* =========================================================================
            1. HEADER & OVERVIEW
            ========================================================================= */}
        <PageHeader
          eyebrow="FINANCIAL INTELLIGENCE"
          title="Telemetry & Deep Analytics"
          description="Deterministic capital telemetry: category spending allocation, cashflow burn velocity, and financial health diagnostics."
          actionSlot={
            <Link href="/forecast">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6865E8] hover:bg-[#5b58db] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span>90-Day Forecast Runway &rarr;</span>
              </button>
            </Link>
          }
        />

        {/* =========================================================================
            2. SUMMARY STAT CARDS (Aurora Glass 4-Metric Strip)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Net Inflows
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalIncome} currency={user?.currency} size="2xl" type="income" />
              <p className="text-xs text-[#77798A] font-medium mt-1">Total monthly revenue</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                Net Outflows
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalExpense} currency={user?.currency} size="2xl" type="expense" />
              <p className="text-xs text-[#77798A] font-medium mt-1">Total monthly expenditure</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Retained Capital
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={netSavings} currency={user?.currency} size="2xl" type="neutral" />
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8FBF4] text-[#16745C]">
                  {savingsRate}%
                </span>
                <span className="text-xs text-[#77798A]">savings rate</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Health Diagnostics
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">{healthScore} / 100</div>
              <p className="text-xs text-[#16745C] font-semibold mt-1">
                {healthScore >= 75 ? 'Optimal Capital Shield' : 'Active Optimization Needed'}
              </p>
            </div>
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
              3. TWO-COLUMN ANALYTICAL NARRATIVE GRID
              ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SPENDING BREAKDOWN BY CATEGORY (5 COLS - Nexora Donut Style) */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
                <div>
                  <h2 className="text-base font-bold text-[#20212B]">Expenses Breakdown</h2>
                  <p className="text-xs text-[#77798A] mt-0.5">Outflow allocation across categories</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                  <PieIcon className="h-4 w-4" />
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-72 w-full rounded-2xl" />
              ) : formattedCategoryData.length === 0 ? (
                <EmptyState
                  title="No category spending recorded"
                  description="Record transactions with categories to generate allocation donut telemetry."
                />
              ) : (
                <div className="space-y-5">
                  <div className="h-60 w-full relative flex items-center justify-center">
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formattedCategoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
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
                              borderRadius: '16px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E7E6F0',
                              fontSize: '12px',
                              fontWeight: 700,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-60 w-60 rounded-full border-8 border-[#ECEBFF] animate-pulse" />
                    )}

                    {/* Donut Center Metric */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-mono font-bold text-[#20212B]">
                        {formattedCategoryData.length}
                      </span>
                      <span className="text-[10px] font-mono text-[#77798A] uppercase tracking-wider">
                        Categories
                      </span>
                    </div>
                  </div>

                  {/* Category Pills List */}
                  <div className="space-y-2.5 pt-2 border-t border-[#E7E6F0]">
                    {formattedCategoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between gap-2 text-xs font-semibold p-2 rounded-2xl hover:bg-[#F8F7FC] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-[#20212B] truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-[#77798A] text-xs">{cat.percentage}%</span>
                          <span className="font-mono text-[#20212B] font-bold">
                            {formatCurrency(cat.value, user?.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* HISTORICAL TRENDS & REVELATIONS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cashflow Velocity History */}
              <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
                  <div>
                    <h2 className="text-base font-bold text-[#20212B]">Cash Flow Velocity Over Time</h2>
                    <p className="text-xs text-[#77798A] mt-0.5">Historical monthly inflow vs outflow progression</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#6865E8] bg-[#ECEBFF] px-2.5 py-1 rounded-full">
                    {trendDataset.length} Periods Analyzed
                  </span>
                </div>

                {isLoading ? (
                  <Skeleton className="h-72 w-full rounded-2xl" />
                ) : trendDataset.length < 2 ? (
                  <div className="py-16 px-6 rounded-2xl border border-dashed border-[#E7E6F0] text-center space-y-2 bg-[#F8F7FC]">
                    <BarChart3 className="h-10 w-10 text-[#77798A] mx-auto" />
                    <h4 className="text-sm font-bold text-[#20212B]">
                      Insufficient data for velocity trend
                    </h4>
                    <p className="text-xs text-[#77798A] max-w-sm mx-auto">
                      Historical charts strictly reflect verified past months. Log transactions across multiple billing periods to unlock velocity trends.
                    </p>
                  </div>
                ) : (
                  <div className="h-72 w-full pt-2">
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0EFFE" vertical={false} />
                          <XAxis
                            dataKey="month"
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
                          <Tooltip
                            formatter={(val: any) => formatCurrency(val, user?.currency)}
                            contentStyle={{
                              borderRadius: '16px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E7E6F0',
                              fontSize: '12px',
                              fontWeight: 700,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                            }}
                          />
                          <Bar dataKey="income" name="Inflow" fill="#75DCC0" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="expense" name="Outflow" fill="#6865E8" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-72 w-full animate-pulse bg-[#F8F7FC] rounded-2xl" />
                    )}
                  </div>
                )}
              </div>

              {/* Financial Health Diagnostics Card */}
              <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#20212B]">
                      Capital Health Diagnostic Indicators
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#16745C] bg-[#E8FBF4] px-2.5 py-0.5 rounded-full">
                    Deterministic Score: {healthScore}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1">
                    <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Savings Retention</span>
                    <div className="text-base font-mono font-bold text-[#20212B]">{savingsRate}%</div>
                    <span className="text-[11px] text-[#16745C] font-semibold block">Target: &gt;20%</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1">
                    <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Discretionary Ratio</span>
                    <div className="text-base font-mono font-bold text-[#20212B]">
                      {totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(0)}%` : '0%'}
                    </div>
                    <span className="text-[11px] text-[#77798A] font-medium block">Max Cap: &lt;50%</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-1">
                    <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Cashflow Posture</span>
                    <div className="text-base font-mono font-bold text-[#16745C]">
                      {netSavings >= 0 ? 'Surplus Positive' : 'Deficit Risk'}
                    </div>
                    <span className="text-[11px] text-[#16745C] font-semibold block">Net capital gain</span>
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
