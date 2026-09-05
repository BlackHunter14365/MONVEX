"use client";

/**
 * [P] PRESENTER: Analytics & Forecasting Feature ViewModel
 * Prepares chart telemetry, health score breakdown, and spending velocity datasets.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { CashflowSummary, FinancialHealthDiagnostic, CashflowForecast } from '@/models';

export interface AnalyticsState {
  isLoading: boolean;
  selectedDays: number;
  summary: CashflowSummary | null;
  health: FinancialHealthDiagnostic | null;
  forecast: CashflowForecast | null;
  error: string | null;
}

export function useAnalyticsPresenter() {
  const [state, setState] = useState<AnalyticsState>({
    isLoading: true,
    selectedDays: 30,
    summary: null,
    health: null,
    forecast: null,
    error: null,
  });

  const loadAnalytics = useCallback(async (days = 30) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, selectedDays: days }));
      const [summaryRes, healthRes, forecastRes] = await Promise.allSettled([
        api.getAnalyticsSummary(),
        api.getHealthScore(),
        api.getCashflowForecast(days),
      ]);

      setState({
        isLoading: false,
        selectedDays: days,
        summary: summaryRes.status === 'fulfilled' ? (summaryRes.value as any) : null,
        health: healthRes.status === 'fulfilled' ? (healthRes.value as any) : null,
        forecast: forecastRes.status === 'fulfilled' ? (forecastRes.value as any) : null,
        error: null,
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err?.message || 'Failed to load analytics' }));
    }
  }, []);

  useEffect(() => {
    loadAnalytics(30);
  }, [loadAnalytics]);

  return {
    state,
    actions: {
      setDays: (days: number) => loadAnalytics(days),
      refresh: () => loadAnalytics(state.selectedDays),
    },
  };
}
