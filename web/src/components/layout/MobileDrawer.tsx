'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Search,
  Home,
  Receipt,
  PieChart,
  Target,
  BarChart2,
  Sparkles,
  Settings,
  TrendingUp,
  ShieldCheck,
  Sliders,
  Landmark,
  CreditCard,
  Repeat,
  FileText,
  Bell,
  LogOut,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTransaction?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAddTransaction,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    badge?: string;
  }

  const overviewNav: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
  ];

  const moneyNav: NavItem[] = [
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Net Worth', href: '/net-worth', icon: Landmark },
    { name: 'Debt & EMI', href: '/debt', icon: CreditCard },
    { name: 'Subscriptions', href: '/subscriptions', icon: Repeat },
  ];

  const planningNav: NavItem[] = [
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Savings Goals', href: '/goals', icon: Target },
    { name: 'What-If Simulator', href: '/simulator', icon: Sliders, badge: 'Sim' },
  ];

  const intelligenceNav: NavItem[] = [
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Cashflow Forecast', href: '/forecast', icon: TrendingUp },
    { name: 'AI Copilot', href: '/ai', icon: Sparkles, badge: 'AI' },
  ];

  const documentsNav: NavItem[] = [
    { name: 'Receipt Vision', href: '/receipts', icon: Receipt, badge: 'OCR' },
    { name: 'Reports & Statements', href: '/reports', icon: FileText },
  ];

  const systemNav: NavItem[] = [
    { name: 'Smart Alerts', href: '/notifications', icon: Bell },
    { name: 'Security Shield', href: '/security', icon: ShieldCheck, badge: 'ZeroTrust' },
    { name: 'Settings & Profile', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  const handleNavClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#2A1F3D]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 left-0 w-[82vw] max-w-xs bg-[#FBFBFA] border-r border-[#E4E2DC] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        {/* Top Header */}
        <div className="p-4 border-b border-[#E4E2DC] flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl overflow-hidden shadow-2xs bg-white border border-[#E4E2DC] flex items-center justify-center p-0.5">
              <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-[#191522] block leading-tight">MONVEX</span>
              <span className="text-[10px] text-[#898390] font-medium block">Financial Intelligence</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#898390] hover:text-[#191522] hover:bg-[#F6F5F1] transition-colors focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pb-1">
            <button
              onClick={() => {
                onClose();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('monvex:open-command-center'));
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 min-h-[44px] rounded-xl bg-white border border-[#E4E2DC] text-xs font-bold text-[#191522] shadow-xs active:scale-95 transition-all"
            >
              <Search className="h-3.5 w-3.5 text-[#4056A1]" />
              <span>Search</span>
            </button>

            {onOpenAddTransaction && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddTransaction();
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 min-h-[44px] rounded-xl bg-[#2A1F3D] hover:bg-[#3B2D54] text-white text-xs font-bold shadow-subtle active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Record</span>
              </button>
            )}
          </div>

          {/* Navigation Groups (6 Logical Tiers) */}
          {[
            { title: 'Overview', items: overviewNav },
            { title: 'Money Movement', items: moneyNav },
            { title: 'Planning & Projections', items: planningNav },
            { title: 'Financial Intelligence', items: intelligenceNav },
            { title: 'Documents & Reports', items: documentsNav },
            { title: 'System & Security', items: systemNav },
          ].map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#898390] font-bold">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2.5 min-h-[44px] text-xs font-bold transition-all',
                      isActive
                        ? 'bg-[#EEEAF7] text-[#191522] shadow-xs border border-[#625477]/20'
                        : 'text-[#625D69] hover:text-[#191522] hover:bg-white/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#2A1F3D]' : 'text-[#898390]')} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="brutalist-tag-indigo text-[9px] py-0 px-1.5">
                        {item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2A1F3D]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User & Sign Out Footer */}
        <div className="p-3.5 border-t border-[#E4E2DC] bg-white/90 space-y-2">
          {user && (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-[#191522] block truncate">
                  {user.first_name || user.username}
                </span>
                <span className="text-[10px] text-[#898390] block truncate">
                  @{user.username}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E8F7F1] text-[#059669] border border-[#A7F3D0]">
                Active
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-bold text-[#E11D48] hover:bg-[#FFF1F2] border border-[#FECDD3] transition-colors active:scale-98"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out of MONVEX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
