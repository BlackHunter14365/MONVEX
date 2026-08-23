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

interface MobileNavProps {
  onOpenAddTransaction?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenAddTransaction }) => {
  const pathname = usePathname();

  const items = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Ledger', href: '/transactions', icon: Receipt },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'AI Copilot', href: '/ai', icon: Sparkles },
  ];

  const handleOpenDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('monvex:open-mobile-drawer'));
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E4E2DC] bg-[#FBFBFA]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg select-none safe-area-bottom">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-0.5 py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all',
              isActive
                ? 'text-[#172033] bg-white shadow-xs border border-[#E4E2DC]'
                : 'text-[#858D9A] hover:text-[#172033]'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#2563EB]' : 'text-[#858D9A]')} />
            <span className="truncate max-w-[50px]">{item.name}</span>
          </Link>
        );
      })}

      {onOpenAddTransaction && (
        <button
          onClick={onOpenAddTransaction}
          className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[#172033] text-white shadow-md active:scale-95 transition-transform shrink-0"
          aria-label="Add transaction"
          title="Add Transaction"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* Full Menu / Drawer Trigger */}
      <button
        onClick={handleOpenDrawer}
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-0.5 py-1 px-1.5 rounded-xl text-[10px] font-bold text-[#858D9A] hover:text-[#172033] transition-all"
        aria-label="Open full menu"
        title="More Features"
      >
        <Menu className="h-4 w-4 text-[#858D9A]" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
