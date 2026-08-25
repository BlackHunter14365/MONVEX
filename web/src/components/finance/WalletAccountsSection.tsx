'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  Gauge,
  ArrowRightLeft,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { AnimatedValue } from '@/components/motion';

export interface AccountItem {
  id: string;
  name: string;
  bankName: string;
  type: 'SAVINGS' | 'CHECKING' | 'CREDIT' | 'WALLET' | 'CASH';
  accountNumber: string;
  fullCardNumber: string;
  balance: number;
  creditLimit?: number;
  availableCredit?: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  apy?: string;
  theme: 'obsidian' | 'emerald' | 'sapphire' | 'amber';
  isFrozen: boolean;
  network: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX';
}

interface WalletAccountsSectionProps {
  userCurrency?: string;
  realTransactions?: any[];
  onAddTransaction?: () => void;
}

export const WalletAccountsSection: React.FC<WalletAccountsSectionProps> = ({
  userCurrency = 'INR',
  realTransactions = [],
  onAddTransaction,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAllNumbers, setShowAllNumbers] = useState(false);
  const [individualRevealedMap, setIndividualRevealedMap] = useState<Record<string, boolean>>({});
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Impulse Buy Simulator State
  const [impulseItem, setImpulseItem] = useState('');
  const [impulseAmount, setImpulseAmount] = useState('');
  const [impulseVerdict, setImpulseVerdict] = useState<{
    item: string;
    cost: number;
    status: 'SAFE' | 'CAUTION' | 'DANGER';
    impactPct: number;
    monthsDelayed: number;
    message: string;
  } | null>(null);

  // Transfer Funds State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // New Account Form state
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'CHECKING' | 'SAVINGS' | 'CREDIT' | 'WALLET' | 'CASH'>('CHECKING');
  const [newLastFour, setNewLastFour] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newTheme, setNewTheme] = useState<'obsidian' | 'emerald' | 'sapphire' | 'amber'>('obsidian');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const fetchUserAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const assets = await api.getAssets();
      if (!Array.isArray(assets) || assets.length === 0) {
        setAccounts([]);
        setSelectedAccountId(null);
        setIsLoading(false);
        return;
      }

      const themes: Array<'obsidian' | 'emerald' | 'sapphire' | 'amber'> = ['obsidian', 'emerald', 'sapphire', 'amber'];

      const mapped: AccountItem[] = assets.map((ast: any, idx: number) => {
        let meta: any = {};
        if (ast.notes) {
          try {
            meta = JSON.parse(ast.notes);
          } catch {
            meta = {};
          }
        }

        const chosenTheme = meta.theme || themes[idx % themes.length];
        const val = parseFloat(ast.value) || 0;
        const last4 = meta.last4 || (ast.name ? String(ast.name.length * 111).slice(-4).padStart(4, '0') : '0000');
        const accType: AccountItem['type'] = meta.account_type || (ast.asset_type === 'CASH' ? 'WALLET' : (ast.asset_type === 'OTHER' ? 'CREDIT' : 'CHECKING'));
        const isCredit = accType === 'CREDIT';

        return {
          id: String(ast.id),
          name: ast.name || 'Account',
          bankName: ast.institution || 'Personal Account',
          type: accType,
          accountNumber: last4,
          fullCardNumber: `•••• •••• •••• ${last4}`,
          balance: val,
          creditLimit: isCredit ? (meta.credit_limit || val * 2) : undefined,
          availableCredit: isCredit ? (meta.available_credit || val) : undefined,
          monthlyInflow: 0,
          monthlyOutflow: 0,
          theme: chosenTheme,
          isFrozen: !!meta.is_frozen,
          network: idx % 2 === 0 ? 'VISA' : 'RUPAY',
        };
      });

      setAccounts(mapped);
      setSelectedAccountId((prev) => (prev && mapped.some((m) => m.id === prev) ? prev : mapped[0]?.id || null));
    } catch (err: any) {
      console.error('[MONVEX WALLET] Failed to load accounts:', err);
      setLoadError(err?.message || 'Unable to load accounts.');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserAccounts();
  }, [fetchUserAccounts]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  const totalPortfolioLiquidity = useMemo(() => {
    return accounts.reduce((sum, a) => (a.type === 'CREDIT' ? sum : sum + a.balance), 0);
  }, [accounts]);

  // Compute live metrics from real user data
  const velocityMetrics = useMemo(() => {
    if (accounts.length === 0) return null;

    const totalOutflow = realTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalInflow = realTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const dailyPace = Math.round(totalOutflow / 30);
    const monthlyBurn = totalOutflow > 0 ? totalOutflow : 1;
    const runwayDays = totalPortfolioLiquidity > 0 ? Math.round((totalPortfolioLiquidity / monthlyBurn) * 30) : 0;
    const savingsRatio = totalInflow > 0 ? Math.max(0, Math.round(((totalInflow - totalOutflow) / totalInflow) * 100)) : 0;

    return {
      dailyPace,
      runwayDays,
      savingsRatio,
      hasTransactionData: realTransactions.length > 0,
    };
  }, [accounts, realTransactions, totalPortfolioLiquidity]);

  // Toggle Global Show/Hide
  const handleToggleGlobalShow = () => {
    const nextState = !showAllNumbers;
    setShowAllNumbers(nextState);
    if (nextState) {
      toast.success('✓ Card numbers revealed.');
    } else {
      setIndividualRevealedMap({});
      toast.info('🔒 Card numbers securely masked.');
    }
  };

  // Toggle Per-Card Show/Hide
  const handleToggleIndividualCard = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    setIndividualRevealedMap((prev) => {
      const isCurrentlyShown = showAllNumbers || !!prev[cardId];
      const next = { ...prev, [cardId]: !isCurrentlyShown };
      toast.info(!isCurrentlyShown ? 'Card digits revealed' : 'Card digits masked');
      return next;
    });
  };

  // Copy Card Number
  const handleCopyCardNumber = (e: React.MouseEvent, acc: AccountItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(acc.fullCardNumber);
    setCopiedCardId(acc.id);
    toast.success(`✓ Copied: ${acc.fullCardNumber}`);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  // Freeze/Unfreeze Card
  const handleToggleFreeze = async (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;

    const newFreeze = !target.isFrozen;
    const meta = {
      last4: target.accountNumber,
      theme: target.theme,
      is_frozen: newFreeze,
      account_type: target.type,
    };

    try {
      await api.updateAsset(id, { notes: JSON.stringify(meta) });
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, isFrozen: newFreeze } : a)));
      toast.info(newFreeze ? `${target.name} is now Frozen.` : `${target.name} is Unlocked & Active.`);
    } catch {
      toast.error('Unable to update card status.');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;

    setIsDeletingId(id);
    try {
      await api.deleteAsset(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAccountId === id) {
        setSelectedAccountId(null);
      }
      toast.success(`✓ "${name}" removed from your ledger.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account.');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Transfer Funds Handler
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount) || 0;
    if (amt <= 0) {
      toast.error('Please enter a valid transfer amount.');
      return;
    }
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      toast.error('Source and destination accounts must be different.');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === transferFrom);
    const toAcc = accounts.find((a) => a.id === transferTo);

    if (!fromAcc || !toAcc) {
      toast.error('Invalid transfer accounts selected.');
      return;
    }

    if (fromAcc.balance < amt) {
      toast.error('Insufficient funds in source account.');
      return;
    }

    setIsTransferring(true);
    try {
      // 1. Deduct from Source Asset
      await api.updateAsset(fromAcc.id, { value: fromAcc.balance - amt });
      // 2. Add to Destination Asset
      await api.updateAsset(toAcc.id, { value: toAcc.balance + amt });

      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === fromAcc.id) return { ...a, balance: a.balance - amt };
          if (a.id === toAcc.id) return { ...a, balance: a.balance + amt };
          return a;
        })
      );

      setIsTransferModalOpen(false);
      setTransferAmount('');
      toast.success(`✓ Transferred ${formatCurrency(amt, userCurrency)} successfully!`);
    } catch (err: any) {
      toast.error(err?.message || 'Transfer failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  // Impulse Buy Test Calculator
  const handleRunImpulseTest = (customItem?: string, customCost?: number) => {
    const item = customItem || impulseItem || 'Planned Purchase';
    const cost = customCost !== undefined ? customCost : parseFloat(impulseAmount) || 0;

    if (cost <= 0) {
      toast.error('Please enter a purchase price.');
      return;
    }

    if (totalPortfolioLiquidity <= 0) {
      setImpulseVerdict({
        item,
        cost,
        status: 'DANGER',
        impactPct: 100,
        monthsDelayed: 1,
        message: 'No available liquid balance detected. Link an account to evaluate affordability.',
      });
      return;
    }

    const availableSurplus = Math.max(0, totalPortfolioLiquidity);
    const impactPct = Math.min(100, Math.round((cost / totalPortfolioLiquidity) * 100));
    const monthsDelayed = Math.max(0, Math.round(cost / (totalPortfolioLiquidity * 0.2 || 10000)));

    let status: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
    let message = '';

    if (cost < availableSurplus * 0.1) {
      status = 'SAFE';
      message = `Affordable. Represents ${impactPct}% of your liquid wealth with zero stress on capital.`;
    } else if (cost < availableSurplus * 0.35) {
      status = 'CAUTION';
      message = `Moderate impact (${impactPct}% of total liquid capital). Consider spacing over upcoming cashflow cycles.`;
    } else {
      status = 'DANGER';
      message = `High cashflow risk. This represents ${impactPct}% of your total liquid balance.`;
    }

    setImpulseVerdict({ item, cost, status, impactPct, monthsDelayed, message });
    toast.info(`Simulated affordability for "${item}"`);
  };

  // Add Account Submission
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountName.trim() || !newBalance) {
      toast.error('Please fill in Bank Name, Account Name, and Balance.');
      return;
    }

    const val = parseFloat(newBalance) || 0;
    const last4 = newLastFour.trim() ? newLastFour.trim().slice(-4) : String(Math.floor(1000 + Math.random() * 9000));

    setIsSubmittingNew(true);
    try {
      const assetType = newAccountType === 'CREDIT' ? 'OTHER' : newAccountType === 'WALLET' || newAccountType === 'CASH' ? 'CASH' : 'BANK';
      const meta = {
        last4,
        theme: newTheme,
        is_frozen: false,
        account_type: newAccountType,
      };

      const assetRes = await api.createAsset({
        name: newAccountName.trim(),
        asset_type: assetType,
        value: val,
        institution: newBankName.trim(),
        notes: JSON.stringify(meta),
      });

      const newAcc: AccountItem = {
        id: String(assetRes.id),
        name: newAccountName.trim(),
        bankName: newBankName.trim(),
        type: newAccountType,
        accountNumber: last4,
        fullCardNumber: `•••• •••• •••• ${last4}`,
        balance: val,
        creditLimit: newAccountType === 'CREDIT' ? val * 2 : undefined,
        availableCredit: newAccountType === 'CREDIT' ? val : undefined,
        monthlyInflow: 0,
        monthlyOutflow: 0,
        theme: newTheme,
        isFrozen: false,
        network: 'VISA',
      };

      setAccounts((prev) => [...prev, newAcc]);
      setSelectedAccountId(newAcc.id);
      setIsAddModalOpen(false);
      toast.success(`✓ "${newAcc.name}" linked and saved to ledger!`);

      setNewBankName('');
      setNewAccountName('');
      setNewLastFour('');
      setNewBalance('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add account.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const getCardThemeClasses = (theme: string, isSelected: boolean) => {
    let bg = '';
    const ringClass = isSelected ? 'ring-2 ring-[#172033] scale-[1.02] shadow-xl' : 'opacity-95 hover:opacity-100 hover:scale-[1.01]';

    switch (theme) {
      case 'emerald':
        bg = 'bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#022C22]';
        break;
      case 'sapphire':
        bg = 'bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#172554]';
        break;
      case 'amber':
        bg = 'bg-gradient-to-br from-[#78350F] via-[#92400E] to-[#451A03]';
        break;
      case 'obsidian':
      default:
        bg = 'bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16]';
        break;
    }

    return cn(bg, ringClass, 'text-white transition-all duration-200');
  };

  return (
    <div className="dash-reveal editorial-card p-6 sm:p-8 space-y-6 rounded-2xl">
      {/* 1. Header with Aggregate Liquidity & Global Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E2DC]/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#172033] text-white shadow-md">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#172033] tracking-tight">
              Wallets, Bank Accounts & Cards Hub
            </h2>
            <span className="brutalist-tag-emerald text-xs py-0.5 px-2.5">
              {accounts.length} {accounts.length === 1 ? 'Active Account' : 'Active Accounts'}
            </span>
          </div>
          <p className="text-xs text-[#5F6878] font-medium">
            Multi-institution liquidity, instant fund transfer bridge, and AI impulse affordability simulator.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {accounts.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTransferFrom(accounts[0]?.id || '');
                setTransferTo(accounts[1]?.id || '');
                setIsTransferModalOpen(true);
              }}
              leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
              className="text-xs font-bold"
            >
              Transfer Funds
            </Button>
          )}

          {accounts.length > 0 && (
            <button
              onClick={handleToggleGlobalShow}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold shadow-xs transition-all',
                showAllNumbers
                  ? 'bg-[#172033] text-white border-[#172033]'
                  : 'bg-white border-[#E4E2DC] text-[#5F6878] hover:text-[#172033]'
              )}
              title={showAllNumbers ? 'Hide all card numbers' : 'Show all card numbers'}
            >
              {showAllNumbers ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showAllNumbers ? 'Hide digits' : 'Show digits'}</span>
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-bold shadow-md"
          >
            Link Account
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" />
          <span className="text-xs font-bold text-[#5F6878]">Loading verified financial accounts...</span>
        </div>
      ) : loadError ? (
        <div className="p-6 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-[#E11D48] mx-auto" />
          <div className="text-xs font-bold text-[#E11D48]">{loadError}</div>
          <Button variant="outline" size="sm" onClick={fetchUserAccounts} className="text-xs font-bold">
            Retry Loading
          </Button>
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-[#E4E2DC] bg-[#FAFAF7] text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-center text-[#172033] shadow-xs">
            <Wallet className="h-6 w-6 text-[#172033]" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-black text-[#172033]">No accounts linked yet</h3>
            <p className="text-xs text-[#5F6878] leading-relaxed">
              Connect your first bank account, wallet, or card to start tracking your capital and unlock AI velocity insights.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-bold shadow-sm"
          >
            Link Your First Account
          </Button>
        </div>
      ) : (
        /* 2. MAIN 2-COLUMN COMMAND HUB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =========================================================================
              LEFT COLUMN (7 COLS): 3D Cards Grid & Selected Account Inspector
              ========================================================================= */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="swiss-eyebrow block">Select Account / Card to Inspect:</span>
                <span className="text-[10.5px] text-[#858D9A] font-semibold">
                  {showAllNumbers ? '🔓 Numbers Revealed' : '🔒 Protected Mode (Click 👁️ to reveal)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {accounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  const isCredit = acc.type === 'CREDIT';
                  const isRevealed = showAllNumbers || !!individualRevealedMap[acc.id];
                  const isCopied = copiedCardId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={cn(
                        'cursor-pointer relative w-full rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between h-44 select-none group',
                        getCardThemeClasses(acc.theme, isSelected)
                      )}
                    >
                      {/* Specular Reflection */}
                      <div className="absolute top-0 right-0 left-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-2xl pointer-events-none" />

                      {/* Top Row */}
                      <div className="flex items-start justify-between relative z-10">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase block truncate">
                            {acc.bankName}
                          </span>
                          <span className="text-xs font-black text-white block tracking-tight truncate mt-0.5">
                            {acc.name}
                          </span>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleIndividualCard(e, acc.id)}
                            className="p-1 rounded-md bg-white/10 hover:bg-white/25 text-white transition-all shadow-xs"
                            title={isRevealed ? 'Mask card digits' : 'Reveal card digits'}
                          >
                            {isRevealed ? <EyeOff className="h-3 w-3 text-amber-300" /> : <Eye className="h-3 w-3 text-white/80" />}
                          </button>

                          <div className="h-5 w-7 rounded bg-amber-400/90 border border-amber-300 shadow-xs flex items-center justify-center shrink-0">
                            <div className="w-3.5 h-2.5 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Card Number */}
                      <div className="relative z-10 font-mono tracking-widest text-xs sm:text-sm text-white font-bold flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-white tracking-widest text-xs sm:text-[13px] font-mono">
                            {isRevealed ? `•••• •••• •••• ${acc.accountNumber}` : `•••• •••• •••• ${acc.accountNumber}`}
                          </span>

                          {acc.isFrozen && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-[8px] font-bold text-rose-300 flex items-center gap-0.5">
                              <Lock className="h-2 w-2" /> Frozen
                            </span>
                          )}
                        </div>

                        {/* Click to Copy */}
                        {isRevealed && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCardNumber(e, acc)}
                            className="p-1 rounded bg-white/15 hover:bg-white/30 text-white transition-all ml-1 shrink-0"
                            title="Copy Card Digits"
                          >
                            {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        )}
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-end justify-between relative z-10 border-t border-white/10 pt-2">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-white/60 block">
                            {isCredit ? 'Current Bill' : 'Balance'}
                          </span>
                          <span className="text-sm sm:text-base font-black tracking-tight text-white tabular-nums">
                            {formatCurrency(acc.balance, userCurrency)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-black tracking-widest text-white/90 font-mono">
                            {acc.network}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deep-Dive Account Inspector */}
            {selectedAccount && (
              <div className="p-5 rounded-2xl bg-white/95 border border-[#E4E2DC] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E2DC]/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl text-white font-black shadow-md shrink-0',
                        selectedAccount.theme === 'emerald'
                          ? 'bg-[#059669]'
                          : selectedAccount.theme === 'sapphire'
                          ? 'bg-[#2563EB]'
                          : selectedAccount.theme === 'amber'
                          ? 'bg-[#D97706]'
                          : 'bg-[#172033]'
                      )}
                    >
                      {selectedAccount.type === 'CREDIT' ? (
                        <CreditCard className="h-4 w-4" />
                      ) : selectedAccount.type === 'WALLET' || selectedAccount.type === 'CASH' ? (
                        <Wallet className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-[#172033]">
                          {selectedAccount.name}
                        </h3>
                        <Badge variant={selectedAccount.isFrozen ? 'danger' : 'success'} size="sm">
                          {selectedAccount.isFrozen ? 'Frozen' : 'Active'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-[#5F6878] font-mono block">
                        {selectedAccount.bankName} • Account: •••• {selectedAccount.accountNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFreeze(selectedAccount.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border shadow-xs',
                        selectedAccount.isFrozen
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-white border-[#E4E2DC] text-[#5F6878] hover:text-[#172033]'
                      )}
                    >
                      {selectedAccount.isFrozen ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      <span>{selectedAccount.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDeletingId === selectedAccount.id}
                      onClick={() => handleDeleteAccount(selectedAccount.id, selectedAccount.name)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                      title="Remove Account"
                    >
                      {isDeletingId === selectedAccount.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-0.5">
                    <span className="swiss-eyebrow block text-[9px]">Verified Balance</span>
                    <span className="text-sm font-black text-[#172033] tabular-nums block truncate">
                      {formatCurrency(selectedAccount.balance, userCurrency)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-0.5">
                    <span className="swiss-eyebrow block text-[9px]">Account Type</span>
                    <span className="text-xs font-black text-[#172033] block truncate">
                      {selectedAccount.type}
                    </span>
                  </div>
                </div>

                {/* Account Transaction Stream */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="swiss-eyebrow block text-[9px]">Recent Ledger Activity:</span>
                    <span className="text-[10px] font-bold text-[#2563EB]">Live Synced</span>
                  </div>

                  {realTransactions.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
                      No transactions recorded yet in your financial ledger.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E4E2DC]/80 rounded-xl border border-[#E4E2DC] bg-white overflow-hidden">
                      {realTransactions.slice(0, 3).map((tx: any, idx: number) => {
                        const isInc = tx.type === 'INCOME';
                        const amountNum = parseFloat(tx.amount) || 0;

                        return (
                          <div key={tx.id || idx} className="p-2.5 flex items-center justify-between hover:bg-[#FAFAF7] transition-colors">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div
                                className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded text-[10px] font-black shrink-0',
                                  isInc ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'
                                )}
                              >
                                {isInc ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-[#172033] block truncate">
                                  {tx.merchant_name || tx.description || 'Transaction'}
                                </span>
                                <span className="text-[9px] text-[#858D9A] block truncate">
                                  {tx.date || 'Today'} • {tx.category_name || tx.category || 'General'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={cn(
                                'text-xs font-black tabular-nums shrink-0',
                                isInc ? 'text-[#059669]' : 'text-[#172033]'
                              )}
                            >
                              {isInc ? '+' : '-'}{formatCurrency(amountNum, userCurrency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              RIGHT COLUMN (5 COLS): Interactive Cash Velocity & AI Impulse Buy Lab
              ========================================================================= */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Real-Time Cash Velocity & Runway Gauge */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#172033] to-[#0F172A] text-white shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">Live Capital Velocity</span>
                </div>
                <span className="brutalist-tag-emerald text-[9px] py-0 px-2">
                  {velocityMetrics ? 'Dynamic Telemetry' : 'Awaiting Data'}
                </span>
              </div>

              {velocityMetrics ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">
                        {velocityMetrics.hasTransactionData
                          ? `Daily Pace: ${formatCurrency(velocityMetrics.dailyPace, userCurrency)} / Day`
                          : 'Daily Pace: Baseline (No Outflows)'}
                      </span>
                      <span className="text-emerald-400 font-mono">
                        {velocityMetrics.hasTransactionData
                          ? `${velocityMetrics.savingsRatio}% Net Savings Rate`
                          : '100% Capital Preserved'}
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 flex gap-1">
                      <div className="h-full w-1/3 rounded-full bg-emerald-500 shadow-sm" />
                      <div className="h-full w-1/3 rounded-full bg-emerald-400 shadow-sm" />
                      <div className="h-full w-1/3 rounded-full bg-blue-500 animate-pulse shadow-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Emergency Runway</span>
                      <span className="text-base font-black text-white block">
                        {velocityMetrics.runwayDays > 0 ? `${velocityMetrics.runwayDays} Days` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Total Liquidity</span>
                      <span className="text-base font-black text-emerald-400 block truncate">
                        <AnimatedValue value={totalPortfolioLiquidity} currency={userCurrency} />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Capital velocity unavailable. Add accounts and transactions to generate financial telemetry.
                </div>
              )}
            </div>

            {/* 2. AI Impulse Purchase & Affordability Simulator */}
            <div className="p-5 rounded-2xl bg-white/95 border border-[#E4E2DC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E2DC]/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2563EB]" />
                  <h3 className="text-xs font-black text-[#172033] tracking-tight">AI Impulse Buy Simulator</h3>
                </div>
                <span className="text-[10px] font-bold text-[#858D9A]">Test Before You Buy</span>
              </div>

              {accounts.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#5F6878]">
                  Add an account to enable personalized affordability analysis.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#172033] block">What do you want to buy?</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={impulseItem}
                        onChange={(e) => setImpulseItem(e.target.value)}
                        placeholder="e.g. Sony WH-1000XM5"
                        className="flex-1 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                      />
                      <input
                        type="number"
                        value={impulseAmount}
                        onChange={(e) => setImpulseAmount(e.target.value)}
                        placeholder="Price"
                        className="w-24 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleRunImpulseTest()}
                        className="bg-[#172033] text-white px-3 font-bold text-xs"
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#858D9A]">Quick:</span>
                    {[
                      { label: 'AirPods (2,500)', item: 'AirPods Pro', cost: 2500 },
                      { label: 'Laptop (65,000)', item: 'Work Laptop', cost: 65000 },
                      { label: 'Weekend Trip (15,000)', item: 'Weekend Trip', cost: 15000 },
                    ].map((pre) => (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => {
                          setImpulseItem(pre.item);
                          setImpulseAmount(String(pre.cost));
                          handleRunImpulseTest(pre.item, pre.cost);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#F6F5F1] hover:bg-[#EAE8E0] text-[10px] font-bold text-[#172033] transition-colors border border-[#E4E2DC]"
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>

                  {/* Simulation Result Card */}
                  {impulseVerdict && (
                    <div
                      className={cn(
                        'p-3.5 rounded-xl border space-y-1.5 animate-in fade-in zoom-in-95',
                        impulseVerdict.status === 'SAFE'
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : impulseVerdict.status === 'CAUTION'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-rose-50/80 border-rose-200 text-rose-900'
                      )}
                    >
                      <div className="flex items-center justify-between font-black text-xs">
                        <span>
                          Verdict:{' '}
                          {impulseVerdict.status === 'SAFE'
                            ? '🟢 Safe to Purchase'
                            : impulseVerdict.status === 'CAUTION'
                            ? '🟡 Proceed with Caution'
                            : '🔴 High Cashflow Risk'}
                        </span>
                        <span className="font-mono">{formatCurrency(impulseVerdict.cost, userCurrency)}</span>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed">
                        {impulseVerdict.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Link New Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Link New Bank Account or Card"
        subtitle="Add any checking, savings, credit card, or digital wallet."
        maxWidth="md"
      >
        <form onSubmit={handleAddAccountSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#172033] mb-1 block">Account / Card Label</label>
            <input
              type="text"
              required
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="e.g. Salary Checking or Primary Credit"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Institution / Bank</label>
              <input
                type="text"
                required
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="e.g. Chase Bank, HDFC, PayPal"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Account Type</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as any)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              >
                <option value="CHECKING">Checking / Salary</option>
                <option value="SAVINGS">Savings / High-Yield</option>
                <option value="CREDIT">Credit Card</option>
                <option value="WALLET">Digital Wallet / UPI</option>
                <option value="CASH">Physical Cash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Current Balance ({userCurrency})</label>
              <input
                type="number"
                step="any"
                required
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Last 4 Digits (Optional)</label>
              <input
                type="text"
                maxLength={4}
                value={newLastFour}
                onChange={(e) => setNewLastFour(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 8821"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033] mb-1 block">Card Visual Theme</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'obsidian', label: 'Obsidian', color: 'bg-slate-900' },
                { id: 'sapphire', label: 'Sapphire', color: 'bg-blue-600' },
                { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
                { id: 'amber', label: 'Amber', color: 'bg-amber-600' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setNewTheme(th.id as any)}
                  className={cn(
                    'p-2 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                    newTheme === th.id
                      ? 'border-[#172033] bg-[#172033] text-white shadow-sm'
                      : 'border-[#E4E2DC] bg-white text-[#5F6878]'
                  )}
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full', th.color)} />
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingNew} className="bg-[#172033] text-white font-bold">
              Link Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Instant Transfer Funds Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Instant Intra-Account Fund Transfer"
        subtitle="Transfer capital between your verified bank accounts and cards."
        maxWidth="md"
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">From Account</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance, userCurrency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">To Account</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#172033] focus:outline-none focus:border-[#172033]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance, userCurrency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033] mb-1 block">Transfer Amount ({userCurrency})</label>
            <input
              type="number"
              step="any"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2.5 text-sm font-black text-[#172033] focus:outline-none focus:border-[#172033] shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isTransferring}
              className="bg-[#172033] text-white font-bold px-5"
            >
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

