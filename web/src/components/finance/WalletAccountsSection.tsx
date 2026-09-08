'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Settings2,
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

  // ---------------------------------------------------------------------------
  // Core Accounts State
  // ---------------------------------------------------------------------------
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Active View Tab for selected account
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CARD' | 'ACTIVITY' | 'SETTINGS'>('OVERVIEW');

  // Directory Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BANK' | 'CREDIT' | 'WALLET'>('ALL');

  // Security & Display States
  const [isCardNumberRevealed, setIsCardNumberRevealed] = useState(false);
  const [isCvvRevealed, setIsCvvRevealed] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Active item being modified
  const [targetAccount, setTargetAccount] = useState<AccountItem | null>(null);
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
  const [addCardFlipped, setAddCardFlipped] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Card & Account Form State
  const [editBankName, setEditBankName] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editCardNumber, setEditCardNumber] = useState('');
  const [editCardholderName, setEditCardholderName] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editCvv, setEditCvv] = useState('');
  const [editTheme, setEditTheme] = useState<CardTheme>('obsidian');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Transfer Form State
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Compact Purchase Impact Tool State
  const [impactItem, setImpactItem] = useState('');
  const [impactCost, setImpactCost] = useState('');
  const [impactResult, setImpactResult] = useState<{
    item: string;
    cost: number;
    impactRatio: number;
    remainingBalance: number;
    safety: 'SAFE' | 'MODERATE' | 'RISK';
    message: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Data Fetching & Normalization
  // ---------------------------------------------------------------------------
  const fetchUserAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
        const last4 = meta.last4 || (rawNum ? rawNum.slice(-4) : (ast.name ? String(ast.name.length * 111).slice(-4).padStart(4, '0') : '1639'));
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
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserAccounts();
  }, [fetchUserAccounts]);

  // Selected Account
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Reset visibility when switching accounts
  useEffect(() => {
    setIsCardNumberRevealed(false);
    setIsCvvRevealed(false);
    setIsCardFlipped(false);
  }, [selectedAccountId]);

  // ---------------------------------------------------------------------------
  // 2. Financial Metrics (Derived 100% from backend state)
  // ---------------------------------------------------------------------------
  const totalPortfolioLiquidity = useMemo(() => {
    return accounts.reduce((sum, a) => (a.type === 'CREDIT' ? sum : sum + a.balance), 0);
  }, [accounts]);

  const cashflowSummary = useMemo(() => {
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

    return {
      net: inflows - outflows,
      inflows,
      outflows,
      count: targetTx.length,
    };
  }, [realTransactions]);

  const creditSummary = useMemo(() => {
    const creditAccounts = accounts.filter((a) => a.type === 'CREDIT');
    const outstanding = creditAccounts.reduce((sum, a) => sum + a.balance, 0);
    const limit = creditAccounts.reduce((sum, a) => sum + (a.creditLimit || a.balance * 2), 0);
    return {
      outstanding,
      count: creditAccounts.length,
      available: Math.max(0, limit - outstanding),
    };
  }, [accounts]);

  // ---------------------------------------------------------------------------
  // 3. Filtered Account List
  // ---------------------------------------------------------------------------
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (filterType === 'BANK') {
      result = result.filter((a) => a.type === 'CHECKING' || a.type === 'SAVINGS');
    } else if (filterType === 'CREDIT') {
      result = result.filter((a) => a.type === 'CREDIT');
    } else if (filterType === 'WALLET') {
      result = result.filter((a) => a.type === 'WALLET' || a.type === 'CASH');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.bankName.toLowerCase().includes(q) ||
          a.accountNumber.includes(q)
      );
    }

    return result;
  }, [accounts, filterType, searchQuery]);

  // Selected Account Transactions with cleaned-up human names
  const accountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    const bName = selectedAccount.bankName.toLowerCase();
    const aName = selectedAccount.name.toLowerCase();

    const matches = realTransactions.filter((t) => {
      const notes = (t.notes || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const inst = (t.institution || '').toLowerCase();
      return inst.includes(bName) || desc.includes(bName) || notes.includes(aName);
    });

    const list = matches.length > 0 ? matches : realTransactions;

    // Sanitize and format transactions for readable presentation
    return list.slice(0, 8).map((tx, idx) => {
      let title = tx.description || tx.merchant || 'General Transaction';
      // If title looks like a UUID or raw hash, make it clean
      if (title.length > 28 && title.includes('-')) {
        title = tx.category ? `${tx.category} Payment` : 'Card Transaction';
      }

      const isIncome = tx.type === 'INCOME';
      const amt = parseFloat(tx.amount) || 0;
      const dateObj = new Date(tx.date || tx.created_at);
      const isToday = !isNaN(dateObj.getTime()) && dateObj.toDateString() === new Date().toDateString();
      const dateLabel = isToday
        ? 'Today'
        : !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'Recent';

      return {
        id: tx.id || String(idx),
        title,
        category: tx.category || (isIncome ? 'Income' : 'General'),
        dateLabel,
        amount: amt,
        isIncome,
      };
    });
  }, [selectedAccount, realTransactions]);

  // ---------------------------------------------------------------------------
  // 4. Action Handlers: Copy, Reveal, Edit, Freeze, Delete, Transfer
  // ---------------------------------------------------------------------------
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`✓ Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open Edit Modal with full card fields populated
  const handleOpenEditModal = (acc: AccountItem) => {
    setTargetAccount(acc);
    setEditBankName(acc.bankName);
    setEditAccountName(acc.name);
    setEditBalance(String(acc.balance));
    setEditCardNumber(acc.rawCardNumber ? formatCardNumber(acc.rawCardNumber) : acc.fullCardNumber);
    setEditCardholderName(acc.cardholderName || '');
    setEditExpiryDate(acc.expiryDate || '');
    setEditCvv(acc.cvv || '');
    setEditTheme(acc.theme);
    setIsEditModalOpen(true);
  };

  // Submit Edit Card & Account
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount) return;

    if (!editBankName.trim() || !editAccountName.trim() || !editBalance) {
      toast.error('Please enter Bank Name, Account Nickname, and Balance.');
      return;
    }

    const val = parseFloat(editBalance) || 0;
    const cleanCardDigits = editCardNumber.replace(/\D/g, '');
    const last4 = cleanCardDigits.length >= 4 ? cleanCardDigits.slice(-4) : targetAccount.accountNumber;
    const fullNum = cleanCardDigits.length > 0 ? formatCardNumber(cleanCardDigits) : `•••• •••• •••• ${last4}`;
    const detectedNet = cleanCardDigits.length > 0 ? detectCardNetwork(cleanCardDigits) : targetAccount.network;
    const cardholder = editCardholderName.trim() || (user?.username ? user.username.toUpperCase() : 'MONVEX HOLDER');
    const expiry = editExpiryDate.trim() || '12/28';
    const cvv = editCvv.trim() || '882';

    setIsSubmittingEdit(true);
    try {
      const meta = {
        last4,
        raw_card_number: cleanCardDigits || targetAccount.rawCardNumber,
        full_card_number: fullNum,
        cardholder_name: cardholder,
        expiry_date: expiry,
        cvv,
        network: detectedNet,
        theme: editTheme,
        is_frozen: targetAccount.isFrozen,
        account_type: targetAccount.type,
      };

      await api.updateAsset(targetAccount.id, {
        name: editAccountName.trim(),
        institution: editBankName.trim(),
        value: val,
        notes: JSON.stringify(meta),
      });

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === targetAccount.id
            ? {
                ...a,
                name: editAccountName.trim(),
                bankName: editBankName.trim(),
                balance: val,
                accountNumber: last4,
                fullCardNumber: fullNum,
                rawCardNumber: cleanCardDigits || targetAccount.rawCardNumber,
                cardholderName: cardholder,
                expiryDate: expiry,
                cvv,
                network: detectedNet,
                theme: editTheme,
              }
            : a
        )
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      setIsEditModalOpen(false);
      toast.success(`✓ Card and account details for "${editAccountName}" updated.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update account.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Freeze Modal
  const handleOpenFreezeModal = (acc: AccountItem) => {
    setTargetAccount(acc);
    setIsFreezeModalOpen(true);
  };

  // Confirm Freeze Toggle
  const handleConfirmFreeze = async () => {
    if (!targetAccount) return;
    setIsActionPending(true);
    const newFreeze = !targetAccount.isFrozen;

    const meta = {
      last4: targetAccount.accountNumber,
      raw_card_number: targetAccount.rawCardNumber,
      full_card_number: targetAccount.fullCardNumber,
      cardholder_name: targetAccount.cardholderName,
      expiry_date: targetAccount.expiryDate,
      cvv: targetAccount.cvv,
      network: targetAccount.network,
      theme: targetAccount.theme,
      is_frozen: newFreeze,
      account_type: targetAccount.type,
    };

    try {
      await api.updateAsset(targetAccount.id, { notes: JSON.stringify(meta) });
      setAccounts((prev) =>
        prev.map((a) => (a.id === targetAccount.id ? { ...a, isFrozen: newFreeze } : a))
      );
      setIsFreezeModalOpen(false);
      toast.info(newFreeze ? `🔒 ${targetAccount.name} is now frozen.` : `✓ ${targetAccount.name} is unfrozen.`);
    } catch {
      toast.error('Unable to update card status.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (acc: AccountItem) => {
    setTargetAccount(acc);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!targetAccount) return;
    setIsActionPending(true);
    try {
      await api.deleteAsset(targetAccount.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });

      setAccounts((prev) => prev.filter((a) => a.id !== targetAccount.id));
      if (selectedAccountId === targetAccount.id) {
        const remaining = accounts.filter((a) => a.id !== targetAccount.id);
        setSelectedAccountId(remaining[0]?.id || null);
      }
      setIsDeleteModalOpen(false);
      toast.success(`✓ "${targetAccount.name}" removed.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove account.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Create New Account / Card Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBankName.trim() || !addAccountName.trim() || !addBalance) {
      toast.error('Please fill in Bank Name, Account Nickname, and Balance.');
      return;
    }

    const val = parseFloat(addBalance) || 0;
    const cleanDigits = addCardNumber.replace(/\D/g, '');
    const last4 = cleanDigits.length >= 4 ? cleanDigits.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
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

      // Reset
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

  // Transfer Funds
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount) || 0;
    if (amt <= 0) {
      toast.error('Please enter a transfer amount.');
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

  // Analyze Compact Purchase Impact
  const handleAnalyzeImpact = (presetCost?: number, presetItem?: string) => {
    const cost = presetCost !== undefined ? presetCost : parseFloat(impactCost) || 0;
    const item = presetItem || impactItem.trim() || 'Planned Purchase';

    if (cost <= 0) {
      toast.error('Please enter a purchase price.');
      return;
    }

    if (totalPortfolioLiquidity <= 0) {
      setImpactResult({
        item,
        cost,
        impactRatio: 100,
        remainingBalance: 0,
        safety: 'RISK',
        message: 'No available liquid balance detected. Link a funded account before planning purchases.',
      });
      return;
    }

    const remaining = totalPortfolioLiquidity - cost;
    const ratio = Math.min(100, Math.round((cost / totalPortfolioLiquidity) * 100));

    let safety: 'SAFE' | 'MODERATE' | 'RISK' = 'SAFE';
    let message = '';

    if (ratio <= 10) {
      safety = 'SAFE';
      message = `Safe purchase. Consumes only ${ratio}% of liquid capital with negligible strain on your reserves.`;
    } else if (ratio <= 30) {
      safety = 'MODERATE';
      message = `Moderate commitment (${ratio}% of total liquidity). Verify pending monthly bills before completing.`;
    } else {
      safety = 'RISK';
      message = `High cashflow risk. This acquisition will absorb ${ratio}% of your total liquid reserves.`;
    }

    setImpactResult({ item, cost, impactRatio: ratio, remainingBalance: remaining, safety, message });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full space-y-5">
      {/* =====================================================================
          1. HEADER & COMPACT ACTIONS
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight">
              Accounts & Cards
            </h2>
            <Badge variant="neutral" size="sm" className="font-mono text-xs">
              {accounts.length} {accounts.length === 1 ? 'Linked' : 'Linked'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#625477] mt-0.5">
            Centralized banking command for liquid balances, cards, and capital movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white font-bold text-xs shadow-xs"
          >
            + Add Account
          </Button>
        </div>
      </div>

      {/* =====================================================================
          2. COMPACT SUMMARY STRIP (Full-Width, High Density)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Total Liquid Capital */}
        <div className="rounded-xl bg-white border border-[#E4E2DC] p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#625477] block">
              Total Liquid Balance
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight mt-0.5 tabular-nums truncate">
              {formatCurrency(totalPortfolioLiquidity, userCurrency)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#625477]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B7A57]" />
              <span>{accounts.length} linked accounts</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#F6F5F2] flex items-center justify-center text-[#2A1F3D] shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        {/* Monthly Net Cashflow */}
        <div className="rounded-xl bg-white border border-[#E4E2DC] p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#625477] block">
              Monthly Cashflow
            </span>
            <div className={cn(
              "text-xl sm:text-2xl font-black tracking-tight mt-0.5 tabular-nums truncate",
              cashflowSummary.net >= 0 ? "text-[#191522]" : "text-[#B84233]"
            )}>
              {cashflowSummary.net >= 0 ? '+' : ''}{formatCurrency(cashflowSummary.net, userCurrency)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#625477]">
              {cashflowSummary.count > 0 ? (
                <span>{cashflowSummary.count} transactions this month</span>
              ) : (
                <span>No transactions this month</span>
              )}
            </div>
          </div>
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            cashflowSummary.net >= 0 ? "bg-[#3B7A57]/10 text-[#3B7A57]" : "bg-[#B84233]/10 text-[#B84233]"
          )}>
            {cashflowSummary.net >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Credit Facilities */}
        <div className="rounded-xl bg-white border border-[#E4E2DC] p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#625477] block">
              Credit Outstanding
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#191522] tracking-tight mt-0.5 tabular-nums truncate">
              {formatCurrency(creditSummary.outstanding, userCurrency)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#625477]">
              <span>{creditSummary.count} credit cards linked</span>
              {creditSummary.available > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[#3B7A57] font-semibold">{formatCurrency(creditSummary.available, userCurrency)} avail</span>
                </>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#F6F5F2] flex items-center justify-center text-[#2A1F3D] shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. ACCOUNT SELECTION (Adaptive Full-Width Grid)
          ===================================================================== */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-8 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-6 h-6 text-[#2A1F3D] animate-spin mb-2" />
          <p className="text-xs font-bold text-[#191522]">Loading verified accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-white border border-dashed border-[#E4E2DC] p-8 text-center">
          <Building2 className="w-8 h-8 text-[#2A1F3D] mx-auto mb-2" />
          <h3 className="text-base font-black text-[#191522]">No accounts linked</h3>
          <p className="text-xs text-[#625477] max-w-sm mx-auto mt-0.5 mb-4">
            Link your bank checking, savings, credit cards, or digital wallets to track unified liquidity.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#2A1F3D] text-white font-bold text-xs"
          >
            + Link First Account
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* If Multiple Accounts, show Filter Tabs & Search */}
          {accounts.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 p-1 bg-[#F6F5F2] rounded-xl border border-[#E4E2DC] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    filterType === 'ALL' ? "bg-white text-[#191522] shadow-xs" : "text-[#625477] hover:text-[#191522]"
                  )}
                >
                  All ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('BANK')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    filterType === 'BANK' ? "bg-white text-[#191522] shadow-xs" : "text-[#625477] hover:text-[#191522]"
                  )}
                >
                  Banks ({accounts.filter((a) => a.type === 'CHECKING' || a.type === 'SAVINGS').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('CREDIT')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    filterType === 'CREDIT' ? "bg-white text-[#191522] shadow-xs" : "text-[#625477] hover:text-[#191522]"
                  )}
                >
                  Cards ({accounts.filter((a) => a.type === 'CREDIT').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('WALLET')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    filterType === 'WALLET' ? "bg-white text-[#191522] shadow-xs" : "text-[#625477] hover:text-[#191522]"
                  )}
                >
                  Wallets ({accounts.filter((a) => a.type === 'WALLET' || a.type === 'CASH').length})
                </button>
              </div>

              <div className="relative sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#625477]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search account or last 4..."
                  className="w-full rounded-xl bg-white border border-[#E4E2DC] pl-8 pr-3 py-1 text-xs text-[#191522] focus:outline-none focus:border-[#4056A1]"
                />
              </div>
            </div>
          )}

          {/* Full-Width Account Cards Grid (Adapts to 1, 2, or 3 cols with zero dead space) */}
          <div className={cn(
            "grid gap-3",
            filteredAccounts.length === 1 ? "grid-cols-1" :
            filteredAccounts.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {filteredAccounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              const isCredit = acc.type === 'CREDIT';

              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    "group relative rounded-2xl p-4 transition-all cursor-pointer border text-left flex flex-col justify-between gap-3",
                    isSelected
                      ? "bg-white border-[#2A1F3D] ring-2 ring-[#2A1F3D]/10 shadow-sm"
                      : "bg-white border-[#E4E2DC] hover:border-[#625477]/40 hover:bg-[#FAF9F7]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
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
                        <span className="text-xs font-bold uppercase tracking-wider text-[#625477] block truncate">
                          {acc.bankName}
                        </span>
                        <h4 className="text-sm font-black text-[#191522] truncate group-hover:text-[#4056A1] transition-colors">
                          {acc.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {acc.isFrozen ? (
                        <Badge variant="rose" size="sm" className="text-[10px]">
                          <Lock className="w-2.5 h-2.5" /> Frozen
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm" className="text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-[#E4E2DC]/60 pt-3 mt-1">
                    <div>
                      <div className="text-[11px] text-[#625477] font-semibold">
                        {isCredit ? 'Outstanding Balance' : 'Available Balance'}
                      </div>
                      <div className="text-lg sm:text-xl font-black text-[#191522] tabular-nums mt-0.5">
                        {formatCurrency(acc.balance, userCurrency)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs text-[#625477] font-bold">
                        •••• {acc.accountNumber}
                      </div>
                      <div className="text-[10px] text-[#2A1F3D] font-bold uppercase tracking-wider mt-0.5">
                        {isSelected ? '● Managing' : 'Click to Manage'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Link another account tile when 2+ accounts */}
            {filteredAccounts.length >= 2 && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-2xl border-2 border-dashed border-[#E4E2DC] hover:border-[#625477] p-4 text-center transition-colors flex flex-col items-center justify-center gap-2 bg-[#FAF9F7]/60 group"
              >
                <div className="w-9 h-9 rounded-full bg-white border border-[#E4E2DC] flex items-center justify-center text-[#2A1F3D] group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#625477] group-hover:text-[#191522]">
                  Link Another Account or Card
                </span>
              </button>
            )}
          </div>

          {/* =====================================================================
              4. ACTIVE ACCOUNT DETAIL WORKSPACE (Full-Width, Tabbed Navigation)
              ===================================================================== */}
          {selectedAccount && (
            <div className="rounded-2xl bg-white border border-[#E4E2DC] shadow-xs overflow-hidden">
              {/* Account Workspace Header Banner */}
              <div className="p-5 border-b border-[#E4E2DC] bg-[#FAF9F7] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0",
                    selectedAccount.theme === 'obsidian' && "bg-[#191522]",
                    selectedAccount.theme === 'sapphire' && "bg-[#1E3A8A]",
                    selectedAccount.theme === 'emerald' && "bg-[#064E3B]",
                    selectedAccount.theme === 'amber' && "bg-[#78350F]",
                    selectedAccount.theme === 'gold' && "bg-[#854D0E]",
                    selectedAccount.theme === 'platinum' && "bg-[#334155]"
                  )}>
                    {selectedAccount.bankName.slice(0, 3).toUpperCase()}
                  </div>

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
                      <Badge variant="neutral" size="sm" className="text-[10px] uppercase font-semibold">
                        {selectedAccount.type}
                      </Badge>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[#191522] tracking-tight mt-0.5">
                      {selectedAccount.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#625477] font-semibold block">
                      {selectedAccount.type === 'CREDIT' ? 'Outstanding Balance' : 'Verified Available Balance'}
                    </span>
                    <div className="text-2xl font-black text-[#191522] tabular-nums mt-0.5">
                      {formatCurrency(selectedAccount.balance, userCurrency)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEditModal(selectedAccount)}
                      className="text-xs font-bold border-[#E4E2DC] hover:bg-white"
                    >
                      Edit
                    </Button>

                    <Button
                      variant={selectedAccount.isFrozen ? 'success' : 'outline'}
                      size="sm"
                      leftIcon={selectedAccount.isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenFreezeModal(selectedAccount)}
                      className={cn(
                        "text-xs font-bold",
                        selectedAccount.isFrozen
                          ? "bg-[#3B7A57] text-white"
                          : "border-[#E4E2DC] text-[#B84233] hover:bg-[#FEE2E2]/30"
                      )}
                    >
                      {selectedAccount.isFrozen ? 'Unfreeze' : 'Freeze'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-[#E4E2DC] px-5 flex items-center gap-6 overflow-x-auto bg-white">
                {[
                  { id: 'OVERVIEW', label: 'Overview' },
                  { id: 'CARD', label: 'Card & Security' },
                  { id: 'ACTIVITY', label: `Recent Activity (${accountTransactions.length})` },
                  { id: 'SETTINGS', label: 'Account Settings' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-[#2A1F3D] text-[#191522]"
                        : "border-transparent text-[#625477] hover:text-[#191522]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-5">
                {/* -------------------------------------------------------------
                    TAB 1: OVERVIEW (Balanced 2-Column: Card & Transactions)
                    ------------------------------------------------------------- */}
                {activeTab === 'OVERVIEW' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Col (5 cols): Banking Card View & Core Actions */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col items-center">
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
                          isFlipped={isCardFlipped}
                          showNumber={isCardNumberRevealed}
                          onFlipChange={setIsCardFlipped}
                        />
                      </div>

                      {/* Explicit Contextual Card Controls */}
                      <div className="w-full max-w-[340px] space-y-2">
                        {/* Number reveal & copy bar */}
                        <div className="rounded-xl bg-[#F6F5F2] border border-[#E4E2DC] p-3 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#625477] font-semibold uppercase block">
                              Card Number
                            </span>
                            <span className="font-mono font-bold text-[#191522] truncate text-xs block">
                              {isCardNumberRevealed
                                ? (selectedAccount.rawCardNumber ? formatCardNumber(selectedAccount.rawCardNumber) : selectedAccount.fullCardNumber)
                                : `•••• •••• •••• ${selectedAccount.accountNumber}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsCardNumberRevealed((prev) => !prev)}
                              className="px-2 py-1 rounded-lg bg-white border border-[#E4E2DC] hover:bg-[#F6F5F2] text-[11px] font-bold text-[#191522] flex items-center gap-1 shadow-2xs"
                            >
                              {isCardNumberRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isCardNumberRevealed ? 'Mask' : 'Show'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedAccount.rawCardNumber || selectedAccount.fullCardNumber, 'Card Number')}
                              className="px-2 py-1 rounded-lg bg-white border border-[#E4E2DC] hover:bg-[#F6F5F2] text-[11px] font-bold text-[#191522] flex items-center gap-1 shadow-2xs"
                            >
                              {copiedField === 'Card Number' ? <Check className="w-3 h-3 text-[#3B7A57]" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>

                        {/* Action buttons grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsCardFlipped((prev) => !prev)}
                            className="p-2.5 rounded-xl border border-[#E4E2DC] hover:bg-[#F6F5F2] text-xs font-bold text-[#191522] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-[#625477]" />
                            <span>Flip to {isCardFlipped ? 'Front' : 'CVV'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(selectedAccount)}
                            className="p-2.5 rounded-xl border border-[#E4E2DC] hover:bg-[#F6F5F2] text-xs font-bold text-[#191522] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#625477]" />
                            <span>Edit Details</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Col (7 cols): Clean Readable Recent Transactions */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#E4E2DC]">
                        <div>
                          <h4 className="text-sm font-black text-[#191522] tracking-tight">
                            Recent Transactions
                          </h4>
                          <span className="text-[11px] text-[#625477]">
                            Recent ledger activity associated with your financial accounts
                          </span>
                        </div>
                        <Link
                          href="/transactions"
                          className="text-xs font-bold text-[#4056A1] hover:underline flex items-center gap-1"
                        >
                          <span>View All in Ledger</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {accountTransactions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#E4E2DC] p-8 text-center bg-[#FAF9F7]">
                          <Receipt className="w-6 h-6 text-[#625477] mx-auto mb-2" />
                          <p className="text-xs font-bold text-[#191522]">No transactions logged yet</p>
                          <p className="text-[11px] text-[#625477] mt-0.5">
                            Transactions added via ledger or scans will automatically reflect here.
                          </p>
                          {onAddTransaction && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onAddTransaction}
                              className="mt-3 text-xs"
                            >
                              + Add Transaction
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {accountTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="p-3 rounded-xl bg-white border border-[#E4E2DC] hover:border-[#625477]/40 hover:bg-[#FAF9F7] transition-all flex items-center justify-between gap-3 text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  tx.isIncome ? "bg-[#3B7A57]/10 text-[#3B7A57]" : "bg-[#F6F5F2] text-[#191522]"
                                )}>
                                  {tx.isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>

                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-[#191522] truncate">
                                    {tx.title}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#625477] mt-0.5">
                                    <span className="font-semibold text-[#191522]">{tx.category}</span>
                                    <span>·</span>
                                    <span>{tx.dateLabel}</span>
                                  </div>
                                </div>
                              </div>

                              <div className={cn(
                                "font-black text-xs sm:text-sm tabular-nums shrink-0",
                                tx.isIncome ? "text-[#3B7A57]" : "text-[#191522]"
                              )}>
                                {tx.isIncome ? '+' : '-'}{formatCurrency(tx.amount, userCurrency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 2: CARD & SECURITY (Dedicated Full Card Management)
                    ------------------------------------------------------------- */}
                {activeTab === 'CARD' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 flex flex-col items-center">
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
                          isFlipped={isCardFlipped}
                          showNumber={isCardNumberRevealed}
                          onFlipChange={setIsCardFlipped}
                        />
                      </div>
                      <p className="text-[11px] text-[#625477] mt-2.5 text-center">
                        Click card or use controls to inspect front and back faces.
                      </p>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                      <div className="rounded-xl bg-[#FAF9F7] border border-[#E4E2DC] p-4 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#191522]">
                          Security Credentials
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* 16 Digit Display */}
                          <div className="p-3 bg-white rounded-xl border border-[#E4E2DC]">
                            <span className="text-[10px] text-[#625477] font-semibold uppercase block">
                              Card Number
                            </span>
                            <div className="font-mono font-bold text-sm text-[#191522] mt-1 truncate">
                              {isCardNumberRevealed
                                ? (selectedAccount.rawCardNumber ? formatCardNumber(selectedAccount.rawCardNumber) : selectedAccount.fullCardNumber)
                                : `•••• •••• •••• ${selectedAccount.accountNumber}`}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => setIsCardNumberRevealed((prev) => !prev)}
                                className="text-[11px] font-bold text-[#4056A1] hover:underline flex items-center gap-1"
                              >
                                {isCardNumberRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isCardNumberRevealed ? 'Mask' : 'Show Full Number'}</span>
                              </button>
                              <span className="text-[#E4E2DC]">|</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedAccount.rawCardNumber || selectedAccount.fullCardNumber, 'Card Number')}
                                className="text-[11px] font-bold text-[#625477] hover:text-[#191522] flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                          </div>

                          {/* CVV Display */}
                          <div className="p-3 bg-white rounded-xl border border-[#E4E2DC]">
                            <span className="text-[10px] text-[#625477] font-semibold uppercase block">
                              Security Code (CVV)
                            </span>
                            <div className="font-mono font-bold text-sm text-[#191522] mt-1">
                              {isCvvRevealed ? (selectedAccount.cvv || '882') : '•••'}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => setIsCvvRevealed((prev) => !prev)}
                                className="text-[11px] font-bold text-[#4056A1] hover:underline flex items-center gap-1"
                              >
                                {isCvvRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isCvvRevealed ? 'Hide' : 'Reveal CVV'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Expiry */}
                          <div className="p-3 bg-white rounded-xl border border-[#E4E2DC]">
                            <span className="text-[10px] text-[#625477] font-semibold uppercase block">
                              Valid Thru
                            </span>
                            <div className="font-mono font-bold text-sm text-[#191522] mt-1">
                              {selectedAccount.expiryDate || '12/28'}
                            </div>
                          </div>

                          {/* Cardholder */}
                          <div className="p-3 bg-white rounded-xl border border-[#E4E2DC]">
                            <span className="text-[10px] text-[#625477] font-semibold uppercase block">
                              Cardholder Name
                            </span>
                            <div className="font-medium uppercase text-xs text-[#191522] mt-1 truncate">
                              {selectedAccount.cardholderName || 'CARDHOLDER'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenEditModal(selectedAccount)}
                            className="bg-[#2A1F3D] text-white font-bold text-xs"
                          >
                            Edit Card Details & Number
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 3: ACTIVITY (Extended Ledger View)
                    ------------------------------------------------------------- */}
                {activeTab === 'ACTIVITY' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC]">
                      <div>
                        <h4 className="text-sm font-black text-[#191522]">
                          Account Ledger Activity
                        </h4>
                        <span className="text-xs text-[#625477]">
                          All income, transfers, and expense entries tracked for this account.
                        </span>
                      </div>
                      <Link
                        href="/transactions"
                        className="text-xs font-bold text-[#4056A1] hover:underline flex items-center gap-1"
                      >
                        <span>Open Full Transactions Table</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="space-y-2">
                      {accountTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              tx.isIncome ? "bg-[#3B7A57]/10 text-[#3B7A57]" : "bg-[#F6F5F2] text-[#191522]"
                            )}>
                              {tx.isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-[#191522]">{tx.title}</div>
                              <div className="text-[10px] text-[#625477]">{tx.category} · {tx.dateLabel}</div>
                            </div>
                          </div>
                          <div className={cn(
                            "font-bold tabular-nums",
                            tx.isIncome ? "text-[#3B7A57]" : "text-[#191522]"
                          )}>
                            {tx.isIncome ? '+' : '-'}{formatCurrency(tx.amount, userCurrency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 4: SETTINGS (Management & Deletion)
                    ------------------------------------------------------------- */}
                {activeTab === 'SETTINGS' && (
                  <div className="max-w-xl space-y-4">
                    <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#E4E2DC] space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#191522]">
                        Account Management
                      </h4>
                      <p className="text-xs text-[#625477]">
                        Update account metadata, customize card finish, or freeze transaction capabilities.
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenEditModal(selectedAccount)}
                          className="text-xs font-bold"
                        >
                          Edit Details
                        </Button>

                        <Button
                          variant={selectedAccount.isFrozen ? "success" : "outline"}
                          size="sm"
                          leftIcon={selectedAccount.isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenFreezeModal(selectedAccount)}
                          className={cn("text-xs font-bold", selectedAccount.isFrozen ? "bg-[#3B7A57] text-white" : "")}
                        >
                          {selectedAccount.isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#B84233]/30 bg-[#FEE2E2]/20 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#B84233]">
                        Danger Zone
                      </h4>
                      <p className="text-xs text-[#191522]/80 leading-relaxed">
                        Permanently detach this account from your portfolio. Your recorded transaction history will remain intact.
                      </p>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenDeleteModal(selectedAccount)}
                        className="text-xs font-bold mt-1"
                      >
                        Remove Account
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          5. COMPACT PURCHASE IMPACT TOOL (Natural Content-Sized)
          ===================================================================== */}
      <div className="rounded-xl bg-white border border-[#E4E2DC] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E2DC] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2A1F3D]" />
              <h3 className="text-sm font-black text-[#191522] tracking-tight">
                Purchase Impact Analysis
              </h3>
            </div>
            <p className="text-xs text-[#625477] mt-0.5">
              Instantly evaluate discretionary spending against your verified liquid reserves.
            </p>
          </div>

          <Badge variant="neutral" size="sm" className="font-mono text-xs self-start sm:self-auto">
            Reserves: {formatCurrency(totalPortfolioLiquidity, userCurrency)}
          </Badge>
        </div>

        {/* Compact Form */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold text-[#625477] uppercase tracking-wider mb-1">
              What are you planning to buy?
            </label>
            <input
              type="text"
              value={impactItem}
              onChange={(e) => setImpactItem(e.target.value)}
              placeholder="e.g. Flight Tickets, Smart Display"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-1.5 text-xs text-[#191522] focus:outline-none focus:border-[#4056A1]"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[10px] font-bold text-[#625477] uppercase tracking-wider mb-1">
              Amount ({userCurrency})
            </label>
            <input
              type="number"
              value={impactCost}
              onChange={(e) => setImpactCost(e.target.value)}
              placeholder="5000"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-1.5 text-xs font-black text-[#191522] focus:outline-none focus:border-[#4056A1]"
            />
          </div>

          <div className="sm:col-span-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleAnalyzeImpact()}
              className="w-full bg-[#2A1F3D] text-white font-bold text-xs py-2"
            >
              Analyze Impact
            </Button>
          </div>
        </div>

        {/* Presets Strip */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#625477]">
          <span>Quick presets:</span>
          {[
            { label: '₹2,500', cost: 2500, name: 'Minor Purchase' },
            { label: '₹15,000', cost: 15000, name: 'Tech Hardware' },
            { label: '₹50,000', cost: 50000, name: 'Major Outlay' },
          ].map((p) => (
            <button
              key={p.cost}
              type="button"
              onClick={() => {
                setImpactItem(p.name);
                setImpactCost(String(p.cost));
                handleAnalyzeImpact(p.cost, p.name);
              }}
              className="px-2 py-0.5 rounded-lg bg-[#F6F5F2] hover:bg-[#E4E2DC] text-[#191522] font-semibold border border-[#E4E2DC] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Compact Result Banner (Only shown if analyzed) */}
        {impactResult && (
          <div className={cn(
            "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-2",
            impactResult.safety === 'SAFE' && "bg-[#3B7A57]/10 border-[#3B7A57]/20 text-[#3B7A57]",
            impactResult.safety === 'MODERATE' && "bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]",
            impactResult.safety === 'RISK' && "bg-[#B84233]/10 border-[#B84233]/20 text-[#B84233]"
          )}>
            <div className="flex items-start gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs uppercase tracking-wider">
                  {impactResult.item}: {formatCurrency(impactResult.cost, userCurrency)} ({impactResult.impactRatio}% of liquidity)
                </div>
                <div className="text-[11px] text-[#191522] mt-0.5 font-medium">
                  {impactResult.message}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] text-[#625477] uppercase font-bold">Remaining Buffer</div>
              <div className="text-sm font-black text-[#191522] tabular-nums">
                {formatCurrency(impactResult.remainingBalance, userCurrency)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          6. MODALS
          ===================================================================== */}

      {/* 6.1 Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Link Bank Account or Card"
        description="Connect your checking accounts, credit lines, or wallets."
        maxWidth="xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          <div className="flex justify-center pb-2">
            <div className="w-full max-w-[320px]">
              <BankingCardView
                bankName={addBankName || 'BANK INSTITUTION'}
                accountName={addAccountName || 'PRIMARY ACCOUNT'}
                cardholderName={addCardholderName || (user?.username ? user.username.toUpperCase() : 'MONVEX HOLDER')}
                cardNumber={addCardNumber ? formatCardNumber(addCardNumber) : '•••• •••• •••• 1639'}
                rawCardNumber={addCardNumber.replace(/\D/g, '') || undefined}
                expiryDate={addExpiryDate || '12/28'}
                cvv={addCvv || '882'}
                balance={parseFloat(addBalance) || 0}
                currency={userCurrency}
                theme={addTheme}
                network={addCardNumber ? detectCardNetwork(addCardNumber) : 'VISA'}
                isCredit={addAccountType === 'CREDIT'}
                showControls={false}
                isFlipped={addCardFlipped}
                onFlipChange={setAddCardFlipped}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Bank Name <span className="text-[#B84233]">*</span>
              </label>
              <input
                type="text"
                required
                value={addBankName}
                onChange={(e) => setAddBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
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
                placeholder="e.g. Salary Account"
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
                <option value="CASH">Cash Reserve</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Verified Balance ({userCurrency}) <span className="text-[#B84233]">*</span>
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
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs uppercase text-[#191522] focus:outline-none focus:border-[#4056A1]"
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
                CVV
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
                    "h-7 rounded-lg border-2 capitalize text-[10px] font-bold transition-all",
                    themeName === 'obsidian' && "bg-[#191522] text-white",
                    themeName === 'sapphire' && "bg-[#1E3A8A] text-white",
                    themeName === 'emerald' && "bg-[#064E3B] text-white",
                    themeName === 'amber' && "bg-[#78350F] text-white",
                    themeName === 'gold' && "bg-[#854D0E] text-white",
                    themeName === 'platinum' && "bg-[#334155] text-white",
                    addTheme === themeName ? "border-[#4056A1] ring-2 ring-[#4056A1]/30 scale-105" : "border-transparent opacity-80"
                  )}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
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

      {/* 6.2 Edit Card Details & Account Modal (Full Functionality) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Card & Account Details"
        description="Update cardholder details, 16-digit number, expiry date, or balance."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Bank Name
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
                Card Number (16 Digits)
              </label>
              <input
                type="text"
                maxLength={19}
                value={editCardNumber}
                onChange={(e) => setEditCardNumber(formatCardNumber(e.target.value))}
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
                value={editCardholderName}
                onChange={(e) => setEditCardholderName(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs uppercase text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                Expiry Date (MM/YY)
              </label>
              <input
                type="text"
                maxLength={5}
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(formatExpiryDate(e.target.value))}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-mono text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
                CVV
              </label>
              <input
                type="password"
                maxLength={4}
                value={editCvv}
                onChange={(e) => setEditCvv(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-mono text-[#191522] focus:outline-none focus:border-[#4056A1]"
              />
            </div>

            <div className="sm:col-span-2">
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
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1.5">
              Card Finish Theme
            </label>
            <div className="grid grid-cols-6 gap-2">
              {(['obsidian', 'sapphire', 'emerald', 'amber', 'gold', 'platinum'] as CardTheme[]).map((themeName) => (
                <button
                  key={themeName}
                  type="button"
                  onClick={() => setEditTheme(themeName)}
                  className={cn(
                    "h-7 rounded-lg border-2 capitalize text-[10px] font-bold transition-all",
                    themeName === 'obsidian' && "bg-[#191522] text-white",
                    themeName === 'sapphire' && "bg-[#1E3A8A] text-white",
                    themeName === 'emerald' && "bg-[#064E3B] text-white",
                    themeName === 'amber' && "bg-[#78350F] text-white",
                    themeName === 'gold' && "bg-[#854D0E] text-white",
                    themeName === 'platinum' && "bg-[#334155] text-white",
                    editTheme === themeName ? "border-[#4056A1] ring-2 ring-[#4056A1]/30 scale-105" : "border-transparent opacity-80"
                  )}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
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

      {/* 6.3 Freeze Confirmation Modal */}
      <Modal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        title={targetAccount?.isFrozen ? "Unfreeze Card?" : "Freeze Card?"}
        description={
          targetAccount?.isFrozen
            ? `Re-enabling ${targetAccount?.name} will allow outgoing charges immediately.`
            : `Freezing ${targetAccount?.name} will temporarily suspend outgoing transactions.`
        }
        maxWidth="sm"
      >
        <div className="space-y-3 pt-2">
          <div className={cn(
            "p-3 rounded-xl border flex items-center gap-3 text-xs",
            targetAccount?.isFrozen ? "bg-[#3B7A57]/10 border-[#3B7A57]/20" : "bg-[#B84233]/10 border-[#B84233]/20"
          )}>
            {targetAccount?.isFrozen ? <Unlock className="w-5 h-5 text-[#3B7A57]" /> : <Lock className="w-5 h-5 text-[#B84233]" />}
            <span className="font-semibold text-[#191522]">
              {targetAccount?.isFrozen ? "Card credentials will be re-activated." : "You can unfreeze this card at any time."}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFreezeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={targetAccount?.isFrozen ? "primary" : "danger"}
              size="sm"
              isLoading={isActionPending}
              onClick={handleConfirmFreeze}
              className={targetAccount?.isFrozen ? "bg-[#3B7A57] text-white font-bold" : ""}
            >
              {targetAccount?.isFrozen ? "Confirm Unfreeze" : "Confirm Freeze"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6.4 Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Account?"
        description={`Are you sure you want to remove "${targetAccount?.name}"?`}
        maxWidth="sm"
      >
        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-xl bg-[#B84233]/10 border border-[#B84233]/20 text-xs text-[#191522] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B84233] shrink-0 mt-0.5" />
            <span>This will detach the account from your liquid balance calculations. Transaction records remain safe.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
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

      {/* 6.5 Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Intra-Account Transfer"
        description="Move balances between your verified accounts."
        maxWidth="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3 pt-2">
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
            <label className="block text-xs font-bold text-[#191522] uppercase tracking-wider mb-1">
              Transfer Amount ({userCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3 py-2 text-xs font-black text-[#191522] focus:outline-none focus:border-[#4056A1]"
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
