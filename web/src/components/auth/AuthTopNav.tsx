'use client';

import React from 'react';
import Link from 'next/link';

interface AuthTopNavProps {
  className?: string;
}

export const AuthTopNav: React.FC<AuthTopNavProps> = ({ className = '' }) => {
  return (
    <header className={`w-full border-b border-[#E4E2DC]/70 bg-[#F6F5F1]/80 backdrop-blur-sm sticky top-0 z-30 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Brand identity */}
        <Link href="/" className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30 rounded-lg p-0.5">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden bg-white p-1 border border-[#E4E2DC] shadow-xs transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
            <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#191522]">
              MONVEX
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide text-[#898390] pl-2.5 border-l border-[#E4E2DC]">
              Financial Operating System
            </span>
          </div>
        </Link>

        {/* Minimal system status & navigation */}
        <div className="flex items-center gap-3">
          <div className="hidden xs:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 border border-[#E4E2DC] text-[11px] font-medium text-[#625D69]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>Operational</span>
          </div>

          <Link
            href="/"
            className="text-xs font-medium text-[#625D69] hover:text-[#191522] transition-colors py-1 px-2 rounded-md hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191522]/30"
          >
            Exit to Home
          </Link>
        </div>
      </div>
    </header>
  );
};
