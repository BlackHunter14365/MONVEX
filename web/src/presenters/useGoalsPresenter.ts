"use client";

/**
 * [P] PRESENTER: Savings Goals Feature ViewModel
 * Encapsulates milestone progress, contributions, and target forecasts.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { SavingsGoal, CreateGoalPayload, GoalContributionPayload } from '@/models';

export interface GoalsState {
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  goals: SavingsGoal[];
  totalTarget: number;
  totalSaved: number;
  overallProgressPct: number;
  completedCount: number;
  isCreateModalOpen: boolean;
}

export function useGoalsPresenter() {
  const [state, setState] = useState<GoalsState>({
    isLoading: true,
    isMutating: false,
    error: null,
    goals: [],
    totalTarget: 0,
    totalSaved: 0,
    overallProgressPct: 0,
    completedCount: 0,
    isCreateModalOpen: false,
  });

  const fetchGoals = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await api.getGoals();
      const list: SavingsGoal[] = (res as any)?.results || (Array.isArray(res) ? res : []);
      
      const totalTar = list.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
      const totalSav = list.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);
      const overallPct = totalTar > 0 ? Math.round((totalSav / totalTar) * 100) : 0;
      const completed = list.filter(g => (Number(g.current_amount) || 0) >= (Number(g.target_amount) || 0)).length;

      setState({
        isLoading: false,
        isMutating: false,
        error: null,
        goals: list,
        totalTarget: totalTar,
        totalSaved: totalSav,
        overallProgressPct: overallPct,
        completedCount: completed,
        isCreateModalOpen: false,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to load savings goals',
      }));
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (payload: CreateGoalPayload) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.createGoal(payload);
      await fetchGoals();
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to create goal' };
    }
  }, [fetchGoals]);

  const contributeToGoal = useCallback(async (goalId: string, payload: GoalContributionPayload) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.contributeToGoal(goalId, payload.amount, payload.notes);
      await fetchGoals();
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to contribute to goal' };
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.deleteGoal(id);
      await fetchGoals();
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to delete goal' };
    }
  }, [fetchGoals]);

  return {
    state,
    actions: {
      openCreateModal: () => setState(prev => ({ ...prev, isCreateModalOpen: true })),
      closeCreateModal: () => setState(prev => ({ ...prev, isCreateModalOpen: false })),
      createGoal,
      contributeToGoal,
      deleteGoal,
      refresh: fetchGoals,
    },
  };
}
