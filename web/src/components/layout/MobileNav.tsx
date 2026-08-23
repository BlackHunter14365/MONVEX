'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  PieChart,
  Target,
  MessageSquare,
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
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Ask AI', href: '/ai', icon: MessageSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur px-3 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded text-[10px] font-medium transition-colors',
              isActive
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}

      {onOpenAddTransaction && (
        <button
          onClick={onOpenAddTransaction}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white shadow-subtle active:scale-95"
          aria-label="Add transaction"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
};
