'use client';

import React from 'react';
import { AuthTopNav } from './AuthTopNav';

interface AuthShellProps {
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  const patternAutoId = React.useId().replace(/:/g, '');
  const patternId = `ledger-grid-${patternAutoId}`;

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#191522] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#191522] selection:text-white">
      {/* =========================================================================
          SUBTLE MONVEX INTELLIGENCE BACKGROUND SYSTEM
          Ultra-low opacity vector grid and architectural ledger flow paths.
          Zero marketing buzzwords, zero fake charts, zero distraction.
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        {/* Fine Architectural Coordinate Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={patternId} width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#E4E2DC" strokeWidth="0.75" />
              <circle cx="64" cy="64" r="1" fill="#D6D4CD" />
              <circle cx="0" cy="0" r="1" fill="#D6D4CD" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>

        {/* Quiet Abstract Ledger Pathways (Subtle Vector Lines) */}
        <svg
          className="absolute right-0 top-1/4 w-[720px] h-[720px] opacity-[0.06] text-[#191522]"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="400" cy="400" r="320" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="400" cy="400" r="240" stroke="currentColor" strokeWidth="1" />
          <circle cx="400" cy="400" r="160" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
          <path d="M 80 400 L 720 400" stroke="currentColor" strokeWidth="1" />
          <path d="M 400 80 L 400 720" stroke="currentColor" strokeWidth="1" />
          <path d="M 173 173 L 627 627" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 5" />
          <path d="M 173 627 L 627 173" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 5" />
        </svg>

        {/* Discrete Ledger Ticks & Coordinate Markers */}
        <div className="hidden lg:block absolute left-8 top-28 font-mono text-[9px] text-[#A09CA8]/30 tracking-widest uppercase">
          SYS.LOC // 0x4D.0x4F.0x4E
        </div>
        <div className="hidden lg:block absolute right-12 bottom-16 font-mono text-[9px] text-[#A09CA8]/30 tracking-widest uppercase">
          LEDGER.ENV // SESSION_EPHEMERAL
        </div>
      </div>

      {/* TOP NAVIGATION */}
      <AuthTopNav />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-20 items-center">
          {/* LEFT / PRIMARY COLUMN: AUTHENTICATION INTERACTION */}
          <div className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-6 xl:col-span-5">
            {children}
          </div>

          {/* RIGHT COLUMN: ARCHITECTURAL WORKSPACE INTEL (DESKTOP ONLY, ASYMMETRIC BALANCE) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center pl-6 xl:pl-12">
            <div className="max-w-lg space-y-6">
              {/* Quiet Section Tag */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/70 border border-[#E4E2DC] text-[11px] font-mono text-[#625D69]">
                <span>WORKSPACE ARCHITECTURE</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl xl:text-3xl font-semibold tracking-tight text-[#191522] leading-snug">
                  Personal financial operating system.
                </h2>
                <p className="text-sm text-[#625D69] leading-relaxed">
                  Unified balance sheet telemetry, real-time double-entry ledger verification, and deterministic scenario forecasting.
                </p>
              </div>

              {/* Structured Architectural Parameters (Clean data-inspired details, no marketing fluff) */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-lg bg-white/80 border border-[#E4E2DC] shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#191522]">Session Integrity</span>
                    <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-[#625D69]">
                    Isolated browser lifecycle with automatic token eviction upon window or tab termination.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white/80 border border-[#E4E2DC] shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#191522]">Double-Entry Ledger</span>
                    <span className="font-mono text-[10px] text-[#625D69] bg-[#F1F0EC] px-1.5 py-0.5 rounded border border-[#E4E2DC]">VERIFIED</span>
                  </div>
                  <p className="text-[11px] text-[#625D69]">
                    Strict arithmetic reconciliation ensuring every transaction is accounted for without fabrication.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white/80 border border-[#E4E2DC] shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#191522]">Deterministic Forecasting</span>
                    <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">REAL-TIME</span>
                  </div>
                  <p className="text-[11px] text-[#625D69]">
                    Mathematical runway simulations calculated directly from authenticated ledger history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="relative z-10 w-full border-t border-[#E4E2DC]/60 py-4 text-center sm:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#898390]">
          <div>
            © {new Date().getFullYear()} MONVEX. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <span className="hover:text-[#191522] transition-colors cursor-default">Privacy</span>
            <span className="hover:text-[#191522] transition-colors cursor-default">Terms</span>
            <span className="hover:text-[#191522] transition-colors cursor-default">System Health</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
