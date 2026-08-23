'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Lock,
  Check,
  Zap,
  Layers,
  Activity,
  ChevronRight,
  Calculator,
  RefreshCw,
  Cpu,
  Database,
  Compass,
  Eye,
  Filter,
  Wallet,
  CreditCard,
  Clock,
  Terminal,
  Menu,
  X,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ContactModal } from '@/components/landing/ContactModal';
import { AboutSection } from '@/components/landing/AboutSection';

export default function LandingPage() {
  const windowsDownloadUrl =
    process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ||
    'https://github.com/BlackHunter14365/MONVEX/releases/download/v2.0.0/MONVEX-Setup.exe';

  // Contact Modal State
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Mobile Nav Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. What-If Simulator State
  const [selectedCategory, setSelectedCategory] = useState<'dining' | 'shopping' | 'subs' | 'travel'>('dining');
  const [reductionPct, setReductionPct] = useState(30);


  const categoryPresets = {
    dining: { name: 'Food & Dining', baseline: 20000, desc: 'Restaurants, delivery apps, cafes' },
    shopping: { name: 'Shopping & Lifestyle', baseline: 15000, desc: 'Apparel, gadgets, discretionary buys' },
    subs: { name: 'Subscriptions & SaaS', baseline: 6000, desc: 'Streaming, software, unused memberships' },
    travel: { name: 'Transport & Commute', baseline: 8000, desc: 'Ride-hailing cabs, fuel, impulse trips' },
  };

  const currentCategory = categoryPresets[selectedCategory];
  const simulatedMonthlyBurn = Math.round(currentCategory.baseline * (1 - reductionPct / 100));
  const monthlyRetained = currentCategory.baseline - simulatedMonthlyBurn;
  const annualRetained = monthlyRetained * 12;

  // 5-Year Compound Value Calculation at 10% CAGR: PMT formula
  const compoundFiveYear = useMemo(() => {
    const r = 0.1 / 12; // monthly rate
    const n = 60; // 60 months
    const fv = monthlyRetained * ((Math.pow(1 + r, n) - 1) / r);
    return Math.round(fv);
  }, [monthlyRetained]);

  // 2. Decision Engine Interactive Stages (01 to 06)
  const [activeStage, setActiveStage] = useState(0);

  const decisionStages = [
    {
      num: '01',
      title: 'CAPTURE',
      badge: 'Multi-Channel Ingestion',
      headline: 'Instant, friction-free transaction ingestion',
      desc: 'Voice dictation, natural language logs, receipt scans, and multi-wallet reconciliation without manual spreadsheets.',
      exampleData: {
        amount: '₹4,500.00',
        merchant: 'Trattoria Roma',
        date: 'Aug 21, 2026',
        account: 'HDFC Salary A/c',
        status: 'Reconciled',
      },
      tagColor: 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]',
    },
    {
      num: '02',
      title: 'UNDERSTAND',
      badge: 'Merchant Normalization',
      headline: 'Machine-learned merchant normalization',
      desc: 'Transforms ambiguous bank descriptors like "SWG*BLR-982" into verified merchants, mapped to structured discretionary categories.',
      exampleData: {
        normalizedMerchant: 'Swiggy Gourmet',
        category: 'Food & Dining',
        classification: 'Discretionary Lifestyle',
        taxDeductible: 'No',
      },
      tagColor: 'text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]',
    },
    {
      num: '03',
      title: 'ANALYZE',
      badge: 'Velocity Telemetry',
      headline: 'Burn rate & velocity tracking',
      desc: 'Calculates rolling daily spend velocity, 30-day standard deviation, and identifies category acceleration before budgets break.',
      exampleData: {
        monthlySpend: '₹18,420.00',
        paceVariance: '+14.8% vs 30d baseline',
        dailyBurn: '₹877.00 / day',
        status: 'Elevated Velocity',
      },
      tagColor: 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]',
    },
    {
      num: '04',
      title: 'PREDICT',
      badge: 'Deterministic Forecasting',
      headline: '90-Day cash flow projection',
      desc: 'Simulates month-end liquidity curves, recurring bills, and impending debt obligations with zero probabilistic hallucinations.',
      exampleData: {
        projectedMonthEnd: '₹26,840.00',
        budgetCap: '₹23,000.00',
        projectedVariance: '-₹3,840.00 (Deficit)',
        forecastConfidence: '98.4%',
      },
      tagColor: 'text-[#E11D48] bg-[#FFF1F2] border-[#FECDD3]',
    },
    {
      num: '05',
      title: 'RECOMMEND',
      badge: 'Prescriptive Intelligence',
      headline: 'Targeted capital preservation rules',
      desc: 'Formulates prioritized adjustments to discretionary outflows that preserve monthly savings goals with minimum lifestyle disruption.',
      exampleData: {
        action: 'Trim Weekend Dining Orders',
        targetSavings: '₹2,500.00 / mo',
        alternateOption: 'Cook at Home (2x/week)',
        feasibilityScore: 'High (94%)',
      },
      tagColor: 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]',
    },
    {
      num: '06',
      title: 'DECIDE',
      badge: 'Compounded Sovereignty',
      headline: 'Executive decision support for financial freedom',
      desc: 'Connects immediate spending adjustments directly to 1-year capital buffers and long-term financial sovereignty.',
      exampleData: {
        annualCapitalGain: '+₹30,000.00',
        emergencyRunway: '+1.4 Months',
        portfolioTrajectory: 'On Track for FIRE',
        sovereigntyRating: 'Optimal',
      },
      tagColor: 'text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#172033] flex flex-col selection:bg-[#172033] selection:text-white relative">
      {/* ─── STICKY NAVBAR ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-[#F7F7F4]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] w-full items-center justify-between px-4 sm:px-6 lg:px-12">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-black/10 transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-[#172033] leading-none">
                MONVEX
              </span>
              <span className="text-[9px] font-bold tracking-wider text-[#858D9A] uppercase mt-0.5">
                Financial Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8 text-xs font-semibold text-[#5F6878]">
            <a href="#core-loop" className="hover:text-[#172033] transition-colors whitespace-nowrap">
              Core Architecture
            </a>
            <a href="#simulator" className="hover:text-[#172033] transition-colors whitespace-nowrap">
              What-If Simulator
            </a>
            <a href="#intelligence" className="hover:text-[#172033] transition-colors whitespace-nowrap">
              Intelligence System
            </a>
            <a href="#desktop" className="hover:text-[#172033] transition-colors whitespace-nowrap">
              Windows App
            </a>
            <a href="#about" className="hover:text-[#172033] transition-colors whitespace-nowrap">
              About
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="text-xs font-bold text-[#5F6878] hover:text-[#172033] px-3 py-1.5 transition-colors cursor-pointer"
            >
              Contact Me
            </button>
            <Link
              href="/login"
              className="text-xs font-bold text-[#5F6878] hover:text-[#172033] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl bg-[#172033] hover:bg-[#0F172A] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:translate-y-[1px]"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#172033] hover:bg-[#E5E7EB] rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 pt-3 pb-5 space-y-3">
            <a
              href="#core-loop"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#172033] py-1.5"
            >
              Core Architecture
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#172033] py-1.5"
            >
              What-If Simulator
            </a>
            <a
              href="#intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#172033] py-1.5"
            >
              Intelligence System
            </a>
            <a
              href="#desktop"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#172033] py-1.5"
            >
              Windows Desktop App
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#172033] py-1.5"
            >
              About
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsContactOpen(true);
              }}
              className="block w-full text-left text-xs font-bold text-[#2563EB] py-1.5"
            >
              Contact Me
            </button>
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-3">
              <Link
                href="/login"
                className="w-1/2 text-center text-xs font-bold py-2 text-[#172033] border border-[#E5E7EB] rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="w-1/2 text-center text-xs font-bold py-2 bg-[#172033] text-white rounded-lg"
              >
                Launch App
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION (EDITORIAL SPLIT 60/40 LAYOUT) ────────────────── */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Value Proposition (~58%) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#172033]/5 border border-[#172033]/10 text-[#172033]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider">
                Financial Intelligence Platform
              </span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#172033] leading-[1.12]">
              Know where your money is going.{' '}
              <span className="text-[#2563EB] block sm:inline">
                See what happens next.
              </span>
            </h1>

            {/* High-Contrast Supporting Copy */}
            <p className="text-sm sm:text-base text-[#475467] leading-relaxed max-w-2xl font-medium">
              MONVEX turns everyday financial activity into clear cash-flow analysis, spending intelligence, and forward-looking financial decisions.
            </p>

            {/* Action Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033] hover:bg-[#0F172A] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all active:translate-y-[1px]"
              >
                <span>Start with MONVEX</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={windowsDownloadUrl}
                download="MONVEX-Setup.exe"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#F2F1EC] border border-[#E5E7EB] px-6 py-3.5 text-xs font-bold text-[#172033] shadow-2xs transition-all active:translate-y-[1px]"
              >
                <Download className="h-4 w-4 text-[#2563EB]" />
                <span>Download for Windows</span>
              </a>
              <a
                href="#desktop"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-3.5 text-xs font-bold text-[#5F6878] hover:text-[#172033] transition-colors"
              >
                <span>Desktop Specs</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#858D9A]" />
              </a>
            </div>

            {/* Key System Confidence Badges */}
            <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#5F6878] font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>0 Mock Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>Deterministic Simulation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>Zero-Trust Security Shield</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic MONVEX Workspace Preview (~42%) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xl overflow-hidden">
              {/* Window Bar */}
              <div className="bg-[#172033] px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]/80" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-300 ml-2 tracking-wider">
                    MONVEX TERMINAL • INR (₹)
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#34D399] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse" />
                  LIVE VELOCITY
                </span>
              </div>

              {/* Terminal Workspace Content */}
              <div className="p-5 space-y-5 bg-[#FFFFFF]">
                {/* 4 Core Financial Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-1">
                    <span className="font-mono text-[10px] font-bold text-[#858D9A] uppercase tracking-wider block">
                      Available Capital
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xl font-extrabold text-[#172033]">
                        ₹72,910
                      </span>
                      <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                        +8.4%
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-1">
                    <span className="font-mono text-[10px] font-bold text-[#858D9A] uppercase tracking-wider block">
                      Retained Savings
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xl font-extrabold text-[#059669]">
                        ₹54,100
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#5F6878]">
                        72.1% rate
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-0.5">
                    <span className="font-mono text-[10px] font-bold text-[#858D9A] uppercase block">
                      Monthly Inflow
                    </span>
                    <span className="font-mono text-sm font-bold text-[#172033]">
                      ₹75,000
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-0.5">
                    <span className="font-mono text-[10px] font-bold text-[#858D9A] uppercase block">
                      Expenses / Burn
                    </span>
                    <span className="font-mono text-sm font-bold text-[#E11D48]">
                      ₹20,900
                    </span>
                  </div>
                </div>

                {/* Cash-Flow Trajectory Visualization */}
                <div className="p-3.5 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">90-Day Liquidity Trajectory</span>
                    <span className="font-mono text-[10px] text-[#059669] font-bold">Solvent (+₹32,400)</span>
                  </div>
                  {/* SVG Sparkline Curve */}
                  <div className="h-16 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,45 Q 60,35 120,40 T 200,20 T 300,8 L 300,60 L 0,60 Z"
                        fill="url(#heroGradient)"
                      />
                      <path
                        d="M 0,45 Q 60,35 120,40 T 200,20 T 300,8"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Current point */}
                      <circle cx="200" cy="20" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Real-time Ledger Stream */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#858D9A] uppercase tracking-wider px-1">
                    <span>Recent Reconciled Activity</span>
                    <span>Status</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-md bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-[10px]">
                          FD
                        </div>
                        <div>
                          <span className="font-bold text-[#172033] block">Swiggy Gourmet</span>
                          <span className="text-[10px] text-[#5F6878]">Food & Dining • Today</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#E11D48]">-₹840.00</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-md bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center font-bold text-[10px]">
                          IN
                        </div>
                        <div>
                          <span className="font-bold text-[#172033] block">Monthly Salary Inflow</span>
                          <span className="text-[10px] text-[#5F6878]">Primary Income • Aug 01</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#059669]">+₹75,000.00</span>
                    </div>
                  </div>
                </div>

                {/* Embedded Intelligence Alert */}
                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-2.5 text-xs text-[#92400E]">
                  <Sparkles className="h-4 w-4 text-[#D97706] shrink-0" />
                  <span className="font-medium text-[11px] leading-tight">
                    <strong className="font-bold">Observation:</strong> Dining burn velocity +18% above 30d baseline.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DECISION ENGINE: "FROM TRANSACTION TO DECISION" ─────────────── */}
      <section id="core-loop" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full border-t border-[#E5E7EB]">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Deterministic Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              From transaction to decision.
            </h2>
            <p className="text-sm text-[#5F6878] font-medium leading-relaxed">
              Every expense goes through a 6-stage analytical pipeline that converts raw activity into long-term wealth impact.
            </p>
          </div>

          {/* Interactive 6-Stage Timeline Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-b border-[#E5E7EB] pb-4">
            {decisionStages.map((stage, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStage(idx)}
                className={cn(
                  'p-3 text-left rounded-xl transition-all border text-xs',
                  activeStage === idx
                    ? 'bg-[#172033] text-white border-[#172033] shadow-sm'
                    : 'bg-white text-[#5F6878] border-[#E5E7EB] hover:border-[#D6D4CD]'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('font-mono font-bold text-[11px]', activeStage === idx ? 'text-[#38BDF8]' : 'text-[#858D9A]')}>
                    {stage.num}
                  </span>
                  {activeStage === idx && <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />}
                </div>
                <span className="font-bold block tracking-tight">{stage.title}</span>
              </button>
            ))}
          </div>

          {/* Active Stage Narrative Showcase */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-[#2563EB]">
                    STAGE {decisionStages[activeStage].num}
                  </span>
                  <span className="text-[#858D9A]">•</span>
                  <span className="text-xs font-bold text-[#5F6878] uppercase tracking-wider">
                    {decisionStages[activeStage].badge}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                  {decisionStages[activeStage].headline}
                </h3>

                <p className="text-xs sm:text-sm text-[#475467] leading-relaxed font-medium">
                  {decisionStages[activeStage].desc}
                </p>

                <div className="pt-2 flex items-center gap-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveStage((prev) => (prev > 0 ? prev - 1 : decisionStages.length - 1))}
                    className="text-[#5F6878] hover:text-[#172033]"
                  >
                    ← Previous Stage
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    type="button"
                    onClick={() => setActiveStage((prev) => (prev < decisionStages.length - 1 ? prev + 1 : 0))}
                    className="text-[#2563EB] hover:underline"
                  >
                    Next Stage →
                  </button>
                </div>
              </div>

              {/* Data Representation Card */}
              <div className="lg:col-span-6">
                <div className="p-6 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
                    <span className="font-mono font-bold text-[#172033] uppercase">
                      TELEMETRY OUTPUT • STAGE {decisionStages[activeStage].num}
                    </span>
                    <Badge variant="neutral" size="sm">Deterministic Engine</Badge>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {Object.entries(decisionStages[activeStage].exampleData).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
                        <span className="text-[#858D9A] uppercase text-[11px]">{key}</span>
                        <span className="font-bold text-[#172033]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT-IF SIMULATOR SECTION ───────────────────────────────────── */}
      <section id="simulator" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full border-t border-[#E5E7EB]">
        <div className="space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#D97706]">
              Interactive Scenario Modeling
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              What happens if you change one thing?
            </h2>
            <p className="text-sm text-[#5F6878] font-medium leading-relaxed">
              Test spending adjustments against deterministic cash flow projections and discover your compounded capital gain.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-sm space-y-8">
            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['dining', 'shopping', 'subs', 'travel'] as const).map((catKey) => {
                const info = categoryPresets[catKey];
                const isActive = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={cn(
                      'p-4 rounded-xl text-left border transition-all text-xs space-y-1',
                      isActive
                        ? 'bg-[#172033] text-white border-[#172033] shadow-xs'
                        : 'bg-[#F7F7F4] text-[#172033] border-[#E5E7EB] hover:border-[#D6D4CD]'
                    )}
                  >
                    <span className={cn('font-mono text-[10px] font-bold uppercase block', isActive ? 'text-[#38BDF8]' : 'text-[#858D9A]')}>
                      Baseline: {formatCurrency(info.baseline, 'INR')}
                    </span>
                    <span className="font-bold block text-sm">{info.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Slider Control */}
            <div className="p-6 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#172033] block">
                    Simulate Spending Cut on {currentCategory.name}
                  </span>
                  <span className="text-[11px] text-[#5F6878]">
                    {currentCategory.desc}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#858D9A]">Reduction:</span>
                  <span className="font-mono text-base font-extrabold text-[#2563EB] bg-white px-3 py-1 rounded-lg border border-[#E5E7EB]">
                    {reductionPct}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={reductionPct}
                onChange={(e) => setReductionPct(parseInt(e.target.value))}
                className="w-full h-2.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#172033]"
              />

              <div className="flex justify-between text-[11px] font-mono text-[#858D9A]">
                <span>5% (Minor adjustment)</span>
                <span>30% (Recommended)</span>
                <span>60% (Aggressive FIRE)</span>
              </div>
            </div>

            {/* Live Calculation Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-2">
                <span className="font-mono text-[10px] font-bold text-[#858D9A] uppercase tracking-wider block">
                  Current Spending
                </span>
                <span className="font-mono text-2xl font-black text-[#172033] block">
                  {formatCurrency(currentCategory.baseline, 'INR')} <span className="text-xs font-normal text-[#858D9A]">/ mo</span>
                </span>
                <span className="text-xs text-[#5F6878] font-medium block">
                  Annual total: {formatCurrency(currentCategory.baseline * 12, 'INR')}
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#F7F7F4] border border-[#E5E7EB] space-y-2">
                <span className="font-mono text-[10px] font-bold text-[#858D9A] uppercase tracking-wider block">
                  Simulated Spending
                </span>
                <span className="font-mono text-2xl font-black text-[#2563EB] block">
                  {formatCurrency(simulatedMonthlyBurn, 'INR')} <span className="text-xs font-normal text-[#858D9A]">/ mo</span>
                </span>
                <span className="text-xs text-[#5F6878] font-medium block">
                  Annual total: {formatCurrency(simulatedMonthlyBurn * 12, 'INR')}
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                <span className="font-mono text-[10px] font-bold text-[#059669] uppercase tracking-wider block">
                  Annual Capital Retained
                </span>
                <span className="font-mono text-2xl font-black text-[#059669] block">
                  +{formatCurrency(annualRetained, 'INR')}
                </span>
                <span className="text-xs text-[#065F46] font-medium block">
                  +{formatCurrency(monthlyRetained, 'INR')} saved each month
                </span>
              </div>
            </div>

            {/* 5-Year Compounded Impact Card */}
            <div className="p-6 rounded-xl bg-[#172033] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#34D399]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#34D399]">
                    5-Year Compounded Growth (@ 10% CAGR)
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium max-w-xl">
                  If this monthly surplus of {formatCurrency(monthlyRetained, 'INR')} is invested into a disciplined index portfolio, your projected 5-year capital value reaches:
                </p>
              </div>

              <div className="text-right sm:text-right shrink-0">
                <span className="font-mono text-3xl font-black text-white block">
                  +{formatCurrency(compoundFiveYear, 'INR')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Principal: {formatCurrency(annualRetained * 5, 'INR')} • Returns: +{formatCurrency(compoundFiveYear - annualRetained * 5, 'INR')}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
              >
                <span>Launch Full Multi-Variable Simulator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTELLIGENCE SYSTEM SECTION ─────────────────────────────────── */}
      <section id="intelligence" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full border-t border-[#E5E7EB]">
        <div className="space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#059669]">
              Autonomous Financial Diagnosis
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              Real intelligence, not generic advice.
            </h2>
            <p className="text-sm text-[#5F6878] font-medium leading-relaxed">
              MONVEX analyzes cross-category spending shifts and formulates precise, mathematically backed recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Financial Diagnosis Showcase (~7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#172033] uppercase">
                    MONVEX OBSERVATION • AUGUST 2026
                  </span>
                </div>
                <Badge variant="warning" size="sm">Velocity Anomaly</Badge>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#172033]">
                  Your food spending increased 18% over the previous 30 days.
                </h3>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Discretionary dining out and delivery app orders accelerated from ₹520/day to ₹877/day during weekends.
                </p>
              </div>

              {/* Contributor Breakdown */}
              <div className="space-y-3 pt-2">
                <span className="font-mono text-[11px] font-bold text-[#858D9A] uppercase tracking-wider block">
                  Top Outflow Contributors
                </span>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="font-bold text-[#172033]">Food &amp; Dining (Restaurants + Delivery)</span>
                      <span className="font-mono font-bold text-[#E11D48]">+18.2% (₹18,420 / ₹15,000 budget)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0EFEA] overflow-hidden">
                      <div className="h-full bg-[#E11D48] rounded-full" style={{ width: '122%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="font-bold text-[#172033]">Transport &amp; Cab Rides</span>
                      <span className="font-mono font-bold text-[#D97706]">+12.0% (₹6,400 / ₹5,700 budget)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0EFEA] overflow-hidden">
                      <div className="h-full bg-[#D97706] rounded-full" style={{ width: '112%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="font-bold text-[#172033]">Entertainment &amp; Digital SaaS</span>
                      <span className="font-mono font-bold text-[#2563EB]">+9.4% (₹4,800 / ₹4,500 budget)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0EFEA] overflow-hidden">
                      <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '106%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#059669] block">
                  Actionable Recommendation
                </span>
                <p className="text-xs text-[#065F46] font-medium leading-relaxed">
                  Reduce discretionary food delivery orders by <strong className="font-bold">₹2,500/month</strong> to restore your Q3 target savings rate of 25%.
                </p>
                <div className="pt-1 flex items-center justify-between text-xs font-mono font-bold text-[#059669]">
                  <span>Projected Annual Buffer:</span>
                  <span className="text-sm">+₹30,000.00 / yr</span>
                </div>
              </div>
            </div>

            {/* Right: Why This Matters / Deterministic Explainer (~5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl border border-[#E5E7EB] bg-white space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                  <Compass className="h-4 w-4 text-[#2563EB]" />
                  <span>Why This Explainer is Different</span>
                </div>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Standard budget apps simply tell you that you spent too much. MONVEX isolates the exact causal factor, models the future cash-flow trajectory, and presents an achievable trade-off.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-[#E5E7EB] bg-white space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                  <ShieldCheck className="h-4 w-4 text-[#059669]" />
                  <span>Privacy-Preserving Edge Intelligence</span>
                </div>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Your raw financial data is strictly partitioned and never trained on public models. Financial simulations run deterministically inside secure, user-isolated sessions.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#172033] text-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block text-white">Experience Live AI Copilot</span>
                  <span className="text-[11px] text-slate-400">Natural language queries &amp; voice analysis</span>
                </div>
                <Link
                  href="/ai"
                  className="px-3.5 py-2 rounded-xl bg-white text-[#172033] hover:bg-[#F7F7F4] text-xs font-bold transition-all"
                >
                  Open Copilot →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WORKSPACE SHOWCASE (4 DISTINCT PRESENTATION MODULES) ───────── */}
      <section id="workspace" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full border-t border-[#E5E7EB]">
        <div className="space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Integrated System
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              A workspace built for financial sovereignty.
            </h2>
            <p className="text-sm text-[#5F6878] font-medium leading-relaxed">
              Every financial dimension has a specialized UI surface engineered for clarity, speed, and mathematical control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Large Ledger Preview */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172033]">Multi-Wallet Financial Ledger</span>
                </div>
                <Badge variant="neutral" size="sm">Reconciled</Badge>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#F7F7F4] border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#172033] block">Apple Cloud Storage</span>
                    <span className="text-[10px] text-[#5F6878]">Subscription • ICICI Credit Card</span>
                  </div>
                  <span className="font-bold text-[#E11D48]">-₹219.00</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F7F4] border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#172033]">Consulting Dividend</span>
                    <span className="text-[10px] text-[#5F6878]">Secondary Income • HDFC Salary</span>
                  </div>
                  <span className="font-bold text-[#059669]">+₹18,500.00</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F7F4] border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#172033]">HPCL Fuel Station</span>
                    <span className="text-[10px] text-[#5F6878]">Transport • UPI Cash Wallet</span>
                  </div>
                  <span className="font-bold text-[#E11D48]">-₹2,100.00</span>
                </div>
              </div>
            </div>

            {/* 2. Budget Velocity Visualization */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-[#D97706]" />
                  <span className="text-xs font-bold text-[#172033]">Category Velocity &amp; Thresholds</span>
                </div>
                <Badge variant="success" size="sm">Cycle Day 21 / 30</Badge>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#172033]">Groceries &amp; Pantry</span>
                    <span className="font-mono text-[#5F6878]">₹8,200 / ₹12,000 (68%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F0EFEA] overflow-hidden">
                    <div className="h-full bg-[#059669] rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#172033]">Utilities &amp; Broadband</span>
                    <span className="font-mono text-[#5F6878]">₹4,100 / ₹5,000 (82%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F0EFEA] overflow-hidden">
                    <div className="h-full bg-[#D97706] rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#172033]">Dining Out</span>
                    <span className="font-mono text-[#E11D48] font-bold">₹18,420 / ₹15,000 (122%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F0EFEA] overflow-hidden">
                    <div className="h-full bg-[#E11D48] rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Goal Accumulation Trajectory */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#059669]" />
                  <span className="text-xs font-bold text-[#172033]">Emergency Reserve Fund</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#059669]">84% Reached</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-black text-[#172033]">₹2,52,000</span>
                  <span className="text-xs text-[#858D9A]">Target: ₹3,00,000</span>
                </div>

                <div className="h-2.5 rounded-full bg-[#F0EFEA] overflow-hidden">
                  <div className="h-full bg-[#059669] rounded-full" style={{ width: '84%' }} />
                </div>

                <div className="p-3 rounded-lg bg-[#F7F7F4] text-xs text-[#5F6878] flex items-center justify-between">
                  <span>ETA to 100% Completion:</span>
                  <strong className="text-[#172033]">November 2026 (2.5 Months)</strong>
                </div>
              </div>
            </div>

            {/* 4. Cyber Defense & Data Isolation */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172033]">Zero-Trust Security &amp; Data Boundary</span>
                </div>
                <Badge variant="success" size="sm">WAF Active</Badge>
              </div>

              <div className="space-y-2 text-xs text-[#5F6878]">
                <div className="p-3 rounded-lg bg-[#F7F7F4] flex items-center justify-between">
                  <span>Active Query Scoping:</span>
                  <span className="font-mono font-bold text-[#172033]">request.user ONLY</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F7F7F4] flex items-center justify-between">
                  <span>Tamper-Evident Audit Trail:</span>
                  <span className="font-mono font-bold text-[#059669]">SHA-256 Verified</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F7F7F4] flex items-center justify-between">
                  <span>Intrusion Prevention:</span>
                  <span className="font-mono font-bold text-[#2563EB]">Active WAF Layer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WINDOWS DESKTOP APP SECTION ─────────────────────────────────── */}
      <section id="desktop" className="py-16 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
        <div className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-white via-white to-[#F7F7F4] p-6 sm:p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB]">
              <Cpu className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider">
                Native Desktop Platform
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#172033]">
              MONVEX for Windows
            </h2>
            <p className="text-xs sm:text-sm text-[#475467] font-medium leading-relaxed">
              Experience MONVEX as a native Windows desktop application. Includes instant global Command Center shortcuts (<kbd className="px-1.5 py-0.5 rounded bg-[#E5E7EB] font-mono text-[10px] text-[#172033] font-bold">Ctrl+K</kbd>), system tray quick transaction entry, low-latency performance, and native OS notifications.
            </p>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-[#5F6878] pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                Windows 10 / 11 (64-bit)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                NSIS Installer (~1.6 MB)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                v2.0.0 Production Release
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
            <a
              href={windowsDownloadUrl}
              download="MONVEX-Setup.exe"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#172033] hover:bg-[#0F172A] text-white px-8 py-4 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all active:translate-y-[1px]"
            >
              <Download className="h-4 w-4 text-[#38BDF8]" />
              <span>Download for Windows</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ──────────────────────────────────────────────── */}
      <AboutSection onOpenContact={() => setIsContactOpen(true)} />

      {/* ─── CALL TO ACTION (CTA) ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
        <div className="rounded-3xl bg-[#172033] text-white p-8 sm:p-14 shadow-xl text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#38BDF8]">
              Ready to Upgrade Your Financial Clarity?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Take absolute control over your financial trajectory.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              No spreadsheets. No fake transactions. Pure financial intelligence tailored to your income and cash flow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#172033] px-8 py-3.5 text-xs font-bold shadow-md transition-all active:translate-y-[1px]"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-slate-700 text-white px-8 py-3.5 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Contact Me</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#E5E7EB] bg-white py-12 px-4 sm:px-6 lg:px-12 text-xs text-[#5F6878]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[#172033] text-white flex items-center justify-center font-black text-xs">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#172033]">MONVEX</span>
              <span className="text-[10px] text-[#858D9A]">AI-powered personal financial intelligence.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <a href="#core-loop" className="hover:text-[#172033] transition-colors">Core Architecture</a>
            <a href="#simulator" className="hover:text-[#172033] transition-colors">What-If Simulator</a>
            <a href="#intelligence" className="hover:text-[#172033] transition-colors">Intelligence System</a>
            <a href="#desktop" className="hover:text-[#172033] transition-colors">Windows Desktop</a>
            <a href="#about" className="hover:text-[#172033] transition-colors">About</a>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="hover:text-[#172033] transition-colors font-semibold cursor-pointer"
            >
              Contact
            </button>
            <Link href="/security" className="hover:text-[#172033] transition-colors">Security Center</Link>
            <Link href="/login" className="hover:text-[#172033] transition-colors">Sign In</Link>
          </div>

          <div className="text-center md:text-right space-y-0.5">
            <div className="font-semibold text-[11px] text-[#172033]">
              Built by Danish Ansari (Drix)
            </div>
            <div className="font-mono text-[10px] text-[#858D9A]">
              &copy; 2026 MONVEX. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* ─── CONTACT MODAL ────────────────────────────────────────────────── */}
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}

