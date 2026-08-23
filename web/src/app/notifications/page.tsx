'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function NotificationsPage() {
  const toast = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(filterType === 'ALL' ? undefined : filterType);
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications.');
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
    } catch {
      // handled
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger" size="sm">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="warning" size="sm">WARNING</Badge>;
      case 'INFO':
      default:
        return <Badge variant="success" size="sm">INFO</Badge>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'UNUSUAL_SPENDING':
        return <Zap className="h-4 w-4 text-rose-500" />;
      case 'GOAL_RISK':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'UPCOMING_PAYMENT':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'FORECAST_WARNING':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-emerald-500" />;
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
                className="text-xs font-bold"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Check className="h-3.5 w-3.5" />}
                className="text-xs font-bold"
              >
                Mark All Read
              </Button>
            </div>
          }
        />

        {/* FILTER BAR */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#E4E2DC] overflow-x-auto shadow-2xs">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'BUDGET_WARNING', label: 'Budget Warnings' },
            { id: 'UNUSUAL_SPENDING', label: 'Unusual Spending' },
            { id: 'UPCOMING_PAYMENT', label: 'Bills Due' },
            { id: 'GOAL_RISK', label: 'Goal Risks' },
            { id: 'INSIGHT_AVAILABLE', label: 'Smart Insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                filterType === tab.id
                  ? 'bg-[#172033] text-white shadow-xs'
                  : 'text-[#5F6878] hover:text-[#172033] hover:bg-[#F6F5F1]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS STREAM */}
        <div className="editorial-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3">
            <h3 className="text-sm font-black text-[#172033]">
              Active Alerts & Security Notifications
            </h3>
            <span className="text-xs font-mono font-bold text-[#5F6878]">
              {notifications.filter((n) => !n.is_read).length} Unread
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[#E4E2DC] text-center text-xs text-[#5F6878]">
              No alerts matching your current filter. Your finances are running smoothly!
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    notif.is_read
                      ? 'bg-white/60 border-[#E4E2DC] opacity-75'
                      : 'bg-white border-[#172033]/30 shadow-xs ring-1 ring-[#172033]/10'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-[#F6F5F1] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getNotificationIcon(notif.notification_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#172033]">
                          {notif.title}
                        </span>
                        {getSeverityBadge(notif.severity)}
                      </div>
                      <p className="text-xs text-[#5F6878] leading-relaxed font-medium">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-[#858D9A] font-mono block">
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
                        className="px-3 py-1.5 rounded-xl bg-[#F6F5F1] hover:bg-[#172033] hover:text-white text-xs font-bold text-[#172033] transition-all"
                      >
                        View
                      </a>
                    )}
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1.5 rounded-xl hover:bg-[#F6F5F1] text-[#858D9A] hover:text-[#059669] transition-all"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
