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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { AnimatedValue, CardReveal } from '@/components/motion';

export default function NetWorthPage() {
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Net Worth & Wealth Balance Sheet"
          description="Consolidated overview of all liquid reserves, bank deposits, investment portfolios, gold, and debt obligations."
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
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Add Liability
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddAssetOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-bold shadow-md"
              >
                Add Asset
              </Button>
            </div>
          }
        />

        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardReveal index={0} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Calculated Net Worth</span>
            <div className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              <AnimatedValue value={netWorthData?.net_worth || 0} />
            </div>
            <span className="text-[11px] text-[#059669] font-bold block">
              Assets minus Liabilities
            </span>
          </CardReveal>

          <CardReveal index={1} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Total Assets Base</span>
            <div className="text-xl sm:text-2xl font-black text-[#059669] tracking-tight">
              <AnimatedValue value={netWorthData?.total_assets || 0} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              {netWorthData?.assets_list?.length || 0} registered assets
            </span>
          </CardReveal>

          <CardReveal index={2} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Total Liabilities</span>
            <div className="text-xl sm:text-2xl font-black text-[#E11D48] tracking-tight">
              <AnimatedValue value={netWorthData?.total_liabilities || 0} />
            </div>
            <span className="text-[11px] text-[#5F6878] font-medium block">
              {netWorthData?.liabilities_list?.length || 0} active debts
            </span>
          </CardReveal>

          <CardReveal index={3} hoverLift={true} className="editorial-card p-5 space-y-1 rounded-xl">
            <span className="swiss-eyebrow block">Solvency / Leverage</span>
            <div className="text-xl sm:text-2xl font-black text-[#2563EB] tracking-tight">
              <AnimatedValue value={parseFloat(netWorthData?.debt_to_asset_ratio) || 0} type="percentage" decimals={1} />
            </div>
            <span className="text-[11px] text-[#059669] font-bold block">
              Status: {netWorthData?.solvency_status || 'STRONG'}
            </span>
          </CardReveal>
        </div>

        {/* 2-COLUMN ASSETS & LIABILITIES MANAGEMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASSETS LEDGER */}
          <div className="editorial-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#059669]" />
                <h3 className="text-sm font-black text-[#172033]">
                  Registered Assets ({netWorthData?.assets_list?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setIsAddAssetOpen(true)}
                className="text-xs font-bold text-[#059669] hover:underline"
              >
                + Add Asset
              </button>
            </div>

            {(netWorthData?.assets_list || []).length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
                No assets added yet. Add bank deposits, stock portfolios, or gold!
              </div>
            ) : (
              <div className="space-y-2.5">
                {netWorthData.assets_list.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#172033] block">{a.name}</span>
                        <span className="brutalist-tag-emerald text-[9px] py-0 px-1.5">
                          {a.asset_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#858D9A] font-mono">
                        {a.institution || 'Liquid Reserve'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-black text-[#059669]">
                        {formatCurrency(a.value)}
                      </span>
                      <button
                        onClick={() => handleDeleteAsset(a.id)}
                        className="text-[#858D9A] hover:text-[#E11D48] transition-all p-1"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LIABILITIES LEDGER */}
          <div className="editorial-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#E11D48]" />
                <h3 className="text-sm font-black text-[#172033]">
                  Outstanding Liabilities ({netWorthData?.liabilities_list?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setIsAddLiabOpen(true)}
                className="text-xs font-bold text-[#E11D48] hover:underline"
              >
                + Add Liability
              </button>
            </div>

            {(netWorthData?.liabilities_list || []).length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
                No debt obligations recorded. Your balance sheet is clean!
              </div>
            ) : (
              <div className="space-y-2.5">
                {netWorthData.liabilities_list.map((l: any) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#172033] block">{l.name}</span>
                        <Badge variant="danger" size="sm">{l.liability_type}</Badge>
                      </div>
                      <span className="text-[11px] text-[#858D9A] font-mono">
                        EMI: {formatCurrency(l.monthly_emi)}/mo • Rate: {l.interest_rate_pct}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-black text-[#E11D48]">
                        {formatCurrency(l.remaining_balance)}
                      </span>
                      <button
                        onClick={() => handleDeleteLiability(l.id)}
                        className="text-[#858D9A] hover:text-[#E11D48] transition-all p-1"
                        title="Delete liability"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ADD ASSET MODAL */}
        <Modal
          isOpen={isAddAssetOpen}
          onClose={() => setIsAddAssetOpen(false)}
          title="Add New Asset"
          subtitle="Add bank balances, stock portfolios, real estate, or precious metals."
        >
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div>
              <label className="swiss-eyebrow mb-1 block">Asset Name</label>
              <input
                type="text"
                placeholder="e.g. Zerodha Equity Portfolio, HDFC Fixed Deposit"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                required
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="swiss-eyebrow mb-1 block">Asset Class</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                >
                  <option value="BANK">Bank Savings & Deposits</option>
                  <option value="INVESTMENT">Stocks & Mutual Funds</option>
                  <option value="GOLD">Gold & Precious Metals</option>
                  <option value="REAL_ESTATE">Real Estate & Property</option>
                  <option value="CASH">Cash & Liquid Reserve</option>
                  <option value="OTHER">Other / Vehicles</option>
                </select>
              </div>

              <div>
                <label className="swiss-eyebrow mb-1 block">Current Value (₹)</label>
                <input
                  type="number"
                  placeholder="250000"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                />
              </div>
            </div>

            <div>
              <label className="swiss-eyebrow mb-1 block">Institution / Broker (Optional)</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, Zerodha, Groww"
                value={assetInstitution}
                onChange={(e) => setAssetInstitution(e.target.value)}
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E2DC]">
              <Button variant="outline" size="sm" onClick={() => setIsAddAssetOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingAsset}>
                Save Asset
              </Button>
            </div>
          </form>
        </Modal>

        {/* ADD LIABILITY MODAL */}
        <Modal
          isOpen={isAddLiabOpen}
          onClose={() => setIsAddLiabOpen(false)}
          title="Add New Liability"
          subtitle="Record credit card balances, personal/home loans, or EMIs."
        >
          <form onSubmit={handleCreateLiability} className="space-y-4">
            <div>
              <label className="swiss-eyebrow mb-1 block">Liability Name</label>
              <input
                type="text"
                placeholder="e.g. SBI Home Loan, HDFC Car Loan"
                value={liabName}
                onChange={(e) => setLiabName(e.target.value)}
                required
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="swiss-eyebrow mb-1 block">Liability Type</label>
                <select
                  value={liabType}
                  onChange={(e) => setLiabType(e.target.value)}
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                >
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="HOME_LOAN">Home / Mortgage Loan</option>
                  <option value="AUTO_LOAN">Vehicle / Auto Loan</option>
                  <option value="CREDIT_CARD">Credit Card Outstanding</option>
                  <option value="EDUCATION_LOAN">Education Loan</option>
                  <option value="OTHER_DEBT">Other Debt</option>
                </select>
              </div>

              <div>
                <label className="swiss-eyebrow mb-1 block">Principal Amount (₹)</label>
                <input
                  type="number"
                  placeholder="500000"
                  value={liabPrincipal}
                  onChange={(e) => setLiabPrincipal(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="swiss-eyebrow mb-1 block">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="10.5"
                  value={liabRate}
                  onChange={(e) => setLiabRate(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                />
              </div>

              <div>
                <label className="swiss-eyebrow mb-1 block">Tenure (Months)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={liabTenure}
                  onChange={(e) => setLiabTenure(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E2DC]">
              <Button variant="outline" size="sm" onClick={() => setIsAddLiabOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingLiab}>
                Save Liability
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
