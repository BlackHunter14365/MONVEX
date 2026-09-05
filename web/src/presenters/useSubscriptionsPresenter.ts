"use client";

/**
 * [P] PRESENTER: Subscriptions & Recurring Bills Feature ViewModel
 * Encapsulates active recurring commitment auditing, monthly burn rate, and service management.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  next_due_date: string;
  is_active: boolean;
}

export interface SubscriptionsState {
  isLoading: boolean;
  error: string | null;
  subscriptions: SubscriptionItem[];
  monthlyBurn: number;
  annualizedBurn: number;
  activeCount: number;
}

export function useSubscriptionsPresenter() {
  const [state, setState] = useState<SubscriptionsState>({
    isLoading: true,
    error: null,
    subscriptions: [],
    monthlyBurn: 0,
    annualizedBurn: 0,
    activeCount: 0,
  });

  const loadSubscriptions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await api.getRecurringPayments();
      const list: SubscriptionItem[] = (res as any)?.results || (Array.isArray(res) ? res : []);
      
      const mBurn = list.reduce((sum, s) => {
        const amt = Number(s.amount) || 0;
        if (s.frequency === 'YEARLY') return sum + (amt / 12);
        if (s.frequency === 'WEEKLY') return sum + (amt * 4.33);
        return sum + amt;
      }, 0);

      setState({
        isLoading: false,
        error: null,
        subscriptions: list,
        monthlyBurn: Math.round(mBurn),
        annualizedBurn: Math.round(mBurn * 12),
        activeCount: list.filter(s => s.is_active).length,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to load subscriptions',
      }));
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  return {
    state,
    actions: {
      refresh: loadSubscriptions,
    },
  };
}
