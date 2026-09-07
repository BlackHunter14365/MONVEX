'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Plus,
  Trash2,
  PieChart,
  Landmark,
  CreditCard,
  Coins,
  Building,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Scale,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function NetWorthPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [netWorthData, setNetWorthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Asset Modal State
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('BANK');
  const [assetValue, setAssetValue] = useState('');
  const [assetInstitution, setAssetInstitution] = useState('');
  const [isSavingAsset, setIsSavingAsset] = useState(false);

  // Add Liability Modal State
  const [isAddLiabOpen, setIsAddLiabOpen] = useState(false);
  const [liabName, setLiabName] = useState('');
  const [liabType, setLiabType] = useState('PERSONAL_LOAN');
  const [liabPrincipal, setLiabPrincipal] = useState('');
  const [liabRate, setLiabRate] = useState('10.5');
  const [liabTenure, setLiabTenure] = useState('24');
  const [isSavingLiab, setIsSavingLiab] = useState(false);

  const fetchNetWorth = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNetWorth();
      setNetWorthData(data);
    } catch {
      toast.error('Failed to load net worth balance sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetWorth();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetValue) return;
    setIsSavingAsset(true);

    try {
      await api.createAsset({
        name: assetName,
        asset_type: assetType,
        value: Number(assetValue),
        institution: assetInstitution,
      });
      toast.success(`✓ Asset "${assetName}" added to Balance Sheet.`);
      setIsAddAssetOpen(false);
      setAssetName('');
      setAssetValue('');
      setAssetInstitution('');
      fetchNetWorth();
    } catch {
      toast.error('Failed to save asset.');
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleCreateLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabName || !liabPrincipal) return;
    setIsSavingLiab(true);

    try {
      await api.createLiability({
        name: liabName,
        liability_type: liabType,
        principal_amount: Number(liabPrincipal),
        remaining_balance: Number(liabPrincipal),
        interest_rate_pct: Number(liabRate),
        tenure_months: Number(liabTenure),
      });
      toast.success(`✓ Liability "${liabName}" added.`);
      setIsAddLiabOpen(false);
      setLiabName('');
      setLiabPrincipal('');
      fetchNetWorth();
    } catch {
      toast.error('Failed to save liability.');
    } finally {
      setIsSavingLiab(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await api.deleteAsset(id);
      toast.info('Asset removed.');
      fetchNetWorth();
    } catch {
      toast.error('Failed to delete asset.');
    }
  };

  const handleDeleteLiability = async (id: string) => {
    try {
      await api.deleteLiability(id);
      toast.info('Liability removed.');
      fetchNetWorth();
    } catch {
      toast.error('Failed to delete liability.');
    }
  };

  const totalAssets = parseFloat(netWorthData?.total_assets) || 0;
  const totalLiabilities = parseFloat(netWorthData?.total_liabilities) || 0;
  const netWorth = parseFloat(netWorthData?.net_worth) || (totalAssets - totalLiabilities);
  const debtToAsset = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  // Asset classes allocation calculation
  const assetsList = netWorthData?.assets_list || [];
  const liabilitiesList = netWorthData?.liabilities_list || [];

  const assetAllocation: Record<string, number> = assetsList.reduce((acc: Record<string, number>, item: any) => {
    const val = parseFloat(item.value) || 0;
    const type = item.asset_type || 'OTHER';
    acc[type] = (acc[type] || 0) + val;
    return acc;
  }, {});

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return Landmark;
      case 'EQUITY':
        return TrendingUp;
      case 'CRYPTO':
        return Coins;
      case 'REAL_ESTATE':
        return Building;
      default:
        return Wallet;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Balance Sheet & Capital Allocation"
          description="Double-entry institutional accounting ledger detailing liquid reserves, capital assets, and liabilities."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNetWorth}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddLiabOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5 text-[#E11D48]" />}
                className="text-xs font-bold text-[#E11D48] border-[#FECDD3] hover:bg-[#FFF1F2]"
              >
                Add Liability
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddAssetOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-md"
              >
                Add Asset
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. BALANCE SHEET EQUATION HERO (Double Bezel)
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 7 cols: Equation */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2 text-[#898390]">
                  <Scale className="h-4 w-4 text-[#4056A1]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    The Solvency Equation
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-4 sm:gap-6">
                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase">Total Assets</span>
                    <FinancialAmount amount={totalAssets} currency={user?.currency} size="xl" showSign={false} />
                  </div>

                  <span className="text-2xl font-black text-[#898390] self-center">−</span>

                  <div>
                    <span className="text-[10px] font-mono text-[#898390] block uppercase">Total Liabilities</span>
                    <FinancialAmount amount={-totalLiabilities} currency={user?.currency} size="xl" showSign={false} />
                  </div>

                  <span className="text-2xl font-black text-[#898390] self-center">=</span>

                  <div>
                    <span className="text-[10px] font-mono text-[#4056A1] block uppercase font-bold">Net Standing</span>
                    <FinancialAmount amount={netWorth} currency={user?.currency} size="2xl" showSign={true} />
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Telemetry ratios */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#E4E2DC] lg:pl-6">
                <div className="p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1">
                  <span className="text-[10px] font-mono text-[#625D69] block uppercase">Solvency Ratio</span>
                  <div className="text-lg font-mono font-black text-[#191522] tnum">
                    {totalLiabilities > 0 ? `${(totalAssets / totalLiabilities).toFixed(2)}x` : '100% Free'}
                  </div>
                  <span className="text-[10px] text-[#059669] font-bold">
                    {debtToAsset < 30 ? 'Low Leverage' : debtToAsset < 60 ? 'Moderate Risk' : 'High Leverage'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1">
                  <span className="text-[10px] font-mono text-[#625D69] block uppercase">Debt-to-Asset</span>
                  <div className="text-lg font-mono font-black text-[#2563EB] tnum">
                    {debtToAsset.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-[#625D69] font-medium">
                    {liabilitiesList.length} Active Debts
                  </span>
                </div>
              </div>
            </div>

            {/* Asset Class Allocation Bar */}
            {totalAssets > 0 && (
              <div className="mt-6 pt-5 border-t border-[#E4E2DC] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#191522]">Asset Class Distribution</span>
                  <span className="text-[11px] font-mono text-[#898390]">{assetsList.length} registered positions</span>
                </div>

                <div className="h-2.5 w-full bg-[#E4E2DC] rounded-full overflow-hidden flex">
                  {Object.entries(assetAllocation).map(([type, val], idx) => {
                    const widthPct = (val / totalAssets) * 100;
                    const colors = ['bg-[#059669]', 'bg-[#2563EB]', 'bg-[#D97706]', 'bg-[#7C3AED]', 'bg-[#0D9488]', 'bg-[#64748B]'];
                    return (
                      <div
                        key={type}
                        className={cn('h-full transition-all', colors[idx % colors.length])}
                        style={{ width: `${widthPct}%` }}
                        title={`${type}: ${widthPct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                  {Object.entries(assetAllocation).map(([type, val], idx) => {
                    const widthPct = (val / totalAssets) * 100;
                    const dotColors = ['bg-[#059669]', 'bg-[#2563EB]', 'bg-[#D97706]', 'bg-[#7C3AED]', 'bg-[#0D9488]', 'bg-[#64748B]'];
                    return (
                      <div key={type} className="flex items-center gap-1.5 font-mono">
                        <span className={cn('h-2 w-2 rounded-full', dotColors[idx % dotColors.length])} />
                        <span className="text-[#625D69]">{type}:</span>
                        <span className="font-bold text-[#191522] tnum">{widthPct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. TWO-COLUMN BALANCE SHEET LEDGER
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ASSETS COLUMN (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="double-bezel">
              <div className="double-bezel-inner p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669]">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                        Asset Portfolio
                      </h3>
                      <span className="text-[10px] text-[#898390] block">{assetsList.length} verified positions</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddAssetOpen(true)}
                    className="text-xs font-bold text-[#059669] hover:underline"
                  >
                    + Add Position
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : assetsList.length === 0 ? (
                  <EmptyState
                    title="No assets registered"
                    description="Record bank deposits, investment holdings, or real properties."
                    actionLabel="Add First Asset"
                    onAction={() => setIsAddAssetOpen(true)}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {assetsList.map((a: any) => {
                      const Icon = getAssetIcon(a.asset_type);
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E4E2DC] hover:border-[#CBD5E1] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6F5F1] text-[#4056A1]">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#191522]">{a.name}</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] uppercase">
                                  {a.asset_type}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#898390] block">
                                {a.institution || 'Liquid Holding'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <FinancialAmount amount={parseFloat(a.value)} currency={user?.currency} size="sm" showSign={false} />
                            <button
                              type="button"
                              onClick={() => handleDeleteAsset(a.id)}
                              className="text-[#898390] hover:text-[#E11D48] p-1 transition-colors"
                              title="Delete position"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LIABILITIES COLUMN (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="double-bezel">
              <div className="double-bezel-inner p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1F2] text-[#E11D48]">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                        Liabilities & Debt
                      </h3>
                      <span className="text-[10px] text-[#898390] block">{liabilitiesList.length} outstanding accounts</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddLiabOpen(true)}
                    className="text-xs font-bold text-[#E11D48] hover:underline"
                  >
                    + Add Debt
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : liabilitiesList.length === 0 ? (
                  <EmptyState
                    title="Zero outstanding debt"
                    description="Your personal balance sheet is completely debt-free."
                    actionLabel="Add Debt If Needed"
                    onAction={() => setIsAddLiabOpen(true)}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {liabilitiesList.map((l: any) => {
                      const balance = parseFloat(l.remaining_balance || l.principal_amount) || 0;
                      return (
                        <div
                          key={l.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E4E2DC] hover:border-[#CBD5E1] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF1F2] text-[#E11D48]">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#191522]">{l.name}</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] uppercase">
                                  {l.liability_type}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#898390] block">
                                {l.interest_rate_pct}% APR • {l.tenure_months} mo tenure
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <FinancialAmount amount={-balance} currency={user?.currency} size="sm" showSign={false} />
                            <button
                              type="button"
                              onClick={() => handleDeleteLiability(l.id)}
                              className="text-[#898390] hover:text-[#E11D48] p-1 transition-colors"
                              title="Delete liability"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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

        {/* ADD ASSET MODAL */}
        <Modal isOpen={isAddAssetOpen} onClose={() => setIsAddAssetOpen(false)} title="Register Balance Sheet Asset">
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#625D69] mb-1 block">Asset Label</label>
              <input
                type="text"
                required
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. HDFC Fixed Deposit, Index Fund Portfolio"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Asset Class</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                >
                  <option value="BANK">Bank Deposit / Cash</option>
                  <option value="EQUITY">Stocks / Mutual Funds</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="CRYPTO">Crypto Assets</option>
                  <option value="GOLD">Gold / Sovereign Bonds</option>
                  <option value="OTHER">Other Tangible Capital</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Valuation Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#625D69] mb-1 block">Institution / Custodian</label>
              <input
                type="text"
                value={assetInstitution}
                onChange={(e) => setAssetInstitution(e.target.value)}
                placeholder="e.g. Zerodha, ICICI Bank, Ledger Vault"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddAssetOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingAsset}>
                Establish Position
              </Button>
            </div>
          </form>
        </Modal>

        {/* ADD LIABILITY MODAL */}
        <Modal isOpen={isAddLiabOpen} onClose={() => setIsAddLiabOpen(false)} title="Record Liability or Debt Obligation">
          <form onSubmit={handleCreateLiability} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#625D69] mb-1 block">Liability Name</label>
              <input
                type="text"
                required
                value={liabName}
                onChange={(e) => setLiabName(e.target.value)}
                placeholder="e.g. SBI Home Loan, Auto Loan"
                className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Liability Type</label>
                <select
                  value={liabType}
                  onChange={(e) => setLiabType(e.target.value)}
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                >
                  <option value="MORTGAGE">Home Loan / Mortgage</option>
                  <option value="AUTO_LOAN">Auto Loan</option>
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="STUDENT_LOAN">Education Loan</option>
                  <option value="CREDIT_CARD">Credit Card Outstanding</option>
                  <option value="OTHER">Other Debt</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Principal Balance</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liabPrincipal}
                  onChange={(e) => setLiabPrincipal(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Interest Rate (% APR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={liabRate}
                  onChange={(e) => setLiabRate(e.target.value)}
                  placeholder="8.5"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#625D69] mb-1 block">Tenure (Months)</label>
                <input
                  type="number"
                  value={liabTenure}
                  onChange={(e) => setLiabTenure(e.target.value)}
                  placeholder="24"
                  className="w-full rounded-lg bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-mono font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddLiabOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingLiab}>
                Record Obligation
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
