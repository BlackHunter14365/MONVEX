'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  ShoppingBag,
  Home,
  Car,
  ShoppingBasket,
  CreditCard,
  Plus,
  ShieldCheck,
  Receipt,
  PieChart,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
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
import { WalletAccountsSection } from '@/components/finance/WalletAccountsSection';

interface DashboardAttentionItem {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  desc: string;
  actionUrl: string;
  actionLabel: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardQuery();

  const summary = dashboardData?.summary || null;
  const transactions = dashboardData?.transactions || [];
  const budgets = dashboardData?.budgets || [];
  const goals = dashboardData?.goals || [];
  const monthlyTrend = dashboardData?.monthlyTrend || [];

  // Chart Metric Mode
  const [chartMetric, setChartMetric] = useState<'EXPENSE' | 'DUAL' | 'NET'>('EXPENSE');

  // Dynamic user name
  const [cachedName, setCachedName] = useState<string | null>(null);

  const loadProfileInfo = () => {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        const name = `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim();
        if (name) setCachedName(name);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadProfileInfo();
    const handleProfileUpdate = () => {
      loadProfileInfo();
      refetch();
    };
    window.addEventListener('monvex:profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('monvex:profile-updated', handleProfileUpdate);
    };
  }, [user, refetch]);

  // Verified financial totals from backend API
  const totalIncome = summary?.monthly_income ?? summary?.total_income ?? 0;
  const totalExpense = summary?.monthly_expense ?? summary?.total_expense ?? 0;
  const totalNetBalance = summary?.net_balance ?? (totalIncome - totalExpense);
  const netLiquidity = summary?.net_liquidity ?? totalNetBalance;
  const dailyBurnRate = summary?.daily_burn_rate ?? (totalExpense > 0 ? Math.round(totalExpense / Math.max(1, new Date().getDate())) : 0);
  const runwayDays = summary?.runway_days ?? (dailyBurnRate > 0 ? Math.round(netLiquidity / dailyBurnRate) : null);
  const netSavings = summary?.net_savings ?? Math.max(0, totalIncome - totalExpense);
  const savingsRate = summary?.savings_rate ?? summary?.savings_rate_pct ?? (totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0);

  const displayName = cachedName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'there';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Real Cashflow Trend Dataset (Strictly No Fake Data)
  const trajectoryChartData = useMemo(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) {
      return [];
    }
    return monthlyTrend.map((m: any) => ({
      label: m.month || m.name || 'Period',
      expense: parseFloat(m.expense || m.expenses || 0),
      income: parseFloat(m.income || 0),
      net: parseFloat(m.income || 0) - parseFloat(m.expense || m.expenses || 0),
    }));
  }, [monthlyTrend]);

  // Health Score (0-100) with Transparent Diagnostics
  const healthMetrics = useMemo(() => {
    const sRate = parseFloat(String(savingsRate)) || 0;
    const isPositiveCashflow = netSavings > 0;
    const overBudgetCount = budgets.filter((b: any) => {
      const spent = parseFloat(b.spent_amount ?? b.current_spent) || 0;
      const limit = parseFloat(b.limit_amount ?? b.amount) || 1;
      return spent > limit;
    }).length;

    let score = 50;
    if (sRate >= 20) score += 30;
    else if (sRate > 0) score += 15;
    else score -= 20;

    if (isPositiveCashflow) score += 10;
    if (overBudgetCount === 0 && budgets.length > 0) score += 10;
    else if (overBudgetCount > 0) score -= (overBudgetCount * 10);

    const boundedScore = Math.min(100, Math.max(10, score));
    const tier =
      boundedScore >= 80 ? 'Optimal Financial Sovereignty' : boundedScore >= 60 ? 'Healthy Stability' : 'Elevated Burn Velocity';

    return {
      score: summary?.health_score?.score ?? boundedScore,
      tier,
      sRate,
      isPositiveCashflow,
      overBudgetCount,
    };
  }, [savingsRate, netSavings, budgets, summary]);

  // Attention Center Items (Authoritative backend guardrails with client fallback)
  const attentionItems: DashboardAttentionItem[] = useMemo(() => {
    if (summary?.attention_items && Array.isArray(summary.attention_items) && summary.attention_items.length > 0) {
      return summary.attention_items as DashboardAttentionItem[];
    }

    const items: DashboardAttentionItem[] = [];

    // Check budget violations
    budgets.forEach((b: any) => {
      const spent = parseFloat(b.spent_amount ?? b.current_spent) || 0;
      const limit = parseFloat(b.limit_amount ?? b.amount) || 1;
      const pct = Math.round((spent / limit) * 100);
      if (pct >= 100) {
        items.push({
          id: `budget-${b.id}`,
          level: 'critical',
          title: `Budget Cap Exceeded: ${b.category_name || b.name}`,
          desc: `Exceeded by ${pct - 100}% (${formatCurrency(spent - limit, user?.currency)} over limit).`,
          actionUrl: '/budgets',
          actionLabel: 'Adjust Guardrail',
        });
      } else if (pct >= 80) {
        items.push({
          id: `budget-warn-${b.id}`,
          level: 'warning',
          title: `Approaching Budget Limit: ${b.category_name || b.name}`,
          desc: `${pct}% utilized (${formatCurrency(limit - spent, user?.currency)} remaining).`,
          actionUrl: '/budgets',
          actionLabel: 'View Spend',
        });
      }
    });

    // Check savings goals
    goals.forEach((g: any) => {
      const current = parseFloat(g.current_amount) || 0;
      const target = parseFloat(g.target_amount) || 1;
      const pct = Math.round((current / target) * 100);
      if (pct < 50 && (g.target_date || g.deadline)) {
        items.push({
          id: `goal-${g.id}`,
          level: 'info',
          title: `Active Goal Milestone: ${g.title || g.name}`,
          desc: `${pct}% accumulated toward ${formatCurrency(target, user?.currency)}.`,
          actionUrl: '/goals',
          actionLabel: 'Contribute Capital',
        });
      }
    });

    // Fallback if healthy
    if (items.length === 0) {
      if (transactions.length === 0) {
        items.push({
          id: 'setup-ledger',
          level: 'info',
          title: 'Ledger Ingestion Ready',
          desc: 'Log your first income or expense transaction to unlock velocity telemetry.',
          actionUrl: '/transactions',
          actionLabel: 'Open Ledger',
        });
      } else {
        items.push({
          id: 'healthy-state',
          level: 'success',
          title: 'All Financial Guardrails Balanced',
          desc: 'Monthly outflows are aligned within established spending limits.',
          actionUrl: '/analytics',
          actionLabel: 'View Analytics',
        });
      }
    }

    return items;
  }, [summary?.attention_items, budgets, goals, transactions, user?.currency]);

  // Category Icon & Badge Resolver
  const getCategoryStyles = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) {
      return { icon: Utensils, bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]' };
    }
    if (lower.includes('shop')) {
      return { icon: ShoppingBag, bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]' };
    }
    if (lower.includes('bill') || lower.includes('util') || lower.includes('rent')) {
      return { icon: Home, bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', badgeBg: 'bg-[#E0F2FE]', badgeText: 'text-[#0369A1]' };
    }
    if (lower.includes('grocer')) {
      return { icon: ShoppingBasket, bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]' };
    }
    if (lower.includes('trans') || lower.includes('travel') || lower.includes('cab')) {
      return { icon: Car, bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', badgeBg: 'bg-[#F3E8FF]', badgeText: 'text-[#7E22CE]' };
    }
    return { icon: CreditCard, bg: 'bg-[#F1F0EC]', text: 'text-[#625D69]', badgeBg: 'bg-[#F1F0EC]', badgeText: 'text-[#625D69]' };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            1. FINANCIAL COMMAND BAR & GREETING
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E2DC]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
                {getGreeting()}, {displayName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E8F7F1] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-[#625D69] font-medium mt-0.5">
              Financial command center and deterministic capital overview.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('monvex:open-add-transaction'));
                }
              }}
              className="touch-target"
            >
              Add Record
            </Button>
            <Link href="/receipts">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Receipt className="h-3.5 w-3.5 text-[#4056A1]" />}
                className="touch-target"
              >
                Scan Receipt
              </Button>
            </Link>
            <Link href="/budgets">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PieChart className="h-3.5 w-3.5 text-[#059669]" />}
                className="touch-target hidden sm:inline-flex"
              >
                Set Budget
              </Button>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            2. WALLET & ACCOUNTS BAR
            ========================================================================= */}
        <WalletAccountsSection
          userCurrency={user?.currency}
          realTransactions={transactions}
          onAddTransaction={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('monvex:open-add-transaction'));
            }
          }}
        />

        {isError && !dashboardData ? (
          <ErrorState
            title="Unable to load financial dashboard"
            description="Could not connect to the accounting service. Your ledger is safely preserved. Try refreshing."
            onRetry={() => refetch()}
          />
        ) : (
          /* =========================================================================
              3. ASYMMETRIC COMMAND GRID (8 COLS MAIN / 4 COLS INTEL)
              ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT & CENTER COLUMN (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">
              {/* PRIMARY FINANCIAL POSITION & CASH FLOW */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 sm:p-7 space-y-6">
                  {/* Position Header */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E4E2DC]/80">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#898390]">
                        Net Available Liquidity
                      </span>
                      {isLoading ? (
                        <Skeleton className="h-10 w-48 mt-1" />
                      ) : (
                        <div className="flex items-baseline gap-3">
                          <FinancialAmount
                            amount={netLiquidity}
                            currency={user?.currency}
                            size="3xl"
                            showSign={false}
                            type="neutral"
                          />
                          <span
                            className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded-md border',
                              netLiquidity >= 0
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECDD3]'
                            )}
                          >
                            {netLiquidity >= 0 ? 'Surplus Position' : 'Deficit Reserve'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#625D69]">
                      <div>
                        <span className="text-[10px] text-[#898390] block uppercase tracking-wider">Savings Rate</span>
                        <span className="font-mono font-bold text-[#059669]">{savingsRate}%</span>
                      </div>
                      <div className="hidden sm:block h-8 w-px bg-[#E4E2DC]" />
                      <div>
                        <span className="text-[10px] text-[#898390] block uppercase tracking-wider">Net Retained</span>
                        <span className="font-mono font-bold text-[#191522]">
                          {formatCurrency(netSavings, user?.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Monthly Inflows */}
                    <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E4E2DC] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669]">
                          Total Inflows
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#059669]" />
                      </div>
                      <FinancialAmount
                        amount={totalIncome}
                        currency={user?.currency}
                        size="xl"
                        type="income"
                      />
                      <span className="text-[10px] text-[#625D69] block">This calendar month</span>
                    </div>

                    {/* Monthly Outflows */}
                    <div className="p-4 rounded-xl bg-[#FDF8F8] border border-[#E4E2DC] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E11D48]">
                          Total Outflows
                        </span>
                        <ArrowDownRight className="h-3.5 w-3.5 text-[#E11D48]" />
                      </div>
                      <FinancialAmount
                        amount={totalExpense}
                        currency={user?.currency}
                        size="xl"
                        type="expense"
                      />
                      <span className="text-[10px] text-[#625D69] block">This calendar month</span>
                    </div>

                    {/* Capital Velocity */}
                    <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E4E2DC] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4056A1]">
                          Daily Burn Rate
                        </span>
                        <TrendingDown className="h-3.5 w-3.5 text-[#4056A1]" />
                      </div>
                      <FinancialAmount
                        amount={dailyBurnRate}
                        currency={user?.currency}
                        size="xl"
                        type="neutral"
                      />
                      <span className="text-[10px] text-[#625D69] block">
                        {runwayDays && runwayDays < 999
                          ? `${runwayDays} days reserve runway`
                          : 'Rolling 30-day pace'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REAL CASH FLOW TRAJECTORY CHART (Zero Fake Data) */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 sm:p-7 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-bold text-[#191522]">Cash Flow Trajectory</h2>
                      {/* Metric Mode Pills */}
                      <div className="flex rounded-lg bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                        <button
                          onClick={() => setChartMetric('EXPENSE')}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer',
                            chartMetric === 'EXPENSE' ? 'bg-white text-[#191522] shadow-xs' : 'text-[#625D69]'
                          )}
                        >
                          Outflows
                        </button>
                        <button
                          onClick={() => setChartMetric('DUAL')}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer',
                            chartMetric === 'DUAL' ? 'bg-white text-[#191522] shadow-xs' : 'text-[#625D69]'
                          )}
                        >
                          In vs Out
                        </button>
                        <button
                          onClick={() => setChartMetric('NET')}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer',
                            chartMetric === 'NET' ? 'bg-white text-[#191522] shadow-xs' : 'text-[#625D69]'
                          )}
                        >
                          Net Flow
                        </button>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-[#898390]">
                      Historical Periods Recorded: {trajectoryChartData.length}
                    </span>
                  </div>

                  {isLoading ? (
                    <Skeleton className="h-64 w-full rounded-xl" />
                  ) : trajectoryChartData.length < 2 ? (
                    <div className="py-12 px-6 rounded-xl border border-dashed border-[#E4E2DC] text-center space-y-2 bg-[#FAF9F6]/60">
                      <TrendingUp className="h-6 w-6 text-[#898390] mx-auto" />
                      <p className="text-xs font-bold text-[#191522]">
                        Insufficient historical data for cashflow curve
                      </p>
                      <p className="text-[11px] text-[#625D69] max-w-sm mx-auto">
                        MONVEX strictly prohibits synthesized fake data. Record transactions across multiple periods to unlock real trajectory curves.
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="spendGradBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16} />
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="incomeGradGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.16} />
                              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="netGradPurple" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.16} />
                              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" vertical={false} />
                          <XAxis
                            dataKey="label"
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
                            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-xl bg-white border border-[#E4E2DC] p-3 shadow-lg space-y-1 text-xs">
                                    <span className="font-bold text-[#898390] block">{label}</span>
                                    {payload.map((entry: any, index: number) => (
                                      <div key={index} className="flex justify-between gap-3 font-semibold">
                                        <span style={{ color: entry.color }}>{entry.name}:</span>
                                        <span className="font-mono tabular-nums">{formatCurrency(entry.value, user?.currency)}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {(chartMetric === 'EXPENSE' || chartMetric === 'DUAL') && (
                            <Area
                              type="monotone"
                              name="Outflow"
                              dataKey="expense"
                              stroke="#2563EB"
                              strokeWidth={2}
                              fill="url(#spendGradBlue)"
                            />
                          )}
                          {chartMetric === 'DUAL' && (
                            <Area
                              type="monotone"
                              name="Inflow"
                              dataKey="income"
                              stroke="#059669"
                              strokeWidth={2}
                              fill="url(#incomeGradGreen)"
                            />
                          )}
                          {chartMetric === 'NET' && (
                            <Area
                              type="monotone"
                              name="Net Cash"
                              dataKey="net"
                              stroke="#7C3AED"
                              strokeWidth={2}
                              fill="url(#netGradPurple)"
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT MONEY MOVEMENT LEDGER */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-[#191522]">Recent Money Movement</h2>
                      <p className="text-[11px] text-[#625D69]">Latest recorded transactions in your active ledger</p>
                    </div>
                    <Link
                      href="/transactions"
                      className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1"
                    >
                      <span>Full Ledger</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <EmptyState
                      title="No transactions logged"
                      description="Add your first inflow or outflow to begin automated financial telemetry."
                      actionLabel="Record First Transaction"
                      onAction={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('monvex:open-add-transaction'));
                        }
                      }}
                    />
                  ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                      {/* Mobile Card List */}
                      <div className="sm:hidden divide-y divide-[#F0EFEA]">
                        {transactions.slice(0, 5).map((tx: any) => {
                          const isExp = tx.type === 'EXPENSE';
                          const catStyles = getCategoryStyles(tx.category_name);
                          return (
                            <div key={`mob-${tx.id}`} className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0 text-xs font-black', catStyles.bg, catStyles.text)}>
                                  {(tx.merchant_name || tx.category_name || 'T').slice(0,1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-[#191522] block truncate">
                                    {tx.merchant_name || tx.description || 'Transaction'}
                                  </span>
                                  <span className="text-[11px] text-[#898390] block">
                                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {' · '}
                                    <span className={cn('font-bold', catStyles.badgeText)}>{tx.category_name || 'General'}</span>
                                  </span>
                                </div>
                              </div>
                              <FinancialAmount
                                amount={tx.amount}
                                currency={user?.currency}
                                type={isExp ? 'expense' : 'income'}
                                showSign={true}
                                sign={isExp ? '-' : '+'}
                                size="sm"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table */}
                      <table className="ref-table hidden sm:table">
                        <thead>
                          <tr>
                            <th className="w-[20%]">Date</th>
                            <th className="w-[45%]">Merchant / Description</th>
                            <th className="w-[18%]">Category</th>
                            <th className="w-[17%] text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.slice(0, 5).map((tx: any) => {
                            const isExp = tx.type === 'EXPENSE';
                            const catStyles = getCategoryStyles(tx.category_name);

                            return (
                              <tr key={tx.id}>
                                <td className="text-xs font-semibold text-[#625D69] whitespace-nowrap">
                                  {new Date(tx.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td>
                                  <span className="font-bold text-xs text-[#191522] truncate max-w-[240px] block">
                                    {tx.merchant_name || tx.description || 'Transaction'}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={cn(
                                      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                                      catStyles.badgeBg,
                                      catStyles.badgeText,
                                      'border-[#E4E2DC]'
                                    )}
                                  >
                                    {tx.category_name || 'General'}
                                  </span>
                                </td>
                                <td className="text-right whitespace-nowrap">
                                  <FinancialAmount
                                    amount={tx.amount}
                                    currency={user?.currency}
                                    type={isExp ? 'expense' : 'income'}
                                    showSign={true}
                                    sign={isExp ? '-' : '+'}
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (4 COLS: ATTENTION & HEALTH) */}
            <div className="lg:col-span-4 space-y-6">
              {/* 1. ATTENTION CENTER */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#191522] flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#D97706]" />
                      <span>Attention Center</span>
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-[#898390]">
                      {attentionItems.length} Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    {attentionItems.map((item: DashboardAttentionItem) => (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3.5 rounded-xl border text-xs space-y-2',
                          item.level === 'critical'
                            ? 'bg-[#FEF2F2] border-[#FECDD3] text-[#DC2626]'
                            : item.level === 'warning'
                            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                            : item.level === 'success'
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                            : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                        )}
                      >
                        <div className="font-bold text-[#191522]">{item.title}</div>
                        <p className="text-[11px] text-[#625D69] leading-relaxed">{item.desc}</p>
                        <Link
                          href={item.actionUrl}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. FINANCIAL HEALTH SCORE DIAGNOSTICS */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#191522] flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                      <span>Financial Health</span>
                    </h2>
                    <span className="text-xs font-mono font-extrabold text-[#191522]">
                      {healthMetrics.score} / 100
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full h-2 bg-[#F1F0EC] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          healthMetrics.score >= 80
                            ? 'bg-[#059669]'
                            : healthMetrics.score >= 60
                            ? 'bg-[#D97706]'
                            : 'bg-[#E11D48]'
                        )}
                        style={{ width: `${healthMetrics.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#191522] block">{healthMetrics.tier}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E4E2DC] text-[11px]">
                    <div className="flex justify-between items-center text-[#625D69]">
                      <span>Monthly Cash Flow:</span>
                      <span className={cn('font-bold', healthMetrics.isPositiveCashflow ? 'text-[#059669]' : 'text-[#E11D48]')}>
                        {healthMetrics.isPositiveCashflow ? 'Positive Surplus' : 'Negative Deficit'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#625D69]">
                      <span>Savings Velocity:</span>
                      <span className="font-mono font-bold text-[#191522]">{healthMetrics.sRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[#625D69]">
                      <span>Budget Compliance:</span>
                      <span className="font-bold text-[#191522]">
                        {healthMetrics.overBudgetCount === 0 ? '100% Guarded' : `${healthMetrics.overBudgetCount} Violated`}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/analytics"
                    className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>Full Diagnostic Breakdown</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* 3. BUDGET PROGRESS & LIMITS */}
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#191522]">
                      Budget Guardrails
                    </h2>
                    <Link href="/budgets" className="text-xs font-bold text-[#2563EB] hover:underline">
                      Manage
                    </Link>
                  </div>

                  {isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : budgets.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[#E4E2DC] text-center space-y-2">
                      <p className="text-xs text-[#625D69]">No category budgets established.</p>
                      <Link href="/budgets" className="text-xs font-bold text-[#2563EB] hover:underline block">
                        + Set Spending Limit
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {budgets.slice(0, 3).map((b: any) => {
                        const spent = parseFloat(b.spent_amount ?? b.current_spent) || 0;
                        const limit = parseFloat(b.limit_amount ?? b.amount) || 1;
                        const pct = Math.min(100, Math.round((spent / limit) * 100));

                        return (
                          <div key={b.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-[#191522]">{b.category_name || b.name}</span>
                              <span className="font-mono text-[#625D69]">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F1F0EC] rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  pct >= 100 ? 'bg-[#E11D48]' : pct >= 80 ? 'bg-[#D97706]' : 'bg-[#059669]'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#898390] font-mono">
                              <span>Spent: {formatCurrency(spent, user?.currency)}</span>
                              <span>Cap: {formatCurrency(limit, user?.currency)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
