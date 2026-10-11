'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  PieChart,
  Sparkles,
  Menu,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/queryKeys';
import { api } from '@/lib/api';

interface MobileNavProps {
  onOpenAddTransaction?: () => void;
}

const MOBILE_NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Ledger', href: '/transactions', icon: Receipt },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'AI Copilot', href: '/ai', icon: Sparkles },
];

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenAddTransaction }) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const prefetchMobileRoute = (href: string) => {
    if (href === '/transactions') {
      queryClient.prefetchQuery({ queryKey: queryKeys.transactions.list({}), queryFn: () => api.getTransactions({}) });
    } else if (href === '/budgets') {
      queryClient.prefetchQuery({ queryKey: queryKeys.budgets.list(), queryFn: () => api.getBudgets() });
    }
  };

  const handleOpenDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monvex:open-mobile-drawer'));
    }
  };

  return (
    <nav aria-label="Mobile bottom navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E7E6F0] bg-[#FAF9FC]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg select-none safe-area-bottom">
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onTouchStart={() => prefetchMobileRoute(item.href)}
            onMouseEnter={() => prefetchMobileRoute(item.href)}
            className={cn(
              'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-0.5 py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none focus-visible:ring-offset-1',
              isActive
                ? item.name === 'AI Copilot'
                  ? 'text-[#20212B] bg-[#EDEBFB] shadow-xs border border-[#6865E8]/30'
                  : 'text-[#20212B] bg-[#EEEDF8] shadow-xs border border-[#6865E8]/20'
                : 'text-[#77798A] hover:text-[#20212B]'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                isActive
                  ? 'text-[#6865E8]'
                  : 'text-[#9DA0B3]'
              )}
              aria-hidden="true"
            />
            <span className="truncate max-w-[50px]">{item.name}</span>
          </Link>
        );
      })}

      {onOpenAddTransaction && (
        <button
          onClick={onOpenAddTransaction}
          className="flex flex-col items-center justify-center h-11 w-11 rounded-xl bg-[#6865E8] text-white shadow-md active:scale-95 transition-transform shrink-0 focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none focus-visible:ring-offset-1"
          aria-label="Add transaction"
          title="Add Transaction"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Full Menu / Drawer Trigger */}
      <button
        onClick={handleOpenDrawer}
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-0.5 py-1 px-1.5 rounded-xl text-[10px] font-bold text-[#77798A] hover:text-[#20212B] transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none focus-visible:ring-offset-1"
        aria-label="Open full menu"
        title="More Features"
      >
        <Menu className="h-4 w-4 text-[#9DA0B3]" aria-hidden="true" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
