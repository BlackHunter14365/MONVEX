import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useNetWorthQuery() {
  return useQuery({
    queryKey: queryKeys.transactions.netWorth(),
    queryFn: () => api.getNetWorth(),
    staleTime: 1000 * 60 * 3,
  });
}
