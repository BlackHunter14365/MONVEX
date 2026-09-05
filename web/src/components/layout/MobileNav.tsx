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
              'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-0.5 py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none',
              isActive
                ? item.name === 'AI Copilot'
                  ? 'text-[#191522] bg-[#E9EDFA] shadow-xs border border-[#7184C4]/30'
                  : 'text-[#191522] bg-[#EEEAF7] shadow-xs border border-[#625477]/20'
                : 'text-[#898390] hover:text-[#191522]'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                isActive
                  ? item.name === 'AI Copilot'
                    ? 'text-[#4056A1]'
                    : 'text-[#2A1F3D]'
                  : 'text-[#898390]'
              )}
            />
            <span className="truncate max-w-[50px]">{item.name}</span>
          </Link>
        );
      })}

      {onOpenAddTransaction && (
        <button
          onClick={onOpenAddTransaction}
          className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[#2A1F3D] text-white shadow-md active:scale-95 transition-transform shrink-0 focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none"
          aria-label="Add transaction"
          title="Add Transaction"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* Full Menu / Drawer Trigger */}
      <button
        onClick={handleOpenDrawer}
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-0.5 py-1 px-1.5 rounded-xl text-[10px] font-bold text-[#898390] hover:text-[#191522] transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none"
        aria-label="Open full menu"
        title="More Features"
      >
        <Menu className="h-4 w-4 text-[#898390]" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
