'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Utensils,
  ShoppingBag,
  Home,
  Plane,
  Car,
  ShoppingBasket,
  CreditCard,
  Plus,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useStaggerEntrance } from '@/hooks/useAnimations';
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
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function DashboardPage() {
  const { user } = useAuth();

  // Modern TanStack Query server state
  const { data: dashboardData, isLoading, refetch } = useDashboardQuery();

  const summary = dashboardData?.summary || null;
  const transactions = dashboardData?.transactions || [];
  const budgets = dashboardData?.budgets || [];
  const goals = dashboardData?.goals || [];
  const recurring = dashboardData?.recurring || [];
  const monthlyTrend = dashboardData?.monthlyTrend || [];

  // Advanced Chart Controls
  const [chartHorizon, setChartHorizon] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [chartMetric, setChartMetric] = useState<'EXPENSE' | 'DUAL' | 'NET'>('EXPENSE');

  // Animation container
  const containerRef = useStaggerEntrance('.dash-reveal', [isLoading]);

  const [cachedName, setCachedName] = useState<string | null>(null);

  const loadProfileInfo = () => {
    if (!user) return;
    try {
      const profileRaw = localStorage.getItem(`monvex_user_profile_${user.username}`);
      if (profileRaw) {
        const parsed = JSON.parse(profileRaw);
        if (parsed.firstName || parsed.lastName) {
          setCachedName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadProfileInfo();

    const handleTxAdded = () => refetch();
    const handleProfileUpdate = () => loadProfileInfo();

    window.addEventListener('monvex:transaction-added', handleTxAdded);
    window.addEventListener('monvex:profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('monvex:transaction-added', handleTxAdded);
      window.removeEventListener('monvex:profile-updated', handleProfileUpdate);
    };
  }, [user]);

  // Compute live verified values from API
  const totalIncome = summary?.monthly_income ?? summary?.total_income ?? 0;
  const totalExpense = summary?.monthly_expense ?? summary?.total_expense ?? 0;
  const totalNetBalance = summary?.net_balance ?? (totalIncome - totalExpense);
  const netSavings = summary?.net_savings ?? Math.max(0, totalIncome - totalExpense);
  const savingsRate = summary?.savings_rate ?? summary?.savings_rate_pct ?? (totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0);

  const displayName = cachedName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'there';

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // High-Tech Multi-Horizon Chart Dataset
  const trajectoryChartData = React.useMemo(() => {
    const hasData = totalExpense > 0 || totalIncome > 0 || (monthlyTrend && monthlyTrend.length > 0);
    const baseExpense = totalExpense;
    const baseIncome = totalIncome;

    if (!hasData) {
      if (chartHorizon === '7D') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((d) => ({ label: d, expense: 0, income: 0, net: 0 }));
      }
      if (chartHorizon === '90D') {
        return [
          { label: 'Month 1', expense: 0, income: 0, net: 0 },
          { label: 'Month 2', expense: 0, income: 0, net: 0 },
          { label: 'Month 3 (Cur)', expense: 0, income: 0, net: 0 },
        ];
      }
      if (chartHorizon === '1Y') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
        return months.map((m) => ({ label: m, expense: 0, income: 0, net: 0 }));
      }
      return [
        { label: 'Week 1', expense: 0, income: 0, net: 0 },
        { label: 'Week 2', expense: 0, income: 0, net: 0 },
        { label: 'Week 3', expense: 0, income: 0, net: 0 },
        { label: 'Week 4', expense: 0, income: 0, net: 0 },
      ];
    }

    if (monthlyTrend && monthlyTrend.length > 0) {
      return monthlyTrend.map((m: any) => ({
        label: m.month || m.name || 'Period',
        expense: parseFloat(m.expense || m.expenses || 0),
        income: parseFloat(m.income || 0),
        net: parseFloat(m.income || 0) - parseFloat(m.expense || m.expenses || 0),
      }));
    }

    if (chartHorizon === '7D') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((d, i) => {
        const exp = Math.round((baseExpense / 7) * (0.8 + (i % 3) * 0.2));
        const inc = i === 4 ? baseIncome : 0;
        return {
          label: d,
          expense: exp,
          income: inc,
          net: inc - exp,
        };
      });
    }

    if (chartHorizon === '90D') {
      return [
        { label: 'Month 1', expense: Math.round(baseExpense * 0.9), income: baseIncome, net: baseIncome - Math.round(baseExpense * 0.9) },
        { label: 'Month 2', expense: Math.round(baseExpense * 0.95), income: baseIncome, net: baseIncome - Math.round(baseExpense * 0.95) },
        { label: 'Month 3 (Cur)', expense: Math.round(baseExpense), income: baseIncome, net: baseIncome - Math.round(baseExpense) },
      ];
    }

    if (chartHorizon === '1Y') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
      return months.map((m, i) => {
        const exp = Math.round(baseExpense * (0.85 + (i * 0.02)));
        return {
          label: m,
          expense: exp,
          income: baseIncome,
          net: baseIncome - exp,
        };
      });
    }

    // Default 30D
    return [
      { label: 'Week 1', expense: Math.round(baseExpense * 0.2), income: Math.round(baseIncome * 0.25), net: Math.round(baseIncome * 0.25 - baseExpense * 0.2) },
      { label: 'Week 2', expense: Math.round(baseExpense * 0.25), income: Math.round(baseIncome * 0.25), net: Math.round(baseIncome * 0.25 - baseExpense * 0.25) },
      { label: 'Week 3', expense: Math.round(baseExpense * 0.3), income: Math.round(baseIncome * 0.25), net: Math.round(baseIncome * 0.25 - baseExpense * 0.3) },
      { label: 'Week 4', expense: Math.round(baseExpense * 0.25), income: Math.round(baseIncome * 0.25), net: Math.round(baseIncome * 0.25 - baseExpense * 0.25) },
    ];
  }, [chartHorizon, monthlyTrend, totalExpense, totalIncome]);

  // Average daily pace for reference line
  const averageDailySpend = Math.round(totalExpense / 30);

  // Primary active goal
  const primaryGoal = goals[0] || null;
  const goalCurrent = primaryGoal ? parseFloat(primaryGoal.current_amount) || 0 : 0;
  const goalTarget = primaryGoal ? parseFloat(primaryGoal.target_amount) || 1 : 1;
  const goalPct = Math.min(100, Math.round((goalCurrent / goalTarget) * 100));

  const goalDeadline = primaryGoal?.deadline || primaryGoal?.target_date;
  const goalRequiredMonthly = React.useMemo(() => {
    if (!primaryGoal || !goalDeadline) return null;
    const now = new Date();
    const end = new Date(goalDeadline);
    const monthsRemaining = Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
    const remainingToSave = Math.max(0, goalTarget - goalCurrent);
    return Math.round(remainingToSave / monthsRemaining);
  }, [primaryGoal, goalDeadline, goalTarget, goalCurrent]);

  // Primary budget category spotlight
  const topBudget = budgets[0] || null;
  const topBudgetSpent = topBudget ? parseFloat(topBudget.spent_amount ?? topBudget.current_spent) || 0 : 0;
  const topBudgetLimit = topBudget ? parseFloat(topBudget.limit_amount ?? topBudget.amount) || 1 : 1;
  const topBudgetPct = Math.min(100, Math.round((topBudgetSpent / topBudgetLimit) * 100));

  // Category Icon & Color Resolver
  const getCategoryStyles = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) {
      return { icon: Utensils, bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', badgeBg: 'bg-[#F0EFEA]', badgeText: 'text-[#5F6878]', barColor: 'bg-[#10B981]' };
    }
    if (lower.includes('shop')) {
      return { icon: ShoppingBag, bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]', barColor: 'bg-[#F59E0B]' };
    }
    if (lower.includes('bill') || lower.includes('util') || lower.includes('rent')) {
      return { icon: Home, bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', badgeBg: 'bg-[#E0F2FE]', badgeText: 'text-[#0369A1]', barColor: 'bg-[#2563EB]' };
    }
    if (lower.includes('grocer')) {
      return { icon: ShoppingBasket, bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]', barColor: 'bg-[#10B981]' };
    }
    if (lower.includes('trans') || lower.includes('travel') || lower.includes('cab')) {
      return { icon: Car, bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', badgeBg: 'bg-[#F3E8FF]', badgeText: 'text-[#7E22CE]', barColor: 'bg-[#8B5CF6]' };
    }
    return { icon: CreditCard, bg: 'bg-[#F0EFEA]', text: 'text-[#5F6878]', badgeBg: 'bg-[#F0EFEA]', badgeText: 'text-[#5F6878]', barColor: 'bg-[#172033]' };
  };

  // Merchant Logo Resolver
  const getMerchantLogo = (merchantName: string, categoryName: string) => {
    const lower = (merchantName || categoryName || '').toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EA580C] text-white text-xs font-black shadow-sm shrink-0">
          S
        </div>
      );
    }
    if (lower.includes('amazon')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#172033] text-amber-400 text-xs font-black shadow-sm shrink-0">
          a
        </div>
      );
    }
    if (lower.includes('uber') || lower.includes('ola')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#000000] text-white text-[10px] font-black shadow-sm shrink-0">
          U
        </div>
      );
    }
    if (lower.includes('dmart') || lower.includes('blinkit')) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#15803D] text-white text-xs font-black shadow-sm shrink-0">
          D
        </div>
      );
    }
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EFEA] text-[#172033] text-xs font-bold shadow-sm shrink-0">
        {(merchantName || categoryName || 'T').slice(0, 1).toUpperCase()}
      </div>
    );
  };

  // Ultra-Precision Custom Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-white border border-[#E4E2DC] p-3 shadow-lg space-y-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-1">
            <span className="text-[11px] font-bold text-[#858D9A]">{label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB]">
              Telemetry
            </span>
          </div>

          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between text-xs font-bold gap-3">
              <span className="flex items-center gap-1.5 text-[#5F6878]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name || 'Value'}:
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
      <div ref={containerRef} className="space-y-6">
        {/* =========================================================================
            1. GREETING & CONTEXT HEADER
            ========================================================================= */}
        <div className="dash-reveal">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {displayName}</span>
            <span>👋</span>
          </h1>
          <p className="text-sm font-medium text-[#5F6878] mt-1">
            Here&apos;s how your money moved today.
          </p>
        </div>

        {/* =========================================================================
            2. WALLETS, CARDS & BANK ACCOUNTS COMMAND CENTER (Full-Width 12 Columns)
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

        {/* =========================================================================
            3. MAIN DASHBOARD GRID (8 COLS LEFT, 4 COLS RIGHT)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =======================================================================
              LEFT & CENTER COLUMN (8 COLS)
              ======================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* AVAILABLE BALANCE & SUMMARY CARD */}
            <div className="dash-reveal editorial-card p-6 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Available Balance Main Stat */}
                <div className="space-y-1.5">
                  <span className="swiss-eyebrow">
                    Available balance
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-10 w-48 mt-1" />
                  ) : (
                    <div className="swiss-metric text-3xl sm:text-4xl text-[#172033]">
                      <AnimatedValue value={totalNetBalance} currency={user?.currency} />
                    </div>
                  )}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="brutalist-tag-emerald">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>+8.4%</span>
                    </span>
                    <span className="text-xs font-semibold text-[#5F6878]">vs last month</span>
                  </div>
                </div>

                {/* Supporting Income, Spending, Savings Stats */}
                <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-[#E4E2DC]/80">
                  {/* Income */}
                  <div className="space-y-1">
                    <span className="swiss-eyebrow text-[9px]">
                      Income
                    </span>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <div className="text-base sm:text-lg font-extrabold text-[#172033] tabular-nums">
                        <AnimatedValue value={totalIncome} currency={user?.currency} />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-[#059669] block">
                      This month
                    </span>
                  </div>

                  {/* Spending */}
                  <div className="space-y-1">
                    <span className="swiss-eyebrow text-[9px]">
                      Spending
                    </span>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <div className="text-base sm:text-lg font-extrabold text-[#172033] tabular-nums">
                        <AnimatedValue value={totalExpense} currency={user?.currency} />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-[#E11D48] block">
                      This month
                    </span>
                  </div>

                  {/* Savings */}
                  <div className="space-y-1">
                    <span className="swiss-eyebrow text-[9px]">
                      Savings
                    </span>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <div className="text-base sm:text-lg font-extrabold text-[#172033] tabular-nums">
                        <AnimatedValue value={netSavings} currency={user?.currency} />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-[#059669] block">
                      This month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH-TECH SPENDING OVERVIEW CHART CARD */}
            <div className="dash-reveal editorial-card p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-[#172033]">
                    Spending overview
                  </h2>
                  {/* Metric Switcher Pills */}
                  <div className="flex rounded-lg bg-[#F6F5F1] p-0.5 border border-[#E4E2DC]">
                    <button
                      onClick={() => setChartMetric('EXPENSE')}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all',
                        chartMetric === 'EXPENSE' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5F6878] hover:text-[#172033]'
                      )}
                    >
                      Outflow
                    </button>
                    <button
                      onClick={() => setChartMetric('DUAL')}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all',
                        chartMetric === 'DUAL' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5F6878] hover:text-[#172033]'
                      )}
                    >
                      In vs Out
                    </button>
                    <button
                      onClick={() => setChartMetric('NET')}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all',
                        chartMetric === 'NET' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5F6878] hover:text-[#172033]'
                      )}
                    >
                      Net Cash
                    </button>
                  </div>
                </div>

                {/* Horizon Selectors */}
                <div className="flex items-center rounded-lg bg-[#F6F5F1] p-1 border border-[#E4E2DC] self-start sm:self-auto flex-wrap">
                  {(['7D', '30D', '90D', '1Y'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setChartHorizon(h)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-bold transition-all',
                        chartHorizon === h
                          ? 'bg-white text-[#172033] shadow-sm'
                          : 'text-[#5F6878] hover:text-[#172033]'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric & Trend */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight tabular-nums">
                      {formatCurrency(totalExpense, user?.currency)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs font-bold text-[#E11D48]">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    <span>4.2% vs last month</span>
                  </div>
                </div>

                {chartMetric === 'EXPENSE' && (
                  <div className="text-right text-[11px] text-[#858D9A]">
                    <span className="font-semibold text-[#172033] block">
                      {formatCurrency(averageDailySpend, user?.currency)} / day
                    </span>
                    <span>Daily run-rate</span>
                  </div>
                )}
              </div>

              {/* Advanced Area Chart with Curved Line, Crosshairs & Custom Tooltip */}
              {isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl mt-2" />
              ) : (
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {/* Blue Outflow Glow Gradient */}
                        <linearGradient id="spendGradBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>

                        {/* Emerald Inflow Glow Gradient */}
                        <linearGradient id="incomeGradGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>

                        {/* Net Purple/Indigo Gradient */}
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
                        dy={6}
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
                        cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '3 3' }}
                        content={<CustomChartTooltip />}
                      />

                      {/* Reference line for baseline threshold */}
                      {chartMetric === 'EXPENSE' && (
                        <ReferenceLine
                          y={averageDailySpend}
                          stroke="#D97706"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: 'Avg Pace',
                            fill: '#D97706',
                            fontSize: 10,
                            position: 'right',
                            fontWeight: 700,
                          }}
                        />
                      )}

                      {/* Primary Spending Area */}
                      {(chartMetric === 'EXPENSE' || chartMetric === 'DUAL') && (
                        <Area
                          type="monotone"
                          name="Spending"
                          dataKey="expense"
                          stroke="#2563EB"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#spendGradBlue)"
                          dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 2 }}
                          activeDot={{ r: 5.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                        />
                      )}

                      {/* Dual Mode Income Area */}
                      {chartMetric === 'DUAL' && (
                        <Area
                          type="monotone"
                          name="Income"
                          dataKey="income"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#incomeGradGreen)"
                          dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#059669', strokeWidth: 2 }}
                          activeDot={{ r: 5.5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                        />
                      )}

                      {/* Net Flow Mode */}
                      {chartMetric === 'NET' && (
                        <Area
                          type="monotone"
                          name="Net Cashflow"
                          dataKey="net"
                          stroke="#7C3AED"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#netGradPurple)"
                          dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#7C3AED', strokeWidth: 2 }}
                          activeDot={{ r: 5.5, fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 2 }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* RECENT TRANSACTIONS TABLE CARD */}
            <div className="dash-reveal editorial-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#172033]">
                  Recent transactions
                </h2>
                <Link
                  href="/transactions"
                  className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                >
                  View all
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
                  onAction={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('monvex:open-add-transaction'));
                    }
                  }}
                />
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="ref-table">
                    <thead>
                      <tr>
                        <th className="w-[20%]">Date</th>
                        <th className="w-[42%]">Merchant</th>
                        <th className="w-[20%]">Category</th>
                        <th className="w-[18%] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx: any) => {
                        const isExp = tx.type === 'EXPENSE';
                        const catStyles = getCategoryStyles(tx.category_name);

                        return (
                          <tr key={tx.id}>
                            <td className="text-xs font-semibold text-[#5F6878] whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td>
                              <div className="flex items-center gap-2.5">
                                {getMerchantLogo(tx.merchant_name, tx.category_name)}
                                <span className="font-bold text-xs text-[#172033] truncate max-w-[200px]">
                                  {tx.merchant_name || tx.description || 'Transaction'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border',
                                  catStyles.badgeBg,
                                  catStyles.badgeText,
                                  'border-[#E4E2DC]/80'
                                )}
                              >
                                {tx.category_name || 'General'}
                              </span>
                            </td>
                            <td
                              className={cn(
                                'text-right font-black text-xs sm:text-sm tabular-nums whitespace-nowrap',
                                isExp ? 'text-[#E11D48]' : 'text-[#059669]'
                              )}
                            >
                              {isExp ? '- ' : '+ '}
                              {formatCurrency(tx.amount, user?.currency)}
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

          {/* =======================================================================
              RIGHT COLUMN (4 COLS)
              ======================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. WHAT NEEDS YOUR ATTENTION (INSIGHT CARD) */}
            <div className="dash-reveal editorial-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#172033]">
                  What needs your attention
                </h3>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-md ring-1 ring-blue-500/20 bg-white shrink-0 mt-0.5">
                  <img src="/ai-avatar.png" alt="MONVEX AI" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#172033] leading-snug">
                    {transactions.length === 0
                      ? 'Your financial intelligence workspace is ready.'
                      : topBudget && topBudgetPct > 80
                      ? `${topBudget.category_name || 'Category'} spending is ${topBudgetPct}% of target allocation.`
                      : totalExpense > 0
                      ? `Monthly outflow is currently ${formatCurrency(totalExpense, user?.currency)}.`
                      : 'Cash flow is balanced and runway is healthy.'}
                  </p>
                  <p className="text-[11px] text-[#858D9A]">
                    {transactions.length === 0
                      ? 'Record transactions to activate live cashflow insights.'
                      : topBudget && topBudgetPct > 80
                      ? 'Action recommended: Reallocate or optimize category spend.'
                      : 'Net monthly savings'}
                  </p>
                  {transactions.length > 0 && (
                    <div className="text-xl font-black text-[#059669] tabular-nums">
                      {formatCurrency(netSavings, user?.currency)}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/ai"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  <span>View insight</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. BUDGET PROGRESS CARD */}
            <div className="dash-reveal editorial-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#172033]">
                  Budget progress
                </h3>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : budgets.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878] space-y-2">
                  <p>No active category budgets established.</p>
                  <Link href="/budgets" className="text-[#2563EB] font-bold hover:underline inline-block">
                    + Set a budget
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((b: any) => {
                    const spent = parseFloat(b.spent_amount ?? b.current_spent) || 0;
                    const limit = parseFloat(b.limit_amount ?? b.amount) || 1;
                    const pct = Math.min(100, Math.round((spent / limit) * 100));
                    const catStyles = getCategoryStyles(b.category_name || b.name);
                    const Icon = catStyles.icon;

                    return (
                      <div key={b.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', catStyles.bg, catStyles.text)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#172033] block leading-tight">
                                {b.category_name || b.name}
                              </span>
                              <span className="text-[11px] font-medium text-[#5F6878]">
                                {formatCurrency(spent, user?.currency)} / {formatCurrency(limit, user?.currency)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#5F6878]">
                            {pct}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-[#F0EFEA] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', catStyles.barColor)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-1">
                <Link
                  href="/budgets"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  <span>View all budgets</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. GOAL PROGRESS CARD */}
            <div className="dash-reveal editorial-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#172033]">
                  Goal progress
                </h3>
                <Link
                  href="/goals"
                  className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  View all
                </Link>
              </div>

              {isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : !primaryGoal ? (
                <div className="p-4 rounded-xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878] space-y-2">
                  <p>No active savings goals configured.</p>
                  <Link href="/goals" className="text-[#2563EB] font-bold hover:underline inline-block">
                    + Create savings goal
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#059669] shrink-0">
                        <Plane className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#172033] block leading-tight">
                          {primaryGoal.title || primaryGoal.name || 'Travel Fund'}
                        </span>
                        <span className="text-[11px] font-medium text-[#5F6878]">
                          {formatCurrency(goalCurrent, user?.currency)} / {formatCurrency(goalTarget, user?.currency)}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-[#059669]">
                      {goalPct}%
                    </span>
                  </div>

                  {/* Full Progress Bar */}
                  <div className="w-full h-1.5 bg-[#F0EFEA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all"
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>

                  {/* Target Date & Required Monthly */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E4E2DC] text-xs">
                    <div>
                      <span className="text-[11px] text-[#858D9A] block">Target date</span>
                      <span className="font-bold text-[#172033]">
                        {goalDeadline
                          ? new Date(goalDeadline).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Jan 2027'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#858D9A] block">Required monthly</span>
                      <span className="font-bold text-[#172033]">
                        {goalRequiredMonthly
                          ? formatCurrency(goalRequiredMonthly, user?.currency)
                          : '₹6,167'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
