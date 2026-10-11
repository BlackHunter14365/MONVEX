'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Search,
  LogOut,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MONVEX_NAV_GROUPS } from '@/config/navigation';

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
  const { theme, setTheme } = useTheme();

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

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact || href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleNavClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation drawer"
      className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#20212B]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 left-0 w-[82vw] max-w-xs bg-[#FAF9FC] dark:bg-[#111019] border-r border-[#E7E6F0] dark:border-[#2D2B3F] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        {/* Top Header */}
        <div className="p-4 border-b border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center justify-between bg-white/80 dark:bg-[#161522]/90">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#6865E8] flex items-center justify-center text-white shadow-md shadow-[#6865E8]/25 shrink-0">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M6 14h6" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-black tracking-tight text-[#20212B] dark:text-[#F4F3FA] leading-none truncate">
                Monvex
              </span>
              <span className="text-[10px] font-semibold text-[#8E8FA2] dark:text-[#79778E] uppercase tracking-wider mt-1 leading-none">
                Financial OS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#77798A] hover:text-[#20212B] dark:text-[#A6A4B8] dark:hover:text-[#F4F3FA] hover:bg-[#F8F7FC] dark:hover:bg-[#1C1B2E] transition-colors focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none focus-visible:ring-offset-1"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <nav aria-label="Drawer navigation" className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pb-1">
            <button
              onClick={() => {
                onClose();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('monvex:open-command-center'));
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 min-h-[44px] rounded-xl bg-white border border-[#E7E6F0] text-xs font-bold text-[#20212B] shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none"
              aria-label="Open search command center"
            >
              <Search className="h-3.5 w-3.5 text-[#6865E8]" aria-hidden="true" />
              <span>Search</span>
            </button>

            {onOpenAddTransaction && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddTransaction();
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 min-h-[44px] rounded-xl bg-[#6865E8] hover:bg-[#5754DC] text-white text-xs font-bold shadow-subtle active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 focus-visible:outline-none"
                aria-label="Add transaction record"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Record</span>
              </button>
            )}
          </div>

          {/* Navigation Groups (5 Finora-Style Hierarchical Tiers) */}
          {MONVEX_NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="px-3 pb-1 pt-1 text-[11px] font-semibold text-[#8E8FA2] dark:text-[#79778E] tracking-tight">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = isItemActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleNavClick}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group flex items-center justify-between rounded-2xl px-3.5 py-2.5 min-h-[44px] text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6865E8]/40',
                      isActive
                        ? 'bg-gradient-to-r from-[#6865E8] via-[#7B68EE] to-[#9E57E8] text-white shadow-md shadow-[#6865E8]/25 font-bold'
                        : 'font-semibold text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#F4F3FA]/80 dark:hover:bg-[#1C1B2E]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'h-4.5 w-4.5 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-[#8E8FA2] dark:text-[#79778E] group-hover:text-[#20212B] dark:group-hover:text-[#F4F3FA]'
                        )}
                        strokeWidth={isActive ? 2.4 : 2}
                        aria-hidden="true"
                      />
                      <span className="truncate leading-none">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors leading-none',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#EEEDF8] dark:bg-[#6865E8]/20 text-[#6865E8] dark:text-[#908EF2]'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User & Sign Out Footer */}
        <div className="p-3.5 border-t border-[#E7E6F0] bg-white/90 dark:bg-[#161522] dark:border-[#2D2B3F] space-y-2.5">
          {/* Segmented Light / Dark Toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-[#EBE9F5] border border-[#E7E6F0] dark:bg-[#141320] dark:border-[#2D2B3F]">
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Switch to light theme"
              aria-pressed={theme === 'light'}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                theme === 'light'
                  ? 'bg-black text-white shadow-xs dark:bg-[#6865E8] dark:text-white'
                  : 'text-[#77798A] hover:text-[#20212B] dark:text-[#A6A4B8] dark:hover:text-[#F4F3FA]'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Switch to dark theme"
              aria-pressed={theme === 'dark'}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                theme === 'dark'
                  ? 'bg-black text-white shadow-xs dark:bg-[#6865E8] dark:text-white'
                  : 'text-[#77798A] hover:text-[#20212B] dark:text-[#A6A4B8] dark:hover:text-[#F4F3FA]'
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Dark</span>
            </button>
          </div>

          {user && (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-[#20212B] dark:text-[#F4F3FA] block truncate">
                  {user.first_name || user.username}
                </span>
                <span className="text-[10px] text-[#77798A] dark:text-[#A6A4B8] block truncate">
                  @{user.username}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E6F9F5] text-[#16745C] border border-[#75DCC0] dark:bg-[#16745C]/20 dark:text-[#75DCC0] dark:border-[#75DCC0]/40">
                Active
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-bold text-[#E76D7A] hover:bg-[#FDEEF0] border border-[#F8B4BD] dark:border-[#E76D7A]/30 dark:hover:bg-[#E76D7A]/10 transition-colors active:scale-98"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out of MONVEX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
