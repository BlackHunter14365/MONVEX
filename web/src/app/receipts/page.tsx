'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt as ReceiptIcon,
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  Trash2,
  Check,
  Edit2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FinancialAmount } from '@/components/ui/FinancialAmount';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function ReceiptsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Active Pending Receipt to Review
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Groceries');
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReceipts();
      const list = Array.isArray(data) ? data : data?.results || [];
      setReceipts(list);

      // Auto select first pending receipt if none active
      const pending = list.find((r: any) => r.status === 'PENDING_REVIEW');
      if (pending && !activeReceipt) {
        setActiveReceipt(pending);
        setEditMerchant(pending.merchant_name || '');
        setEditAmount(String(pending.total_amount || ''));
        setEditCategory(pending.predicted_category || 'Groceries');
      }
    } catch {
      toast.error('Failed to load receipts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate size: 10MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds maximum 10MB limit.');
      return;
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validMimes.includes(file.type)) {
      toast.error('Unsupported format. Please upload JPEG, PNG, WEBP, or PDF.');
      return;
    }

    setIsUploading(true);
    toast.info('Uploading receipt image to Neural Vision Engine...');

    try {
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
      } else {
        setPreviewImage(null);
      }

      const res = await api.uploadReceiptFile(file);
      const conf = Math.round((Number(res.confidence_score) || 0.95) * 100);
      toast.success(`✓ Receipt processed (${conf}% confidence). Review extracted fields.`);

      setActiveReceipt(res);
      setEditMerchant(res.merchant_name || '');
      setEditAmount(String(res.total_amount || ''));
      setEditCategory(res.predicted_category || 'Groceries');
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process receipt image.');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  const handleSimulateScan = async () => {
    setIsUploading(true);
    toast.info('Analyzing sample receipt image...');

    try {
      const mockReceiptPayloads = [
        {
          merchant_name: 'D-Mart Supermarket',
          total_amount: 2340.0,
          subtotal: 2200.0,
          tax_amount: 140.0,
          category_suggestion: 'Groceries',
          items: [
            { name: 'Basmati Rice 5kg', qty: 1, price: 650.0 },
            { name: 'Organic Cold-Pressed Oil 1L', qty: 2, price: 780.0 },
            { name: 'Farm Fresh Eggs Pack of 12', qty: 2, price: 210.0 },
            { name: 'Almonds 500g Pack', qty: 1, price: 560.0 },
            { name: 'Paper Towel Multi-Pack', qty: 1, price: 140.0 },
          ],
          raw_text: 'D-MART RETAIL LTD\nBILL NO: DM94829\nTOTAL ITEMS: 5\nTOTAL: 2340.00\nTHANK YOU',
        },
        {
          merchant_name: 'Blue Tokai Coffee Roasters',
          total_amount: 760.0,
          subtotal: 720.0,
          tax_amount: 40.0,
          category_suggestion: 'Food & Dining',
          items: [
            { name: 'Iced Americano Single Estate', qty: 2, price: 460.0 },
            { name: 'Almond Croissant', qty: 1, price: 300.0 },
          ],
          raw_text: 'BLUE TOKAI COFFEE\nTABLE 04\nTOTAL: 760.00',
        },
        {
          merchant_name: 'Apollo Pharmacy',
          total_amount: 1250.0,
          subtotal: 1200.0,
          tax_amount: 50.0,
          category_suggestion: 'Healthcare',
          items: [
            { name: 'Multivitamin Complex 60 Caps', qty: 1, price: 750.0 },
            { name: 'Whey Protein Isolate Sachet', qty: 5, price: 500.0 },
          ],
          raw_text: 'APOLLO PHARMACY LTD\nRX INVOICE: AP3842\nTOTAL: 1250.00',
        },
      ];

      const sample = mockReceiptPayloads[Math.floor(Math.random() * mockReceiptPayloads.length)];
      const res = await api.uploadReceipt(sample);

      setTimeout(() => {
        toast.success(`✓ Receipt parsed with 96.5% confidence! Please confirm.`);
        setActiveReceipt(res);
        setEditMerchant(res.merchant_name);
        setEditAmount(String(res.total_amount));
        setEditCategory(res.predicted_category || 'Groceries');
        setIsUploading(false);
        fetchReceipts();
      }, 500);
    } catch {
      setIsUploading(false);
      toast.error('Failed to parse receipt.');
    }
  };

  const handleConfirmReceipt = async () => {
    if (!activeReceipt) return;
    setIsConfirming(true);

    try {
      await api.confirmReceipt(activeReceipt.id, {
        merchant_name: editMerchant,
        amount: Number(editAmount),
        category_name: editCategory,
      });

      toast.success('✓ Transaction confirmed & posted to your financial ledger!');
      setActiveReceipt(null);
      fetchReceipts();
    } catch {
      toast.error('Failed to confirm receipt.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRejectReceipt = async (id: string) => {
    try {
      await api.rejectReceipt(id);
      toast.info('Receipt dismissed.');
      if (activeReceipt?.id === id) setActiveReceipt(null);
      fetchReceipts();
    } catch {
      toast.error('Failed to dismiss receipt.');
    }
  };

  // Metrics
  const totalValueCaptured = useMemo(() => {
    return receipts
      .filter((r) => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
  }, [receipts]);

  const pendingCount = useMemo(() => {
    return receipts.filter((r) => r.status === 'PENDING_REVIEW').length;
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    if (filterStatus === 'ALL') return receipts;
    return receipts.filter((r) => r.status === filterStatus);
  }, [receipts, filterStatus]);

  // Current pipeline active step
  const currentPipelineStep = useMemo(() => {
    if (isUploading) return 2; // Processing
    if (activeReceipt && activeReceipt.status === 'PENDING_REVIEW') return 3; // Review / Classification
    return 1; // Idle / Ready to upload
  }, [isUploading, activeReceipt]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success" size="sm">CONFIRMED IN LEDGER</Badge>;
      case 'REJECTED':
        return <Badge variant="neutral" size="sm">DISMISSED</Badge>;
      case 'PENDING_REVIEW':
      default:
        return <Badge variant="warning" size="sm">REQUIRES APPROVAL</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture="environment"
          className="hidden"
          onChange={onFileInputChange}
        />

        <PageHeader
          title="Receipt Intelligence & Vision Studio"
          description="Multimodal document OCR, automatic line-item parsing, and human-in-the-loop double-entry reconciliation."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReceipts}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold touch-target"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateScan}
                isLoading={isUploading}
                leftIcon={<Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />}
                className="text-xs font-bold touch-target"
              >
                Load Sample
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                leftIcon={<Camera className="h-3.5 w-3.5" />}
                className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-sm touch-target"
              >
                Scan Receipt Photo
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. FIVE-STAGE PIPELINE STEPPER HERO
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E2DC] pb-4">
              <div>
                <div className="flex items-center gap-2 text-[#898390]">
                  <ReceiptIcon className="h-4 w-4 text-[#4056A1]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    Vision Reconciliation Pipeline
                  </span>
                </div>
                <span className="text-xs text-[#625D69] block mt-0.5">
                  End-to-end receipt extraction & human verification sequence
                </span>
              </div>

              {/* Aggregates Summary */}
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#898390] block uppercase">Captured Value</span>
                  <FinancialAmount
                    amount={totalValueCaptured}
                    currency={user?.currency}
                    size="md"
                    type="income"
                    showSign={false}
                  />
                </div>
                <div className="h-8 w-px bg-[#E4E2DC]" />
                <div>
                  <span className="text-[10px] font-mono text-[#898390] block uppercase">Pending Review</span>
                  <span className="text-sm font-mono font-black text-[#D97706] tnum">
                    {pendingCount}
                  </span>
                </div>
                <div className="h-8 w-px bg-[#E4E2DC]" />
                <div>
                  <span className="text-[10px] font-mono text-[#898390] block uppercase">Audit History</span>
                  <span className="text-sm font-mono font-black text-[#191522] tnum">
                    {receipts.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Step Visual Pipeline Stepper */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-5 pt-1">
              {[
                { step: 1, title: 'Upload', desc: 'Photo or PDF' },
                { step: 2, title: 'Neural OCR', desc: 'Text & Bounding' },
                { step: 3, title: 'Extraction', desc: 'Line Items & Tax' },
                { step: 4, title: 'Classification', desc: 'Category Matching' },
                { step: 5, title: 'Reconciliation', desc: 'Atomic Ledger Post' },
              ].map((s) => {
                const isActive = currentPipelineStep === s.step;
                const isCompleted = currentPipelineStep > s.step;

                return (
                  <div
                    key={s.step}
                    className={cn(
                      'min-w-[110px] sm:min-w-0 flex-shrink-0 sm:flex-shrink p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between',
                      isActive
                        ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs'
                        : isCompleted
                        ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                        : 'bg-[#F6F5F1] border-[#E4E2DC]'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={cn(
                          'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold',
                          isActive
                            ? 'bg-[#2563EB] text-white'
                            : isCompleted
                            ? 'bg-[#059669] text-white'
                            : 'bg-[#E4E2DC] text-[#625D69]'
                        )}
                      >
                        {isCompleted ? '✓' : s.step}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#191522] block truncate max-w-full">
                      {s.title}
                    </span>
                    <span className="text-[9px] font-mono text-[#898390] block truncate max-w-full">
                      {s.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. STUDIO WORK AREA (2 COLUMNS)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: DROPZONE & REVIEW CONFIRMATION CARD (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* DROPZONE */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className={cn(
                'double-bezel cursor-pointer transition-all',
                isDragOver ? 'ring-2 ring-[#2563EB]' : ''
              )}
            >
              <div
                className={cn(
                  'double-bezel-inner p-8 text-center space-y-3 transition-colors',
                  isDragOver ? 'bg-[#EFF6FF]' : 'hover:bg-[#FBFBFA]'
                )}
              >
                <div className="h-14 w-14 rounded-2xl bg-[#F6F5F1] text-[#2A1F3D] flex items-center justify-center mx-auto transition-all shadow-sm border border-[#E4E2DC]">
                  {isUploading ? <RefreshCw className="h-6 w-6 animate-spin text-[#2563EB]" /> : <Upload className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#191522]">
                    {isUploading ? 'Analyzing Receipt with Neural OCR...' : 'Click or drop receipt photo to scan'}
                  </h3>
                  <p className="text-xs text-[#625D69] mt-1 font-medium">
                    Supports JPEG, PNG, WEBP, and PDF receipts up to 10MB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-bold">
                    ✓ Multimodal Vision OCR
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F6F5F1] text-[#625D69] border border-[#E4E2DC]">
                    Encrypted Storage
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIVE RECEIPT HUMAN-IN-THE-LOOP CONFIRMATION */}
            {activeReceipt && (
              <div className="double-bezel">
                <div className="double-bezel-inner p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#191522]">
                          Review Extracted Receipt Data
                        </h3>
                        <span className="text-[11px] font-mono text-[#625D69]">
                          Confidence: {Math.round((Number(activeReceipt.confidence_score) || 0.96) * 100)}%
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(activeReceipt.status)}
                  </div>

                  {/* Preview Thumbnail if available */}
                  {previewImage && (
                    <div className="rounded-xl overflow-hidden border border-[#E4E2DC] bg-[#F6F5F1] max-h-56 flex items-center justify-center p-2">
                      <img
                        src={previewImage}
                        alt="Receipt preview"
                        className="max-h-52 w-auto object-contain rounded-lg shadow-xs"
                      />
                    </div>
                  )}

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#625D69] mb-1 block">Merchant</label>
                      <input
                        type="text"
                        value={editMerchant}
                        onChange={(e) => setEditMerchant(e.target.value)}
                        className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1] touch-target"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#625D69] mb-1 block">Total Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-mono font-bold text-[#191522] focus:outline-none focus:border-[#4056A1] touch-target"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#625D69] mb-1 block">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1] touch-target"
                      >
                        <option value="Groceries">Groceries</option>
                        <option value="Food & Dining">Food & Dining</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Bills & Utilities">Bills & Utilities</option>
                      </select>
                    </div>
                  </div>

                  {/* Line Items Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-[#E4E2DC]">
                    <span className="text-[11px] font-mono font-bold text-[#898390] uppercase tracking-wider block">
                      Detected Line Items
                    </span>
                    {(activeReceipt.items || []).length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] text-xs text-[#625D69] text-center">
                        Total receipt amount detected without individual item lines.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#E4E2DC] rounded-xl border border-[#E4E2DC] bg-white overflow-hidden text-xs">
                        {activeReceipt.items.map((item: any, idx: number) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between">
                            <span className="font-bold text-[#191522]">
                              {item.name} <span className="text-[#898390] font-normal font-mono">x{item.qty || 1}</span>
                            </span>
                            <FinancialAmount
                              amount={item.price}
                              currency={user?.currency}
                              size="xs"
                              showSign={false}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm / Reject Action Buttons */}
                  {activeReceipt.status === 'PENDING_REVIEW' && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectReceipt(activeReceipt.id)}
                        leftIcon={<XCircle className="h-3.5 w-3.5 text-[#E11D48]" />}
                        className="text-xs font-bold text-[#E11D48] hover:bg-rose-50 touch-target"
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleConfirmReceipt}
                        isLoading={isConfirming}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-sm px-5 touch-target"
                      >
                        Confirm & Post to Ledger
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: PROCESSED RECEIPTS RECENT AUDIT LEDGER (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="double-bezel">
              <div className="double-bezel-inner p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#4056A1]" />
                    <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                      Receipt Audit Log ({receipts.length})
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono text-[#898390]">
                    Select to inspect
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['ALL', 'PENDING_REVIEW', 'CONFIRMED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all touch-target',
                        filterStatus === st
                          ? 'bg-[#2A1F3D] text-white shadow-xs'
                          : 'bg-[#F6F5F1] text-[#625D69] hover:bg-[#EAE8E1]'
                      )}
                    >
                      {st === 'PENDING_REVIEW' ? 'Pending' : st === 'CONFIRMED' ? 'Confirmed' : 'All'}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : filteredReceipts.length === 0 ? (
                  <EmptyState
                    title="No receipts found"
                    description="Upload or scan a receipt photo to populate your audit log."
                    actionLabel="Scan Receipt"
                    onAction={() => fileInputRef.current?.click()}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {filteredReceipts.map((rec) => {
                      const isSelected = activeReceipt?.id === rec.id;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => {
                            setActiveReceipt(rec);
                            setEditMerchant(rec.merchant_name || '');
                            setEditAmount(String(rec.total_amount || ''));
                            setEditCategory(rec.predicted_category || 'Groceries');
                          }}
                          className={cn(
                            'p-3.5 rounded-xl border transition-all cursor-pointer space-y-2',
                            isSelected
                              ? 'border-[#2563EB] bg-white shadow-sm ring-1 ring-[#2563EB]/20'
                              : 'border-[#E4E2DC] bg-[#F6F5F1] hover:bg-white'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#191522] truncate max-w-[150px]">
                              {rec.merchant_name || 'Receipt Document'}
                            </span>
                            <FinancialAmount
                              amount={rec.total_amount}
                              currency={user?.currency}
                              size="xs"
                              showSign={false}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-[#625D69]">
                            <span>{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Recent'} • {rec.predicted_category || 'Groceries'}</span>
                            {getStatusBadge(rec.status)}
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
      </div>
    </AppShell>
  );
}
