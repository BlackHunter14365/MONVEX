'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';
import { useNotificationsQuery } from '@/hooks/queries/useNotificationsQuery';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type?: string;
  type?: string;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export const NotificationPopover: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { data: rawNotifications, isLoading, refetch } = useNotificationsQuery();

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!rawNotifications) return [];
    return Array.isArray(rawNotifications) ? rawNotifications : (rawNotifications as any)?.results || [];
  }, [rawNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update in React Query cache
      queryClient.setQueryData(
        queryKeys.transactions.notifications(),
        (old: any) => {
          if (!old) return old;
          const list = Array.isArray(old) ? old : old?.results || [];
          const updated = list.map((item: any) =>
            item.id === id ? { ...item, is_read: true } : item
          );
          return Array.isArray(old) ? updated : { ...old, results: updated };
        }
      );

      await api.markNotificationRead(id);
    } catch {
      // Refetch if API fails
      refetch();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isClearing) return;
    setIsClearing(true);
    try {
      // Optimistic update
      queryClient.setQueryData(
        queryKeys.transactions.notifications(),
        (old: any) => {
          if (!old) return old;
          const list = Array.isArray(old) ? old : old?.results || [];
          const updated = list.map((item: any) => ({ ...item, is_read: true }));
          return Array.isArray(old) ? updated : { ...old, results: updated };
        }
      );

      await api.clearAllNotifications();
      await refetch();
    } catch {
      refetch();
    } finally {
      setIsClearing(false);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);
    if (n.action_url) {
      router.push(n.action_url);
    } else {
      router.push('/notifications');
    }
  };

  const getNotificationIcon = (n: NotificationItem) => {
    const type = n.notification_type || n.type || '';
    if (n.severity === 'CRITICAL') {
      return <ShieldAlert className="h-4 w-4 text-[#E76D7A]" />;
    }
    if (n.severity === 'WARNING' || type.includes('BUDGET')) {
      return <AlertTriangle className="h-4 w-4 text-[#E8A54B]" />;
    }
    if (type.includes('SPEND') || type.includes('ANOMALY')) {
      return <Zap className="h-4 w-4 text-[#E76D7A]" />;
    }
    if (type.includes('INSIGHT') || type.includes('AI')) {
      return <Sparkles className="h-4 w-4 text-[#6865E8]" />;
    }
    return <Info className="h-4 w-4 text-[#6865E8]" />;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative p-2.5 rounded-2xl bg-white dark:bg-[#161522] border border-[#E7E6F0] dark:border-[#2D2B3F] text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] shadow-xs hover:border-[#6865E8]/30 transition-all cursor-pointer"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#6865E8] text-[9px] font-bold text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notifications panel"
          className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 z-50 rounded-2xl bg-white/95 dark:bg-[#161522]/95 backdrop-blur-xl border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center justify-between bg-[#FAF9FC]/80 dark:bg-[#111019]/80">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#20212B] dark:text-[#F4F3FA]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6865E8] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isClearing}
                className="flex items-center gap-1 text-[11px] font-bold text-[#6865E8] hover:underline cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E7E6F0]/60 dark:divide-[#2D2B3F]/60">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-xs text-[#77798A] dark:text-[#A6A4B8]">
                <Loader2 className="h-5 w-5 text-[#6865E8] animate-spin" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-10 w-10 mx-auto rounded-2xl bg-[#EEEDF8] dark:bg-[#6865E8]/20 flex items-center justify-center text-[#6865E8]">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-[#20212B] dark:text-[#F4F3FA]">
                  All caught up!
                </p>
                <p className="text-[11px] text-[#77798A] dark:text-[#A6A4B8] max-w-xs mx-auto">
                  No alerts currently pending. Monvex is monitoring your balances in the background.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.is_read;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer group text-left',
                      isUnread
                        ? 'bg-[#F6F5FD] dark:bg-[#1A1830]/60 hover:bg-[#EEEDF8] dark:hover:bg-[#1E1C38]'
                        : 'hover:bg-[#FAF9FC] dark:hover:bg-[#181726]'
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'p-2 rounded-xl shrink-0 mt-0.5',
                        isUnread
                          ? 'bg-white dark:bg-[#201E36] shadow-xs'
                          : 'bg-[#FAF9FC] dark:bg-[#141320]'
                      )}
                    >
                      {getNotificationIcon(n)}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            'text-xs truncate block',
                            isUnread
                              ? 'font-extrabold text-[#20212B] dark:text-[#F4F3FA]'
                              : 'font-semibold text-[#77798A] dark:text-[#A6A4B8]'
                          )}
                        >
                          {n.title}
                        </span>
                        {isUnread && (
                          <span
                            className="h-2 w-2 rounded-full bg-[#6865E8] shrink-0"
                            title="Unread"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-[#77798A] dark:text-[#A6A4B8] line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-[#9DA0B3] dark:text-[#77798A]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(n.created_at)}
                        </span>

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-[#6865E8] hover:underline font-bold"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#FAF9FC]/90 dark:bg-[#111019]/90 border-t border-[#E7E6F0] dark:border-[#2D2B3F] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6865E8] hover:underline"
            >
              <span>View all notifications & settings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
