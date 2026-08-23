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

  const overviewNav = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Savings Goals', href: '/goals', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  ];

  const intelligenceNav = [
    { name: 'AI Copilot Intelligence', href: '/ai', icon: Sparkles, badge: 'AI' },
    { name: 'What-If Simulator', href: '/simulator', icon: Sliders, badge: 'Sim' },
    { name: 'Cashflow Forecast', href: '/forecast', icon: TrendingUp },
    { name: 'Receipt Vision Scanner', href: '/receipts', icon: Receipt, badge: 'OCR' },
  ];

  const wealthNav = [
    { name: 'Net Worth & Balance Sheet', href: '/net-worth', icon: Landmark },
    { name: 'Debt & EMI Planner', href: '/debt', icon: CreditCard },
    { name: 'Subscriptions & Bills', href: '/subscriptions', icon: Repeat },
    { name: 'Monthly Statements', href: '/reports', icon: FileText },
  ];

  const systemNav = [
    { name: 'Smart Alerts & Telemetry', href: '/notifications', icon: Bell },
    { name: 'Cyber Defense & Security', href: '/security', icon: ShieldCheck, badge: 'ZeroTrust' },
    { name: 'Preferences & Settings', href: '/settings', icon: Settings },
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
        className="fixed inset-0 bg-[#172033]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 left-0 w-[82vw] max-w-xs bg-[#FBFBFA] border-r border-[#E4E2DC] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        {/* Top Header */}
        <div className="p-4 border-b border-[#E4E2DC] flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl overflow-hidden shadow-sm bg-[#172033] flex items-center justify-center text-white font-black text-xs">
              <img src="/logo.png" alt="MONVEX" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-[#172033] block leading-tight">MONVEX</span>
              <span className="text-[10px] text-[#858D9A] font-medium block">Financial Intelligence</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#858D9A] hover:text-[#172033] hover:bg-[#F6F5F1] transition-colors"
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
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white border border-[#E4E2DC] text-xs font-bold text-[#172033] shadow-xs active:scale-95 transition-all"
            >
              <Search className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Search</span>
            </button>

            {onOpenAddTransaction && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddTransaction();
                }}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#172033] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Record</span>
              </button>
            )}
          </div>

          {/* Overview Group */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#858D9A] font-bold">
              Overview
            </div>
            {overviewNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-white text-[#172033] shadow-sm border border-[#E4E2DC]'
                      : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#172033]' : 'text-[#858D9A]')} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#172033]" />}
                </Link>
              );
            })}
          </div>

          {/* Intelligence Group */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#858D9A] font-bold">
              Intelligence
            </div>
            {intelligenceNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-white text-[#172033] shadow-sm border border-[#E4E2DC]'
                      : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#2563EB]' : 'text-[#858D9A]')} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Wealth & Planning Group */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#858D9A] font-bold">
              Wealth & Planning
            </div>
            {wealthNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-white text-[#172033] shadow-sm border border-[#E4E2DC]'
                      : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#059669]' : 'text-[#858D9A]')} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* System & Security Group */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#858D9A] font-bold">
              System & Security
            </div>
            {systemNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-white text-[#172033] shadow-sm border border-[#E4E2DC]'
                      : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#172033]' : 'text-[#858D9A]')} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom User & Sign Out Footer */}
        <div className="p-3.5 border-t border-[#E4E2DC] bg-white/90 space-y-2">
          {user && (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-[#172033] block truncate">
                  {user.first_name || user.username}
                </span>
                <span className="text-[10px] text-[#858D9A] block truncate">
                  @{user.username}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                Active
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold text-[#E11D48] hover:bg-[#FFF1F2] border border-[#FECDD3] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out of MONVEX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
