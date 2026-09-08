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
  RotateCw,
} from 'lucide-react';
import {
  BankingCardView,
  detectCardNetwork,
  formatCardNumber,
  formatExpiryDate,
  CardTheme,
  CardNetwork,
} from './BankingCardView';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { AnimatedValue } from '@/components/motion';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/queryKeys';

export interface AccountItem {
  id: string;
  name: string;
  bankName: string;
  type: 'SAVINGS' | 'CHECKING' | 'CREDIT' | 'WALLET' | 'CASH';
  accountNumber: string;
  fullCardNumber: string;
  rawCardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
  balance: number;
  creditLimit?: number;
  availableCredit?: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  apy?: string;
  theme: CardTheme;
  isFrozen: boolean;
  network: CardNetwork;
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
  const queryClient = useQueryClient();

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAllNumbers, setShowAllNumbers] = useState(false);
  const [individualRevealedMap, setIndividualRevealedMap] = useState<Record<string, boolean>>({});
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [inspectorShowCvv, setInspectorShowCvv] = useState(false);
  const [inspectorShowCardNumber, setInspectorShowCardNumber] = useState(false);

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

  // New Account / Banking Card Form state
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'CHECKING' | 'SAVINGS' | 'CREDIT' | 'WALLET' | 'CASH'>('CHECKING');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardholderName, setNewCardholderName] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newCvv, setNewCvv] = useState('');
  const [showModalCvv, setShowModalCvv] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [newTheme, setNewTheme] = useState<CardTheme>('obsidian');
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

      const themes: CardTheme[] = ['obsidian', 'sapphire', 'emerald', 'amber', 'gold', 'platinum'];

      const mapped: AccountItem[] = assets.map((ast: any, idx: number) => {
        let meta: any = {};
        if (ast.notes) {
          try {
            meta = JSON.parse(ast.notes);
          } catch {
            meta = {};
          }
        }

        const chosenTheme: CardTheme = meta.theme || themes[idx % themes.length];
        const val = parseFloat(ast.value) || 0;
        const rawNum: string = (meta.raw_card_number || meta.full_card_number || '').replace(/\D/g, '');
        const last4 = meta.last4 || (rawNum ? rawNum.slice(-4) : (ast.name ? String(ast.name.length * 111).slice(-4).padStart(4, '0') : '8821'));
        const fullCardNumber = rawNum ? formatCardNumber(rawNum) : `•••• •••• •••• ${last4}`;
        const cardholderName = meta.cardholder_name || (user?.username ? user.username.toUpperCase() : 'MONVEX HOLDER');
        const expiryDate = meta.expiry_date || '12/28';
        const cvv = meta.cvv || '882';
        const detectedNet: CardNetwork = meta.network || (rawNum ? detectCardNetwork(rawNum) : (idx % 2 === 0 ? 'VISA' : 'MASTERCARD'));
        const accType: AccountItem['type'] = meta.account_type || (ast.asset_type === 'CASH' ? 'WALLET' : (ast.asset_type === 'OTHER' ? 'CREDIT' : 'CHECKING'));
        const isCredit = accType === 'CREDIT';

        return {
          id: String(ast.id),
          name: ast.name || 'Account',
          bankName: ast.institution || 'Personal Account',
          type: accType,
          accountNumber: last4,
          fullCardNumber,
          rawCardNumber: rawNum || undefined,
          cardholderName,
          expiryDate,
          cvv,
          balance: val,
          creditLimit: isCredit ? (meta.credit_limit || val * 2) : undefined,
          availableCredit: isCredit ? (meta.available_credit || val) : undefined,
          monthlyInflow: 0,
          monthlyOutflow: 0,
          theme: chosenTheme,
          isFrozen: !!meta.is_frozen,
          network: detectedNet,
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
      raw_card_number: target.rawCardNumber,
      full_card_number: target.fullCardNumber,
      cardholder_name: target.cardholderName,
      expiry_date: target.expiryDate,
      cvv: target.cvv,
      network: target.network,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
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
    if (!fromAcc || !toAcc) return;

    if (fromAcc.balance < amt && fromAcc.type !== 'CREDIT') {
      toast.error(`Insufficient balance in ${fromAcc.name}. Available: ${formatCurrency(fromAcc.balance, userCurrency)}`);
      return;
    }

    setIsTransferring(true);
    try {
      // 1. Deduct from source
      const newFromBal = fromAcc.balance - amt;
      await api.updateAsset(fromAcc.id, {
        value: newFromBal,
      });

      // 2. Add to destination
      const newToBal = toAcc.balance + amt;
      await api.updateAsset(toAcc.id, {
        value: newToBal,
      });

      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === fromAcc.id) return { ...a, balance: newFromBal };
          if (a.id === toAcc.id) return { ...a, balance: newToBal };
          return a;
        })
      );

      setIsTransferModalOpen(false);
      setTransferAmount('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
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

  // Add Account / Banking Card Submission
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountName.trim() || !newBalance) {
      toast.error('Please fill in Bank Name, Account Name, and Balance.');
      return;
    }

    const val = parseFloat(newBalance) || 0;
    const cleanDigits = newCardNumber.replace(/\D/g, '');
    const last4 = cleanDigits.length >= 4 
      ? cleanDigits.slice(-4) 
      : String(Math.floor(1000 + Math.random() * 9000));
    const fullNum = cleanDigits.length > 0 ? formatCardNumber(cleanDigits) : `•••• •••• •••• ${last4}`;
    const cardholder = newCardholderName.trim() || (user?.username ? user.username.toUpperCase() : 'MONVEX HOLDER');
    const expiry = newExpiryDate.trim() || '12/28';
    const cvv = newCvv.trim() || '882';
    const detectedNet: CardNetwork = cleanDigits.length > 0 ? detectCardNetwork(cleanDigits) : 'VISA';

    setIsSubmittingNew(true);
    try {
      const assetType = newAccountType === 'CREDIT' ? 'OTHER' : (newAccountType === 'WALLET' || newAccountType === 'CASH') ? 'CASH' : 'BANK';
      const meta = {
        last4,
        raw_card_number: cleanDigits,
        full_card_number: fullNum,
        cardholder_name: cardholder,
        expiry_date: expiry,
        cvv,
        network: detectedNet,
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
        fullCardNumber: fullNum,
        rawCardNumber: cleanDigits || undefined,
        cardholderName: cardholder,
        expiryDate: expiry,
        cvv,
        balance: val,
        creditLimit: newAccountType === 'CREDIT' ? val * 2 : undefined,
        availableCredit: newAccountType === 'CREDIT' ? val : undefined,
        monthlyInflow: 0,
        monthlyOutflow: 0,
        theme: newTheme,
        isFrozen: false,
        network: detectedNet,
      };

      setAccounts((prev) => [...prev, newAcc]);
      setSelectedAccountId(newAcc.id);
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      toast.success(`✓ Card "${newAcc.name}" linked and saved to ledger!`);

      setNewBankName('');
      setNewAccountName('');
      setNewCardNumber('');
      setNewCardholderName('');
      setNewExpiryDate('');
      setNewCvv('');
      setNewBalance('');
      setPreviewFlipped(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add banking card.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="dash-reveal editorial-card p-6 sm:p-8 space-y-6 rounded-2xl">
      {/* 1. Header with Aggregate Liquidity & Global Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E2DC]/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2A1F3D] text-white shadow-md">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#191522] tracking-tight">
              Wallets, Bank Accounts & Cards Hub
            </h2>
            <span className="brutalist-tag-emerald text-xs py-0.5 px-2.5">
              {accounts.length} {accounts.length === 1 ? 'Active Account' : 'Active Accounts'}
            </span>
          </div>
          <p className="text-xs text-[#625D69] font-medium">
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
                  ? 'bg-[#2A1F3D] text-white border-[#2A1F3D]'
                  : 'bg-white border-[#E4E2DC] text-[#625D69] hover:text-[#191522]'
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
            className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-md"
          >
            Link Account
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" />
          <span className="text-xs font-bold text-[#625D69]">Loading verified financial accounts...</span>
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
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-center text-[#191522] shadow-xs">
            <Wallet className="h-6 w-6 text-[#191522]" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-black text-[#191522]">No accounts linked yet</h3>
            <p className="text-xs text-[#625D69] leading-relaxed">
              Connect your first bank account, wallet, or card to start tracking your capital and unlock AI velocity insights.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-sm"
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
                <span className="text-[10.5px] text-[#898390] font-semibold">
                  Click card to inspect • Click Flip for CVV & magnetic stripe
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;

                  return (
                    <BankingCardView
                      key={acc.id}
                      bankName={acc.bankName}
                      accountName={acc.name}
                      cardholderName={acc.cardholderName}
                      cardNumber={acc.fullCardNumber}
                      rawCardNumber={acc.rawCardNumber}
                      expiryDate={acc.expiryDate}
                      cvv={acc.cvv}
                      balance={acc.balance}
                      currency={userCurrency}
                      theme={acc.theme}
                      network={acc.network}
                      isFrozen={acc.isFrozen}
                      isCredit={acc.type === 'CREDIT'}
                      isSelected={isSelected}
                      showNumber={showAllNumbers || !!individualRevealedMap[acc.id]}
                      onSelect={() => setSelectedAccountId(acc.id)}
                    />
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
                          : 'bg-[#2A1F3D]'
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
                        <h3 className="text-xs font-black text-[#191522]">
                          {selectedAccount.name}
                        </h3>
                        <Badge variant={selectedAccount.isFrozen ? 'danger' : 'success'} size="sm">
                          {selectedAccount.isFrozen ? 'Frozen' : 'Active'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-[#625D69] font-mono block">
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
                          : 'bg-white border-[#E4E2DC] text-[#625D69] hover:text-[#191522]'
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
                    <span className="text-sm font-black text-[#191522] tabular-nums block truncate">
                      {formatCurrency(selectedAccount.balance, userCurrency)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-0.5">
                    <span className="swiss-eyebrow block text-[9px]">Account Type</span>
                    <span className="text-xs font-black text-[#191522] block truncate">
                      {selectedAccount.type}
                    </span>
                  </div>
                </div>

                {/* Banking Card Credentials & Security Panel */}
                <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="swiss-eyebrow block text-[9px]">Banking Card Credentials</span>
                    <span className="text-[10px] font-mono font-bold text-[#191522] bg-white px-2 py-0.5 rounded border border-[#E4E2DC]">
                      {selectedAccount.network}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-[#E4E2DC]">
                      <span className="text-[9px] font-mono uppercase text-[#898390] block">Cardholder</span>
                      <span className="font-bold text-[#191522] truncate block mt-0.5 uppercase">
                        {selectedAccount.cardholderName || 'CARDHOLDER'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-[#E4E2DC]">
                      <span className="text-[9px] font-mono uppercase text-[#898390] block">Expiry (Valid Thru)</span>
                      <span className="font-mono font-bold text-[#191522] block mt-0.5">
                        {selectedAccount.expiryDate || '12/28'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-[#E4E2DC] flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-[#898390] block">Security Code (CVV)</span>
                        <span className="font-mono font-bold text-[#191522] block mt-0.5">
                          {inspectorShowCvv ? (selectedAccount.cvv || '882') : '•••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectorShowCvv(!inspectorShowCvv)}
                        className="p-1.5 rounded-md hover:bg-[#F6F5F1] text-[#625D69] hover:text-[#191522] transition-colors"
                        title={inspectorShowCvv ? 'Mask CVV' : 'Reveal CVV'}
                      >
                        {inspectorShowCvv ? <EyeOff className="h-3.5 w-3.5 text-amber-600" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white px-3 py-2 rounded-lg border border-[#E4E2DC] flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[9px] uppercase text-[#898390] shrink-0">Card No:</span>
                      <span className="font-bold text-[#191522] tracking-wider truncate">
                        {inspectorShowCardNumber ? selectedAccount.fullCardNumber : `•••• •••• •••• ${selectedAccount.accountNumber}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setInspectorShowCardNumber(!inspectorShowCardNumber)}
                        className="p-1 rounded hover:bg-[#F6F5F1] text-[#625D69] hover:text-[#191522] transition-colors"
                        title={inspectorShowCardNumber ? 'Mask Card Number' : 'Reveal Card Number'}
                      >
                        {inspectorShowCardNumber ? <EyeOff className="h-3 w-3 text-amber-600" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCardNumber(e, selectedAccount)}
                        className="p-1 rounded hover:bg-[#F6F5F1] text-[#625D69] hover:text-[#191522] transition-colors"
                        title="Copy Card Number"
                      >
                        {copiedCardId === selectedAccount.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Transaction Stream */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="swiss-eyebrow block text-[9px]">Recent Ledger Activity:</span>
                    <span className="text-[10px] font-bold text-[#2563EB]">Live Synced</span>
                  </div>

                  {realTransactions.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#625D69]">
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
                                <span className="text-xs font-bold text-[#191522] block truncate">
                                  {tx.merchant_name || tx.description || 'Transaction'}
                                </span>
                                <span className="text-[9px] text-[#898390] block truncate">
                                  {tx.date || 'Today'} • {tx.category_name || tx.category || 'General'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={cn(
                                'text-xs font-black tabular-nums shrink-0',
                                isInc ? 'text-[#059669]' : 'text-[#E11D48]'
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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2A1F3D] to-[#21182F] text-white shadow-xl space-y-4 relative overflow-hidden">
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
                  <h3 className="text-xs font-black text-[#191522] tracking-tight">AI Impulse Buy Simulator</h3>
                </div>
                <span className="text-[10px] font-bold text-[#898390]">Test Before You Buy</span>
              </div>

              {accounts.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#625D69]">
                  Add an account to enable personalized affordability analysis.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#191522] block">What do you want to buy?</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={impulseItem}
                        onChange={(e) => setImpulseItem(e.target.value)}
                        placeholder="e.g. Sony WH-1000XM5"
                        className="flex-1 min-w-0 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={impulseAmount}
                          onChange={(e) => setImpulseAmount(e.target.value)}
                          placeholder="Price"
                          className="w-24 sm:w-28 min-w-0 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleRunImpulseTest()}
                          className="bg-[#4056A1] hover:bg-[#26335F] text-white px-3 font-bold text-xs shrink-0 whitespace-nowrap"
                        >
                          Check Affordability
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#898390]">Quick:</span>
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
                        className="px-2 py-1 rounded-lg bg-[#F6F5F1] hover:bg-[#EAE8E0] text-[10px] font-bold text-[#191522] transition-colors border border-[#E4E2DC]"
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

      {/* 3. Link New Banking Card / Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Link New Bank Account or Card"
        subtitle="Full banking card system with 16-digit embossing, EMV chip, and CVV security protection."
        maxWidth="lg"
      >
        <form onSubmit={handleAddAccountSubmit} className="space-y-4">
          {/* Live Interactive 3D Card Preview */}
          <div className="space-y-1.5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#625D69] font-bold">
                Live Interactive Card Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4056A1] hover:text-[#26335F] bg-[#4056A1]/10 px-2.5 py-1 rounded-lg transition-colors"
              >
                <RotateCw className="h-3 w-3" />
                <span>{previewFlipped ? 'Show Front' : 'Flip to Back (CVV)'}</span>
              </button>
            </div>

            <div className="max-w-md mx-auto pt-1">
              <BankingCardView
                bankName={newBankName || 'BANK INSTITUTION'}
                accountName={newAccountName || 'Primary Account'}
                cardholderName={newCardholderName || (user?.username ? user.username.toUpperCase() : 'CARDHOLDER')}
                cardNumber={newCardNumber || '•••• •••• •••• 8821'}
                rawCardNumber={newCardNumber.replace(/\D/g, '')}
                expiryDate={newExpiryDate || '12/28'}
                cvv={newCvv || '882'}
                balance={parseFloat(newBalance) || 0}
                currency={userCurrency}
                theme={newTheme}
                network={newCardNumber.replace(/\D/g, '').length > 0 ? detectCardNetwork(newCardNumber) : 'VISA'}
                isCredit={newAccountType === 'CREDIT'}
                isFlipped={previewFlipped}
                onFlipChange={setPreviewFlipped}
                showControls={true}
              />
            </div>
          </div>

          {/* Cardholder Name & Full Card Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">
                Cardholder Name
              </label>
              <input
                type="text"
                value={newCardholderName}
                onChange={(e) => setNewCardholderName(e.target.value.toUpperCase())}
                placeholder="e.g. ALEX M. VANCE"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">
                16-Digit Card Number
              </label>
              <input
                type="text"
                maxLength={19}
                value={newCardNumber}
                onChange={(e) => setNewCardNumber(formatCardNumber(e.target.value))}
                placeholder="4532 8921 4455 8821"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Expiry Date, CVV, and Current Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">
                Expiry Date (MM/YY)
              </label>
              <input
                type="text"
                maxLength={5}
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="12/28"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-mono font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#191522] block">
                  CVV / Security Code
                </label>
                <button
                  type="button"
                  onClick={() => setShowModalCvv(!showModalCvv)}
                  className="text-[10px] font-bold text-[#625D69] hover:text-[#191522] inline-flex items-center gap-1"
                >
                  {showModalCvv ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showModalCvv ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showModalCvv ? 'text' : 'password'}
                maxLength={4}
                value={newCvv}
                onChange={(e) => setNewCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="882"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">
                Starting Balance ({userCurrency})
              </label>
              <input
                type="number"
                step="any"
                required
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Account Label & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">Institution / Bank</label>
              <input
                type="text"
                required
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="e.g. Chase Bank, HDFC, Barclays"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">Account / Card Type</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as any)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
              >
                <option value="CHECKING">Debit / Checking Card</option>
                <option value="SAVINGS">Savings Account Card</option>
                <option value="CREDIT">Credit Line Card</option>
                <option value="WALLET">Digital Wallet / UPI</option>
                <option value="CASH">Physical Cash Reserve</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#191522] mb-1 block">Account Nickname</label>
            <input
              type="text"
              required
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="e.g. Primary Daily Checking or Travel Rewards"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#191522] focus:border-[#4056A1] focus:outline-none shadow-xs"
            />
          </div>

          {/* 6 Luxury Card Themes */}
          <div>
            <label className="text-xs font-bold text-[#191522] mb-1.5 block">Card Finish & Palette</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'obsidian', label: 'Obsidian', color: 'bg-[#2A1F3D]' },
                { id: 'sapphire', label: 'Sapphire', color: 'bg-blue-600' },
                { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
                { id: 'amber', label: 'Amber', color: 'bg-amber-600' },
                { id: 'gold', label: 'Gold', color: 'bg-yellow-500' },
                { id: 'platinum', label: 'Platinum', color: 'bg-slate-400' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setNewTheme(th.id as any)}
                  className={cn(
                    'p-2 rounded-xl border text-center text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1.5',
                    newTheme === th.id
                      ? 'border-[#2A1F3D] bg-[#2A1F3D] text-white shadow-sm'
                      : 'border-[#E4E2DC] bg-white text-[#625D69] hover:text-[#191522]'
                  )}
                >
                  <span className={cn('h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs', th.color)} />
                  <span className="truncate">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingNew} className="bg-[#2A1F3D] text-white font-bold px-5">
              Link Banking Card
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
              <label className="text-xs font-bold text-[#191522] mb-1 block">From Account</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance, userCurrency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191522] mb-1 block">To Account</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
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
            <label className="text-xs font-bold text-[#191522] mb-1 block">Transfer Amount ({userCurrency})</label>
            <input
              type="number"
              step="any"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2.5 text-sm font-black text-[#191522] focus:outline-none focus:border-[#4056A1] shadow-sm"
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
              className="bg-[#2A1F3D] text-white font-bold px-5"
            >
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

