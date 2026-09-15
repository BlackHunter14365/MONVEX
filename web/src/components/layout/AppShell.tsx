'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import { CommandCenter } from '@/components/search/CommandCenter';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/motion';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAIPage = pathname === '/ai';
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    const handleOpenModal = () => setIsAddTxOpen(true);
    const handleOpenCommandCenter = () => setIsCommandCenterOpen(true);
    const handleOpenMobileDrawer = () => setIsMobileDrawerOpen(true);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandCenterOpen((prev) => !prev);
      }
    };

    window.addEventListener('monvex:open-add-transaction', handleOpenModal);
    window.addEventListener('monvex:open-command-center', handleOpenCommandCenter);
    window.addEventListener('monvex:open-mobile-drawer', handleOpenMobileDrawer);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('monvex:open-add-transaction', handleOpenModal);
      window.removeEventListener('monvex:open-command-center', handleOpenCommandCenter);
      window.removeEventListener('monvex:open-mobile-drawer', handleOpenMobileDrawer);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-[#E4E2DC] bg-white p-1 animate-pulse">
          <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
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
      {/* Keyboard Accessibility Skip Link (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#2A1F3D] focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:text-xs focus:ring-2 focus:ring-offset-2 focus:ring-[#4056A1]"
      >
        Skip to main content
      </a>

      {/* Editorial Sidebar Rail */}
      <Sidebar onOpenAddTransaction={() => setIsAddTxOpen(true)} />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 sm:pb-24 lg:pb-0">
        <Topbar
          onOpenAddTransaction={() => setIsAddTxOpen(true)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          className={isAIPage ? 'hidden lg:flex' : undefined}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 w-full max-w-[1720px] mx-auto flex flex-col outline-none',
            isAIPage ? 'p-0 lg:p-8' : 'p-4 sm:p-6 lg:p-8'
          )}
        >
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
      />

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
