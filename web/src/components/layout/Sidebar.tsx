'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  ChevronRight,
  Sliders,
  Landmark,
  CreditCard,
  Repeat,
  FileText,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { UserProfileModal, PRESET_AVATARS } from '@/components/profile/UserProfileModal';

interface SidebarProps {
  onOpenAddTransaction?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAddTransaction }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const avatarUrl = user?.avatar_url;
  const avatarPreset = user?.avatar_preset ? PRESET_AVATARS.find((p) => p.id === user.avatar_preset) : null;

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

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User Profile';

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <div className="px-3 pb-1 swiss-eyebrow text-[10px] font-bold text-[#898390] uppercase tracking-wider">
        {title}
      </div>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150',
              isActive
                ? 'bg-[#EEEAF7] text-[#191522] shadow-2xs border border-[#625477]/20 scale-[1.01]'
                : 'text-[#625D69] hover:text-[#191522] hover:bg-white/70'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-[#2A1F3D]' : 'text-[#898390]'
                )}
              />
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
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 liquid-glass-sidebar select-none z-30 justify-between">
        {/* Top Header & Navigation */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* USER PROFILE HEADER CAPSULE */}
          <div className="p-3 border-b border-[#E4E2DC]/80 bg-white/40">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white/80 transition-all text-left group border border-transparent hover:border-[#E4E2DC] hover:shadow-sm"
              title="Click to open Profile Setup & Customization"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* User Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-md ring-2 ring-white/90 bg-[#2A1F3D] text-white text-xs font-black">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : avatarPreset ? (
                      <div className={cn('h-full w-full flex items-center justify-center text-lg bg-gradient-to-br', avatarPreset.bg)}>
                        {avatarPreset.emoji}
                      </div>
                    ) : (
                      <span>{fullName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                </div>

                {/* Name & Low-Opacity Username */}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#191522] block truncate leading-tight group-hover:text-[#2563EB] transition-colors">
                    {fullName}
                  </span>
                  <span className="text-[10.5px] font-semibold text-[#191522]/55 block truncate mt-0.5">
                    @{user?.username || 'user'}
                  </span>
                </div>
              </div>

              {/* Action Chevron */}
              <div className="p-1 rounded-lg text-[#898390] group-hover:text-[#191522] group-hover:bg-white transition-all shrink-0">
                <Sliders className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 px-3.5 py-4 space-y-4 overflow-y-auto">
            {/* Quick Command Center Trigger */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('monvex:open-command-center'));
                }
              }}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold bg-[#FAF9F6] text-[#625D69] hover:text-[#191522] hover:bg-[#EEEAF7]/50 border border-[#E4E2DC] transition-all shadow-2xs group mb-2"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#898390] group-hover:text-[#191522]" />
                <span className="text-[11px]">Command Center</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-[#E4E2DC] text-[9px] font-mono text-[#898390] font-bold">
                ⌘K
              </kbd>
            </button>

            {renderNavGroup('Overview', overviewNav)}
            {renderNavGroup('Money Movement', moneyNav)}
            {renderNavGroup('Planning & Projections', planningNav)}
            {renderNavGroup('Financial Intelligence', intelligenceNav)}
            {renderNavGroup('Documents & Reports', documentsNav)}
            {renderNavGroup('System & Security', systemNav)}
          </div>
        </div>

        {/* Bottom Status Card */}
        <div className="p-3.5 m-3 rounded-xl bg-white/80 border border-[#E4E2DC] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#191522]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
              <span>Vault Protected</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <p className="text-[10px] text-[#625D69] font-medium leading-tight">
            256-bit AES cryptographic isolation active.
          </p>
        </div>
      </aside>

      {/* User Profile Setup & Customization Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
