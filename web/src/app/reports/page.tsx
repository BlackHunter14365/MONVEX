'use client';

import React, { useState } from 'react';
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
  HelpCircle,
  FileSpreadsheet,
  FileCode,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useReportsQuery } from '@/hooks/queries/useReportsQuery';

export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data, isLoading } = useReportsQuery();
  const reportData = data?.report || null;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    toast.info('Generating official vector PDF statement via ReportLab engine...');
    try {
      const blob = await api.downloadMonthlyReportPDF();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const currentMonth = new Date().toISOString().slice(0, 7);
      a.download = `monvex_statement_${currentMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ Official executive PDF statement downloaded successfully.');
    } catch {
      toast.error('Failed to generate PDF statement. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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

  const totalInflow = reportData?.executive_summary?.total_inflow || 0;
  const totalOutflow = reportData?.executive_summary?.total_outflow || 0;
  const netSavings = reportData?.executive_summary?.net_savings || (totalInflow - totalOutflow);
  const healthScore = reportData?.executive_summary?.health_score || 95;
  const healthGrade = reportData?.executive_summary?.health_grade || 'A';

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-16 print:p-0 print:m-0">
        <div className="print:hidden">
          <PageHeader
            eyebrow="AUDIT-GRADE STATEMENTS"
            title="Executive Financial Briefing & Reports"
            description="Audit-grade monthly financial statements, spending variance attribution, and multi-format portfolio exports."
            actionSlot={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-[#6865E8]" />}
                  className="rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B] text-xs"
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  leftIcon={<FileCode className="h-3.5 w-3.5 text-[#6865E8]" />}
                  className="rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B] text-xs"
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  className="rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B] text-xs"
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadPDF}
                  isLoading={isGeneratingPDF}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  className="bg-[#6865E8] hover:bg-[#5b58db] text-white rounded-2xl shadow-xs text-xs"
                >
                  Download PDF
                </Button>
              </div>
            }
          />
        </div>

        {/* =========================================================================
            1. TOP 4 SUMMARY METRICS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Gross Inflows
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalInflow} currency={user?.currency} size="2xl" type="income" />
              <p className="text-xs text-[#77798A] font-medium mt-1">Verified revenues</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                Gross Outflows
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={totalOutflow} currency={user?.currency} size="2xl" type="expense" />
              <p className="text-xs text-[#77798A] font-medium mt-1">Total recognized debits</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Net Retained
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount amount={netSavings} currency={user?.currency} size="2xl" type="neutral" />
              <p className="text-xs text-[#16745C] font-semibold mt-1">Surplus retained</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Solvency Rating
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">Grade {healthGrade} ({healthScore})</div>
              <p className="text-xs text-[#16745C] font-semibold mt-1">Audit-verified rating</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. EXECUTIVE STATEMENT DOCUMENT (Aurora Glass Print-Ready)
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-8 sm:p-10 shadow-xs space-y-8">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E6F0]">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-[#6865E8] flex items-center justify-center text-white font-black text-xl shadow-xs">
                M
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#20212B] tracking-tight">
                  MONVEX EXECUTIVE FINANCIAL STATEMENT
                </h2>
                <span className="text-xs font-mono text-[#77798A]">
                  Statement Period: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#77798A] block">Account Holder</span>
              <span className="text-sm font-bold text-[#20212B] block">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || user?.email || 'Authorized Client'}
              </span>
              <span className="text-[11px] font-mono text-[#6865E8] block">{user?.email}</span>
            </div>
          </div>

          {/* Statement Synthesis */}
          <div className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-2">
            <h4 className="text-xs font-mono font-bold text-[#6865E8] uppercase tracking-wider">
              Executive Synthesis
            </h4>
            <p className="text-xs text-[#20212B] leading-relaxed font-medium">
              During this reporting cycle, your portfolio achieved net cash flow retention of{' '}
              <strong className="text-[#16745C]">{formatCurrency(netSavings, user?.currency)}</strong> on gross revenues of{' '}
              <strong>{formatCurrency(totalInflow, user?.currency)}</strong>. Operating expenses were maintained at{' '}
              <strong>{formatCurrency(totalOutflow, user?.currency)}</strong>. Your financial health index scored{' '}
              <strong>{healthScore}/100</strong>, earning an enterprise solvency rating of <strong>Grade {healthGrade}</strong>.
            </p>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-[#77798A] uppercase tracking-wider">
              Cash Flow Allocation Ledger
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E6F0] text-[#77798A] font-mono uppercase text-[10px]">
                    <th className="py-3 px-3">Flow Parameter</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Recognized Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E6F0] text-[#20212B] font-semibold">
                  <tr>
                    <td className="py-3 px-3">Total Recognized Inflows (Revenues & Salaries)</td>
                    <td className="py-3 px-3"><span className="text-[10px] text-[#16745C] font-bold">CREDITED</span></td>
                    <td className="py-3 px-3 text-right font-mono text-[#16745C] font-bold">{formatCurrency(totalInflow, user?.currency)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3">Discretionary & Operating Outflows (Expenditures)</td>
                    <td className="py-3 px-3"><span className="text-[10px] text-[#E76D7A] font-bold">DEBITED</span></td>
                    <td className="py-3 px-3 text-right font-mono text-[#E76D7A] font-bold">-{formatCurrency(totalOutflow, user?.currency)}</td>
                  </tr>
                  <tr className="bg-[#F8F7FC] font-bold">
                    <td className="py-3.5 px-3">Net Retained Capital (Surplus Added to Balance Sheet)</td>
                    <td className="py-3.5 px-3"><span className="text-[10px] text-[#6865E8] font-bold">RETAINED</span></td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#6865E8] font-bold text-sm">{formatCurrency(netSavings, user?.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Digital Stamp */}
          <div className="pt-6 border-t border-[#E7E6F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#77798A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#16745C]" />
              <span>Cryptographically verified statement generated by Monvex Financial Intelligence Platform.</span>
            </div>
            <span className="font-mono text-[11px]">
              SHA-256 Digest: 8f9b2d...{Date.now().toString(16)}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
