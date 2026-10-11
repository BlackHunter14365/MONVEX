'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { UserProfileModal, PRESET_AVATARS } from '@/components/profile/UserProfileModal';
import { useTheme } from '@/context/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/queryKeys';
import { api } from '@/lib/api';
import { Tooltip } from '@/components/ui/Tooltip';
import { MONVEX_NAV_GROUPS } from '@/config/navigation';
import { useSidebar } from '@/context/SidebarContext';

export interface SidebarProps {
  onOpenAddTransaction?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, toggleCollapse, isMounted } = useSidebar();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const avatarUrl = user?.avatar_url;
  const avatarPreset = user?.avatar_preset ? PRESET_AVATARS.find((p) => p.id === user.avatar_preset) : null;
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Sarah Rahman';

  const prefetchRoute = (href: string) => {
    switch (href) {
      case '/transactions':
        queryClient.prefetchQuery({ queryKey: queryKeys.transactions.list({}), queryFn: () => api.getTransactions({}) });
        break;
      case '/budgets':
        queryClient.prefetchQuery({ queryKey: queryKeys.budgets.list(), queryFn: () => api.getBudgets() });
        break;
      case '/goals':
        queryClient.prefetchQuery({ queryKey: queryKeys.goals.list(), queryFn: () => api.getGoals() });
        break;
      case '/subscriptions':
        queryClient.prefetchQuery({ queryKey: queryKeys.transactions.recurring(), queryFn: () => api.getRecurringPayments() });
        break;
      case '/analytics':
        queryClient.prefetchQuery({ queryKey: queryKeys.analytics.summary(), queryFn: () => api.getAnalyticsSummary() });
        break;
      default:
        break;
    }
  };

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact || href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      <aside
        aria-label="Application sidebar"
        className={cn(
          'hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-white dark:bg-[#111019] border-r border-[#E7E6F0] dark:border-[#2D2B3F] select-none z-30 justify-between overflow-hidden',
          isMounted && 'transition-[width] duration-200 ease-in-out',
          isCollapsed ? 'w-[76px]' : 'w-[260px]'
        )}
      >
        {/* TOP: LOGO HEADER & NAVIGATION BODY */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* BRAND LOGO HEADER */}
          <div
            className={cn(
              'border-b border-[#E7E6F0]/60 dark:border-[#2D2B3F]/60 flex items-center transition-all',
              isCollapsed ? 'py-4 px-2 justify-center flex-col gap-2' : 'px-5 py-4 justify-between'
            )}
          >
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 rounded-xl',
                isCollapsed && 'justify-center'
              )}
              title="Monvex Financial OS"
            >
              {/* Finora-Inspired Geometric Brand Glyph with Aurora Violet Depth */}
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#6865E8] flex items-center justify-center text-white shadow-md shadow-[#6865E8]/25 transition-transform group-hover:scale-105 shrink-0">
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

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-black tracking-tight text-[#20212B] dark:text-[#F4F3FA] group-hover:text-[#6865E8] transition-colors leading-none truncate">
                    Monvex
                  </span>
                  <span className="text-[10px] font-semibold text-[#8E8FA2] dark:text-[#79778E] uppercase tracking-wider mt-1 leading-none">
                    Financial OS
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-xl text-[#8E8FA2] hover:text-[#20212B] dark:text-[#79778E] dark:hover:text-[#F4F3FA] hover:bg-[#FAF9FC] dark:hover:bg-[#1C1B2E] transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* HIERARCHICAL NAVIGATION SCROLL AREA */}
          <nav
            aria-label="Main navigation"
            className={cn(
              'flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-3 space-y-4',
              isCollapsed ? 'px-2' : 'px-3.5'
            )}
          >
            {MONVEX_NAV_GROUPS.map((group, groupIdx) => (
              <div key={group.id} className="space-y-1">
                {/* Group Title Header */}
                {!isCollapsed ? (
                  <div className="px-3 pb-1 pt-1 text-[11px] font-semibold text-[#8E8FA2] dark:text-[#79778E] tracking-tight">
                    {group.title}
                  </div>
                ) : (
                  groupIdx > 0 && (
                    <div className="my-2 border-t border-[#E7E6F0]/60 dark:border-[#2D2B3F]/60 mx-2" />
                  )
                )}

                {/* Group Navigation Items */}
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href, item.exact);
                  const Icon = item.icon;

                  if (isCollapsed) {
                    return (
                      <div key={item.name} className="flex justify-center">
                        <Tooltip position="right" content={item.name}>
                          <Link
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            onMouseEnter={() => prefetchRoute(item.href)}
                            onFocus={() => prefetchRoute(item.href)}
                            className={cn(
                              'group relative flex items-center justify-center rounded-2xl w-10 h-10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6865E8]/40',
                              isActive
                                ? 'bg-gradient-to-r from-[#6865E8] via-[#7B68EE] to-[#9E57E8] text-white shadow-md shadow-[#6865E8]/25'
                                : 'text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#F4F3FA] dark:hover:bg-[#1C1B2E]'
                            )}
                          >
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
                            {item.badge && !isActive && (
                              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#6865E8] ring-2 ring-white dark:ring-[#111019]" />
                            )}
                          </Link>
                        </Tooltip>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      onMouseEnter={() => prefetchRoute(item.href)}
                      onFocus={() => prefetchRoute(item.href)}
                      className={cn(
                        'group flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6865E8]/40',
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
        </div>

        {/* BOTTOM SECTION: THEME TOGGLE & USER PROFILE CAPSULE */}
        <div
          className={cn(
            'border-t border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#111019] transition-all',
            isCollapsed ? 'p-2 flex flex-col items-center gap-2.5' : 'p-3.5 space-y-2.5'
          )}
        >
          {/* Segmented Light / Dark Toggle Switch */}
          {!isCollapsed ? (
            <div className="flex items-center bg-[#F4F3FA] dark:bg-[#161522] p-1 rounded-2xl border border-[#E7E6F0] dark:border-[#2D2B3F]">
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
          ) : (
            <Tooltip
              position="right"
              content={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            >
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
                className="w-10 h-10 rounded-2xl bg-[#F4F3FA] dark:bg-[#161522] border border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center justify-center text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-[#F5B865]" />
                ) : (
                  <Moon className="h-4 w-4 text-[#6865E8]" />
                )}
              </button>
            </Tooltip>
          )}

          {/* User Profile Capsule Trigger */}
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-[#FAF9FC] dark:hover:bg-[#1B1A2A] transition-colors border border-transparent hover:border-[#E7E6F0] dark:hover:border-[#2D2B3F] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6865E8]/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-full bg-[#6865E8] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="h-full w-full rounded-full object-cover" />
                  ) : avatarPreset ? (
                    <span>{avatarPreset.emoji}</span>
                  ) : (
                    <span>{fullName.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#20212B] dark:text-[#F4F3FA] block truncate leading-tight">
                    {fullName}
                  </span>
                  <span className="text-[10px] text-[#77798A] dark:text-[#A6A4B8] block truncate leading-tight mt-0.5">
                    Personal Account
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#77798A] dark:text-[#A6A4B8] shrink-0" />
            </button>
          ) : (
            <Tooltip position="right" content={fullName}>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                aria-label={`Open profile for ${fullName}`}
                className="h-9 w-9 rounded-full bg-[#6865E8] flex items-center justify-center text-white text-xs font-bold shrink-0 hover:ring-2 hover:ring-[#6865E8]/40 transition-all cursor-pointer shadow-xs"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="h-full w-full rounded-full object-cover" />
                ) : avatarPreset ? (
                  <span>{avatarPreset.emoji}</span>
                ) : (
                  <span>{fullName.slice(0, 1).toUpperCase()}</span>
                )}
              </button>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* User Profile Setup & Customization Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
