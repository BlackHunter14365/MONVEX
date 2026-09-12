'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function WebAppGateway() {
  const router = useRouter();
  const { isAuthenticated, isLoading, sessionExpiredReason } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      if (sessionExpiredReason === 'inactivity') {
        router.replace('/login?reason=inactivity');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, sessionExpiredReason, router]);

  return (
    <div className="min-h-screen bg-[#0E131F] flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-white">
      <div className="flex flex-col items-center space-y-6 max-w-sm w-full text-center">
        {/* Sleek branded emblem */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-md shadow-2xl animate-pulse">
          <img
            src="/logo.png"
            alt="MONVEX"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Brand identity */}
        <div className="space-y-1.5">
          <div className="text-xl font-bold tracking-tight text-white">
            MONVEX
          </div>
          <div className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">
            Opening Web App...
          </div>
        </div>

        {/* Minimal loading indicator */}
        <div className="w-44 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
