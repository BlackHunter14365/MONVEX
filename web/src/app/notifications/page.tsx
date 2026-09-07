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

export default function NotificationsPage() {
  const toast = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications(filterType === 'ALL' ? undefined : filterType);
      const list = Array.isArray(data) ? data : data?.results || [];
      setNotifications(list);
    } catch {
      toast.error('Failed to load alerts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterType]);

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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger" size="sm">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="warning" size="sm">WARNING</Badge>;
      case 'INFO':
      default:
        return <Badge variant="neutral" size="sm">INFO</Badge>;
    }
  };

  const getNotificationIcon = (type: string, severity: string) => {
    if (severity === 'CRITICAL') {
      return <ShieldAlert className="h-4 w-4 text-[#E11D48]" />;
    }
    switch (type) {
      case 'BUDGET_WARNING':
        return <AlertTriangle className="h-4 w-4 text-[#D97706]" />;
      case 'UNUSUAL_SPENDING':
        return <Zap className="h-4 w-4 text-[#E11D48]" />;
      case 'GOAL_RISK':
        return <Target className="h-4 w-4 text-[#7C3AED]" />;
      case 'UPCOMING_PAYMENT':
        return <CreditCard className="h-4 w-4 text-[#2563EB]" />;
      case 'FORECAST_WARNING':
        return <TrendingUp className="h-4 w-4 text-[#D97706]" />;
      default:
        return <Info className="h-4 w-4 text-[#4056A1]" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title="Smart Financial Alerts & Telemetry"
          description="Real-time proactive monitoring for budget thresholds, unusual spending velocity, bill maturities, and goal health."
          actionSlot={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isLoading ? 'animate-spin' : '')} />}
                className="text-xs font-bold touch-target"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Check className="h-3.5 w-3.5 text-[#059669]" />}
                className="text-xs font-bold touch-target"
              >
                Mark All Read
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. DOUBLE-BEZEL TELEMETRY HERO
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 7 cols: Alert Posture */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center gap-2 text-[#898390]">
                  <Bell className="h-4 w-4 text-[#4056A1]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    Telemetry Stream Status
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-mono font-black text-[#191522] tnum">
                    {unreadCount}
                  </span>
                  <span className="text-xs text-[#625D69] font-medium">
                    Unread alerts requiring attention
                  </span>
                </div>

                <p className="text-xs text-[#898390]">
                  Heuristic anomaly detectors continuously monitor transaction streams and budget limits.
                </p>
              </div>

              {/* Right 5 cols: Severity Counter Strips */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#E4E2DC] lg:pl-6">
                <div
                  onClick={() => setFilterSeverity(filterSeverity === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all space-y-1 touch-target',
                    filterSeverity === 'CRITICAL'
                      ? 'bg-[#FFF1F2] border-[#E11D48] ring-1 ring-[#E11D48]'
                      : 'bg-[#F6F5F1] border-[#E4E2DC] hover:border-[#CBD5E1]'
                  )}
                >
                  <span className="text-[10px] font-mono text-[#E11D48] uppercase font-bold block">Critical</span>
                  <span className="text-xl font-mono font-black text-[#E11D48] tnum block">
                    {criticalCount}
                  </span>
                  <span className="text-[9px] text-[#898390]">Immediate</span>
                </div>

                <div
                  onClick={() => setFilterSeverity(filterSeverity === 'WARNING' ? 'ALL' : 'WARNING')}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all space-y-1 touch-target',
                    filterSeverity === 'WARNING'
                      ? 'bg-[#FFFBEB] border-[#D97706] ring-1 ring-[#D97706]'
                      : 'bg-[#F6F5F1] border-[#E4E2DC] hover:border-[#CBD5E1]'
                  )}
                >
                  <span className="text-[10px] font-mono text-[#D97706] uppercase font-bold block">Warning</span>
                  <span className="text-xl font-mono font-black text-[#D97706] tnum block">
                    {warningCount}
                  </span>
                  <span className="text-[9px] text-[#898390]">Thresholds</span>
                </div>

                <div
                  onClick={() => setFilterSeverity(filterSeverity === 'INFO' ? 'ALL' : 'INFO')}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all space-y-1 touch-target',
                    filterSeverity === 'INFO'
                      ? 'bg-[#EFF6FF] border-[#2563EB] ring-1 ring-[#2563EB]'
                      : 'bg-[#F6F5F1] border-[#E4E2DC] hover:border-[#CBD5E1]'
                  )}
                >
                  <span className="text-[10px] font-mono text-[#2563EB] uppercase font-bold block">Info</span>
                  <span className="text-xl font-mono font-black text-[#2563EB] tnum block">
                    {notifications.filter((n) => n.severity === 'INFO' && !n.is_read).length}
                  </span>
                  <span className="text-[9px] text-[#898390]">Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. FILTER STRIP
            ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E4E2DC] scrollbar-none">
          {[
            { id: 'ALL', label: 'All Telemetry' },
            { id: 'BUDGET_WARNING', label: 'Budget Warnings' },
            { id: 'UNUSUAL_SPENDING', label: 'Velocity Spikes' },
            { id: 'UPCOMING_PAYMENT', label: 'Upcoming Bills' },
            { id: 'GOAL_RISK', label: 'Goal Risks' },
            { id: 'INSIGHT_AVAILABLE', label: 'Smart Insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap touch-target shrink-0',
                filterType === tab.id
                  ? 'bg-[#2A1F3D] text-white shadow-xs'
                  : 'bg-[#F6F5F1] text-[#625D69] hover:text-[#191522] hover:bg-[#EAE8E1]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =========================================================================
            3. NOTIFICATIONS AUDIT STREAM (Double Bezel)
            ========================================================================= */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
              <h3 className="text-xs font-bold text-[#191522] uppercase tracking-wider font-mono">
                Telemetry Alerts ({filteredNotifications.length})
              </h3>
              <span className="text-[10px] font-mono text-[#898390]">
                {filterSeverity !== 'ALL' ? `Filtered by ${filterSeverity}` : 'All Severities'}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                title="Zero telemetry alerts active"
                description={
                  filterType !== 'ALL' || filterSeverity !== 'ALL'
                    ? 'No notifications match the active filter criteria.'
                    : 'All budgets, cash burn rates, and savings trajectories are running in nominal bounds.'
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  const Icon = getNotificationIcon(notif.notification_type, notif.severity);

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                        notif.is_read
                          ? 'bg-[#FBFBFA] border-[#E4E2DC] opacity-75'
                          : notif.severity === 'CRITICAL'
                          ? 'bg-white border-[#FECDD3] shadow-sm ring-1 ring-[#E11D48]/15'
                          : 'bg-white border-[#E4E2DC] hover:border-[#CBD5E1]'
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border',
                            notif.severity === 'CRITICAL'
                              ? 'bg-[#FFF1F2] border-[#FECDD3]'
                              : notif.severity === 'WARNING'
                              ? 'bg-[#FFFBEB] border-[#FDE68A]'
                              : 'bg-[#F6F5F1] border-[#E4E2DC]'
                          )}
                        >
                          {Icon}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#191522]">
                              {notif.title}
                            </span>
                            {getSeverityBadge(notif.severity)}
                            {!notif.is_read && (
                              <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                            )}
                          </div>
                          <p className="text-xs text-[#625D69] leading-relaxed font-medium">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-[#898390] font-mono block">
                            {new Date(notif.created_at).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {notif.action_url && (
                          <a
                            href={notif.action_url}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F6F5F1] hover:bg-[#2A1F3D] hover:text-white text-xs font-mono font-bold text-[#191522] transition-all touch-target"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3 w-3" />
                          </a>
                        )}
                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notif.id)}
                            className="p-2 rounded-lg hover:bg-[#F6F5F1] text-[#898390] hover:text-[#059669] transition-colors touch-target"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
