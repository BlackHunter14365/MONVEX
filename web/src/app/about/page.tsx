'use client';

import React from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  Code,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
  ArrowRight,
  Github,
  Mail,
  Heart,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  const techStack = [
    { category: 'Frontend Architecture', tech: 'Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion' },
    { category: 'Backend Engine', tech: 'Django 5 REST Framework, Python 3.12, Argon2 & PBKDF2 Password Hashing' },
    { category: 'Database & Storage', tech: 'SQLite & PostgreSQL, Strict Multi-Tenant Row Isolation, Double-Entry Ledger Tables' },
    { category: 'AI & Machine Learning', tech: 'Google Gemini 2.0 SDK, Scikit-Learn Regression Models, Tesseract OCR Pipeline' },
    { category: 'Desktop Application', tech: 'Tauri v2 Native Desktop Container, Rust Runtime, Windows Bundler' },
    { category: 'Design System', tech: 'Aurora Glass Token Architecture, WCAG AA Calibrated Palette, Responsive Bento Grids' },
  ];

  const architecturalPillars = [
    {
      title: 'Deterministic Arithmetic',
      desc: 'No fabricated calculations. Every transaction is governed by double-entry bookkeeping rules ensuring debits and credits always balance.',
      icon: Terminal,
    },
    {
      title: 'Zero Data Brokering',
      desc: 'We never sell, broker, or monetize your financial telemetry. There are zero third-party tracking pixels or ad networks.',
      icon: ShieldCheck,
    },
    {
      title: 'Stateless AI Copilot',
      desc: 'Generative queries to Google Gemini are ephemeral. Your financial records are never used to train public foundation models.',
      icon: Cpu,
    },
    {
      title: 'Local-First Speed',
      desc: 'Designed for instantaneous sub-100ms UI interactions, offline capability via Tauri, and complete data portability at all times.',
      icon: Zap,
    },
  ];

  return (
    <PublicPageShell
      eyebrow="ENGINEERING PHILOSOPHY & ORIGIN"
      title="About MONVEX"
      description="The story, technical architecture, and founding principles behind the AI-powered personal financial operating system."
    >
      <div className="space-y-12 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Mission Statement Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-elevated space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDF8] dark:bg-[#23213B] text-[11px] font-mono font-bold text-[#6865E8] dark:text-[#7C79F2]">
            <span>FOUNDING MISSION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20212B] dark:text-[#F4F3FA] leading-tight">
            Financial clarity through verifiable math, not advertising models.
          </h2>
          <p className="text-xs sm:text-sm text-[#77798A] dark:text-[#A6A4B8] leading-relaxed max-w-3xl">
            Modern personal budgeting software has lost its way. Most popular apps force users into opaque subscription funnels, sell user transaction histories to lending aggregators, or rely on invasive bank scrapers that constantly break. MONVEX was created to build a cleaner alternative: an autonomous, double-entry financial operating system that gives individuals absolute sovereignty over their net worth, cash runway, and long-term trajectory.
          </p>
        </div>

        {/* Section: The Story & The Creator */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">1.</span> The Creator & The Vision
          </h2>
          <div className="p-6 rounded-2xl bg-[#F4F3FA] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card flex items-center justify-center p-2 shrink-0">
              <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-2 flex-1 text-xs">
              <h3 className="text-base font-bold text-[#20212B] dark:text-[#F4F3FA]">
                Conceived & Engineered by Danish Ansari (Drix)
              </h3>
              <p className="text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                Danish is a software engineer and BSc Computer Science student passionate about full-stack systems architecture, cryptography, and deterministic computing. Rather than designing another superficial clone with fake charts, Danish engineered MONVEX from the database layer upward—implementing rigorous double-entry ledgers, automated OCR receipt parsing, and Google Gemini reasoning.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold">
                <a
                  href="https://github.com/danishansari6876"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#6865E8] dark:text-[#7C79F2] hover:underline"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>GitHub: @danishansari6876</span>
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-[#20212B] dark:text-[#F4F3FA] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Get in Touch</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Architectural Pillars */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">2.</span> Core Engineering Pillars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {architecturalPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-2"
                >
                  <div className="h-9 w-9 rounded-xl bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2] flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Technical Stack */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">3.</span> Production Technology Stack
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            MONVEX is built on modern, battle-tested software infrastructure designed for speed and reliability:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {techStack.map((item) => (
              <div
                key={item.category}
                className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-1"
              >
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#6865E8] dark:text-[#7C79F2] block">
                  {item.category}
                </span>
                <p className="text-[#20212B] dark:text-[#F4F3FA] font-medium">
                  {item.tech}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#20212B] to-[#2E2F3E] text-white space-y-4 text-center">
          <h3 className="text-2xl font-black tracking-tight">
            Ready to experience deterministic financial clarity?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create an account in 30 seconds and explore what personal financial intelligence looks like without ads or compromises.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-white hover:bg-slate-100 text-[#20212B] font-bold rounded-xl"
              >
                Create Free Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="md"
                className="text-white hover:bg-white/10 border border-white/20 rounded-xl"
              >
                Send Us Feedback
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
