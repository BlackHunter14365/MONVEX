'use client';

import React from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  ShieldCheck,
  Lock,
  Database,
  Cpu,
  UserCheck,
  FileText,
  Mail,
  AlertCircle,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell
      eyebrow="LEGAL & DATA GOVERNANCE"
      title="Privacy Policy"
      description="How MONVEX collects, processes, and cryptographically isolates your financial intelligence data."
      lastUpdated="October 2026"
    >
      <div className="space-y-10 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Core Principles Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-2">
            <div className="h-9 w-9 rounded-xl bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2] flex items-center justify-center">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
              Zero Data Monetization
            </h3>
            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
              We do not sell, rent, license, or broker your personal financial records or telemetry to advertisers or data aggregators.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
              Stateless AI Reasoning
            </h3>
            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
              Your queries sent to the Google Gemini Copilot are processed ephemerally and are never retained to train foundation models.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-2">
            <div className="h-9 w-9 rounded-xl bg-[#EDEBFB] dark:bg-[#252445] text-[#6865E8] dark:text-[#7C79F2] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
              Tenant Cryptographic Isolation
            </h3>
            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
              Every ledger query and mutation is strictly scoped to your authenticated identity with zero cross-tenant visibility.
            </p>
          </div>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">1.</span> Overview & Scope
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            This Privacy Policy governs the manner in which <strong>MONVEX</strong> (&ldquo;MONVEX&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, maintains, and discloses information gathered from users of the MONVEX web application (<code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8]">monvex.app</code>) and desktop distributions. MONVEX is an AI-powered personal financial operating system engineered by Danish Ansari.
          </p>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            By accessing or using MONVEX, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with any terms herein, please discontinue use of the platform.
          </p>
        </section>

        {/* Section 2: Data Collection */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">2.</span> Information We Collect
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            We collect only the minimum information necessary to execute double-entry accounting computations, financial scenario forecasts, and secure authentication:
          </p>

          <div className="space-y-3 pl-2">
            <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA] mb-1">
                A. Account & Profile Data
              </h4>
              <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
                Username, email address, password hash (hashed via Argon2/PBKDF2), optional phone number, base currency code (e.g., INR, USD, EUR), and declared monthly baseline income.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA] mb-1">
                B. Financial Ledger Records
              </h4>
              <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
                Transactions (amounts, timestamps, descriptions, categories), budget allocations, savings goals, recurring subscription entries, and user-defined what-if simulation parameters.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA] mb-1">
                C. Receipt Artifacts (OCR)
              </h4>
              <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
                Images of physical receipts uploaded by you for optical character recognition. Once extracted into structured ledger items, images remain accessible solely within your private account vault.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA] mb-1">
                D. Operational Security Telemetry
              </h4>
              <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
                IP address, user-agent string, authentication attempt timestamps, and security audit logs to enforce brute-force protection, rate limiting, and anomaly detection.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: AI Copilot Processing */}
        <section id="ai-processing" className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">3.</span> AI Copilot & Machine Learning Privacy
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            MONVEX incorporates conversational financial intelligence powered by Google Gemini 2.0 and local predictive scikit-learn models:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li>
              <strong>Ephemeral Ingestion:</strong> Queries sent to the AI Copilot pass only necessary contextual metrics (such as aggregate category sums or runway calculations) needed to formulate an answer.
            </li>
            <li>
              <strong>No Model Training:</strong> Under our enterprise API configuration, user queries and financial payloads are <em>never</em> used by Google to train or fine-tune public foundation models.
            </li>
            <li>
              <strong>Deterministic Mathematical Verification:</strong> Cash balance calculations and ledger sums are executed by deterministic code on our backend server rather than generated by generative hallucinations.
            </li>
          </ul>
        </section>

        {/* Section 4: Data Storage & Client Storage */}
        <section id="data-protection" className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">4.</span> Client Storage & Cookies
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            MONVEX utilizes local browser storage (<code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8]">localStorage</code>) and minimal HTTP cookies strictly for authentication and interface stability:
          </p>
          <div className="overflow-x-auto rounded-2xl border border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#1B1A2A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FC] dark:bg-[#151421] border-b border-[#E7E6F0] dark:border-[#2D2B3F] text-[#20212B] dark:text-[#F4F3FA]">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Storage Key</th>
                  <th className="py-2.5 px-4 font-bold">Medium</th>
                  <th className="py-2.5 px-4 font-bold">Purpose</th>
                  <th className="py-2.5 px-4 font-bold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E6F0] dark:divide-[#2D2B3F] text-[#77798A] dark:text-[#A6A4B8]">
                <tr>
                  <td className="py-2.5 px-4 font-mono text-[#6865E8] dark:text-[#7C79F2]">monvex_auth_session</td>
                  <td className="py-2.5 px-4">localStorage</td>
                  <td className="py-2.5 px-4">Cryptographic JWT access token & user profile state</td>
                  <td className="py-2.5 px-4">Cleared on logout / expiry</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono text-[#6865E8] dark:text-[#7C79F2]">monvex-theme</td>
                  <td className="py-2.5 px-4">localStorage</td>
                  <td className="py-2.5 px-4">Light / Dark theme preference</td>
                  <td className="py-2.5 px-4">Persistent</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono text-[#6865E8] dark:text-[#7C79F2]">monvex-sidebar-collapsed</td>
                  <td className="py-2.5 px-4">Cookie & localStorage</td>
                  <td className="py-2.5 px-4">Navigation sidebar collapse state to prevent layout shift</td>
                  <td className="py-2.5 px-4">Persistent (1 year)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono text-[#6865E8] dark:text-[#7C79F2]">monvex_last_activity_ts</td>
                  <td className="py-2.5 px-4">localStorage</td>
                  <td className="py-2.5 px-4">Inactivity tracking for automatic session auto-lock</td>
                  <td className="py-2.5 px-4">Session lifetime</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] pt-1">
            For further details, review our complete <Link href="/cookie-policy" className="text-[#6865E8] dark:text-[#7C79F2] underline font-semibold">Cookie & Storage Policy</Link>.
          </p>
        </section>

        {/* Section 5: Security Architecture */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">5.</span> Security Measures & Encryption
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            We deploy multi-layered safeguards designed to prevent unauthorized access, manipulation, or disclosure:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li><strong>Transport Security:</strong> All client-server traffic is encrypted using TLS 1.3 with strict HTTP Strict Transport Security (HSTS) headers.</li>
            <li><strong>Password Cryptography:</strong> Passwords are processed with salted cryptographic hashes (Argon2 / PBKDF2 with SHA-256) and are never stored in plaintext.</li>
            <li><strong>Cross-Origin Protections:</strong> Strict Content-Security-Policy (CSP) headers and <code className="font-mono text-xs">X-Frame-Options: DENY</code> to eliminate clickjacking.</li>
            <li><strong>Two-Factor Authentication:</strong> Time-based One-Time Password (TOTP) support configurable in the Security Vault.</li>
          </ul>
        </section>

        {/* Section 6: User Rights */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">6.</span> Your Data Rights (GDPR & CCPA)
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            Regardless of your geographic location, MONVEX provides complete sovereignty over your data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block mb-1">Right to Access & Portability</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Export all transactions, budgets, goals, and ledger history as structured JSON or CSV anytime via Settings.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F]">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] block mb-1">Right to Erasure (&ldquo;To Be Forgotten&rdquo;)</span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Request permanent account purge. All related ledger lines, receipts, and profile data will be expunged from primary storage.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Inquiries & Contact */}
        <section className="space-y-3 pt-4 border-t border-[#E7E6F0] dark:border-[#2D2B3F]">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">7.</span> Contact the Privacy Controller
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            For questions regarding this policy or to submit a data erasure request, contact our engineering team directly:
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6865E8] hover:bg-[#5754DC] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Submit Privacy Inquiry</span>
            </Link>
            <span className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
              or email directly at <strong className="text-[#20212B] dark:text-[#F4F3FA]">danishansari6876@gmail.com</strong>
            </span>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
