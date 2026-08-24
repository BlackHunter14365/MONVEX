import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useBudgetsQuery() {
  return useQuery({
    queryKey: queryKeys.budgets.list(),
    queryFn: () => api.getBudgets(),
    staleTime: 1000 * 60 * 2,
  });
}
