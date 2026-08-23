'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import { CommandCenter } from '@/components/search/CommandCenter';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    const handleOpenModal = () => setIsAddTxOpen(true);
    const handleOpenCommandCenter = () => setIsCommandCenterOpen(true);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandCenterOpen((prev) => !prev);
      }
    };

    window.addEventListener('monvex:open-add-transaction', handleOpenModal);
    window.addEventListener('monvex:open-command-center', handleOpenCommandCenter);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('monvex:open-add-transaction', handleOpenModal);
      window.removeEventListener('monvex:open-command-center', handleOpenCommandCenter);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-md ring-1 ring-black/10 animate-pulse">
          <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover" />
        </div>
        <div className="w-40 space-y-2">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col lg:flex-row antialiased">
      {/* Editorial Sidebar Rail */}
      <Sidebar onOpenAddTransaction={() => setIsAddTxOpen(true)} />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Topbar onOpenAddTransaction={() => setIsAddTxOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1720px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav onOpenAddTransaction={() => setIsAddTxOpen(true)} />

      {/* Universal Command Center (Ctrl+K) */}
      <CommandCenter
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
      />

      {/* Modal Transaction Entry */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={() => {
          refreshUser();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('monvex:transaction-added'));
          }
        }}
      />
    </div>
  );
};
