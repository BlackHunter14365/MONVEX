'use client';

import React from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  AlertTriangle,
  Scale,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export default function FinancialDisclaimerPage() {
  return (
    <PublicPageShell
      eyebrow="REGULATORY & ADVISORY NOTICE"
      title="Financial Disclaimer"
      description="Important regulatory disclosures regarding algorithmic calculations, AI forecasts, and non-fiduciary status."
      lastUpdated="October 2026"
    >
      <div className="space-y-10 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Prominent Warning Callout */}
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-white dark:bg-[#1B1A2A] text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
              Informational & Computational Platform Only
            </h3>
            <p className="text-amber-800 dark:text-amber-400 leading-relaxed">
              MONVEX provides software tools for double-entry bookkeeping, cash flow organization, and mathematical simulations. <strong>Nothing on MONVEX constitutes professional financial, tax, legal, or investment advice.</strong>
            </p>
          </div>
        </div>

        {/* Section 1: Non-Advisory Status */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">1.</span> Non-Advisory & Non-Fiduciary Status
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            MONVEX is <strong>not</strong> a Registered Investment Advisor (RIA), broker-dealer, financial planner, tax consultant, or Certified Public Accountant (CPA) under any jurisdiction.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li>No fiduciary relationship is created between you and MONVEX (or Danish Ansari) by using this platform.</li>
            <li>We do not recommend, endorse, or promote specific equities, securities, debt instruments, mutual funds, cryptocurrency assets, or financial products.</li>
            <li>All metrics, charts, ratios, runway calculations, and summaries generated within MONVEX are computed strictly from inputs and entries you configure.</li>
          </ul>
        </section>

        {/* Section 2: AI Copilot Projections */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">2.</span> AI Copilot & Generative Intelligence Limitations
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            The MONVEX conversational Copilot utilizes large language models (Google Gemini 2.0) alongside statistical regression tools:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-1">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block">Synthetic Insights</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                AI Copilot observations regarding &ldquo;burn rate&rdquo; or &ldquo;savings efficiency&rdquo; are automated linguistic reflections of your entered data, not financial mandates.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-1">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block">No Real-World Market Guarantees</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Language model output should never be used as the basis for asset allocation, options trading, or tax filing decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: What-If Simulator & Deterministic Forecasting */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">3.</span> What-If Simulator & Runway Models
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            Projections displayed across the <em>What-If Simulator</em>, <em>Cash Runway Forecast</em>, and <em>Debt Payoff Simulator</em> are mathematical approximations derived from linear, geometric, or constant-growth assumptions:
          </p>
          <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs space-y-2">
            <p className="text-[#77798A] dark:text-[#A6A4B8]">
              <strong>Hypothetical Scenarios:</strong> Simulations assume stable future income, predictable inflation, and constant expense trajectories. In reality, actual macroeconomic conditions, unplanned emergencies, and market shifts will differ materially from simulated numbers.
            </p>
            <p className="text-[#77798A] dark:text-[#A6A4B8]">
              <strong>Past Performance:</strong> Historical ledger trends logged in MONVEX do not predict or guarantee future balances or cash availability.
            </p>
          </div>
        </section>

        {/* Section 4: Currency Conversion Estimates */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">4.</span> Foreign Exchange & Conversion Rates
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            The <em>Convert Now</em> utility and multi-currency ledger conversions provide approximate exchange values based on periodic benchmark market rates:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li>Exchange rates shown are estimates and may lag spot market quotes.</li>
            <li>Conversions displayed do <strong>not</strong> execute real-money currency exchanges, cross-border remittances, or wire transfers.</li>
            <li>Commercial financial institutions and banks charge retail spreads, intermediary fees, and markups that are not reflected in MONVEX mid-market calculations.</li>
          </ul>
        </section>

        {/* Section 5: Professional Counsel */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">5.</span> Consult a Certified Professional
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            Before making decisions involving tax filings, significant capital outlays, real estate transactions, debt restructuring, or retirement strategies, you should consult with a certified financial planner (CFP), registered investment advisor, tax attorney, or licensed CPA qualified in your jurisdiction.
          </p>
        </section>

        {/* Inquiries */}
        <section className="pt-4 border-t border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-[#77798A] dark:text-[#A6A4B8]">
            Have regulatory or compliance questions regarding MONVEX?
          </span>
          <Link
            href="/contact"
            className="text-[#6865E8] dark:text-[#7C79F2] font-semibold hover:underline"
          >
            Contact administration &rarr;
          </Link>
        </section>
      </div>
    </PublicPageShell>
  );
}
