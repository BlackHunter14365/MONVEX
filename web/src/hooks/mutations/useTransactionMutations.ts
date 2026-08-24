import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (txData: any) => api.createTransaction(txData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}
