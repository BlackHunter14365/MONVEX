'use client';

import React from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  FileText,
  ShieldAlert,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Mail,
  Lock,
} from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <PublicPageShell
      eyebrow="LEGAL CONTRACT"
      title="Terms of Service"
      description="The terms governing your access to and usage of the MONVEX financial operating system."
      lastUpdated="October 2026"
    >
      <div className="space-y-10 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Important Notice Callout */}
        <div className="p-5 rounded-2xl bg-[#EEEDF8] dark:bg-[#23213B] border border-[#6865E8]/30 dark:border-[#7C79F2]/30 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-white dark:bg-[#1B1A2A] text-[#6865E8] dark:text-[#7C79F2] shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
              Non-Custodial Financial Intelligence System
            </h3>
            <p className="text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
              MONVEX is an informational calculation engine and double-entry record-keeping software. MONVEX is <strong>not</strong> a bank, depository institution, payment processor, custodian, or licensed broker. MONVEX does not execute real-money banking transactions or hold user funds.
            </p>
          </div>
        </div>

        {/* Section 1: Acceptance */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">1.</span> Acceptance of Terms
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            By registering an account, accessing, downloading, or using MONVEX (including web and desktop applications), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our associated <Link href="/privacy-policy" className="text-[#6865E8] dark:text-[#7C79F2] underline font-semibold">Privacy Policy</Link>. If you do not agree to all provisions, you may not access or use the platform.
          </p>
        </section>

        {/* Section 2: Account Registration */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">2.</span> Account Registration & Credential Integrity
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            To access dashboard capabilities, you must register a workspace account by providing a valid username, email address, and strong password.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li>You are solely responsible for safeguarding your authentication credentials and any Multi-Factor Authentication (MFA) tokens associated with your account.</li>
            <li>You must promptly notify MONVEX administration via our <Link href="/contact" className="text-[#6865E8] dark:text-[#7C79F2] underline">contact portal</Link> if you detect any unauthorized access or compromise of your credentials.</li>
            <li>We reserve the right to suspend or revoke accounts whose security has been visibly compromised or used in violation of these Terms.</li>
          </ul>
        </section>

        {/* Section 3: Scope of Service */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">3.</span> Scope of Service & Capabilities
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            MONVEX provides tools designed to help individuals track, organize, and forecast personal financial cash flows:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block mb-1">Double-Entry Ledger Tracking</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Arithmetic transaction logging, categorization, and balance reconciliation.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block mb-1">Algorithmic Forecasting</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Cash runway projections, debt payoff timelines, and savings goal telemetry.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block mb-1">Optical Character Recognition</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Automated text extraction from uploaded physical transaction receipts.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block mb-1">AI Copilot Analysis</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Natural language answers regarding your recorded historical spending patterns.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Prohibited Uses */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">4.</span> Acceptable Use & System Integrity
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            You agree not to use MONVEX in any manner that impairs, overwhelms, or attacks system operations. Specifically, you may not:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li>Circumvent or attempt to bypass our API rate limiters, token expiration timers, or IP throttling mechanisms.</li>
            <li>Attempt SQL injection, cross-site scripting (XSS), path traversal, or cross-tenant data harvesting.</li>
            <li>Deploy automated scrapers, spiders, or bots against authenticated endpoints without prior written authorization.</li>
            <li>Reverse engineer or disassemble proprietary compilation artifacts or attempt to exploit backend system vulnerabilities.</li>
            <li>Submit malicious or trojanized payloads via the receipt OCR ingestion pipeline.</li>
          </ul>
        </section>

        {/* Section 5: Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">5.</span> Intellectual Property & Software License
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            All intellectual property rights in MONVEX, including its user interface design, logo, Aurora Glass token system, double-entry mathematical models, and underlying backend services, are the exclusive property of Danish Ansari. You are granted a limited, personal, revocable, non-exclusive license to use the application for your own individual financial management.
          </p>
        </section>

        {/* Section 6: Disclaimers & Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">6.</span> Disclaimers & Limitation of Liability
          </h2>
          <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs space-y-2">
            <p className="text-[#77798A] dark:text-[#A6A4B8]">
              <strong>AS-IS BASIS:</strong> MONVEX is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; without warranties of any kind, whether express, statutory, or implied, including warranties of merchantability, fitness for a particular purpose, or uninterrupted uptime.
            </p>
            <p className="text-[#77798A] dark:text-[#A6A4B8]">
              <strong>NO FINANCIAL RESPONSIBILITY:</strong> Under no circumstances shall MONVEX or its creator be liable for any direct, indirect, incidental, consequential, or punitive damages arising from financial decisions made on the basis of algorithmic projections, AI Copilot commentary, currency conversions, or budget estimations.
            </p>
            <p className="text-[#77798A] dark:text-[#A6A4B8]">
              Please refer to our dedicated <Link href="/financial-disclaimer" className="text-[#6865E8] dark:text-[#7C79F2] underline font-semibold">Financial Disclaimer</Link> for detailed regulatory clarifications.
            </p>
          </div>
        </section>

        {/* Section 7: Account Termination */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">7.</span> Termination & Data Retention
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            You may terminate your account at any time by requesting account closure through the Settings page or by contacting engineering. Upon confirmed closure, your records will be purged in accordance with our Privacy Policy. MONVEX reserves the right to terminate or restrict access immediately upon evidence of security violations or harmful conduct.
          </p>
        </section>

        {/* Section 8: Inquiries */}
        <section className="space-y-3 pt-4 border-t border-[#E7E6F0] dark:border-[#2D2B3F]">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">8.</span> Questions & Legal Inquiries
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            For questions regarding these Terms of Service or commercial licensing requests, please reach out via our contact interface:
          </p>
          <div className="pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6865E8] hover:bg-[#5754DC] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Legal & Administration</span>
            </Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
