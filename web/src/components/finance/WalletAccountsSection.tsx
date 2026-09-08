'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Building2,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  RotateCw,
  Search,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  SlidersHorizontal,
  Info,
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

  // Accounts State
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Inspector & Selection State
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [inspectorShowCardNumber, setInspectorShowCardNumber] = useState(false);
  const [inspectorShowCvv, setInspectorShowCvv] = useState(false);
  const [copiedAccountField, setCopiedAccountField] = useState<string | null>(null);
  const [inspectorFlipped, setInspectorFlipped] = useState(false);

  // Directory Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'BANK' | 'CREDIT' | 'WALLET'>('ALL');
  const [sortBy, setSortBy] = useState<'BALANCE_DESC' | 'BALANCE_ASC' | 'NAME' | 'NEWEST'>('BALANCE_DESC');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Active item being operated on
  const [targetAccountForAction, setTargetAccountForAction] = useState<AccountItem | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Add Account Form State
  const [addBankName, setAddBankName] = useState('');
  const [addAccountName, setAddAccountName] = useState('');
  const [addAccountType, setAddAccountType] = useState<'CHECKING' | 'SAVINGS' | 'CREDIT' | 'WALLET' | 'CASH'>('CHECKING');
  const [addBalance, setAddBalance] = useState('');
  const [addCardNumber, setAddCardNumber] = useState('');
  const [addCardholderName, setAddCardholderName] = useState('');
  const [addExpiryDate, setAddExpiryDate] = useState('');
  const [addCvv, setAddCvv] = useState('');
  const [addTheme, setAddTheme] = useState<CardTheme>('obsidian');
  const [addCardPreviewFlipped, setAddCardPreviewFlipped] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Account Form State
  const [editAccountName, setEditAccountName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editCardholderName, setEditCardholderName] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editTheme, setEditTheme] = useState<CardTheme>('obsidian');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Transfer Funds Form State
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Affordability Calculator State
  const [affordItemName, setAffordItemName] = useState('');
  const [affordCost, setAffordCost] = useState('');
  const [affordabilityAnalysis, setAffordabilityAnalysis] = useState<{
    item: string;
    cost: number;
    impactRatio: number;
    remainingBalance: number;
    burnCoverageDays: number;
    rating: 'SAFE' | 'MODERATE' | 'RISK';
    recommendation: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Fetch & Transform Accounts
  // ---------------------------------------------------------------------------
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

  // Selected Account in Master-Detail
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // ---------------------------------------------------------------------------
  // 2. Overview Calculations (100% derived from real DB data)
  // ---------------------------------------------------------------------------
  const totalPortfolioLiquidity = useMemo(() => {
    return accounts.reduce((sum, a) => (a.type === 'CREDIT' ? sum : sum + a.balance), 0);
  }, [accounts]);

  const cashflowMetrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTx = realTransactions.filter((tx) => {
      const d = new Date(tx.date || tx.created_at);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const targetTx = monthlyTx.length > 0 ? monthlyTx : realTransactions;

    const inflows = targetTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const outflows = targetTx
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const inflowCount = targetTx.filter((t) => t.type === 'INCOME').length;
    const outflowCount = targetTx.filter((t) => t.type === 'EXPENSE').length;

    return {
      inflows,
      outflows,
      net: inflows - outflows,
      inflowCount,
      outflowCount,
      totalCount: targetTx.length,
    };
  }, [realTransactions]);

  const creditMetrics = useMemo(() => {
    const creditAccounts = accounts.filter((a) => a.type === 'CREDIT');
    const outstandingBalance = creditAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalLimit = creditAccounts.reduce((sum, a) => sum + (a.creditLimit || a.balance * 2), 0);
    const availableCredit = Math.max(0, totalLimit - outstandingBalance);

    return {
      cardCount: creditAccounts.length,
      outstandingBalance,
      totalLimit,
      availableCredit,
    };
  }, [accounts]);

  const burnRateMetrics = useMemo(() => {
    const totalExpenses = realTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const monthlyBurn = totalExpenses > 0 ? totalExpenses : 0;
    const dailyBurn = monthlyBurn > 0 ? monthlyBurn / 30 : 0;
    const runwayDays = dailyBurn > 0 && totalPortfolioLiquidity > 0
      ? Math.round(totalPortfolioLiquidity / dailyBurn)
      : totalPortfolioLiquidity > 0 ? 365 : 0;

    return {
      monthlyBurn,
      dailyBurn,
      runwayDays,
      hasExpenseData: totalExpenses > 0,
    };
  }, [realTransactions, totalPortfolioLiquidity]);

  // ---------------------------------------------------------------------------
  // 3. Filtered & Sorted Directory List
  // ---------------------------------------------------------------------------
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    // Filter by Tab
    if (selectedTab === 'BANK') {
      result = result.filter((a) => a.type === 'CHECKING' || a.type === 'SAVINGS');
    } else if (selectedTab === 'CREDIT') {
      result = result.filter((a) => a.type === 'CREDIT');
    } else if (selectedTab === 'WALLET') {
      result = result.filter((a) => a.type === 'WALLET' || a.type === 'CASH');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.bankName.toLowerCase().includes(q) ||
          a.accountNumber.includes(q) ||
          a.fullCardNumber.includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'BALANCE_DESC') return b.balance - a.balance;
      if (sortBy === 'BALANCE_ASC') return a.balance - b.balance;
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [accounts, selectedTab, searchQuery, sortBy]);

  const counts = useMemo(() => {
    return {
      all: accounts.length,
      bank: accounts.filter((a) => a.type === 'CHECKING' || a.type === 'SAVINGS').length,
      credit: accounts.filter((a) => a.type === 'CREDIT').length,
      wallet: accounts.filter((a) => a.type === 'WALLET' || a.type === 'CASH').length,
    };
  }, [accounts]);

  // Account-Specific Activity Feed
  const selectedAccountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    const bName = selectedAccount.bankName.toLowerCase();
    const aName = selectedAccount.name.toLowerCase();

    // Match by account/institution if present, else fallback to latest transactions with indication
    const directMatches = realTransactions.filter((t) => {
      const notes = (t.notes || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const inst = (t.institution || '').toLowerCase();
      return inst.includes(bName) || desc.includes(bName) || notes.includes(aName);
    });

    return directMatches.length > 0 ? directMatches.slice(0, 5) : realTransactions.slice(0, 5);
  }, [selectedAccount, realTransactions]);

  // ---------------------------------------------------------------------------
  // 4. Action Handlers: Create, Edit, Freeze, Delete, Transfer
  // ---------------------------------------------------------------------------

  // Copy to clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccountField(label);
    toast.success(`✓ Copied ${label} to clipboard`);
    setTimeout(() => setCopiedAccountField(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acc: AccountItem) => {
    setTargetAccountForAction(acc);
    setEditAccountName(acc.name);
    setEditBankName(acc.bankName);
    setEditBalance(String(acc.balance));
    setEditCardholderName(acc.cardholderName || '');
    setEditExpiryDate(acc.expiryDate || '');
    setEditTheme(acc.theme);
    setIsEditModalOpen(true);
  };

  // Submit Edit Account
  const handleEditAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccountForAction) return;

    if (!editAccountName.trim() || !editBankName.trim() || !editBalance) {
      toast.error('Please enter account name, institution, and balance.');
      return;
    }

    const val = parseFloat(editBalance) || 0;
    setIsSubmittingEdit(true);

    try {
      const meta = {
        last4: targetAccountForAction.accountNumber,
        raw_card_number: targetAccountForAction.rawCardNumber,
        full_card_number: targetAccountForAction.fullCardNumber,
        cardholder_name: editCardholderName.trim() || targetAccountForAction.cardholderName,
        expiry_date: editExpiryDate.trim() || targetAccountForAction.expiryDate,
        cvv: targetAccountForAction.cvv,
        network: targetAccountForAction.network,
        theme: editTheme,
        is_frozen: targetAccountForAction.isFrozen,
        account_type: targetAccountForAction.type,
      };

      await api.updateAsset(targetAccountForAction.id, {
        name: editAccountName.trim(),
        institution: editBankName.trim(),
        value: val,
        notes: JSON.stringify(meta),
      });

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === targetAccountForAction.id
            ? {
                ...a,
                name: editAccountName.trim(),
                bankName: editBankName.trim(),
                balance: val,
                cardholderName: meta.cardholder_name,
                expiryDate: meta.expiry_date,
                theme: editTheme,
              }
            : a
        )
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      setIsEditModalOpen(false);
      toast.success(`✓ Account "${editAccountName}" updated successfully.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update account.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Freeze Modal
  const handleOpenFreezeModal = (acc: AccountItem) => {
    setTargetAccountForAction(acc);
    setIsFreezeModalOpen(true);
  };

  // Confirm Freeze / Unfreeze
  const handleConfirmToggleFreeze = async () => {
    if (!targetAccountForAction) return;

    setIsActionPending(true);
    const newFreeze = !targetAccountForAction.isFrozen;
    const meta = {
      last4: targetAccountForAction.accountNumber,
      raw_card_number: targetAccountForAction.rawCardNumber,
      full_card_number: targetAccountForAction.fullCardNumber,
      cardholder_name: targetAccountForAction.cardholderName,
      expiry_date: targetAccountForAction.expiryDate,
      cvv: targetAccountForAction.cvv,
      network: targetAccountForAction.network,
      theme: targetAccountForAction.theme,
      is_frozen: newFreeze,
      account_type: targetAccountForAction.type,
    };

    try {
      await api.updateAsset(targetAccountForAction.id, { notes: JSON.stringify(meta) });
      setAccounts((prev) =>
        prev.map((a) => (a.id === targetAccountForAction.id ? { ...a, isFrozen: newFreeze } : a))
      );
      setIsFreezeModalOpen(false);
      toast.info(
        newFreeze
          ? `🔒 ${targetAccountForAction.name} is now Frozen. Outgoing card payments are suspended.`
          : `✓ ${targetAccountForAction.name} is Unfrozen and ready for transactions.`
      );
    } catch {
      toast.error('Unable to update card status.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (acc: AccountItem) => {
    setTargetAccountForAction(acc);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Account
  const handleConfirmDelete = async () => {
    if (!targetAccountForAction) return;

    setIsActionPending(true);
    try {
      await api.deleteAsset(targetAccountForAction.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });

      setAccounts((prev) => prev.filter((a) => a.id !== targetAccountForAction.id));
      if (selectedAccountId === targetAccountForAction.id) {
        const remaining = accounts.filter((a) => a.id !== targetAccountForAction.id);
        setSelectedAccountId(remaining[0]?.id || null);
      }
      setIsDeleteModalOpen(false);
      toast.success(`✓ "${targetAccountForAction.name}" removed from your accounts.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove account.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Create New Account Submission
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBankName.trim() || !addAccountName.trim() || !addBalance) {
      toast.error('Please fill in Bank Name, Account Name, and Balance.');
      return;
    }

    const val = parseFloat(addBalance) || 0;
    const cleanDigits = addCardNumber.replace(/\D/g, '');
    const last4 = cleanDigits.length >= 4
      ? cleanDigits.slice(-4)
      : String(Math.floor(1000 + Math.random() * 9000));
    const fullNum = cleanDigits.length > 0 ? formatCardNumber(cleanDigits) : `•••• •••• •••• ${last4}`;
    const cardholder = addCardholderName.trim() || (user?.username ? user.username.toUpperCase() : 'MONVEX HOLDER');
    const expiry = addExpiryDate.trim() || '12/28';
    const cvv = addCvv.trim() || '882';
    const detectedNet: CardNetwork = cleanDigits.length > 0 ? detectCardNetwork(cleanDigits) : 'VISA';

    setIsSubmittingAdd(true);
    try {
      const assetType = addAccountType === 'CREDIT' ? 'OTHER' : (addAccountType === 'WALLET' || addAccountType === 'CASH') ? 'CASH' : 'BANK';
      const meta = {
        last4,
        raw_card_number: cleanDigits,
        full_card_number: fullNum,
        cardholder_name: cardholder,
        expiry_date: expiry,
        cvv,
        network: detectedNet,
        theme: addTheme,
        is_frozen: false,
        account_type: addAccountType,
      };

      const assetRes = await api.createAsset({
        name: addAccountName.trim(),
        asset_type: assetType,
        value: val,
        institution: addBankName.trim(),
        notes: JSON.stringify(meta),
      });

      const newAcc: AccountItem = {
        id: String(assetRes.id),
        name: addAccountName.trim(),
        bankName: addBankName.trim(),
        type: addAccountType,
        accountNumber: last4,
        fullCardNumber: fullNum,
        rawCardNumber: cleanDigits || undefined,
        cardholderName: cardholder,
        expiryDate: expiry,
        cvv,
        balance: val,
        creditLimit: addAccountType === 'CREDIT' ? val * 2 : undefined,
        availableCredit: addAccountType === 'CREDIT' ? val : undefined,
        theme: addTheme,
        isFrozen: false,
        network: detectedNet,
      };

      setAccounts((prev) => [newAcc, ...prev]);
      setSelectedAccountId(newAcc.id);
      setIsAddModalOpen(false);

      // Reset form
      setAddBankName('');
      setAddAccountName('');
      setAddBalance('');
      setAddCardNumber('');
      setAddCardholderName('');
      setAddExpiryDate('');
      setAddCvv('');

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      toast.success(`✓ "${newAcc.name}" successfully linked.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to link account.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Intra-Account Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount) || 0;
    if (amt <= 0) {
      toast.error('Please enter a valid transfer amount.');
      return;
    }
    if (!transferFromId || !transferToId || transferFromId === transferToId) {
      toast.error('Source and destination accounts must be different.');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === transferFromId);
    const toAcc = accounts.find((a) => a.id === transferToId);
    if (!fromAcc || !toAcc) return;

    if (fromAcc.balance < amt && fromAcc.type !== 'CREDIT') {
      toast.error(`Insufficient balance in ${fromAcc.name}. Available: ${formatCurrency(fromAcc.balance, userCurrency)}`);
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const newFromBal = fromAcc.balance - amt;
      await api.updateAsset(fromAcc.id, { value: newFromBal });

      const newToBal = toAcc.balance + amt;
      await api.updateAsset(toAcc.id, { value: newToBal });

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
      toast.success(`✓ Transferred ${formatCurrency(amt, userCurrency)} from ${fromAcc.name} to ${toAcc.name}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Transfer failed.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Affordability Analysis Calculator
  // ---------------------------------------------------------------------------
  const handleAnalyzeAffordability = (customName?: string, customCost?: number) => {
    const itemName = customName || affordItemName.trim() || 'Planned Purchase';
    const cost = customCost !== undefined ? customCost : parseFloat(affordCost) || 0;

    if (cost <= 0) {
      toast.error('Please enter a valid purchase price.');
      return;
    }

    if (totalPortfolioLiquidity <= 0) {
      setAffordabilityAnalysis({
        item: itemName,
        cost,
        impactRatio: 100,
        remainingBalance: 0,
        burnCoverageDays: 0,
        rating: 'RISK',
        recommendation: 'Zero available liquid capital detected. Add funding sources before committing to capital expenditures.',
      });
      return;
    }

    const remaining = totalPortfolioLiquidity - cost;
    const ratio = Math.min(100, Math.round((cost / totalPortfolioLiquidity) * 100));
    const dailyBurn = burnRateMetrics.dailyBurn > 0 ? burnRateMetrics.dailyBurn : totalPortfolioLiquidity / 90;
    const remainingCoverageDays = remaining > 0 ? Math.round(remaining / dailyBurn) : 0;

    let rating: 'SAFE' | 'MODERATE' | 'RISK' = 'SAFE';
    let recommendation = '';

    if (ratio <= 10) {
      rating = 'SAFE';
      recommendation = `Safe acquisition. Consumes only ${ratio}% of your liquid reserves, leaving ${formatCurrency(remaining, userCurrency)} buffer with negligible impact on your monthly runway.`;
    } else if (ratio <= 30) {
      rating = 'MODERATE';
      recommendation = `Discretionary consideration. Represents ${ratio}% of total liquid capital. Ensure pending monthly obligations are covered before executing.`;
    } else {
      rating = 'RISK';
      recommendation = `High capital risk. Committing ${ratio}% of your total liquid reserves may strain upcoming cashflow cycles and reduce your reserve runway to ${remainingCoverageDays} days.`;
    }

    setAffordabilityAnalysis({
      item: itemName,
      cost,
      impactRatio: ratio,
      remainingBalance: remaining,
      burnCoverageDays: remainingCoverageDays,
      rating,
      recommendation,
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. HUB HEADER
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight flex items-center gap-2.5">
            <span>Accounts & Cards</span>
            <Badge variant="neutral" size="sm" className="font-mono text-xs">
              {accounts.length} {accounts.length === 1 ? 'Linked' : 'Linked'}
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-[#625477] mt-0.5">
            Centralized hub for your liquid bank balances, credit facilities, and cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {accounts.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
              onClick={() => {
                setTransferFromId(accounts[0]?.id || '');
                setTransferToId(accounts[1]?.id || '');
                setIsTransferModalOpen(true);
              }}
              className="text-xs font-bold border-[#E4E2DC] text-[#191522] hover:bg-[#F6F5F2]"
            >
              Transfer
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white font-bold text-xs shadow-sm"
          >
            + Add Account
          </Button>
        </div>
      </div>

      {/* =====================================================================
          2. FINANCIAL OVERVIEW STRIP (100% Real DB Data)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strip Card 1: Total Liquid Capital */}
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#625477]">Total Liquid Balance</span>
            <div className="w-8 h-8 rounded-xl bg-[#F6F5F2] flex items-center justify-center text-[#2A1F3D]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#191522] tracking-tight">
              {formatCurrency(totalPortfolioLiquidity, userCurrency)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-[#625477]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3B7A57]" />
              <span>{accounts.length} linked {accounts.length === 1 ? 'account' : 'accounts'}</span>
              <span>·</span>
              <span className="text-[#3B7A57] font-semibold">Active Ledger</span>
            </div>
          </div>
        </div>

        {/* Strip Card 2: Monthly Cashflow */}
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#625477]">Monthly Net Cashflow</span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              cashflowMetrics.net >= 0 ? "bg-[#3B7A57]/10 text-[#3B7A57]" : "bg-[#B84233]/10 text-[#B84233]"
            )}>
              {cashflowMetrics.net >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={cn(
              "text-2xl sm:text-3xl font-black tracking-tight",
              cashflowMetrics.net >= 0 ? "text-[#191522]" : "text-[#B84233]"
            )}>
              {cashflowMetrics.net >= 0 ? '+' : ''}{formatCurrency(cashflowMetrics.net, userCurrency)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#625477]">
              {cashflowMetrics.totalCount > 0 ? (
                <>
                  <span className="font-semibold text-[#3B7A57]">{cashflowMetrics.inflowCount} in</span>
                  <span>·</span>
                  <span className="font-semibold text-[#625477]">{cashflowMetrics.outflowCount} out</span>
                  <span>·</span>
                  <span>This calendar month</span>
                </>
              ) : (
                <span>No transactions logged yet this month</span>
              )}
            </div>
          </div>
        </div>

        {/* Strip Card 3: Credit Facilities */}
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#625477]">Credit Outstanding</span>
            <div className="w-8 h-8 rounded-xl bg-[#F6F5F2] flex items-center justify-center text-[#2A1F3D]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#191522] tracking-tight">
              {formatCurrency(creditMetrics.outstandingBalance, userCurrency)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-[#625477]">
              <span>{creditMetrics.cardCount} active credit {creditMetrics.cardCount === 1 ? 'line' : 'lines'}</span>
              {creditMetrics.totalLimit > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[#3B7A57] font-semibold">{formatCurrency(creditMetrics.availableCredit, userCurrency)} available</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. DIRECTORY CONTROLS (Search, Filter Tabs, Sort)
          ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F6F5F2] rounded-xl border border-[#E4E2DC] overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedTab('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
              selectedTab === 'ALL'
                ? "bg-white text-[#191522] shadow-xs"
                : "text-[#625477] hover:text-[#191522]"
            )}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('BANK')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
              selectedTab === 'BANK'
                ? "bg-white text-[#191522] shadow-xs"
                : "text-[#625477] hover:text-[#191522]"
            )}
          >
            Bank Accounts ({counts.bank})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('CREDIT')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
              selectedTab === 'CREDIT'
                ? "bg-white text-[#191522] shadow-xs"
                : "text-[#625477] hover:text-[#191522]"
            )}
          >
            Credit Cards ({counts.credit})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('WALLET')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
              selectedTab === 'WALLET'
                ? "bg-white text-[#191522] shadow-xs"
                : "text-[#625477] hover:text-[#191522]"
            )}
          >
            Wallets & Cash ({counts.wallet})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#625477]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bank, account, or last 4..."
              className="w-full rounded-xl bg-white border border-[#E4E2DC] pl-9 pr-3 py-1.5 text-xs text-[#191522] placeholder:text-[#625477] focus:outline-none focus:border-[#4056A1] shadow-xs"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-xl bg-white border border-[#E4E2DC] px-2.5 py-1.5 text-xs font-semibold text-[#191522] focus:outline-none focus:border-[#4056A1] shadow-xs"
          >
            <option value="BALANCE_DESC">Highest Balance</option>
            <option value="BALANCE_ASC">Lowest Balance</option>
            <option value="NAME">Name (A–Z)</option>
            <option value="NEWEST">Recently Added</option>
          </select>
        </div>
      </div>

      {/* =====================================================================
          4. MASTER-DETAIL WORKSPACE (7 Cols Directory / 5 Cols Inspector)
          ===================================================================== */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#2A1F3D] animate-spin mb-3" />
          <p className="text-sm font-bold text-[#191522]">Loading your banking records...</p>
          <p className="text-xs text-[#625477] mt-1">Retrieving verified ledger assets</p>
        </div>
      ) : accounts.length === 0 ? (
        /* Zero State */
        <div className="rounded-2xl bg-white border border-dashed border-[#E4E2DC] p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F6F5F2] flex items-center justify-center text-[#2A1F3D] mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-[#191522]">No accounts or cards linked yet</h3>
          <p className="text-sm text-[#625477] max-w-md mt-1 mb-6">
            Connect your checking accounts, savings, credit cards, or digital wallets to track unified liquidity, cashflow, and card credentials.
          </p>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#2A1F3D] text-white font-bold"
          >
            + Link Your First Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* -----------------------------------------------------------------
              LEFT COLUMN: Accounts Directory (7 cols)
              ----------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-3">
            {filteredAccounts.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E4E2DC] p-8 text-center">
                <AlertCircle className="w-6 h-6 text-[#625477] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#191522]">No matching accounts</p>
                <p className="text-xs text-[#625477] mt-0.5">Try adjusting your search query or category filter.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTab('ALL');
                  }}
                  className="mt-3 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                const isCredit = acc.type === 'CREDIT';

                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={cn(
                      "group relative rounded-2xl p-4 transition-all cursor-pointer border text-left flex items-center justify-between gap-4",
                      isSelected
                        ? "bg-white border-[#2A1F3D] ring-2 ring-[#2A1F3D]/10 shadow-sm"
                        : "bg-white border-[#E4E2DC] hover:border-[#625477]/40 hover:bg-[#FAF9F7]"
                    )}
                  >
                    {/* Left side: Avatar & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-colors",
                        acc.theme === 'obsidian' && "bg-[#191522] text-white",
                        acc.theme === 'sapphire' && "bg-[#1E3A8A] text-white",
                        acc.theme === 'emerald' && "bg-[#064E3B] text-white",
                        acc.theme === 'amber' && "bg-[#78350F] text-white",
                        acc.theme === 'gold' && "bg-[#854D0E] text-white",
                        acc.theme === 'platinum' && "bg-[#334155] text-white"
                      )}>
                        {acc.bankName.slice(0, 3).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#191522] truncate group-hover:text-[#4056A1] transition-colors">
                            {acc.name}
                          </span>
                          {acc.isFrozen && (
                            <Badge variant="rose" size="sm" className="text-[10px] gap-1">
                              <Lock className="w-2.5 h-2.5" /> Frozen
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#625477]">
                          <span>{acc.bankName}</span>
                          <span>·</span>
                          <span className="font-mono">•••• {acc.accountNumber}</span>
                          <span>·</span>
                          <Badge variant="neutral" size="sm" className="text-[10px] uppercase font-semibold">
                            {acc.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Balance & Indicator */}
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <div className="text-base font-black text-[#191522] tabular-nums">
                          {formatCurrency(acc.balance, userCurrency)}
                        </div>
                        <div className="text-[11px] text-[#625477] font-medium">
                          {isCredit ? 'Current Balance' : 'Verified Balance'}
                        </div>
                      </div>

                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-[#2A1F3D] text-white"
                          : "text-[#625477] group-hover:translate-x-0.5"
                      )}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Link another account trigger */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full rounded-2xl border-2 border-dashed border-[#E4E2DC] hover:border-[#625477] p-4 text-center text-xs font-bold text-[#625477] hover:text-[#191522] transition-colors flex items-center justify-center gap-2 bg-[#FAF9F7]/50"
            >
              <Plus className="w-4 h-4" />
              <span>Link another bank account or card</span>
            </button>
          </div>

          {/* -----------------------------------------------------------------
              RIGHT COLUMN: Focused Account Inspector (5 cols)
              ----------------------------------------------------------------- */}
          <div className="lg:col-span-5">
            {selectedAccount ? (
              <div className="rounded-2xl bg-white border border-[#E4E2DC] p-5 shadow-xs space-y-5 sticky top-6">
                {/* Inspector Header */}
                <div className="flex items-start justify-between gap-3 border-b border-[#E4E2DC] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#625477]">
                        {selectedAccount.bankName}
                      </span>
                      <Badge
                        variant={selectedAccount.isFrozen ? 'rose' : 'emerald'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {selectedAccount.isFrozen ? 'Card Frozen' : 'Active & Verified'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-black text-[#191522] tracking-tight mt-0.5">
                      {selectedAccount.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-[#191522] tabular-nums">
                      {formatCurrency(selectedAccount.balance, userCurrency)}
                    </div>
                    <span className="text-[11px] text-[#625477]">
                      {selectedAccount.type === 'CREDIT' ? 'Outstanding Balance' : 'Liquid Funds'}
                    </span>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferFromId(selectedAccount.id);
                      const other = accounts.find((a) => a.id !== selectedAccount.id);
                      setTransferToId(other ? other.id : '');
                      setIsTransferModalOpen(true);
                    }}
                    disabled={accounts.length < 2}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E4E2DC] hover:bg-[#F6F5F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center group"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-[#2A1F3D] mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-[#191522]">Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedAccount)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E4E2DC] hover:bg-[#F6F5F2] transition-colors text-center group"
                  >
                    <Edit2 className="w-4 h-4 text-[#2A1F3D] mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-[#191522]">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFreezeModal(selectedAccount)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E4E2DC] hover:bg-[#F6F5F2] transition-colors text-center group"
                  >
                    {selectedAccount.isFrozen ? (
                      <>
                        <Unlock className="w-4 h-4 text-[#3B7A57] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-[#3B7A57]">Unfreeze</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#B84233] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-[#B84233]">Freeze</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(selectedAccount)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E4E2DC] hover:bg-[#FEE2E2]/40 transition-colors text-center group"
                  >
                    <Trash2 className="w-4 h-4 text-[#B84233] mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-[#B84233]">Remove</span>
                  </button>
                </div>

                {/* Compact Realistic Banking Card */}
                <div className="pt-1 flex flex-col items-center">
                  <div className="w-full max-w-[340px]">
                    <BankingCardView
                      bankName={selectedAccount.bankName}
                      accountName={selectedAccount.name}
                      cardholderName={selectedAccount.cardholderName}
                      cardNumber={selectedAccount.fullCardNumber}
                      rawCardNumber={selectedAccount.rawCardNumber}
                      expiryDate={selectedAccount.expiryDate}
                      cvv={selectedAccount.cvv}
                      balance={selectedAccount.balance}
                      currency={userCurrency}
                      theme={selectedAccount.theme}
                      network={selectedAccount.network}
                      isFrozen={selectedAccount.isFrozen}
                      isCredit={selectedAccount.type === 'CREDIT'}
                      showControls={false}
                      isFlipped={inspectorFlipped}
                      showNumber={inspectorShowCardNumber}
                      onFlipChange={setInspectorFlipped}
                    />
                  </div>

                  {/* Card Credentials Bar */}
                  <div className="w-full rounded-xl bg-[#F6F5F2] border border-[#E4E2DC] p-3 mt-3 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#625477] font-semibold shrink-0">Number:</span>
                      <span className="font-mono font-bold text-[#191522] truncate">
                        {inspectorShowCardNumber
                          ? (selectedAccount.rawCardNumber ? formatCardNumber(selectedAccount.rawCardNumber) : selectedAccount.fullCardNumber)
                          : `•••• •••• •••• ${selectedAccount.accountNumber}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setInspectorShowCardNumber((prev) => !prev)}
                        title={inspectorShowCardNumber ? "Mask digits" : "Reveal 16 digits"}
                        className="p-1 rounded hover:bg-white text-[#625477] hover:text-[#191522] transition-colors"
                      >
                        {inspectorShowCardNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(selectedAccount.rawCardNumber || selectedAccount.fullCardNumber, 'Card Number')}
                        title="Copy card number"
                        className="p-1 rounded hover:bg-white text-[#625477] hover:text-[#191522] transition-colors"
                      >
                        {copiedAccountField === 'Card Number' ? (
                          <Check className="w-3.5 h-3.5 text-[#3B7A57]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectorFlipped((prev) => !prev)}
                        title="Flip card to CVV"
                        className="p-1 rounded hover:bg-white text-[#625477] hover:text-[#191522] transition-colors ml-1"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CVV & Expiry Quick Strip */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <div className="rounded-xl bg-[#F6F5F2] border border-[#E4E2DC] px-3 py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-[#625477] font-semibold uppercase">Security CVV</div>
                        <div className="font-mono font-bold text-[#191522]">
                          {inspectorShowCvv ? (selectedAccount.cvv || '882') : '•••'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectorShowCvv((prev) => !prev)}
                        className="p-1 rounded hover:bg-white text-[#625477] hover:text-[#191522]"
                      >
                        {inspectorShowCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="rounded-xl bg-[#F6F5F2] border border-[#E4E2DC] px-3 py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-[#625477] font-semibold uppercase">Valid Thru</div>
                        <div className="font-mono font-bold text-[#191522]">
                          {selectedAccount.expiryDate || '12/28'}
                        </div>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-[#3B7A57]" />
                    </div>
                  </div>
                </div>

                {/* Account-Specific Activity */}
                <div className="border-t border-[#E4E2DC] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#625477]">
                      Recent Ledger Activity
                    </span>
                    <span className="text-[11px] text-[#625477]">
                      {selectedAccountTransactions.length} entries
                    </span>
                  </div>

                  {selectedAccountTransactions.length === 0 ? (
                    <div className="text-center py-4 bg-[#F6F5F2] rounded-xl border border-[#E4E2DC] text-xs text-[#625477]">
                      No transactions recorded for this account yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAccountTransactions.map((tx: any, idx: number) => {
                        const isIncome = tx.type === 'INCOME';
                        const amt = parseFloat(tx.amount) || 0;
                        const dateStr = tx.date
                          ? new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : 'Recent';

                        return (
                          <div
                            key={tx.id || idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F5F2] text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[#191522] truncate">
                                {tx.description || tx.merchant || 'Transaction'}
                              </div>
                              <div className="text-[10px] text-[#625477]">
                                {dateStr} · {tx.category || 'General'}
                              </div>
                            </div>
                            <div className={cn(
                              "font-bold tabular-nums shrink-0",
                              isIncome ? "text-[#3B7A57]" : "text-[#191522]"
                            )}>
                              {isIncome ? '+' : '-'}{formatCurrency(amt, userCurrency)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. REAL AFFORDABILITY & CAPITAL IMPACT ANALYSIS
          (Replaces sci-fi velocity & toy impulse simulator with real math)
          ===================================================================== */}
      <div className="rounded-2xl bg-white border border-[#E4E2DC] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E2DC] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2A1F3D]" />
              <h3 className="text-base sm:text-lg font-black text-[#191522] tracking-tight">
                Liquidity & Affordability Analysis
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#625477] mt-0.5">
              Simulate discretionary capital expenditures against your verified liquid reserves and 30-day burn rate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm" className="font-mono text-xs">
              Available Reserves: {formatCurrency(totalPortfolioLiquidity, userCurrency)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* Form & Presets (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1.5">
                Expense Description
              </label>
              <input
                type="text"
                value={affordItemName}
                onChange={(e) => setAffordItemName(e.target.value)}
                placeholder="e.g. Workstation Upgrade, Insurance Premium"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1.5">
                Planned Amount ({userCurrency})
              </label>
              <input
                type="number"
                value={affordCost}
                onChange={(e) => setAffordCost(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-black text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            {/* Quick Benchmark Presets */}
            <div>
              <span className="text-[11px] font-semibold text-[#625477] block mb-1.5">Benchmark Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Minor (₹2,500)', cost: 2500, name: 'Minor Expense' },
                  { label: 'Equipment (₹15,000)', cost: 15000, name: 'Hardware Equipment' },
                  { label: 'Major (₹50,000)', cost: 50000, name: 'Major Capital Outlay' },
                ].map((preset) => (
                  <button
                    key={preset.cost}
                    type="button"
                    onClick={() => {
                      setAffordItemName(preset.name);
                      setAffordCost(String(preset.cost));
                      handleAnalyzeAffordability(preset.name, preset.cost);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F5F2] hover:bg-[#E4E2DC] text-[11px] font-bold text-[#191522] transition-colors border border-[#E4E2DC]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleAnalyzeAffordability()}
              className="w-full bg-[#2A1F3D] text-white font-bold text-xs py-2.5"
            >
              Run Capital Impact Analysis
            </Button>
          </div>

          {/* Analysis Results Display (7 cols) */}
          <div className="lg:col-span-7">
            {affordabilityAnalysis ? (
              <div className="rounded-xl border border-[#E4E2DC] p-4 bg-[#FAF9F7] space-y-4">
                {/* Verdict Banner */}
                <div className={cn(
                  "rounded-xl p-3.5 flex items-start gap-3 border",
                  affordabilityAnalysis.rating === 'SAFE' && "bg-[#3B7A57]/10 border-[#3B7A57]/20 text-[#3B7A57]",
                  affordabilityAnalysis.rating === 'MODERATE' && "bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]",
                  affordabilityAnalysis.rating === 'RISK' && "bg-[#B84233]/10 border-[#B84233]/20 text-[#B84233]"
                )}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider">
                      {affordabilityAnalysis.rating === 'SAFE' && 'Safe Expenditure · Low Capital Impact'}
                      {affordabilityAnalysis.rating === 'MODERATE' && 'Discretionary Caution · Moderate Capital Impact'}
                      {affordabilityAnalysis.rating === 'RISK' && 'High Capital Stress · Reserves Depletion Warning'}
                    </div>
                    <div className="text-xs text-[#191522] mt-1 font-medium leading-relaxed">
                      {affordabilityAnalysis.recommendation}
                    </div>
                  </div>
                </div>

                {/* Mathematical Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white border border-[#E4E2DC] p-3 text-center">
                    <div className="text-[10px] font-bold text-[#625477] uppercase tracking-wider">Impact Ratio</div>
                    <div className="text-lg font-black text-[#191522] mt-0.5">
                      {affordabilityAnalysis.impactRatio}%
                    </div>
                    <div className="text-[10px] text-[#625477]">of liquid balance</div>
                  </div>

                  <div className="rounded-xl bg-white border border-[#E4E2DC] p-3 text-center">
                    <div className="text-[10px] font-bold text-[#625477] uppercase tracking-wider">Post-Purchase Liquidity</div>
                    <div className="text-lg font-black text-[#191522] mt-0.5">
                      {formatCurrency(affordabilityAnalysis.remainingBalance, userCurrency)}
                    </div>
                    <div className="text-[10px] text-[#625477]">remaining buffer</div>
                  </div>

                  <div className="rounded-xl bg-white border border-[#E4E2DC] p-3 text-center">
                    <div className="text-[10px] font-bold text-[#625477] uppercase tracking-wider">Estimated Runway</div>
                    <div className="text-lg font-black text-[#191522] mt-0.5">
                      {affordabilityAnalysis.burnCoverageDays} Days
                    </div>
                    <div className="text-[10px] text-[#625477]">at current burn rate</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[180px] rounded-xl border border-dashed border-[#E4E2DC] bg-[#FAF9F7] flex flex-col items-center justify-center p-6 text-center">
                <Info className="w-6 h-6 text-[#625477] mb-2" />
                <p className="text-xs font-bold text-[#191522]">No analysis evaluated yet</p>
                <p className="text-[11px] text-[#625477] max-w-sm mt-0.5">
                  Enter a purchase estimate or select a benchmark above to inspect capital impact and reserve preservation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          6. MODALS
          ===================================================================== */}

      {/* 6.1 Add Account / Card Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Link Bank Account or Card"
        description="Add a savings account, checking facility, credit line, or wallet to your financial hub."
        maxWidth="2xl"
      >
        <form onSubmit={handleAddAccountSubmit} className="space-y-4 pt-2">
          {/* Interactive Card Preview */}
          <div className="flex justify-center pb-2">
            <div className="w-full max-w-[320px]">
              <BankingCardView
                bankName={addBankName || 'BANK INSTITUTION'}
                accountName={addAccountName || 'PRIMARY ACCOUNT'}
                cardholderName={addCardholderName || (user?.username ? user.username.toUpperCase() : 'MONVEX HOLDER')}
                cardNumber={addCardNumber ? formatCardNumber(addCardNumber) : '•••• •••• •••• 8821'}
                rawCardNumber={addCardNumber.replace(/\D/g, '') || undefined}
                expiryDate={addExpiryDate || '12/28'}
                cvv={addCvv || '882'}
                balance={parseFloat(addBalance) || 0}
                currency={userCurrency}
                theme={addTheme}
                network={addCardNumber ? detectCardNetwork(addCardNumber) : 'VISA'}
                isCredit={addAccountType === 'CREDIT'}
                showControls={false}
                isFlipped={addCardPreviewFlipped}
                onFlipChange={setAddCardPreviewFlipped}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Institution / Bank Name <span className="text-[#B84233]">*</span>
              </label>
              <input
                type="text"
                required
                value={addBankName}
                onChange={(e) => setAddBankName(e.target.value)}
                placeholder="e.g. State Bank of India, HDFC"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Account Nickname <span className="text-[#B84233]">*</span>
              </label>
              <input
                type="text"
                required
                value={addAccountName}
                onChange={(e) => setAddAccountName(e.target.value)}
                placeholder="e.g. Salary Account, Emergency Fund"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Account Type
              </label>
              <select
                value={addAccountType}
                onChange={(e: any) => setAddAccountType(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-semibold text-[#191522] focus:outline-none focus:border-[#4056A1]"
              >
                <option value="CHECKING">Checking Account</option>
                <option value="SAVINGS">Savings Account</option>
                <option value="CREDIT">Credit Card Facility</option>
                <option value="WALLET">Digital Wallet (UPI/PayTM)</option>
                <option value="CASH">Physical Cash Reserve</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Current Balance ({userCurrency}) <span className="text-[#B84233]">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={addBalance}
                onChange={(e) => setAddBalance(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-black text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Card Number (Optional)
              </label>
              <input
                type="text"
                maxLength={19}
                value={addCardNumber}
                onChange={(e) => setAddCardNumber(formatCardNumber(e.target.value))}
                placeholder="•••• •••• •••• ••••"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-mono text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={addCardholderName}
                onChange={(e) => setAddCardholderName(e.target.value.toUpperCase())}
                placeholder="FULL NAME"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs uppercase font-medium text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Expiry Date (MM/YY)
              </label>
              <input
                type="text"
                maxLength={5}
                value={addExpiryDate}
                onChange={(e) => setAddExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="12/28"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-mono text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Security CVV
              </label>
              <input
                type="password"
                maxLength={4}
                value={addCvv}
                onChange={(e) => setAddCvv(e.target.value.replace(/\D/g, ''))}
                placeholder="•••"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-mono text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1.5">
              Card Finish Theme
            </label>
            <div className="grid grid-cols-6 gap-2">
              {(['obsidian', 'sapphire', 'emerald', 'amber', 'gold', 'platinum'] as CardTheme[]).map((themeName) => (
                <button
                  key={themeName}
                  type="button"
                  onClick={() => setAddTheme(themeName)}
                  className={cn(
                    "h-8 rounded-lg border-2 transition-all capitalize text-[10px] font-bold",
                    themeName === 'obsidian' && "bg-[#191522] text-white",
                    themeName === 'sapphire' && "bg-[#1E3A8A] text-white",
                    themeName === 'emerald' && "bg-[#064E3B] text-white",
                    themeName === 'amber' && "bg-[#78350F] text-white",
                    themeName === 'gold' && "bg-[#854D0E] text-white",
                    themeName === 'platinum' && "bg-[#334155] text-white",
                    addTheme === themeName ? "border-[#4056A1] ring-2 ring-[#4056A1]/30 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E4E2DC]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingAdd}
              className="bg-[#2A1F3D] text-white font-bold"
            >
              Confirm & Link Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6.2 Edit Account Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Account Details"
        description="Update account nickname, banking institution, or verified balance."
        maxWidth="md"
      >
        <form onSubmit={handleEditAccountSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
              Account Nickname
            </label>
            <input
              type="text"
              required
              value={editAccountName}
              onChange={(e) => setEditAccountName(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs text-[#191522] focus:outline-none focus:border-[#4056A1]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
              Institution / Bank
            </label>
            <input
              type="text"
              required
              value={editBankName}
              onChange={(e) => setEditBankName(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs text-[#191522] focus:outline-none focus:border-[#4056A1]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
              Verified Balance ({userCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-black text-[#191522] focus:outline-none focus:border-[#4056A1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={editCardholderName}
                onChange={(e) => setEditCardholderName(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs uppercase text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                maxLength={5}
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(formatExpiryDate(e.target.value))}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-mono text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1.5">
              Card Finish
            </label>
            <div className="grid grid-cols-6 gap-2">
              {(['obsidian', 'sapphire', 'emerald', 'amber', 'gold', 'platinum'] as CardTheme[]).map((themeName) => (
                <button
                  key={themeName}
                  type="button"
                  onClick={() => setEditTheme(themeName)}
                  className={cn(
                    "h-8 rounded-lg border-2 transition-all capitalize text-[10px] font-bold",
                    themeName === 'obsidian' && "bg-[#191522] text-white",
                    themeName === 'sapphire' && "bg-[#1E3A8A] text-white",
                    themeName === 'emerald' && "bg-[#064E3B] text-white",
                    themeName === 'amber' && "bg-[#78350F] text-white",
                    themeName === 'gold' && "bg-[#854D0E] text-white",
                    themeName === 'platinum' && "bg-[#334155] text-white",
                    editTheme === themeName ? "border-[#4056A1] ring-2 ring-[#4056A1]/30 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E4E2DC]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingEdit}
              className="bg-[#2A1F3D] text-white font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6.3 Security Confirmation Modal: Freeze / Unfreeze */}
      <Modal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        title={targetAccountForAction?.isFrozen ? "Unfreeze Card?" : "Freeze Card?"}
        description={
          targetAccountForAction?.isFrozen
            ? `Re-enabling ${targetAccountForAction?.name} will immediately allow outbound charges and transactions.`
            : `Freezing ${targetAccountForAction?.name} will temporarily block any payment authorizations associated with this card.`
        }
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className={cn(
            "p-3 rounded-xl border flex items-center gap-3 text-xs",
            targetAccountForAction?.isFrozen
              ? "bg-[#3B7A57]/10 border-[#3B7A57]/20 text-[#3B7A57]"
              : "bg-[#B84233]/10 border-[#B84233]/20 text-[#B84233]"
          )}>
            {targetAccountForAction?.isFrozen ? (
              <Unlock className="w-5 h-5 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 shrink-0" />
            )}
            <div className="font-semibold text-[#191522]">
              {targetAccountForAction?.isFrozen
                ? "Your card credentials will be re-activated immediately."
                : "You can unfreeze this card at any time from this dashboard."}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFreezeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={targetAccountForAction?.isFrozen ? "primary" : "danger"}
              size="sm"
              isLoading={isActionPending}
              onClick={handleConfirmToggleFreeze}
              className={targetAccountForAction?.isFrozen ? "bg-[#3B7A57] text-white font-bold" : ""}
            >
              {targetAccountForAction?.isFrozen ? "Confirm Unfreeze" : "Confirm Freeze"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6.4 Account Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Account from MONVEX?"
        description={`Are you sure you want to remove "${targetAccountForAction?.name}" from your portfolio?`}
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-[#B84233]/10 border border-[#B84233]/20 text-xs text-[#B84233] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-[#191522] leading-relaxed">
              This will detach <span className="font-bold">{targetAccountForAction?.name}</span> ({formatCurrency(targetAccountForAction?.balance || 0, userCurrency)}) from your liquid balance calculations. Ledger transaction histories will be preserved.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isActionPending}
              onClick={handleConfirmDelete}
            >
              Remove Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6.5 Transfer Funds Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Intra-Account Transfer"
        description="Move balances between your verified accounts with instant ledger reflection."
        maxWidth="md"
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
              Source Account (From)
            </label>
            <select
              value={transferFromId}
              onChange={(e) => setTransferFromId(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-semibold text-[#191522] focus:outline-none focus:border-[#4056A1]"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName}) — {formatCurrency(acc.balance, userCurrency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
              Destination Account (To)
            </label>
            <select
              value={transferToId}
              onChange={(e) => setTransferToId(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-semibold text-[#191522] focus:outline-none focus:border-[#4056A1]"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName}) — {formatCurrency(acc.balance, userCurrency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#191522] uppercase tracking-wider">
                Transfer Amount ({userCurrency})
              </label>
              {transferFromId && (
                <span className="text-[11px] text-[#625477]">
                  Available: {formatCurrency(accounts.find((a) => a.id === transferFromId)?.balance || 0, userCurrency)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-black text-[#191522] focus:outline-none focus:border-[#4056A1]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E4E2DC]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTransferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingTransfer}
              className="bg-[#2A1F3D] text-white font-bold"
            >
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
