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
import { UserProfileModal } from '@/components/profile/UserProfileModal';

interface SidebarProps {
  onOpenAddTransaction?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAddTransaction }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [presetData, setPresetData] = useState<any>(null);
  const [cachedName, setCachedName] = useState<string | null>(null);

  const loadUserCustomizations = () => {
    if (!user) return;
    try {
      const profileRaw = localStorage.getItem(`monvex_user_profile_${user.username}`);
      if (profileRaw) {
        const parsed = JSON.parse(profileRaw);
        if (parsed.firstName || parsed.lastName) {
          setCachedName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
        }
      }

      const raw = localStorage.getItem(`monvex_avatar_${user.username}`);
      if (raw) {
        if (raw.startsWith('data:image')) {
          setAvatarImage(raw);
          setPresetData(null);
        } else if (raw.startsWith('{')) {
          setPresetData(JSON.parse(raw));
          setAvatarImage(null);
        }
      } else {
        setAvatarImage(null);
        setPresetData(null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadUserCustomizations();

    const handleProfileUpdated = () => {
      loadUserCustomizations();
    };

    window.addEventListener('monvex:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('monvex:profile-updated', handleProfileUpdated);
  }, [user]);

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

  const fullName = cachedName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User Profile';

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 liquid-glass-sidebar select-none z-30 justify-between">
        {/* Top Header & Navigation */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* USER PROFILE HEADER CAPSULE (Replaces default logo header) */}
          <div className="p-3 border-b border-[#E4E2DC]/80 bg-white/40">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white/80 transition-all text-left group border border-transparent hover:border-[#E4E2DC] hover:shadow-sm"
              title="Click to open Profile Setup & Customization"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* User Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-md ring-2 ring-white/90 bg-[#172033] text-white text-xs font-black">
                    {avatarImage ? (
                      <img src={avatarImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span>{fullName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                </div>

                {/* Name & Low-Opacity Username */}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#172033] block truncate leading-tight group-hover:text-[#2563EB] transition-colors">
                    {fullName}
                  </span>
                  <span className="text-[10.5px] font-semibold text-[#172033]/55 block truncate mt-0.5">
                    @{user?.username || 'user'}
                  </span>
                </div>
              </div>

              {/* Action Chevron */}
              <div className="p-1 rounded-lg text-[#858D9A] group-hover:text-[#172033] group-hover:bg-white transition-all shrink-0">
                <Sliders className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 px-3.5 py-4 space-y-5 overflow-y-auto">
            {/* Quick Command Center Trigger */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('monvex:open-command-center'));
                }
              }}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold bg-[#FAF9F6] text-[#5F6878] hover:text-[#172033] hover:bg-white border border-[#E4E2DC] transition-all shadow-2xs group mb-2"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#858D9A] group-hover:text-[#172033]" />
                <span className="text-[11px]">Command Center</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-[#E4E2DC] text-[9px] font-mono text-[#858D9A] font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Overview Group */}
            <div className="space-y-1">
              <div className="px-3 pb-1 swiss-eyebrow">
                Overview
              </div>
              {overviewNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150',
                      isActive
                        ? 'bg-white/95 text-[#172033] shadow-sm border border-[#E4E2DC] scale-[1.01]'
                        : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-[#172033]' : 'text-[#858D9A]'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#172033]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Intelligence Group */}
            <div className="space-y-1">
              <div className="px-3 pb-1 swiss-eyebrow">
                Intelligence
              </div>
              {intelligenceNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150',
                      isActive
                        ? 'bg-white/95 text-[#172033] shadow-sm border border-[#E4E2DC]'
                        : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-[#2563EB]' : 'text-[#858D9A]'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="brutalist-tag-emerald text-[9px] py-0 px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Wealth & Planning Group */}
            <div className="space-y-1">
              <div className="px-3 pb-1 swiss-eyebrow">
                Wealth & Planning
              </div>
              {wealthNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150',
                      isActive
                        ? 'bg-white/95 text-[#172033] shadow-sm border border-[#E4E2DC]'
                        : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-[#059669]' : 'text-[#858D9A]'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* System & Security Group */}
            <div className="space-y-1">
              <div className="px-3 pb-1 swiss-eyebrow">
                System & Security
              </div>
              {systemNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150',
                      isActive
                        ? 'bg-white/95 text-[#172033] shadow-sm border border-[#E4E2DC]'
                        : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-[#172033]' : 'text-[#858D9A]'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="brutalist-tag-emerald text-[9px] py-0 px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Status Card */}
        <div className="p-3.5 m-3 rounded-xl bg-white/70 border border-[#E4E2DC]/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
              <span>Vault Protected</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <p className="text-[10px] text-[#5F6878] font-medium leading-tight">
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
