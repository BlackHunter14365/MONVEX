'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#172033] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      {/* Brand Icon */}
      <div className="text-center mb-6 space-y-3">
        <div className="relative h-16 w-16 mx-auto rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/80">
          <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover" />
        </div>
        <span className="text-xl font-black tracking-tight text-[#172033]">MONVEX</span>
      </div>

      {/* Card Content */}
      <div className="w-full max-w-md editorial-card p-8 text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#E11D48] shadow-xs">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <span className="swiss-eyebrow text-[#E11D48] block">Error 404 • Page Not Found</span>
          <h1 className="text-2xl font-black text-[#172033] tracking-tight">
            Destination Unavailable
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6878] leading-relaxed">
            The requested financial intelligence resource or route does not exist or has been relocated in the MONVEX system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href="/dashboard" className="w-full">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="h-4 w-4" />}
              className="w-full text-xs font-bold bg-[#172033] hover:bg-[#0F172A]"
            >
              Return to Dashboard
            </Button>
          </Link>

          <Link href="/transactions" className="w-full">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Search className="h-4 w-4" />}
              className="w-full text-xs font-bold"
            >
              View Transactions
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#E4E2DC] text-center">
          <Link
            href="/settings"
            className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
          >
            <span>Need assistance? Check settings & system health</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
