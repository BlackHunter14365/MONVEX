import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useForecastQuery(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.forecast(days),
    queryFn: () => api.getCashflowForecast(days),
    staleTime: 1000 * 60 * 3,
  });
}
