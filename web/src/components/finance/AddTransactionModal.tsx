'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { cn } from '@/lib/utils';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTransaction?: any;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTransaction,
}) => {
  const toast = useToast();
  const isEdit = Boolean(initialTransaction && initialTransaction.id);

  // Mode: 'smart' (NLP/Voice) or 'manual'
  const [entryMode, setEntryMode] = useState<'smart' | 'manual'>(isEdit ? 'manual' : 'smart');

  // Smart natural language input
  const [nlpInput, setNlpInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryName, setCategoryName] = useState('Food & Dining');
  const [merchantName, setMerchantName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Categories list
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Robust Speech Recognition
  const {
    isListening,
    toggleListening: toggleVoiceRecording,
    stopListening,
  } = useSpeechRecognition({
    lang: 'en-IN',
    onResult: (liveText, isFinal) => {
      setNlpInput(liveText);
      parseSmartInput(liveText);
    },
  });

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then(setCategories).catch(() => {});
      setErrorMsg('');

      if (initialTransaction) {
        setEntryMode('manual');
        setAmount(String(initialTransaction.amount || ''));
        setType(initialTransaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
        setCategoryName(initialTransaction.category_name || initialTransaction.category?.name || 'Food & Dining');
        setMerchantName(initialTransaction.merchant_name || initialTransaction.merchant?.name || '');
        setDescription(initialTransaction.description || '');
        if (initialTransaction.date) {
          setDate(initialTransaction.date.split('T')[0]);
        }
      } else {
        setEntryMode('smart');
        setAmount('');
        setType('EXPENSE');
        setCategoryName('Food & Dining');
        setMerchantName('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      stopListening();
    }
  }, [isOpen, initialTransaction, stopListening]);

  // Smart Parser
  const parseSmartInput = async (text: string) => {
    if (!text || text.trim().length < 3) return;
    setIsParsing(true);
    try {
      const parsed = await api.parseNaturalTransaction(text);
      if (parsed) {
        if (parsed.amount) setAmount(String(parsed.amount));
        if (parsed.type) setType(parsed.type);
        if (parsed.category || parsed.category_name) {
          setCategoryName(parsed.category || parsed.category_name);
        }
        if (parsed.merchant || parsed.merchant_name) {
          setMerchantName(parsed.merchant || parsed.merchant_name);
        }
        if (parsed.description) setDescription(parsed.description);
        if (parsed.date) setDate(parsed.date.split('T')[0]);
      }
    } catch {
      // Manual fallback
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedCat = categories.find((c) => c.name === categoryName);
      const payload = {
        amount: numAmount,
        type,
        category: selectedCat?.id || null,
        category_name: categoryName,
        merchant_name: merchantName.trim() || undefined,
        description: description.trim() || merchantName.trim() || categoryName,
        date,
        source: isEdit ? (initialTransaction.source || 'MANUAL') : 'MANUAL',
      };

      if (isEdit) {
        await api.updateTransaction(initialTransaction.id, payload);
        toast.success('Transaction updated successfully.');
      } else {
        await api.createTransaction(payload);
        toast.success('Transaction recorded successfully.');
      }

      if (onSuccess) onSuccess();
      onClose();

      // Reset
      setNlpInput('');
      setAmount('');
      setMerchantName('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to ${isEdit ? 'update' : 'record'} transaction. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Record Transaction'}
      subtitle={isEdit ? 'Update transaction amounts, categorization, or notes.' : 'Capture expenses and income with smart input or manual fields.'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Mode Selector */}
        <div className="flex rounded-lg bg-surface-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => setEntryMode('smart')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors',
              entryMode === 'smart'
                ? 'bg-surface text-text-primary shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Voice & Smart Input</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors',
              entryMode === 'manual'
                ? 'bg-surface text-text-primary shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <span>Manual Form</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-md bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Smart NLP & Voice Box */}
        {entryMode === 'smart' && (
          <div className="rounded-lg bg-surface-muted p-3.5 border border-border space-y-2">
            <label className="text-xs font-medium text-text-primary block">
              Type or speak your transaction:
            </label>
            <div className="relative">
              <input
                type="text"
                value={nlpInput}
                onChange={(e) => {
                  setNlpInput(e.target.value);
                  parseSmartInput(e.target.value);
                }}
                placeholder='e.g. "Lunch with team 450" or "Salary 85000"'
                className="w-full rounded-md bg-surface border border-border pl-3 pr-10 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={cn(
                  'absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-all',
                  isListening
                    ? 'bg-[#E11D48] text-white shadow-md animate-pulse'
                    : 'text-[#858D9A] hover:text-[#172033] hover:bg-white'
                )}
                title={isListening ? 'Stop Recording' : 'Voice Dictation (Microphone)'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#5F6878]">
              <span>
                {isListening ? (
                  <span className="text-[#E11D48] font-bold animate-pulse">
                    🎙️ Listening... Speak naturally (e.g. &quot;Dinner at Subway 450&quot;)
                  </span>
                ) : (
                  'Understands merchants, amounts, categories, and dates'
                )}
              </span>
              {isParsing && <span className="text-[#2563EB] font-bold animate-pulse">Extracting parameters...</span>}
            </div>
          </div>
        )}

        {/* Structured Form Formatter */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Inflow vs Outflow */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-xs font-semibold transition-all',
                type === 'EXPENSE'
                  ? 'bg-danger-soft text-danger border-danger/40 shadow-subtle'
                  : 'bg-surface text-text-secondary border-border hover:text-text-primary'
              )}
            >
              <ArrowDownRight className="h-4 w-4 text-danger" />
              <span>Expense (Outflow)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-xs font-semibold transition-all',
                type === 'INCOME'
                  ? 'bg-success-soft text-success border-success/40 shadow-subtle'
                  : 'bg-surface text-text-secondary border-border hover:text-text-primary'
              )}
            >
              <ArrowUpRight className="h-4 w-4 text-success" />
              <span>Income (Inflow)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md bg-surface border border-border px-3 py-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Category</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-md bg-surface border border-border px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Housing & Rent">Housing & Rent</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                    <option value="Shopping & Lifestyle">Shopping & Lifestyle</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Salary & Wages">Salary & Wages</option>
                    <option value="Investments">Investments</option>
                    <option value="General">General</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">
                Merchant <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g. Starbucks, Amazon"
                className="w-full rounded-md bg-surface border border-border px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md bg-surface border border-border px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              Notes <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Team lunch at cafe"
              className="w-full rounded-md bg-surface border border-border px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Transaction
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
