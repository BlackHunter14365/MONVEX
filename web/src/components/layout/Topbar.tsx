'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { UserProfileModal, PRESET_AVATARS } from '@/components/profile/UserProfileModal';
import { GlobalSearch } from './GlobalSearch';
import { NotificationPopover } from './NotificationPopover';

interface TopbarProps {
  onOpenAddTransaction?: () => void;
  onOpenMobileDrawer?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenAddTransaction,
  onOpenMobileDrawer,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const avatarUrl = user?.avatar_url;
  const avatarPreset = user?.avatar_preset ? PRESET_AVATARS.find((p) => p.id === user.avatar_preset) : null;
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Sarah Rahman';

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.includes('/transactions')) return 'Transactions';
    if (pathname.includes('/budgets')) return 'Budgets';
    if (pathname.includes('/goals')) return 'Savings Goals';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/ai')) return 'AI Assistant';
    if (pathname.includes('/simulator')) return 'What-If Simulator';
    if (pathname.includes('/forecast')) return 'Cashflow Forecast';
    if (pathname.includes('/receipts')) return 'Receipt Vision';
    if (pathname.includes('/net-worth')) return 'Net Worth';
    if (pathname.includes('/debt')) return 'Debt & Loans';
    if (pathname.includes('/subscriptions')) return 'Subscriptions';
    if (pathname.includes('/reports')) return 'Reports';
    if (pathname.includes('/notifications')) return 'Alerts';
    if (pathname.includes('/security')) return 'Security';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    router.replace('/login');
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-transparent px-4 sm:px-8 select-none',
          className
        )}
      >
        {/* LEFT: MOBILE MENU TRIGGER & PAGE TITLE */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-white dark:hover:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-xs cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#20212B] dark:text-[#F4F3FA] tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* RIGHT: SEARCH, NOTIFICATIONS, ADD BTN & USER PILL */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Functional Debounced Global Search Bar */}
          <GlobalSearch />

          {/* Functional Notification Bell with Popover and Real Unread Synchronisation */}
          <NotificationPopover />

          {/* User Profile Capsule */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl bg-white dark:bg-[#161522] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-xs hover:border-[#6865E8]/30 transition-all cursor-pointer"
              aria-label="User profile menu"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#6865E8] to-[#8C8AEF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="h-full w-full rounded-full object-cover" />
                ) : avatarPreset ? (
                  <span>{avatarPreset.emoji}</span>
                ) : (
                  <span>{fullName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-[#20212B] dark:text-[#F4F3FA]">
                {fullName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#77798A] dark:text-[#A6A4B8]" />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#161522] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-[#E7E6F0]/60 dark:border-[#2D2B3F]/60">
                  <p className="text-xs font-bold text-[#20212B] dark:text-[#F4F3FA] truncate">{fullName}</p>
                  <p className="text-[10px] text-[#77798A] dark:text-[#A6A4B8] truncate">{user?.email || 'account@monvex.com'}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#FAF9FC] dark:hover:bg-[#1E1C30] transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </button>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#FAF9FC] dark:hover:bg-[#1E1C30] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    href="/security"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#FAF9FC] dark:hover:bg-[#1E1C30] transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Security Vault</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#E7E6F0]/60 dark:border-[#2D2B3F]/60">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#E76D7A] hover:bg-[#FDEEF0] dark:hover:bg-[#E76D7A]/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
