'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Target,
  RefreshCw,
  Sliders,
  Check,
  Trash2,
  Sparkles,
  ShieldAlert,
  Info,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useNotificationsQuery } from '@/hooks/queries/useNotificationsQuery';

export default function NotificationsPage() {
  const toast = useToast();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const { data: rawNotifications, isLoading, refetch: fetchNotifications } = useNotificationsQuery(filterType);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (rawNotifications) {
      setNotifications(Array.isArray(rawNotifications) ? rawNotifications : rawNotifications?.results || []);
    }
  }, [rawNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Alert marked as read.');
    } catch {
      toast.error('Failed to mark alert as read.');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllNotifications();
      toast.success('All notifications marked as read.');
      fetchNotifications();
    } catch {
      toast.error('Failed to clear notifications.');
    }
  };

  // Telemetry Aggregates
  const criticalCount = useMemo(() => {
    return notifications.filter((n) => n.severity === 'CRITICAL' && !n.is_read).length;
  }, [notifications]);

  const warningCount = useMemo(() => {
    return notifications.filter((n) => n.severity === 'WARNING' && !n.is_read).length;
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let list = notifications;
    if (filterSeverity !== 'ALL') {
      list = list.filter((n) => n.severity === filterSeverity);
    }
    return list;
  }, [notifications, filterSeverity]);

  const getNotificationIcon = (type: string, severity: string) => {
    if (severity === 'CRITICAL') {
      return <ShieldAlert className="h-5 w-5 text-[#E76D7A]" />;
    }
    switch (type) {
      case 'BUDGET_WARNING':
        return <AlertTriangle className="h-5 w-5 text-[#E8A54B]" />;
      case 'UNUSUAL_SPENDING':
        return <Zap className="h-5 w-5 text-[#E76D7A]" />;
      case 'GOAL_RISK':
        return <Target className="h-5 w-5 text-[#6865E8]" />;
      case 'UPCOMING_PAYMENT':
        return <CreditCard className="h-5 w-5 text-[#3B82F6]" />;
      case 'FORECAST_WARNING':
        return <TrendingUp className="h-5 w-5 text-[#E8A54B]" />;
      default:
        return <Info className="h-5 w-5 text-[#6865E8]" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <PageHeader
          eyebrow="TELEMETRY FEED"
          title="Smart Financial Alerts & Telemetry"
          description="Real-time proactive monitoring for budget thresholds, unusual spending velocity, bill maturities, and goal health."
          actionSlot={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => { fetchNotifications(); }}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B]"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleClearAll}
                leftIcon={<Check className="h-4 w-4 text-[#16745C]" />}
                className="rounded-2xl border-[#E7E6F0] hover:bg-[#FAF9FC] text-[#20212B]"
              >
                Mark All Read
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. TOP 3 ALERT METRICS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E76D7A]">
                Critical Blocks
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDEEF0] text-[#E76D7A]">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#E76D7A]">{criticalCount} Urgent</div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Requires immediate attention</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E8A54B]">
                Active Warnings
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEF6EB] text-[#E8A54B]">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#E8A54B]">{warningCount} Warnings</div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Budget and forecast thresholds</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Unread Total
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Bell className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">{unreadCount} Pending</div>
              <p className="text-xs text-[#77798A] font-medium mt-1">Total pending inbox</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. ALERTS FEED DIRECTORY
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E6F0]">
            <div>
              <h3 className="text-base font-bold text-[#20212B]">
                Alert Telemetry Stream ({filteredNotifications.length})
              </h3>
              <p className="text-xs text-[#77798A] mt-0.5">Chronological system notifications and intelligence triggers</p>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0]">
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filterSeverity === sev
                      ? 'bg-[#6865E8] text-white shadow-xs'
                      : 'text-[#77798A] hover:text-[#20212B]'
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              title="All alerts cleared"
              description="Your account is operating inside healthy financial parameters. No active warnings."
            />
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n: any) => {
                const icon = getNotificationIcon(n.type, n.severity);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'p-5 rounded-2xl border transition-all flex items-start justify-between gap-4',
                      !n.is_read
                        ? 'bg-white border-[#6865E8]/30 shadow-xs'
                        : 'bg-[#F8F7FC] border-[#E7E6F0] opacity-80'
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[#ECEBFF] flex items-center justify-center shrink-0 mt-0.5">
                        {icon}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#20212B]">
                            {n.title || n.type}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                              n.severity === 'CRITICAL'
                                ? 'bg-[#FDEEF0] text-[#E76D7A] border-[#FECDD3]'
                                : n.severity === 'WARNING'
                                ? 'bg-[#FEF6EB] text-[#E8A54B] border-[#FDE68A]'
                                : 'bg-[#ECEBFF] text-[#6865E8] border-[#D8D5FB]'
                            )}
                          >
                            {n.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#77798A] leading-relaxed">
                          {n.message || n.description}
                        </p>
                        <span className="text-[10px] font-mono text-[#77798A] block">
                          {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6865E8] hover:bg-[#ECEBFF] border border-[#6865E8]/20 transition-all shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
