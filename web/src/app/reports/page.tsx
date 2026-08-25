'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Landmark,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function ReportsPage() {
  const toast = useToast();

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const data = await api.getMonthlyReport();
      if (data && data.report) {
        setReportData(data.report);
      }
    } catch {
      toast.error('Failed to generate monthly statement.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportJSON = async () => {
    try {
      const fullData = await api.exportFullUserDataJSON();
      const exportBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monvex-statement-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ Complete JSON financial ledger downloaded.');
    } catch {
      toast.error('Failed to export JSON.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.downloadTransactionsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monvex_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ Sanitized CSV ledger downloaded.');
    } catch {
      toast.error('Unable to export transactions CSV.');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:m-0">
        <div className="print:hidden">
          <PageHeader
            title="Monthly Statement & Financial Intelligence Report"
            description="Comprehensive executive financial summary including cash flow velocity, variance attribution, and multi-format exports."
            actionSlot={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  className="text-xs font-bold"
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  className="text-xs font-bold"
                >
                  Export JSON
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  className="bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-bold shadow-md"
                >
                  Print / PDF
                </Button>
              </div>
            }
          />
        </div>

        {/* PRINTABLE EXECUTIVE STATEMENT CARD */}
        <div className="editorial-card p-8 sm:p-10 rounded-2xl space-y-8 bg-white border border-[#E4E2DC] shadow-subtle print:shadow-none print:border-0 print:p-0">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#172033] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#172033]">MONVEX 2.0</span>
                <span className="brutalist-tag-emerald text-[9px] py-0 px-2">Official Statement</span>
              </div>
              <span className="text-xs text-[#5F6878] font-bold block mt-1">
                Personal Financial Intelligence Platform
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-mono font-bold text-[#172033] block">
                Period: {reportData?.month_year || 'Current Month'}
              </span>
              <span className="text-[11px] text-[#858D9A] font-mono">
                Generated: {reportData?.generated_at || new Date().toISOString().slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Core Monetary Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#F6F5F1] border border-[#E4E2DC]">
            <div>
              <span className="text-[10px] text-[#858D9A] block font-mono font-bold uppercase">Total Inflow</span>
              <span className="text-base sm:text-lg font-black text-[#059669]">
                +<AnimatedValue value={reportData?.executive_summary?.total_inflow || 0} />
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#858D9A] block font-mono font-bold uppercase">Total Outflow</span>
              <span className="text-base sm:text-lg font-black text-[#E11D48]">
                -<AnimatedValue value={reportData?.executive_summary?.total_outflow || 0} />
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#858D9A] block font-mono font-bold uppercase">Net Savings</span>
              <span className="text-base sm:text-lg font-black text-[#172033]">
                <AnimatedValue value={reportData?.executive_summary?.net_savings || 0} />
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#858D9A] block font-mono font-bold uppercase">Health Score</span>
              <span className="text-base sm:text-lg font-black text-[#2563EB]">
                <AnimatedValue value={reportData?.executive_summary?.health_score || 95} type="number" decimals={0} />/100 ({reportData?.executive_summary?.health_grade || 'A'})
              </span>
            </div>
          </div>

          {/* Variance Insight & Attribution */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#172033] tracking-tight uppercase border-b border-[#E4E2DC] pb-2">
              1. Root Cause Spending Variance Attribution
            </h3>
            <p className="text-xs text-[#1E293B] font-medium leading-relaxed bg-[#F6F5F1] p-4 rounded-xl border border-[#E4E2DC]">
              {reportData?.spending_variance_insight || 'Spending velocity is running in optimal alignment with your 30-day moving average.'}
            </p>

            {(reportData?.variance_drivers || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {reportData.variance_drivers.map((d: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-[#E4E2DC] bg-white space-y-1 text-xs">
                    <span className="font-bold text-[#172033] block">{d.category}</span>
                    <span className="font-mono text-[#5F6878]">
                      Delta: <strong className={d.delta > 0 ? 'text-[#E11D48]' : 'text-[#059669]'}>
                        {d.delta > 0 ? `+${formatCurrency(d.delta)}` : formatCurrency(d.delta)}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#172033] tracking-tight uppercase border-b border-[#E4E2DC] pb-2">
              2. Major Outflow Categories
            </h3>

            <div className="overflow-x-auto">
              <table className="ref-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Transactions</th>
                    <th>Total Spend</th>
                    <th>Share of Outflow</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.top_categories || []).map((cat: any) => (
                    <tr key={cat.category_id || cat.name}>
                      <td className="font-bold text-xs text-[#172033]">{cat.name}</td>
                      <td className="text-xs font-mono text-[#5F6878]">{cat.count} entries</td>
                      <td className="font-mono text-xs font-black text-[#172033]">
                        {formatCurrency(cat.total)}
                      </td>
                      <td className="text-xs font-mono text-[#5F6878]">{cat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Signoff */}
          <div className="pt-6 border-t border-[#E4E2DC] flex items-center justify-between text-[11px] text-[#858D9A] font-mono">
            <span>MONVEX 2.0 Security Encrypted Ledger</span>
            <span>Deterministic Verified Computation</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
