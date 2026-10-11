'use client';

import React from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  ShieldCheck,
  Lock,
  Key,
  Zap,
  Activity,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowRight,
  Database,
  Cpu,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SecurityOverviewPage() {
  const securityShields = [
    {
      title: 'Web Application Firewall (WAF)',
      description: 'Active regex inspection engine analyzing all incoming payloads for SQL injection, Cross-Site Scripting (XSS), path traversal, and malicious headers.',
      icon: ShieldCheck,
      status: 'OPTIMAL & ENFORCED',
    },
    {
      title: 'Cryptographic JWT Lifecycle & Blacklisting',
      description: 'Stateless HMAC-SHA256 authenticated sessions with short 60-minute token TTL. Refresh token rotation immediately blacklists old tokens to thwart replay attacks.',
      icon: Key,
      status: 'OPTIMAL & ENFORCED',
    },
    {
      title: 'Adaptive IP Throttling & Anti-Brute Force',
      description: 'Multi-tiered rate limiters enforcing max 120 req/minute on standard endpoints and rigorous 5-attempt verification lockouts on authentication forms.',
      icon: Zap,
      status: 'OPTIMAL & ENFORCED',
    },
    {
      title: 'Strict CSP & HSTS Transport Hardening',
      description: 'Frame-ancestors DENY to eradicate clickjacking, zero-eval Content-Security-Policy, and HSTS max-age 31536000 enforcement for TLS 1.3 encryption.',
      icon: Lock,
      status: 'OPTIMAL & ENFORCED',
    },
    {
      title: 'Tamper-Evident Security Audit Logger',
      description: 'Immutable database audit records capturing authentication attempts, IP addresses, user agents, and security incidents for forensic traceability.',
      icon: Activity,
      status: 'OPTIMAL & ENFORCED',
    },
    {
      title: 'Multi-Tenant IDOR & Tenant Isolation',
      description: 'Strict ORM row-level constraints ensuring every query, mutation, and receipt upload is tightly locked to request.user with zero cross-tenant leakage.',
      icon: Database,
      status: 'OPTIMAL & ENFORCED',
    },
  ];

  return (
    <PublicPageShell
      eyebrow="DEFENSE-IN-DEPTH ARCHITECTURE"
      title="Security & Trust Overview"
      description="An open, technical examination of the cryptographic defenses, zero-trust controls, and privacy boundaries protecting MONVEX."
      lastUpdated="October 2026"
      actionSlot={
        <Link href="/security">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Key className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2]" />}
            className="rounded-2xl border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-bold"
          >
            Access Security Vault
          </Button>
        </Link>
      }
    >
      <div className="space-y-12 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Top Guarantee Hero */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-elevated space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ZERO-TRUST ARCHITECTURAL POSTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#20212B] dark:text-[#F4F3FA]">
            We treat your financial records as high-sensitivity telemetry.
          </h2>
          <p className="text-xs sm:text-sm text-[#77798A] dark:text-[#A6A4B8] max-w-3xl leading-relaxed">
            Financial software demands absolute integrity. At MONVEX, security is not an afterthought added before release; every endpoint, migration, and AI pipeline is constructed with defense-in-depth principles, cryptographic hashing, and automated threat mitigation.
          </p>
        </div>

        {/* Section: Active Shields Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">1.</span> Active Production Shields
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            The MONVEX backend runs automated defense controls deployed directly into the request-response lifecycle:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityShields.map((shield) => {
              const Icon = shield.icon;
              return (
                <div
                  key={shield.title}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {shield.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
                      {shield.title}
                    </h3>
                    <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                      {shield.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: AI Privacy Boundary */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">2.</span> AI Copilot Privacy Sandbox
          </h2>
          <div className="p-6 rounded-2xl bg-[#F4F3FA] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3 text-xs leading-relaxed">
            <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
              Zero-Training Architecture on Google Gemini SDK
            </h3>
            <p className="text-[#77798A] dark:text-[#A6A4B8]">
              When interacting with the MONVEX Copilot, your prompt is dispatched over an encrypted TLS connection using enterprise API tokens. Crucially:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#77798A] dark:text-[#A6A4B8]">
              <li>Your personal identifying information (real name, phone number, physical address) is <strong>never passed</strong> to the AI inference prompt.</li>
              <li>Only calculated mathematical abstractions (such as net monthly cash flow or category percentages) are provided to generate contextual responses.</li>
              <li>Under our Google Gemini Enterprise agreement, prompt payloads are ephemeral and are <strong>never logged or retained to train AI models</strong>.</li>
            </ul>
          </div>
        </section>

        {/* Section: Vulnerability Disclosure Program */}
        <section id="disclosure" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">3.</span> Responsible Vulnerability Disclosure
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            We welcome responsible security research from independent researchers. If you identify a potential security flaw in MONVEX, we kindly ask you to adhere to our disclosure policy:
          </p>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3 text-xs">
            <ul className="list-disc pl-5 space-y-1 text-[#77798A] dark:text-[#A6A4B8]">
              <li>Promptly report the vulnerability via our secure <Link href="/contact" className="text-[#6865E8] dark:text-[#7C79F2] underline font-semibold">Contact portal</Link> or direct email to <strong className="text-[#20212B] dark:text-[#F4F3FA]">danishansari6876@gmail.com</strong>.</li>
              <li>Do not exploit the vulnerability beyond what is strictly necessary to establish proof-of-concept.</li>
              <li>Do not access, view, modify, or destroy another user&rsquo;s personal data.</li>
              <li>Provide reasonable time for our engineering team to remediate the vulnerability before public disclosure.</li>
            </ul>
            <div className="pt-2 text-[#20212B] dark:text-[#F4F3FA] font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>We commit to acknowledging all verified security reports within 24 hours.</span>
            </div>
          </div>
        </section>

        {/* User Security Action */}
        <div className="p-6 rounded-2xl bg-[#EEEDF8] dark:bg-[#23213B] border border-[#6865E8]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
              Looking to configure Two-Factor Authentication?
            </h4>
            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
              Authenticated users can enable TOTP Authenticator apps, rotate password keys, and review active sessions in the Security Vault.
            </p>
          </div>
          <Link href="/security">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="bg-[#6865E8] hover:bg-[#5754DC] text-white font-bold rounded-xl shrink-0"
            >
              Open Security Vault
            </Button>
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
