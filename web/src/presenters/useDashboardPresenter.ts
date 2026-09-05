"use client";

/**
 * [P] PRESENTER: Dashboard Feature ViewModel
 * Decouples presentation logic, metrics aggregation, and data fetching from Dashboard View.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Transaction, CashflowSummary, FinancialHealthDiagnostic } from '@/models';

export interface DashboardState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  summary: CashflowSummary | null;
  health: FinancialHealthDiagnostic | null;
  recentTransactions: Transaction[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
}

export function useDashboardPresenter() {
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    isRefreshing: false,
    error: null,
    summary: null,
    health: null,
    recentTransactions: [],
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    savingsRate: 0,
  });

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setState(prev => ({ ...prev, isRefreshing: isRefresh, isLoading: !isRefresh && prev.isLoading }));
      
      const [summaryRes, transRes, metricsRes, healthRes] = await Promise.allSettled([
        api.getAnalyticsSummary(),
        api.getTransactions({ limit: 5 }),
        api.getDashboardMetrics(),
        api.getHealthScore(),
      ]);

      const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value as any) : null;
      const trans = transRes.status === 'fulfilled' ? (transRes.value as any)?.results || [] : [];
      const metrics = metricsRes.status === 'fulfilled' ? (metricsRes.value as any) : null;
      const health = healthRes.status === 'fulfilled' ? (healthRes.value as any) : null;

      const totalBal = Number(metrics?.total_balance || metrics?.net_worth || 0);
      const totalInc = Number(summary?.total_income || metrics?.monthly_income || 0);
      const totalExp = Number(summary?.total_expense || metrics?.monthly_expenses || 0);
      const savingsRate = Number(summary?.savings_rate_pct || (totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100).toFixed(1) : 0));

      setState({
        isLoading: false,
        isRefreshing: false,
        error: null,
        summary,
        health,
        recentTransactions: trans,
        totalBalance: totalBal,
        totalIncome: totalInc,
        totalExpense: totalExp,
        savingsRate: Number(savingsRate),
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: err?.message || 'Failed to load dashboard data',
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  return {
    state,
    actions: {
      refresh,
    },
  };
}
