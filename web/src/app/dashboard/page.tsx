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
  PieChart as PieChartIcon,
  Target,
  Sparkles,
  MoreVertical,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { formatCurrency, cn, getTransactionDisplayName } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
import { useSubscriptionsQuery } from '@/hooks/queries/useSubscriptionsQuery';
import { CurrencyConvertModal } from '@/components/finance/CurrencyConvertModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardQuery();
  const { data: rawSubscriptions } = useSubscriptionsQuery();
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const summary = dashboardData?.summary || null;
  const transactions = dashboardData?.transactions || [];
  const budgets = dashboardData?.budgets || [];
  const goals = dashboardData?.goals || [];
  const monthlyTrend = dashboardData?.monthlyTrend || [];

  const subscriptions: any[] = useMemo(() => {
    return Array.isArray(rawSubscriptions) ? rawSubscriptions : rawSubscriptions?.results || [];
  }, [rawSubscriptions]);

  // Chart Timeframe Tabs: 24h, 1w, 1m, 6m, 1y (Monvex Style)
  const [timeframe, setTimeframe] = useState<'24 Hours' | '1 Week' | '1 Month' | '6 Month' | '1 Year'>('1 Month');
  const [paymentsTab, setPaymentsTab] = useState<'all' | 'regular'>('all');

  useEffect(() => {
    const handleProfileUpdate = () => refetch();
    window.addEventListener('monvex:profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('monvex:profile-updated', handleProfileUpdate);
  }, [refetch]);

  // Verified totals from backend API
  const totalIncome = summary?.monthly_income ?? summary?.total_income ?? 0;
  const totalExpense = summary?.monthly_expense ?? summary?.total_expense ?? 0;
  const totalNetBalance = summary?.net_balance ?? (totalIncome - totalExpense);
  const netLiquidity = summary?.net_liquidity ?? totalNetBalance;
  const netSavings = summary?.net_savings ?? Math.max(0, totalIncome - totalExpense);

  const [isMounted, setIsMounted] = useState(false);
  const [currentDateFormatted, setCurrentDateFormatted] = useState('July 24, 2025');

  useEffect(() => {
    setIsMounted(true);
    setCurrentDateFormatted(
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    );
  }, []);

  // Real Cashflow Trend Dataset for Recharts Area
  const trajectoryChartData = useMemo(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) {
      return [];
    }
    return monthlyTrend.map((m: any) => ({
      label: m.month || m.name || 'Period',
      expense: parseFloat(m.expense || m.expenses || 0),
      income: parseFloat(m.income || 0),
      amount: parseFloat(m.income || 0) - parseFloat(m.expense || m.expenses || 0),
      value: (parseFloat(m.income || 0) / Math.max(1, parseFloat(m.expense || 1))).toFixed(2),
    }));
  }, [monthlyTrend]);

  // Donut Expense Breakdown (Nexora Style)
  const expenseBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((tx: any) => {
      if (tx.type === 'EXPENSE') {
        const cat = tx.category_name || 'General';
        const amt = parseFloat(tx.amount) || 0;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    });

    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) {
      return [];
    }

    const total = entries.reduce((sum, [, val]) => sum + val, 0) || 1;
    const colors = ['#6865E8', '#75DCC0', '#38BDF8', '#A78BFA', '#F472B6', '#FB923C', '#94A3B8'];
    return entries.slice(0, 6).map(([name, val], idx) => ({
      name,
      value: Math.round((val / total) * 100),
      amount: val,
      color: colors[idx % colors.length],
    }));
  }, [transactions]);

  // Category Icon & Badge Resolver
  const getCategoryIcon = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) return Utensils;
    if (lower.includes('shop')) return ShoppingBag;
    if (lower.includes('bill') || lower.includes('home') || lower.includes('rent')) return Home;
    if (lower.includes('car') || lower.includes('travel') || lower.includes('cab')) return Car;
    if (lower.includes('grocer')) return ShoppingBasket;
    return CreditCard;
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* =========================================================================
            ROW 1: MONVEX HERO BANNER & VIRTUAL CREDIT CARD
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* BANNER CARD (8 cols) */}
          <div className="lg:col-span-8 rounded-3xl bg-gradient-to-r from-[#F6F5FD] via-[#ECEBFF] to-[#FAF9FC] dark:from-[#1E1C32] dark:via-[#1A182C] dark:to-[#141322] border border-[#E7E6F0] dark:border-[#2D2B3F] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xs">
            {/* Left Content */}
            <div className="space-y-4 max-w-md z-10">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20212B] dark:text-[#F4F3FA] tracking-tight leading-tight">
                  Convert Money Instantly with Monvex
                </h2>
                <p className="text-xs sm:text-sm text-[#77798A] dark:text-[#A6A4B8] font-medium leading-relaxed">
                  Monvex autonomous intelligence makes financial operations, global exchanges, and wealth management effortless.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={() => setIsConvertModalOpen(true)}
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="rounded-2xl bg-[#6865E8] hover:bg-[#5754D6] text-white shadow-md font-semibold px-5 cursor-pointer"
                >
                  Convert Now
                </Button>
                <Link
                  href="/ai"
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1B1A2A] hover:bg-[#FAF9FC] dark:hover:bg-[#222035] text-xs font-bold text-[#6865E8] border border-[#E7E6F0] dark:border-[#2D2B3F] transition-colors shadow-xs"
                >
                  Ask Copilot
                </Link>
              </div>
            </div>

            {/* Right Graphic: Smartphone & Credit Card Vector Mockup */}
            <div className="relative shrink-0 flex items-center justify-center z-10">
              {/* Floating Card Vector */}
              <div className="w-40 sm:w-48 h-24 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#6865E8] to-[#908EF2] shadow-xl p-3 flex flex-col justify-between text-white transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold tracking-wider uppercase">MONVEX</span>
                  <div className="h-3 w-5 rounded bg-amber-300/80" />
                </div>
                <div className="text-xs font-mono font-bold tracking-widest">•••• 8824</div>
                <div className="flex justify-between items-center text-[9px] text-white/80">
                  <span>EXP 12/28</span>
                  <span className="font-bold uppercase">VISA</span>
                </div>
              </div>

              {/* Behind Phone Frame */}
              <div className="w-28 sm:w-32 h-44 sm:h-48 rounded-2xl bg-white border-2 border-[#20212B] shadow-2xl p-2 hidden sm:flex flex-col justify-between -ml-12 z-0 transform rotate-6">
                <div className="h-2 w-10 bg-[#E7E6F0] rounded-full mx-auto" />
                <div className="space-y-1.5 py-2">
                  <div className="h-2 w-full bg-[#ECEBFF] rounded" />
                  <div className="h-2 w-3/4 bg-[#ECEBFF] rounded" />
                  <div className="h-6 w-full bg-[#6865E8]/10 rounded-lg flex items-center justify-center text-[9px] font-bold text-[#6865E8]">
                    $ Currency Exchanged
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full bg-[#6865E8] text-white text-[9px] font-bold flex items-center justify-center mx-auto">
                  $
                </div>
              </div>
            </div>

            {/* Ambient Background Circle */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-[#6865E8]/10 blur-3xl pointer-events-none" />
          </div>

          {/* VIRTUAL CREDIT CARD (4 cols, Monvex Signature Card) */}
          <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-[#8050E8] via-[#6865E8] to-[#5135D0] p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[220px]">
            {/* Card Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-44 h-44 rounded-full bg-[#75DCC0]/20 blur-2xl pointer-events-none" />

            {/* Card Top */}
            <div className="flex justify-between items-start z-10">
              <span className="text-xs font-semibold text-white/80">Balance</span>
              <button className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Card Balance */}
            <div className="space-y-1 my-4 z-10">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono">
                {formatCurrency(netLiquidity, user?.currency)}
                <span className="text-xs font-normal text-white/70 ml-2">{user?.currency || 'USD'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                <span className="inline-flex items-center gap-1 text-[#75DCC0] font-bold">
                  <ArrowUpRight className="h-3.5 w-3.5" /> 2.04%
                </span>
                <span>• {currentDateFormatted}</span>
              </div>
            </div>

            {/* Card Bottom: EMV Chip & Logo */}
            <div className="flex justify-between items-center z-10 pt-2 border-t border-white/10">
              {/* EMV Chip */}
              <div className="h-7 w-9 rounded-md bg-gradient-to-br from-[#F59E0B] to-[#D97706] p-1 shadow-sm flex items-center justify-center">
                <div className="h-4 w-6 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                  <div className="bg-amber-800/30" />
                  <div className="bg-amber-800/30" />
                </div>
              </div>

              {/* Brand Logo */}
              <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-sm">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
                <span>Monvex</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 2: NEXORA 4-METRIC STRIP (Image 3 Nexora)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Balance */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-5 shadow-xs space-y-2 hover:border-[#6865E8]/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#77798A]">Total Balance</span>
              <MoreVertical className="h-4 w-4 text-[#77798A] cursor-pointer" />
            </div>
            <div className="text-2xl font-extrabold text-[#20212B] font-mono tracking-tight">
              {formatCurrency(netLiquidity, user?.currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16745C]">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#32B995]" />
              <span>+2.47%</span>
              <span className="text-[#77798A] font-normal">Last month</span>
            </div>
          </div>

          {/* Card 2: Total Period Change */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-5 shadow-xs space-y-2 hover:border-[#6865E8]/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#77798A]">Total Period Change</span>
              <MoreVertical className="h-4 w-4 text-[#77798A] cursor-pointer" />
            </div>
            <div className="text-2xl font-extrabold text-[#20212B] font-mono tracking-tight">
              {formatCurrency(netSavings, user?.currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16745C]">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#32B995]" />
              <span>+2.47%</span>
              <span className="text-[#77798A] font-normal">Last month</span>
            </div>
          </div>

          {/* Card 3: Total Period Expenses */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-5 shadow-xs space-y-2 hover:border-[#6865E8]/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#77798A]">Total Period Expenses</span>
              <MoreVertical className="h-4 w-4 text-[#77798A] cursor-pointer" />
            </div>
            <div className="text-2xl font-extrabold text-[#20212B] font-mono tracking-tight">
              {formatCurrency(totalExpense, user?.currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E76D7A]">
              <ArrowDownRight className="h-3.5 w-3.5 text-[#E76D7A]" />
              <span>-2.47%</span>
              <span className="text-[#77798A] font-normal">Last month</span>
            </div>
          </div>

          {/* Card 4: Total Period Income */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-5 shadow-xs space-y-2 hover:border-[#6865E8]/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#77798A]">Total Period Income</span>
              <MoreVertical className="h-4 w-4 text-[#77798A] cursor-pointer" />
            </div>
            <div className="text-2xl font-extrabold text-[#20212B] font-mono tracking-tight">
              {formatCurrency(totalIncome, user?.currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16745C]">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#32B995]" />
              <span>+2.47%</span>
              <span className="text-[#77798A] font-normal">Last month</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 3: BALANCE TRENDS AREA CHART & EXPENSES BREAKDOWN (Images 1 & 3)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: MONVEX BALANCE TRENDS AREA CHART (8 cols) */}
          <div className="lg:col-span-8 rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#20212B]">
                  Always apply the true rate
                </h3>
                <p className="text-xs text-[#77798A] flex items-center gap-1 mt-0.5">
                  <span>As of 1 min ago. 1 GBP = 1.16285 EUR</span>
                  <span className="text-[#6865E8] font-semibold cursor-pointer flex items-center gap-0.5 ml-2">
                    Mid market rate <Info className="h-3 w-3" />
                  </span>
                </p>
              </div>

              {/* Monvex Time Tabs (24h, 1w, 1m, 6m, 1y) */}
              <div className="flex items-center bg-[#F4F3FA] p-1 rounded-2xl border border-[#E7E6F0] self-start sm:self-auto">
                {(['24 Hours', '1 Week', '1 Month', '6 Month', '1 Year'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      timeframe === t
                        ? 'bg-[#20212B] text-white shadow-xs'
                        : 'text-[#77798A] hover:text-[#20212B]'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Smooth Recharts Area */}
            <div className="h-64 sm:h-72 w-full pt-4">
              {isMounted ? (
                trajectoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="monvexViolet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6865E8" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6865E8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F3FA" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#77798A"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E7E6F0' }}
                      />
                      <YAxis
                        stroke="#77798A"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#20212B] text-white px-3 py-2 rounded-xl shadow-xl text-xs space-y-0.5">
                              <p className="text-white/70 text-[10px]">{item.label}</p>
                              <p className="font-bold font-mono text-sm text-[#75DCC0]">
                                {item.amount ? formatCurrency(item.amount, user?.currency) : `${item.value} EUR`}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={trajectoryChartData[0]?.amount ? 'amount' : 'value'}
                        stroke="#6865E8"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#monvexViolet)"
                        activeDot={{ r: 6, fill: '#6865E8', stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-2 rounded-2xl border border-dashed border-[#E7E6F0] bg-[#FAF9FC]">
                    <div className="h-10 w-10 rounded-2xl bg-[#ECEBFF] flex items-center justify-center text-[#6865E8]">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[#20212B]">No historical trend data yet</p>
                    <p className="text-[11px] text-[#77798A] max-w-xs">
                      Cash flow trends will automatically emerge as multi-period transactions are recorded.
                    </p>
                  </div>
                )
              ) : (
                <div className="h-full w-full bg-[#FAF9FC] rounded-2xl animate-pulse" />
              )}
            </div>
          </div>

          {/* RIGHT: NEXORA DONUT EXPENSES BREAKDOWN (4 cols, Image 3 Nexora) */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-bold text-[#20212B]">
                Monthly Expenses Breakdown
              </h3>
              <MoreVertical className="h-4 w-4 text-[#77798A] cursor-pointer" />
            </div>

            {expenseBreakdown.length > 0 ? (
              <>
                {/* Donut Chart with Center 100% */}
                <div className="relative h-48 w-full flex items-center justify-center my-2">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          innerRadius={58}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white border border-[#E7E6F0] p-2 rounded-xl shadow-md text-xs">
                                <span className="font-bold text-[#20212B]">{item.name}: </span>
                                <span className="font-mono font-bold text-[#6865E8]">{item.value}%</span>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full bg-[#FAF9FC] rounded-2xl animate-pulse" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-[#20212B] font-mono leading-none">100%</span>
                    <span className="text-[10px] text-[#77798A] uppercase font-semibold mt-0.5">Allocated</span>
                  </div>
                </div>

                {/* Segment Breakdown Pills */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F4F3FA]">
                  {expenseBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[#77798A] truncate text-[11px]">{item.name}</span>
                      <span className="font-bold text-[#20212B] ml-auto font-mono text-[11px]">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-[#ECEBFF] flex items-center justify-center text-[#6865E8]">
                  <PieChartIcon className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-[#20212B]">No categorized outflows</p>
                <p className="text-[11px] text-[#77798A] max-w-xs">
                  Expense breakdown will populate automatically as soon as debit entries are recorded.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            ROW 4: BUDGETS PROGRESS, UPCOMING BILLS, RECENT TRANSACTIONS (Images 1 & 3)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMN 1: MONTHLY BUDGETS PROGRESS BARS (Image 3 Nexora, 4 cols) */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#20212B]">
                Monthly Budgets
              </h3>
              <MoreVertical className="h-4 w-4 text-[#77798A] cursor-pointer" />
            </div>

            <div className="space-y-4">
              {budgets.length > 0 ? (
                budgets.slice(0, 5).map((b: any) => {
                  const spent = parseFloat(b.spent_amount ?? b.current_spent) || 0;
                  const limit = parseFloat(b.limit_amount ?? b.amount) || 1;
                  const pct = Math.min(100, Math.round((spent / limit) * 100));
                  const Icon = getCategoryIcon(b.category_name || b.name);
                  const isOver = spent > limit;

                  return (
                    <div key={b.id || b.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 font-semibold text-[#20212B]">
                          <div className="p-1 rounded-lg bg-[#FAF9FC] border border-[#E7E6F0]">
                            <Icon className="h-3.5 w-3.5 text-[#6865E8]" />
                          </div>
                          <span>{b.category_name || b.name || 'General'}</span>
                        </div>
                        <span className={cn('font-mono text-xs font-bold', isOver ? 'text-[#E76D7A]' : 'text-[#77798A]')}>
                          {formatCurrency(spent, user?.currency)} / {formatCurrency(limit, user?.currency)}
                        </span>
                      </div>
                      {/* Progress Track */}
                      <div className="h-2 w-full rounded-full bg-[#F4F3FA] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', isOver ? 'bg-[#E76D7A]' : 'bg-[#6865E8]')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-[#ECEBFF] flex items-center justify-center text-[#6865E8]">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-xs font-bold text-[#20212B]">No budget limits set</p>
                  <p className="text-[11px] text-[#77798A] max-w-xs mx-auto">
                    Establish category spending guardrails to protect your savings targets.
                  </p>
                  <Link href="/budgets" className="inline-block pt-1">
                    <span className="text-xs font-bold text-[#6865E8] hover:underline">
                      Establish Guardrail &rarr;
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: UPCOMING & REGULAR PAYMENTS (Monvex Schedule, 4 cols) */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-[#20212B]">Upcoming Payments</h3>
                <p className="text-[11px] text-[#77798A]">Next Month Scheduled</p>
              </div>
              <Link href="/subscriptions" className="text-xs font-bold text-[#6865E8] hover:underline">
                View All
              </Link>
            </div>

            {/* Subscriptions List */}
            <div className="space-y-3">
              {subscriptions.length > 0 ? (
                subscriptions.slice(0, 5).map((sub: any) => (
                  <div key={sub.id || sub.name} className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#FAF9FC] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center text-xs font-bold shadow-xs shrink-0 border border-[#6865E8]/20">
                        {(sub.name || 'S').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#20212B] block">{sub.name}</span>
                        <span className="text-[10px] text-[#77798A] block">
                          {sub.next_due_date ? `Due ${sub.next_due_date}` : sub.frequency || 'Monthly'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#20212B]">
                      {formatCurrency(sub.amount, user?.currency)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-[#ECEBFF] flex items-center justify-center text-[#6865E8]">
                    <Receipt className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-xs font-bold text-[#20212B]">No upcoming payments</p>
                  <p className="text-[11px] text-[#77798A] max-w-xs mx-auto">
                    Schedule recurring bills to monitor upcoming renewal dates.
                  </p>
                  <Link href="/subscriptions" className="inline-block pt-1">
                    <span className="text-xs font-bold text-[#6865E8] hover:underline">
                      Schedule Payment &rarr;
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: RECENT TRANSACTIONS (Monvex Transactions, 4 cols) */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-[#20212B]">Recent Transactions</h3>
                <p className="text-[11px] text-[#77798A]">Direct double-entry ledger</p>
              </div>
              <Link href="/transactions" className="text-xs font-bold text-[#6865E8] hover:underline flex items-center gap-0.5">
                View All &rarr;
              </Link>
            </div>

            {/* Transactions Rows */}
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx: any) => {
                  const isExp = tx.type === 'EXPENSE';
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#FAF9FC] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center text-xs font-black shrink-0 border border-[#6865E8]/20">
                          {(tx.merchant_name || tx.category_name || 'TX').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#20212B] block truncate">
                            {getTransactionDisplayName(tx)}
                          </span>
                          <span className="text-[10px] text-[#77798A] block truncate">
                            {tx.category_name || 'General'} • {new Date(tx.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap pl-2">
                        <FinancialAmount
                          amount={tx.amount}
                          currency={user?.currency}
                          type={isExp ? 'expense' : 'income'}
                          showSign={true}
                          sign={isExp ? '-' : '+'}
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-[#ECEBFF] flex items-center justify-center text-[#6865E8]">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-xs font-bold text-[#20212B]">No recent transactions</p>
                  <p className="text-[11px] text-[#77798A] max-w-xs mx-auto">
                    Record entries to populate your live double-entry financial ledger.
                  </p>
                  <Link href="/transactions" className="inline-block pt-1">
                    <span className="text-xs font-bold text-[#6865E8] hover:underline">
                      Record Entry &rarr;
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Currency Converter Modal */}
      <CurrencyConvertModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
      />
    </AppShell>
  );
}
