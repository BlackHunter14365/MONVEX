import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useReportsQuery() {
  return useQuery({
    queryKey: ['reports', 'monthly'],
    queryFn: () => api.getMonthlyReport(),
    staleTime: 1000 * 60 * 5,
  });
}
