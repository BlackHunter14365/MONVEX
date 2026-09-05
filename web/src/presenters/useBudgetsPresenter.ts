"use client";

/**
 * [P] PRESENTER: Budgets Feature ViewModel
 * Encapsulates budget tracking, progress percentage, alerts, and creation.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Budget, CreateBudgetPayload } from '@/models';

export interface BudgetsState {
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  budgets: Budget[];
  totalLimit: number;
  totalSpent: number;
  overallUsagePct: number;
  atRiskCount: number;
  isCreateModalOpen: boolean;
}

export function useBudgetsPresenter() {
  const [state, setState] = useState<BudgetsState>({
    isLoading: true,
    isMutating: false,
    error: null,
    budgets: [],
    totalLimit: 0,
    totalSpent: 0,
    overallUsagePct: 0,
    atRiskCount: 0,
    isCreateModalOpen: false,
  });

  const fetchBudgets = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await api.getBudgets();
      const list: Budget[] = (res as any)?.results || (Array.isArray(res) ? res : []);
      
      const totalLim = list.reduce((sum, b) => sum + (Number(b.limit_amount) || 0), 0);
      const totalSp = list.reduce((sum, b) => sum + (Number(b.spent_amount) || 0), 0);
      const usagePct = totalLim > 0 ? Math.round((totalSp / totalLim) * 100) : 0;
      const atRisk = list.filter(b => (Number(b.spent_amount) || 0) >= (Number(b.limit_amount) || 0) * 0.8).length;

      setState({
        isLoading: false,
        isMutating: false,
        error: null,
        budgets: list,
        totalLimit: totalLim,
        totalSpent: totalSp,
        overallUsagePct: usagePct,
        atRiskCount: atRisk,
        isCreateModalOpen: false,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to load budgets',
      }));
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = useCallback(async (payload: CreateBudgetPayload) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.createBudget(payload);
      await fetchBudgets();
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to create budget' };
    }
  }, [fetchBudgets]);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.deleteBudget(id);
      await fetchBudgets();
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to delete budget' };
    }
  }, [fetchBudgets]);

  return {
    state,
    actions: {
      openCreateModal: () => setState(prev => ({ ...prev, isCreateModalOpen: true })),
      closeCreateModal: () => setState(prev => ({ ...prev, isCreateModalOpen: false })),
      createBudget,
      deleteBudget,
      refresh: fetchBudgets,
    },
  };
}
