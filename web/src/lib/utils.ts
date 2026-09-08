import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = "INR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0.00";

  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_EMBEDDED_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function isUuid(val: string | null | undefined): boolean {
  if (!val || typeof val !== "string") return false;
  return UUID_REGEX.test(val.trim());
}

export function cleanDisplayName(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "";
  const stripped = str.replace(UUID_EMBEDDED_REGEX, "").trim();
  const cleaned = stripped.replace(/^[-\s:]+|[-\s:]+$/g, "").trim();
  if (cleaned && cleaned.toLowerCase() !== "receipt scan" && cleaned.length > 1) {
    return cleaned;
  }
  return "";
}

export function getTransactionDisplayName(tx: {
  merchant_name?: string | null;
  merchant?: any;
  title?: string | null;
  description?: string | null;
  category_name?: string | null;
  category?: any;
  type?: string | null;
}): string {
  if (!tx) return "Transaction";

  // 1. Check merchant_name if valid non-UUID
  if (tx.merchant_name && !isUuid(tx.merchant_name) && tx.merchant_name.trim()) {
    const cleaned = cleanDisplayName(tx.merchant_name);
    if (cleaned) return cleaned;
  }

  // 2. Check title or description
  const descCandidate = tx.title || tx.description;
  if (descCandidate && typeof descCandidate === "string" && !isUuid(descCandidate)) {
    const cleaned = cleanDisplayName(descCandidate);
    if (cleaned) return cleaned;
  }

  // 3. Category name fallback
  if (tx.category_name && !isUuid(tx.category_name) && tx.category_name.trim()) {
    const cleaned = cleanDisplayName(tx.category_name);
    if (cleaned) return `${cleaned} Payment`;
  }

  // 4. Type-based semantic fallback
  if (tx.type === "INCOME") return "Income Deposit";
  if (tx.type === "TRANSFER") return "Account Transfer";
  return "Card Purchase";
}
