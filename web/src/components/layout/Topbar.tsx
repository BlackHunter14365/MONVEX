'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  Command,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { UserProfileModal } from '@/components/profile/UserProfileModal';

interface TopbarProps {
  onOpenAddTransaction?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenAddTransaction }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [presetData, setPresetData] = useState<any>(null);

  const loadUserCustomizations = () => {
    if (!user) return;
    try {
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
    const handleProfileUpdated = () => loadUserCustomizations();
    window.addEventListener('monvex:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('monvex:profile-updated', handleProfileUpdated);
  }, [user]);

  const getPageTitle = () => {
    if (pathname.includes('/transactions')) return 'Transactions';
    if (pathname.includes('/budgets')) return 'Budgets';
    if (pathname.includes('/goals')) return 'Goals';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/forecast')) return 'Forecast Simulator';
    if (pathname.includes('/ai')) return 'MONVEX Intelligence';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Format today's date in natural reference format: Friday, Aug 21, 2026
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E4E2DC] bg-[#F6F5F1]/80 px-4 sm:px-6 lg:px-8 select-none backdrop-blur-md">
      {/* Title & Live Status */}
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
          {getPageTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
          Live
        </span>
      </div>

      {/* Search & Command Center Trigger */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('monvex:open-command-center'));
          }
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#E4E2DC] hover:border-[#D6D4CD] text-xs text-[#858D9A] hover:text-[#172033] transition-all shadow-2xs group max-w-xs w-full sm:w-64"
        title="Open Universal Command Center (Ctrl+K / Cmd+K)"
        aria-label="Search MONVEX (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5 text-[#858D9A] group-hover:text-[#172033]" />
        <span className="hidden sm:inline font-medium">Search MONVEX...</span>
        <span className="sm:hidden font-medium">Search...</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-[#F6F5F1] border border-[#E4E2DC] text-[10px] font-mono font-bold text-[#5F6878]">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Formatted Date */}
        <span className="hidden md:inline-block text-xs font-medium text-[#858D9A]">
          {todayFormatted}
        </span>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsDropdownOpen(false);
            }}
            className="relative p-2 rounded-lg text-[#5F6878] hover:text-[#172033] hover:bg-white/80 border border-transparent hover:border-[#E4E2DC] transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E11D48] text-white text-[9px] font-black">
              2
            </span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl liquid-glass p-3 shadow-xl border border-[#E4E2DC] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC] mb-2">
                <span className="text-xs font-bold text-[#172033]">Telemetry Notifications</span>
                <span className="text-[10px] font-bold text-[#2563EB]">Mark read</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white/90 border border-[#E4E2DC] text-xs">
                  <div className="flex items-center gap-1.5 text-[#059669] font-bold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Monthly Surplus on Track</span>
                  </div>
                  <p className="text-[11px] text-[#5F6878] mt-1">
                    Your savings rate is +28.4% above last month’s baseline.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 border border-[#E4E2DC] text-xs">
                  <div className="flex items-center gap-1.5 text-[#2563EB] font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Security Engine Active</span>
                  </div>
                  <p className="text-[11px] text-[#5F6878] mt-1">
                    Zero anomalous outbound spikes detected across current cycle.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* + Add Transaction Button */}
        {onOpenAddTransaction && (
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] py-2 px-3.5 text-xs font-bold text-white transition-all shadow-sm active:translate-y-[1px]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add transaction</span>
          </button>
        )}

        {/* User Profile Dropdown Pill */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-white/90 border border-[#E4E2DC] px-2.5 py-1.5 hover:border-[#D6D4CD] transition-all shadow-sm group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden bg-[#172033] text-white text-xs font-bold uppercase shadow-xs">
                {avatarImage ? (
                  <img src={avatarImage} alt={user.username} className="h-full w-full object-cover" />
                ) : presetData ? (
                  <div className={cn('h-full w-full flex items-center justify-center text-sm bg-gradient-to-br', presetData.bg)}>
                    {presetData.emoji}
                  </div>
                ) : (
                  user.username.slice(0, 1)
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[#172033] max-w-[120px] truncate">
                {user.username}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#858D9A] hidden sm:inline group-hover:text-[#172033]" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl liquid-glass py-2 shadow-2xl border border-white/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#E4E2DC]/80 mb-1">
                  <span className="text-xs font-black text-[#172033] block truncate">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-[#858D9A] block truncate font-medium mt-0.5">
                    {user.email}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#172033] hover:bg-white/80 transition-colors text-left"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>Profile Setup & Avatar</span>
                </button>

                <Link
                  href="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#5F6878] hover:text-[#172033] hover:bg-white/80 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Preferences & Security</span>
                </Link>

                <div className="my-1 border-t border-[#E4E2DC]/80" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#E11D48] hover:bg-[#FFF1F2] transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-[#172033] px-4 py-2 text-xs font-bold text-white shadow-sm"
          >
            Sign in
          </Link>
        )}
      </div>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </header>
  );
};
