'use client';

import React from 'react';
import { ArrowUpRight, Code2, Cpu, ShieldCheck, Sparkles, Terminal, UserCheck, Zap, Layers, Compass, CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  onOpenContact: () => void;
}

export function AboutSection({ onOpenContact }: AboutSectionProps) {
  const verifiedTechStack = [
    { name: 'Next.js 14 & React 18', category: 'Frontend Architecture' },
    { name: 'TypeScript & Tailwind CSS', category: 'Type Safety & UI' },
    { name: 'Django 5 REST Framework', category: 'Backend API' },
    { name: 'Google GenAI SDK (Gemini 2.0)', category: 'Financial AI Engine' },
    { name: 'Scikit-Learn & NumPy', category: 'Statistical Telemetry' },
    { name: 'PostgreSQL / SQLite', category: 'Relational Database' },
    { name: 'Google Identity Services (OAuth2)', category: 'Secure Authentication' },
    { name: 'Framer Motion & Recharts', category: 'Data Visualization' },
  ];

  const coreCapabilities = [
    'Personal financial ledger & velocity tracking',
    'Bank, account, and card management with 100% user-owned records',
    'Category budget monitoring & threshold alerting',
    'Milestone-driven savings goal tracking',
    'Statistical cash-flow burn & 90-day trajectory forecasting',
    '7-factor deterministic financial health index (0–100)',
    'What-if spending reduction & 3-year SIP compounding simulations',
    'Purchase feasibility simulator with emergency reserve safety buffers',
    '18-tool multi-tenant AI financial agent with function calling',
    'Real-time Google Search grounding for verified market queries',
    'Tamper-evident security audit logging & WAF inspection',
    'Zero synthetic demo data — dynamic database persistence',
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
      {/* Section Header */}
      <div className="border-b border-[#E5E7EB] pb-12 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full bg-[#172033]" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5F6878]">
            About MONVEX &amp; Engineering Philosophy
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#172033] leading-tight max-w-4xl">
          Financial data should help you make decisions, not just show you numbers.
        </h2>

        <p className="text-sm sm:text-base text-[#5F6878] max-w-3xl leading-relaxed">
          MONVEX is an AI-powered personal financial intelligence platform designed to help users understand their money, track financial activity, analyze spending velocity, simulate what-if scenarios, and make grounded financial decisions.
        </p>
      </div>

      {/* Main Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-16 border-b border-[#E5E7EB]">
        {/* Left Column: The Creator */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              The Creator
            </span>
            <h3 className="text-2xl font-black text-[#172033]">
              Danish Ansari
            </h3>
            <p className="text-xs font-semibold text-[#858D9A] uppercase tracking-wider">
              BSc Computer Science Student / Developer
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-[#5F6878] leading-relaxed">
            <p>
              I’m Danish, a BSc Computer Science student and developer interested in building practical software that combines clean user experiences, intelligent systems, automation, and modern web technologies.
            </p>
            <p className="p-4 rounded-2xl bg-[#F7F7F4] border border-[#E5E7EB] text-[#172033] font-medium italic">
              “MONVEX started as a project to explore how personal financial data can be transformed into useful, understandable, and actionable intelligence instead of simply displaying numbers on a dashboard.”
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#172033] hover:bg-[#0F172A] text-xs font-bold text-white shadow-xs transition-all active:translate-y-[1px]"
            >
              <span>Get in Touch</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Project Philosophy & Engineering Idea */}
        <div className="lg:col-span-7 space-y-10 lg:pl-8 lg:border-l lg:border-[#E5E7EB]">
          {/* Philosophy Statement */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#059669]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#059669]">
                Project Philosophy
              </span>
            </div>
            <h4 className="text-xl font-bold text-[#172033]">
              Built around decisions, not dashboards.
            </h4>
            <p className="text-xs sm:text-sm text-[#5F6878] leading-relaxed">
              Most personal finance tools stop at showing numbers. MONVEX is designed to go one step further: understand the numbers, identify velocity patterns, model possible outcomes, and help the user make better financial decisions.
            </p>
          </div>

          {/* Core Capabilities */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider font-mono">
              Engineered Capabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {coreCapabilities.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-start gap-2.5 text-xs text-[#172033]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Built With Technology Section */}
      <div className="pt-14 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#858D9A]">
              Architecture &amp; Stack
            </span>
            <h3 className="text-lg font-bold text-[#172033]">
              Built With Verified Technologies
            </h3>
          </div>
          <p className="text-xs text-[#858D9A]">
            Real dependencies present in the MONVEX repository
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {verifiedTechStack.map((tech, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] transition-colors space-y-1"
            >
              <span className="text-[10px] font-mono font-bold text-[#2563EB] uppercase block">
                {tech.category}
              </span>
              <span className="text-xs font-bold text-[#172033] block">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
