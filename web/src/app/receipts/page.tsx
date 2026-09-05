'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { CardReveal } from '@/components/motion';

export default function ReceiptsPage() {
  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active Pending Receipt to Review
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Groceries');
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchReceipts = async () => {
    try {
      const data = await api.getReceipts();
      setReceipts(data);
      // Auto select first pending receipt if none active
      const pending = data.find((r: any) => r.status === 'PENDING_REVIEW');
      if (pending && !activeReceipt) {
        setActiveReceipt(pending);
        setEditMerchant(pending.merchant_name);
        setEditAmount(String(pending.total_amount));
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
          description="Upload receipt photos to automatically extract merchant names, line items, taxes, and category tags with human-in-the-loop confirmation."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReceipts}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateScan}
                isLoading={isUploading}
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                className="text-xs font-bold"
              >
                Load Sample
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                leftIcon={<Camera className="h-3.5 w-3.5" />}
                className="bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-md"
              >
                Scan Receipt Photo
              </Button>
            </div>
          }
        />

        {/* 2-COLUMN STUDIO LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: DROPZONE & REVIEW CONFIRMATION CARD */}
          <div className="lg:col-span-7 space-y-5">
            {/* DRAG & DROP UPLOAD ZONE */}
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
                'p-8 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all space-y-3 shadow-xs group',
                isDragOver
                  ? 'border-[#4056A1] bg-[#E9EDFA]'
                  : 'border-[#E4E2DC] hover:border-[#4056A1] bg-white/70 hover:bg-white'
              )}
            >
              <div className="h-14 w-14 rounded-2xl bg-[#F6F5F1] group-hover:bg-[#2A1F3D] text-[#191522] group-hover:text-white flex items-center justify-center mx-auto transition-all shadow-sm">
                {isUploading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#191522]">
                  {isUploading ? 'Analyzing Receipt with Neural OCR...' : 'Click or drag receipt photo to scan'}
                </h3>
                <p className="text-xs text-[#625D69] mt-1 font-medium">
                  Supports JPEG, PNG, WEBP, and PDF receipts up to 10MB
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="brutalist-tag-emerald text-[10px] py-0.5 px-2">
                  ✓ Multimodal Vision OCR
                </span>
                <span className="brutalist-tag text-[10px] py-0.5 px-2 bg-slate-100 text-slate-700">
                  Private Storage
                </span>
              </div>
            </div>

            {/* ACTIVE RECEIPT HUMAN-IN-THE-LOOP CONFIRMATION */}
            {activeReceipt && activeReceipt.status === 'PENDING_REVIEW' ? (
              <div className="editorial-card p-6 rounded-2xl space-y-5 border-2 border-amber-400/50 bg-white/95 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#191522]">
                        Review Extracted Receipt Data
                      </h3>
                      <span className="text-[11px] text-[#625D69]">
                        Confidence: {(Number(activeReceipt.confidence_score) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">Pending Approval</Badge>
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
                    <label className="swiss-eyebrow mb-1 block">Merchant</label>
                    <input
                      type="text"
                      value={editMerchant}
                      onChange={(e) => setEditMerchant(e.target.value)}
                      className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
                    />
                  </div>

                  <div>
                    <label className="swiss-eyebrow mb-1 block">Total Amount (₹)</label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
                    />
                  </div>

                  <div>
                    <label className="swiss-eyebrow mb-1 block">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3 py-2 text-xs font-bold text-[#191522] focus:outline-none focus:border-[#4056A1]"
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
                <div className="space-y-2 pt-2 border-t border-[#E4E2DC]/80">
                  <span className="swiss-eyebrow block">Detected Line Items</span>
                  <div className="divide-y divide-[#E4E2DC] rounded-xl border border-[#E4E2DC] bg-white overflow-hidden text-xs">
                    {(activeReceipt.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <span className="font-bold text-[#191522]">
                          {item.name} <span className="text-[#898390] font-normal font-mono">x{item.qty}</span>
                        </span>
                        <span className="font-mono font-bold text-[#191522]">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm / Reject Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectReceipt(activeReceipt.id)}
                    leftIcon={<XCircle className="h-3.5 w-3.5 text-[#E11D48]" />}
                    className="text-xs font-bold text-[#E11D48] hover:bg-rose-50"
                  >
                    Reject Receipt
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmReceipt}
                    isLoading={isConfirming}
                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-md px-5"
                  >
                    Confirm & Add Transaction
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT: PROCESSED RECEIPTS RECENT GALLERY */}
          <div className="lg:col-span-5 space-y-4">
            <div className="editorial-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
                <h3 className="text-sm font-black text-[#191522]">
                  Receipt History & Audit Logs
                </h3>
                <span className="text-xs font-mono font-bold text-[#625D69]">
                  {receipts.length} Total
                </span>
              </div>

              {receipts.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#625D69]">
                  No receipts uploaded yet. Scan a receipt to start!
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setActiveReceipt(rec);
                        setEditMerchant(rec.merchant_name);
                        setEditAmount(String(rec.total_amount));
                        setEditCategory(rec.predicted_category || 'Groceries');
                      }}
                      className={cn(
                        'p-4 rounded-2xl border transition-all cursor-pointer space-y-2',
                        activeReceipt?.id === rec.id
                          ? 'border-[#4056A1] bg-[#E9EDFA] shadow-sm ring-1 ring-[#4056A1]'
                          : 'border-[#E4E2DC] bg-[#F6F5F1] hover:bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#191522]">{rec.merchant_name}</span>
                        <span className="text-xs font-mono font-black text-[#191522]">
                          {formatCurrency(rec.total_amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#625D69]">
                        <span>{rec.date || 'Today'} • {rec.predicted_category}</span>
                        {getStatusBadge(rec.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
