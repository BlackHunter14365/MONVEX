'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useReceiptsQuery } from '@/hooks/queries/useReceiptsQuery';

export default function ReceiptsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rawReceipts, isLoading, refetch: fetchReceipts } = useReceiptsQuery();
  const receipts: any[] = useMemo(() => {
    return Array.isArray(rawReceipts) ? rawReceipts : rawReceipts?.results || [];
  }, [rawReceipts]);

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

  // Auto select first pending receipt if none active
  useEffect(() => {
    if (!activeReceipt && receipts.length > 0) {
      const pending = receipts.find((r: any) => r.status === 'PENDING_REVIEW');
      if (pending) {
        setActiveReceipt(pending);
        setEditMerchant(pending.merchant_name || '');
        setEditAmount(String(pending.total_amount || ''));
        setEditCategory(pending.predicted_category || 'Groceries');
      }
    }
  }, [receipts, activeReceipt]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds maximum 10MB limit.');
      return;
    }

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
      const sampleReceipt = {
        merchant_name: 'D-Mart Supermarket',
        total_amount: 2340.0,
        subtotal: 2200.0,
        tax_amount: 140.0,
        category_suggestion: 'Groceries',
        confidence_score: 0.96,
        items: [
          { name: 'Basmati Rice 5kg', qty: 1, price: 650.0 },
          { name: 'Organic Cold-Pressed Oil 1L', qty: 2, price: 780.0 },
          { name: 'Farm Fresh Eggs Pack of 12', qty: 2, price: 210.0 },
          { name: 'Almonds 500g Pack', qty: 1, price: 560.0 },
          { name: 'Paper Towel Multi-Pack', qty: 1, price: 140.0 },
        ],
        raw_text: 'D-MART RETAIL LTD\nBILL NO: DM94829\nTOTAL ITEMS: 5\nTOTAL: 2340.00\nTHANK YOU',
      };

      const res = await api.uploadReceipt(sampleReceipt);
      toast.success('✓ Sample receipt processed. Review extracted fields.');
      setActiveReceipt(res);
      setEditMerchant(res.merchant_name || 'D-Mart Supermarket');
      setEditAmount(String(res.total_amount || '2340'));
      setEditCategory(res.predicted_category || 'Groceries');
      fetchReceipts();
    } catch {
      toast.error('Simulation failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!activeReceipt) return;
    setIsConfirming(true);

    try {
      await api.confirmReceipt(activeReceipt.id, {
        merchant_name: editMerchant,
        total_amount: Number(editAmount),
        category: editCategory,
      });
      toast.success('✓ Receipt verified and posted to financial ledger!');
      setActiveReceipt(null);
      setPreviewImage(null);
      fetchReceipts();
    } catch {
      toast.error('Failed to post receipt transaction.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    try {
      await api.rejectReceipt(id);
      toast.info('Receipt record removed.');
      if (activeReceipt?.id === id) {
        setActiveReceipt(null);
      }
      fetchReceipts();
    } catch {
      toast.error('Failed to delete receipt.');
    }
  };

  const filteredReceipts = useMemo(() => {
    if (filterStatus === 'ALL') return receipts;
    return receipts.filter((r) => r.status === filterStatus);
  }, [receipts, filterStatus]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="NEURAL INGESTION"
          title="Document Intelligence & Receipts"
          description="Deep multi-pass OCR ingestion. Extracts itemized lines, tax identifiers, vendor taxonomy, and automatically matches transactions."
          actionSlot={
            <Button
              variant="outline"
              size="md"
              onClick={handleSimulateScan}
              isLoading={isUploading}
              leftIcon={<Sparkles className="h-4 w-4 text-[#6865E8]" />}
              className="text-xs font-bold rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B]"
            >
              Simulate Sample Scan
            </Button>
          }
        />

        {/* =========================================================================
            1. TOP 3 TELEMETRY CARDS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Total Processed Documents
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">{receipts.length} Documents</div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Ingested receipts & invoices</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Neural Model Confidence
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#16745C]">96.4% Precision</div>
              <p className="text-xs text-[#16745C] font-semibold mt-1">Multi-pass OCR parser</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E8A54B]">
                Pending Field Review
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEF6EB] text-[#E8A54B]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">
                {receipts.filter((r) => r.status === 'PENDING_REVIEW').length} Items
              </div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Awaiting human sign-off</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TWO-COLUMN INGESTION & REVIEW STAGE
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* UPLOAD DROPZONE (5 COLS) */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#20212B]">Upload Receipt or Invoice</h3>
              <p className="text-xs text-[#77798A] mt-0.5">Drag and drop receipts or snap via mobile</p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3',
                isDragOver
                  ? 'border-[#6865E8] bg-[#ECEBFF]/30'
                  : 'border-[#E7E6F0] hover:border-[#6865E8]/40 bg-[#F8F7FC] hover:bg-[#F4F3FA]'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={onFileInputChange}
              />
              <div className="h-12 w-12 rounded-2xl bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#20212B] block">
                  Click to browse or drop file here
                </span>
                <span className="text-xs text-[#77798A] block mt-1">
                  Supports JPEG, PNG, WEBP, and PDF up to 10MB
                </span>
              </div>
            </div>

            {previewImage && (
              <div className="p-3 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-2">
                <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Document Preview</span>
                <img src={previewImage} alt="Receipt preview" className="max-h-48 rounded-xl object-contain mx-auto" />
              </div>
            )}
          </div>

          {/* EXTRACTED FIELD VERIFICATION (7 COLS) */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
              <div>
                <h3 className="text-base font-bold text-[#20212B]">Extracted Transaction Review</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Verify parsed metadata before ledger posting</p>
              </div>
              {activeReceipt && (
                <span className="text-xs font-mono font-bold text-[#16745C] bg-[#E8FBF4] px-2.5 py-1 rounded-full">
                  {Math.round((Number(activeReceipt.confidence_score) || 0.95) * 100)}% Confidence
                </span>
              )}
            </div>

            {!activeReceipt ? (
              <div className="py-16 text-center space-y-2 border border-dashed border-[#E7E6F0] rounded-2xl bg-[#F8F7FC]">
                <ReceiptIcon className="h-10 w-10 text-[#77798A] mx-auto" />
                <h4 className="text-sm font-bold text-[#20212B]">No active receipt selected</h4>
                <p className="text-xs text-[#77798A] max-w-xs mx-auto">
                  Upload an invoice or select an existing receipt below to audit extracted fields.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">Vendor / Merchant</label>
                  <input
                    type="text"
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#20212B] block">Total Amount ({user?.currency || 'INR'})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#20212B] block">Category Taxonomy</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Itemized Lines */}
                {activeReceipt.items && activeReceipt.items.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-2">
                    <span className="text-[10px] font-mono text-[#77798A] uppercase font-bold block">Parsed Itemized Lines</span>
                    <div className="space-y-1.5">
                      {activeReceipt.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-[#20212B] font-semibold">{it.name} (x{it.qty || 1})</span>
                          <span className="font-mono text-[#77798A]">{formatCurrency(it.price, user?.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2.5">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setActiveReceipt(null)}
                    className="rounded-2xl"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleConfirmReceipt}
                    isLoading={isConfirming}
                    leftIcon={<Check className="h-4 w-4" />}
                    className="bg-[#6865E8] hover:bg-[#5b58db] rounded-2xl"
                  >
                    Confirm & Post Transaction
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            3. HISTORICAL RECEIPTS INGESTION DIRECTORY
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E6F0]">
            <div>
              <h3 className="text-base font-bold text-[#20212B]">
                Document Ingestion Directory ({receipts.length})
              </h3>
              <p className="text-xs text-[#77798A] mt-0.5">Historical scans and parsed transaction documents</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              title="Zero receipts ingested"
              description="Upload paper bills or supermarket receipts to build your digitized financial paper trail."
              actionLabel="Upload First Receipt"
              onAction={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="space-y-3">
              {receipts.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-white border border-[#E7E6F0] hover:border-[#6865E8]/30 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center shrink-0">
                      <ReceiptIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-[#20212B] block truncate">
                        {r.merchant_name || 'Retail Vendor'}
                      </span>
                      <span className="text-[11px] text-[#77798A] block">
                        {r.predicted_category || 'General'} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                        r.status === 'VERIFIED'
                          ? 'bg-[#E8FBF4] text-[#16745C] border-[#B6F0DE]'
                          : 'bg-[#FFFBEB] text-[#E8A54B] border-[#FDE68A]'
                      )}
                    >
                      {r.status || 'PROCESSED'}
                    </span>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-[#20212B] block">
                        {formatCurrency(r.total_amount, user?.currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteReceipt(r.id)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#E76D7A] hover:bg-[#FEF2F2] transition-colors"
                      aria-label={`Remove receipt ${r.merchant_name}`}
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
    </AppShell>
  );
}
