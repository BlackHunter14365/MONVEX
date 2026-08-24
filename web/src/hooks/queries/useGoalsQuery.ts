import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useGoalsQuery() {
  return useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: () => api.getGoals(),
    staleTime: 1000 * 60 * 2,
  });
}
