import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useDebtQuery() {
  return useQuery({
    queryKey: queryKeys.transactions.debtPlanner(),
    queryFn: () => api.getDebtPlanner(),
    staleTime: 1000 * 60 * 3,
  });
}
