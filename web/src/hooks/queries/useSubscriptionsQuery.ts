import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useSubscriptionsQuery() {
  return useQuery({
    queryKey: queryKeys.transactions.recurring(),
    queryFn: () => api.getRecurringPayments(),
    staleTime: 1000 * 60 * 3,
  });
}
