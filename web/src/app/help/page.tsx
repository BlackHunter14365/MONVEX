'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Receipt,
  ShieldCheck,
  Sliders,
  DollarSign,
  Lock,
  Mail,
  ArrowRight,
  BookOpen,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  // Category 1: Getting Started
  {
    id: 'get-started-currency',
    category: 'Getting Started',
    question: 'How do I set or change my primary workspace currency?',
    answer: 'You can configure your base currency during registration or at any time by navigating to Settings > Financial Parameters. MONVEX supports major global currencies including INR (₹), USD ($), EUR (€), GBP (£), AED, CAD, AUD, JPY, and SGD. Changing your currency recalibrates future summary displays without altering historical ledger amounts.',
  },
  {
    id: 'get-started-income',
    category: 'Getting Started',
    question: 'What is the Monthly Baseline Income and why is it required?',
    answer: 'Your declared monthly baseline income is used by the Cash Runway and What-If Simulator engines to benchmark your monthly burn rate and savings efficiency percentage. If your income varies, enter your average anticipated net take-home pay.',
  },
  {
    id: 'get-started-import',
    category: 'Getting Started',
    question: 'Can I import historical bank statements or spreadsheets?',
    answer: 'Yes. In the Transactions page, click "Import CSV" to upload bank exports. MONVEX provides intelligent column mapping for date, description, amount, and transaction type (income/expense), and performs automatic category suggestions before adding records to your ledger.',
  },

  // Category 2: Double-Entry Ledger
  {
    id: 'ledger-difference',
    category: 'Double-Entry Accounting',
    question: 'Why does MONVEX use double-entry bookkeeping instead of simple list tracking?',
    answer: 'Simple budgeting apps track money as a single floating list, which frequently leads to arithmetic discrepancies and missing funds. Double-entry bookkeeping guarantees that every expense is subtracted from a specific asset source (e.g., Checking Account, Cash, Credit Card), ensuring mathematical consistency and verifiable net worth tracking.',
  },
  {
    id: 'ledger-correction',
    category: 'Double-Entry Accounting',
    question: 'Can I edit or delete an existing transaction?',
    answer: 'Yes. On the Transactions ledger table, click any record to open the transaction inspector. You can modify the amount, category, or notes, or delete the record. Deleting a transaction immediately updates related budget totals, goal progress, and monthly net cash flow.',
  },

  // Category 3: Budgets & Goals
  {
    id: 'budgets-alerts',
    category: 'Budgets & Goals',
    question: 'How do budget threshold alerts work?',
    answer: 'When you allocate a monthly cap to a category (e.g., ₹20,000 for Food & Dining), MONVEX monitors your cumulative spend. When spending reaches 80% of your allocated cap, MONVEX triggers an automated telemetry alert in your Notification center, giving you time to adjust before exceeding your target.',
  },
  {
    id: 'goals-sinking-funds',
    category: 'Budgets & Goals',
    question: 'What are Savings Goals and Sinking Funds?',
    answer: 'Savings Goals allow you to set target balances with target dates (e.g., Emergency Fund, House Down Payment, Vacation). As you allocate savings to these funds, MONVEX calculates your monthly contribution velocity and displays your estimated completion date.',
  },

  // Category 4: AI Copilot
  {
    id: 'ai-copilot-prompts',
    category: 'AI Copilot Intelligence',
    question: 'What kind of questions can I ask the MONVEX AI Copilot?',
    answer: 'The AI Copilot has access to your aggregate financial parameters. You can ask queries like: "What was my highest spending category this month?", "If I cut dining by 20%, how much will my emergency fund grow in 6 months?", or "Analyze my recurring subscriptions for anomalies." The Copilot responds with structured markdown, interactive charts, and calculation blocks.',
  },
  {
    id: 'ai-privacy',
    category: 'AI Copilot Intelligence',
    question: 'Does the AI model train on my personal financial entries?',
    answer: 'No. MONVEX communicates with Google Gemini 2.0 via zero-retention enterprise API endpoints. Your prompts and calculated metrics are processed ephemerally and are never stored or used to train public foundation models.',
  },

  // Category 5: Receipt OCR
  {
    id: 'ocr-formats',
    category: 'Receipt OCR Scanner',
    question: 'What file formats are supported for receipt scanning?',
    answer: 'The Receipt Ingestion pipeline accepts JPEG, PNG, and WebP images up to 10MB. For optimal extraction accuracy, capture receipts in well-lit conditions with the merchant name, date, and total line clearly visible.',
  },
  {
    id: 'ocr-accuracy',
    category: 'Receipt OCR Scanner',
    question: 'Can I verify the extracted details before saving?',
    answer: 'Yes. When an image is processed, an interactive review dialog presents the detected merchant, date, tax, and total amount. You can edit any field before clicking "Confirm & Add to Ledger".',
  },

  // Category 6: Security & Access
  {
    id: 'sec-2fa',
    category: 'Security & Access',
    question: 'How do I enable Two-Factor Authentication (2FA)?',
    answer: 'Navigate to Security in the sidebar. In the Security Vault, find the Two-Factor Authentication section, click "Enable Authenticator", scan the generated QR code using Google Authenticator, Authy, or 1Password, and verify with your 6-digit code.',
  },
  {
    id: 'sec-session-timeout',
    category: 'Security & Access',
    question: 'What is the Session Auto-Lock and how do I change its duration?',
    answer: 'To protect your financial privacy on shared workstations, MONVEX automatically monitors user activity. In Settings > Security, you can set the inactivity lock timer (e.g., 15 minutes, 30 minutes, or 60 minutes). If inactive, the session securely locks until you re-authenticate.',
  },
];

const CATEGORIES = [
  'All Topics',
  'Getting Started',
  'Double-Entry Accounting',
  'Budgets & Goals',
  'AI Copilot Intelligence',
  'Receipt OCR Scanner',
  'Security & Access',
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('get-started-currency');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'All Topics' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <PublicPageShell
      eyebrow="KNOWLEDGE BASE & GUIDES"
      title="Help Center & FAQs"
      description="Clear, technical guides and answers covering every capability of the MONVEX financial operating system."
    >
      <div className="space-y-10 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Search & Filter Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#77798A] dark:text-[#A6A4B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, ledger rules, AI commands, or security topics..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] text-sm text-[#20212B] dark:text-[#F4F3FA] placeholder:text-[#77798A] dark:placeholder:text-[#A6A4B8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/40 transition-all"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#6865E8] text-white shadow-xs'
                    : 'bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#77798A] dark:text-[#A6A4B8] px-1">
            <span>
              Showing {filteredFaqs.length} of {FAQS.length} answers
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#6865E8] dark:text-[#7C79F2] hover:underline cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3">
              <HelpCircle className="h-10 w-10 text-[#77798A] dark:text-[#A6A4B8] mx-auto opacity-50" />
              <h3 className="font-bold text-base text-[#20212B] dark:text-[#F4F3FA]">
                No matching topics found
              </h3>
              <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] max-w-sm mx-auto">
                We couldn&rsquo;t find an answer matching &ldquo;{searchQuery}&rdquo;. Try another keyword or reach out directly to engineering.
              </p>
              <Link href="/contact">
                <Button variant="primary" size="sm" className="mt-2 bg-[#6865E8] text-white rounded-xl">
                  Ask Engineering Directly
                </Button>
              </Link>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#1B1A2A] shadow-card transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6865E8] dark:text-[#7C79F2] block">
                        {faq.category}
                      </span>
                      <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="p-1 rounded-lg text-[#77798A] dark:text-[#A6A4B8] shrink-0 mt-0.5">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#77798A] dark:text-[#A6A4B8] leading-relaxed border-t border-[#E7E6F0]/60 dark:border-[#2D2B3F]/60">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Support Callout Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#EEEDF8] dark:bg-[#23213B] border border-[#6865E8]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-lg">
            <h3 className="text-base font-bold text-[#20212B] dark:text-[#F4F3FA]">
              Still have questions or encountered an issue?
            </h3>
            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
              Danish Ansari and the MONVEX engineering team actively monitor inbound support submissions. Reach out anytime with bug reports, feature requests, or mathematical inquiries.
            </p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="bg-[#6865E8] hover:bg-[#5754DC] text-white font-bold rounded-xl shadow-xs"
            >
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
