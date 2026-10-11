'use client';

import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Activity,
  AlertCircle,
  Sliders,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Database,
  Lock,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface AIContextPanelProps {
  summary: any;
  currentIntent?: string;
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

export const AIContextPanel: React.FC<AIContextPanelProps> = ({
  summary,
  currentIntent,
  onSelectPrompt,
  className,
}) => {
  const totalExpense = Number(summary?.total_expense || summary?.monthly_expenses || 0);
  const totalIncome = Number(summary?.total_income || summary?.monthly_income || 0);
  const savingsRate = Number(summary?.savings_rate || 0);
  const runwayMonths = summary?.runway_months !== undefined ? Number(summary?.runway_months) : null;
  const categories = summary?.category_breakdown || summary?.spending_by_category || [];
  const hasTransactions = totalExpense > 0 || totalIncome > 0 || (Array.isArray(categories) && categories.length > 0);

  return (
    <aside
      className={cn(
        'w-80 shrink-0 bg-[#FAF9FC] border-l border-[#E7E6F0] p-4 flex flex-col justify-between overflow-y-auto select-none space-y-4',
        className
      )}
    >
      <div className="space-y-4">
        {/* Panel Header */}
        <div className="border-b border-[#E7E6F0] pb-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-[#77798A] uppercase tracking-wider">
              Live Balance Telemetry
            </span>
            <span className="flex items-center gap-1.5 text-[9.5px] font-mono text-[#16745C] bg-[#E8FBF4] px-2 py-0.5 rounded-full border border-[#B6F0DE]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75DCC0] animate-pulse" />
              <span>SYNCED</span>
            </span>
          </div>
          <h3 className="font-black text-sm text-[#20212B] tracking-tight">
            Financial Context Engine
          </h3>
        </div>

        {/* Real Ledger Overview */}
        {hasTransactions ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#E7E6F0] bg-white p-2.5 space-y-0.5">
                <span className="text-[10px] text-[#77798A] font-semibold block">Monthly Burn</span>
                <span className="text-xs font-mono font-bold text-[#E76D7A] block truncate">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="rounded-xl border border-[#E7E6F0] bg-white p-2.5 space-y-0.5">
                <span className="text-[10px] text-[#77798A] font-semibold block">Monthly Inflow</span>
                <span className="text-xs font-mono font-bold text-[#16745C] block truncate">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </div>

            {/* Savings Rate & Runway */}
            <div className="rounded-xl border border-[#E7E6F0] bg-white p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77798A] font-medium">Net Savings Rate</span>
                <span className="font-mono font-bold text-[#20212B]">{savingsRate.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEEDF8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6865E8] to-[#75DCC0] rounded-full"
                  style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                />
              </div>

              {runwayMonths !== null && (
                <div className="pt-1 flex items-center justify-between text-xs border-t border-[#E7E6F0]">
                  <span className="text-[#77798A] font-medium">Emergency Runway</span>
                  <span className="font-mono font-bold text-[#20212B]">
                    {runwayMonths > 24 ? '> 24 mos' : `${runwayMonths.toFixed(1)} mos`}
                  </span>
                </div>
              )}
            </div>

            {/* Top Spending Categories if available */}
            {categories.length > 0 && (
              <div className="rounded-xl border border-[#E7E6F0] bg-white p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-[#20212B] uppercase tracking-wider">
                    Top Burn Categories
                  </span>
                  <PieChart className="h-3.5 w-3.5 text-[#77798A]" />
                </div>
                <div className="space-y-1.5">
                  {categories.slice(0, 4).map((cat: any, idx: number) => {
                    const cname = cat.category__name || cat.name || 'Expense';
                    const camount = Number(cat.total || cat.amount || 0);
                    const pct = totalExpense > 0 ? (camount / totalExpense) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-0.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#77798A] font-medium truncate max-w-[120px]">{cname}</span>
                          <span className="font-mono font-bold text-[#20212B]">{formatCurrency(camount)}</span>
                        </div>
                        <div className="h-1 w-full bg-[#EEEDF8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6865E8] rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Honest Empty State: No Fabricated Financial Data */
          <div className="rounded-2xl border border-dashed border-[#E7E6F0] bg-white/70 p-4 text-center space-y-2">
            <div className="h-9 w-9 mx-auto rounded-xl bg-[#EEEDF8] flex items-center justify-center text-[#6865E8]">
              <Database className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-[#20212B] block">
              Awaiting Ledger Activity
            </span>
            <p className="text-[11px] text-[#77798A] leading-relaxed font-medium">
              Not enough transaction history is logged yet to generate live spending variance. Add your transactions to activate deterministic analysis.
            </p>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6865E8] hover:underline pt-1"
            >
              <span>Add Transactions</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Quick Capabilities / Simulator Launchpad */}
        <div className="rounded-xl border border-[#E7E6F0] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-[#20212B] uppercase tracking-wider">
              Financial Stress-Tests
            </span>
            <Sliders className="h-3.5 w-3.5 text-[#6865E8]" />
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onSelectPrompt('What happens if I cut Food & Dining spending by 20% for the next 6 months?')}
              className="w-full text-left p-2 rounded-lg bg-[#F8F7FC] hover:bg-[#EEEDF8] border border-[#E7E6F0] text-[11px] font-semibold text-[#20212B] transition-colors cursor-pointer"
            >
              Simulate 20% Dining Reduction
            </button>
            <button
              type="button"
              onClick={() => onSelectPrompt('Can I afford an unexpected ₹50,000 expense without reducing my 6-month runway?')}
              className="w-full text-left p-2 rounded-lg bg-[#F8F7FC] hover:bg-[#EEEDF8] border border-[#E7E6F0] text-[11px] font-semibold text-[#20212B] transition-colors cursor-pointer"
            >
              Runway Impact Test (₹50k)
            </button>
          </div>
        </div>
      </div>

      {/* Zero-Trust Security Footer */}
      <div className="pt-3 border-t border-[#E7E6F0] space-y-1.5 text-[10px] text-[#77798A] font-mono">
        <div className="flex items-center gap-1.5 text-[#16745C]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#75DCC0]" />
          <span>Tenant DB Encryption Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-[#77798A]" />
          <span>Deterministic Audit v2.4</span>
        </div>
      </div>
    </aside>
  );
};
