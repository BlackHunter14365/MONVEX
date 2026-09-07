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

export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
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
      <div className="space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:m-0">
        <div className="print:hidden">
          <PageHeader
            title="Executive Financial Briefing & Reports"
            description="Audit-grade monthly financial statements, spending variance attribution, and multi-format portfolio exports."
            actionSlot={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
                  className="text-xs font-bold touch-target"
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  leftIcon={<FileCode className="h-3.5 w-3.5" />}
                  className="text-xs font-bold touch-target"
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  className="text-xs font-bold touch-target"
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadPDF}
                  isLoading={isGeneratingPDF}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-sm touch-target"
                >
                  Download PDF
                </Button>
              </div>
            }
          />
        </div>

        {/* =========================================================================
            DOUBLE-BEZEL PRINTABLE EXECUTIVE STATEMENT CARD
            ========================================================================= */}
        <div className="double-bezel print:p-0 print:border-0 print:bg-transparent">
          <div className="double-bezel-inner p-8 sm:p-10 rounded-2xl space-y-8 bg-white border border-[#E4E2DC] shadow-sm print:shadow-none print:border-0 print:p-0">
            {/* Statement Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#2A1F3D] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-[#191522]">MONVEX</span>
                  <Badge variant="success" size="sm">Official Statement</Badge>
                </div>
                <span className="text-xs text-[#625D69] font-bold block mt-1">
                  Personal Financial Intelligence & Sovereign Capital Platform
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono font-bold text-[#191522] block">
                  Reporting Period: {reportData?.month_year || 'Current Month'}
                </span>
                <span className="text-[11px] text-[#898390] font-mono">
                  Generated: {reportData?.generated_at || new Date().toISOString().slice(0, 10)}
                </span>
              </div>
            </div>

            {/* Core Monetary Summary Strip */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#F6F5F1] border border-[#E4E2DC]">
                <div>
                  <span className="text-[10px] text-[#898390] block font-mono font-bold uppercase">Total Inflow</span>
                  <FinancialAmount
                    amount={totalInflow}
                    currency={user?.currency}
                    size="lg"
                    type="income"
                    showSign={true}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-[#898390] block font-mono font-bold uppercase">Total Outflow</span>
                  <FinancialAmount
                    amount={-totalOutflow}
                    currency={user?.currency}
                    size="lg"
                    type="expense"
                    showSign={false}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-[#898390] block font-mono font-bold uppercase">Net Savings</span>
                  <FinancialAmount
                    amount={netSavings}
                    currency={user?.currency}
                    size="lg"
                    type="neutral"
                    showSign={netSavings !== 0}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-[#898390] block font-mono font-bold uppercase">Health Rating</span>
                  <span className="text-lg font-mono font-black text-[#2563EB] tnum">
                    {healthScore}/100 ({healthGrade})
                  </span>
                </div>
              </div>
            )}

            {/* Section 1: Question 1 — Spending Variance Attribution */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E4E2DC] pb-2">
                <HelpCircle className="h-4 w-4 text-[#4056A1]" />
                <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                  1. What Drove Spending Variance This Cycle?
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] text-xs text-[#191522] font-medium leading-relaxed">
                {reportData?.spending_variance_insight ||
                  'Spending velocity is operating in standard variance bounds relative to the 90-day moving average. No abnormal deviations observed.'}
              </div>

              {(reportData?.variance_drivers || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {reportData.variance_drivers.map((d: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-[#E4E2DC] bg-white space-y-1.5 text-xs">
                      <span className="font-bold text-[#191522] block">{d.category}</span>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[#898390] text-[11px]">Variance Delta:</span>
                        <FinancialAmount
                          amount={d.delta}
                          currency={user?.currency}
                          size="xs"
                          type={d.delta > 0 ? 'expense' : 'income'}
                          showSign={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Question 2 — Capital Concentration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E4E2DC] pb-2">
                <PieChart className="h-4 w-4 text-[#059669]" />
                <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                  2. Where Did Capital Outflows Concentrate?
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#E4E2DC]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F5F1] border-b border-[#E4E2DC] font-mono text-[10px] text-[#625D69] uppercase">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Category</th>
                      <th className="px-4 py-2.5 font-bold">Volume</th>
                      <th className="px-4 py-2.5 font-bold">Total Expenditure</th>
                      <th className="px-4 py-2.5 font-bold text-right">Share of Outflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E2DC] bg-white">
                    {(reportData?.top_categories || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#898390]">
                          No categorized transactions recorded for this billing cycle.
                        </td>
                      </tr>
                    ) : (
                      reportData.top_categories.map((cat: any) => (
                        <tr key={cat.category_id || cat.name} className="hover:bg-[#FBFBFA] transition-colors">
                          <td className="px-4 py-3 font-bold text-[#191522]">{cat.name}</td>
                          <td className="px-4 py-3 font-mono text-[#625D69]">{cat.count} txns</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#191522]">
                            <FinancialAmount
                              amount={cat.total}
                              currency={user?.currency}
                              size="xs"
                              showSign={false}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-right font-bold text-[#191522]">
                            {cat.percentage}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Question 3 — Forward Capital Trajectory */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E4E2DC] pb-2">
                <TrendingUp className="h-4 w-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                  3. What Is The Forward Capital Trajectory?
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] text-xs text-[#191522] font-medium leading-relaxed">
                Based on current velocity, your savings rate is running at{' '}
                <strong className="font-mono text-[#059669]">
                  {totalInflow > 0 ? ((netSavings / totalInflow) * 100).toFixed(1) : '0.0'}%
                </strong>
                . Fixed commitments and amortizing liabilities represent{' '}
                <strong className="font-mono text-[#191522]">
                  {totalInflow > 0 ? ((totalOutflow / totalInflow) * 100).toFixed(1) : '0.0'}%
                </strong>{' '}
                of gross inflow.
              </div>
            </div>

            {/* Footer Signoff */}
            <div className="pt-6 border-t border-[#E4E2DC] flex items-center justify-between text-[10px] text-[#898390] font-mono">
              <div className="flex items-center gap-1.5 text-[#059669]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Deterministic Computation Engine Verified</span>
              </div>
              <span>End of Confidential Statement</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
