import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.summary(),
    queryFn: async () => {
      const [summary, healthScore, anomalies, monthlyTrend, spendingByCategory] = await Promise.all([
        api.getAnalyticsSummary().catch(() => null),
        api.getHealthScore().catch(() => null),
        api.getAnomalies().catch(() => []),
        api.getMonthlyTrend().catch(() => []),
        api.getSpendingByCategory().catch(() => []),
      ]);
      return { summary, healthScore, anomalies, monthlyTrend, spendingByCategory };
    },
    staleTime: 1000 * 60 * 3,
  });
}
