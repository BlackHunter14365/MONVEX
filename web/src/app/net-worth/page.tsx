'use client';

import React, { useState } from 'react';
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
import { useNetWorthQuery } from '@/hooks/queries/useNetWorthQuery';

export default function NetWorthPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: netWorthData, isLoading, refetch: fetchNetWorth } = useNetWorthQuery();

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

  const assetsList = netWorthData?.assets_list || [];
  const liabilitiesList = netWorthData?.liabilities_list || [];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return Landmark;
      case 'REAL_ESTATE':
        return Building;
      case 'INVESTMENT':
      case 'STOCKS':
        return TrendingUp;
      case 'CRYPTO':
      case 'GOLD':
        return Coins;
      default:
        return Wallet;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="SOLVENCY ACCOUNTING"
          title="Personal Balance Sheet & Net Worth"
          description="Comprehensive solvency accounting: asset inventories, outstanding liabilities, leverage ratios, and wealth preservation."
          actionSlot={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsAddLiabOpen(true)}
                leftIcon={<Plus className="h-4 w-4 text-[#E76D7A]" />}
                className="rounded-2xl border-[#E7E6F0] hover:bg-[#FEF2F2] text-[#20212B]"
              >
                Add Liability
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAddAssetOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-[#6865E8] hover:bg-[#5b58db] text-white rounded-2xl shadow-xs"
              >
                Add Asset
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. TOP 3 NET WORTH SUMMARY CARDS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Consolidated Net Worth
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount
                amount={netWorth}
                currency={user?.currency}
                size="2xl"
                type={netWorth >= 0 ? 'income' : 'expense'}
              />
              <p className="text-xs text-[#77798A] font-medium mt-1">Total Assets minus Liabilities</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Gross Asset Value
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount
                amount={totalAssets}
                currency={user?.currency}
                size="2xl"
                type="income"
              />
              <p className="text-xs text-[#16745C] font-semibold mt-1">
                {assetsList.length} registered asset positions
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                Total Liabilities & Debt
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div>
              <FinancialAmount
                amount={totalLiabilities}
                currency={user?.currency}
                size="2xl"
                type="expense"
              />
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDEEF0] text-[#E76D7A]">
                  {debtToAsset.toFixed(1)}% Debt-to-Asset
                </span>
                <span className="text-xs text-[#77798A]">ratio</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TWO-COLUMN BALANCE SHEET LEDGER
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ASSETS COLUMN */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#20212B]">Asset Holdings</h3>
                  <p className="text-xs text-[#77798A]">Cash, investments, equity, and property</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#16745C]">
                {formatCurrency(totalAssets, user?.currency)}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : assetsList.length === 0 ? (
              <EmptyState
                title="No assets recorded"
                description="Register cash reserves, real estate, stocks, or retirement funds to build your solvency record."
                actionLabel="Add Asset"
                onAction={() => setIsAddAssetOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {assetsList.map((asset: any) => {
                  const Icon = getAssetIcon(asset.asset_type);
                  return (
                    <div
                      key={asset.id}
                      className="p-4 rounded-2xl bg-white border border-[#E7E6F0] hover:border-[#6865E8]/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-[#E8FBF4] text-[#16745C] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-[#20212B] block truncate">
                            {asset.name}
                          </span>
                          <span className="text-[11px] text-[#77798A] block">
                            {asset.institution || asset.asset_type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-mono font-bold text-[#16745C] block">
                            {formatCurrency(asset.value, user?.currency)}
                          </span>
                          <span className="text-[10px] font-mono text-[#77798A] uppercase">
                            {asset.asset_type}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] transition-colors"
                          aria-label={`Remove asset ${asset.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LIABILITIES COLUMN */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#20212B]">Outstanding Liabilities</h3>
                  <p className="text-xs text-[#77798A]">Loans, mortgages, and revolving obligations</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#E76D7A]">
                {formatCurrency(totalLiabilities, user?.currency)}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : liabilitiesList.length === 0 ? (
              <EmptyState
                title="Zero debt obligations recorded"
                description="No outstanding loans or mortgages found. Register liabilities to model payoff velocity."
                actionLabel="Add Liability"
                onAction={() => setIsAddLiabOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {liabilitiesList.map((liab: any) => (
                  <div
                    key={liab.id}
                    className="p-4 rounded-2xl bg-white border border-[#E7E6F0] hover:border-[#E76D7A]/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[#FDEEF0] text-[#E76D7A] flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[#20212B] block truncate">
                          {liab.name}
                        </span>
                        <span className="text-[11px] text-[#77798A] block">
                          {liab.interest_rate_pct}% APR · {liab.tenure_months || 24}mo tenure
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-[#E76D7A] block">
                          {formatCurrency(liab.remaining_balance || liab.principal_amount, user?.currency)}
                        </span>
                        <span className="text-[10px] font-mono text-[#77798A] uppercase">
                          {liab.liability_type}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteLiability(liab.id)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] transition-colors"
                        aria-label={`Remove liability ${liab.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Add Asset */}
        <Modal
          isOpen={isAddAssetOpen}
          onClose={() => setIsAddAssetOpen(false)}
          title="Register Asset Holding"
          description="Add a positive balance position to your solvency balance sheet."
        >
          <form onSubmit={handleCreateAsset} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Asset Title</label>
              <input
                type="text"
                required
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. HDFC Savings, Zerodha Equities, Primary Residence"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Asset Class</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                >
                  <option value="BANK">Bank Account / Cash</option>
                  <option value="INVESTMENT">Investment / Mutual Fund</option>
                  <option value="STOCKS">Equity / Stocks</option>
                  <option value="REAL_ESTATE">Real Estate / Property</option>
                  <option value="CRYPTO">Crypto Assets</option>
                  <option value="GOLD">Physical Gold / Sovereign Bonds</option>
                  <option value="OTHER">Other Tangible Asset</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">
                  Current Valuation ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Custodian / Institution (Optional)</label>
              <input
                type="text"
                value={assetInstitution}
                onChange={(e) => setAssetInstitution(e.target.value)}
                placeholder="e.g. HDFC Bank, Zerodha, Vanguard"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setIsAddAssetOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingAsset}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
                Save Asset
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Add Liability */}
        <Modal
          isOpen={isAddLiabOpen}
          onClose={() => setIsAddLiabOpen(false)}
          title="Register Debt Liability"
          description="Record an outstanding debt obligation to compute amortized interest and balance sheet ratios."
        >
          <form onSubmit={handleCreateLiability} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#20212B] block">Liability Name</label>
              <input
                type="text"
                required
                value={liabName}
                onChange={(e) => setLiabName(e.target.value)}
                placeholder="e.g. Home Mortgage, Auto Loan, Education Loan"
                className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Debt Category</label>
                <select
                  value={liabType}
                  onChange={(e) => setLiabType(e.target.value)}
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                >
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="HOME_LOAN">Home Mortgage</option>
                  <option value="AUTO_LOAN">Auto Loan</option>
                  <option value="STUDENT_LOAN">Education Loan</option>
                  <option value="CREDIT_CARD">Credit Card Debt</option>
                  <option value="OTHER">Other Obligation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">
                  Outstanding Balance ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liabPrincipal}
                  onChange={(e) => setLiabPrincipal(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Interest Rate (% APR)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={liabRate}
                  onChange={(e) => setLiabRate(e.target.value)}
                  placeholder="10.5"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#20212B] block">Remaining Tenure (Months)</label>
                <input
                  type="number"
                  required
                  value={liabTenure}
                  onChange={(e) => setLiabTenure(e.target.value)}
                  placeholder="24"
                  className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setIsAddLiabOpen(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingLiab}
                className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
              >
                Save Liability
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
