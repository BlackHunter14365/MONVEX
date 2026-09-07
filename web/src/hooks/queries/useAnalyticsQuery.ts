import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.summary(),
    queryFn: async () => {
      // Core financial summary must succeed; failures propagate to trigger isError
      const summary = await api.getAnalyticsSummary();
      const anomalies = await api.getAnomalies().catch(() => []);

      const healthScore = summary?.health_score || null;
      const monthlyTrend = summary?.monthly_trends || summary?.monthly_trend || [];
      const spendingByCategory = summary?.category_breakdown || summary?.spending_by_category || [];

      return { summary, healthScore, anomalies, monthlyTrend, spendingByCategory };
    },
    staleTime: 1000 * 60 * 3,
  });
}
