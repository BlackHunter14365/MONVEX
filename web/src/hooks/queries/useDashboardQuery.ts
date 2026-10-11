import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useDashboardQuery() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => {
      // Parallelize ALL network requests simultaneously to eliminate sequential waterfall
      const [summary, rawTransactions, rawBudgets, rawGoals, rawRecurring] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getTransactions().catch(() => []),
        api.getBudgets().catch(() => []),
        api.getGoals().catch(() => []),
        api.getRecurringPayments().catch(() => []),
      ]);

      const transactions = Array.isArray(rawTransactions) ? rawTransactions : rawTransactions?.results || [];
      const budgets = Array.isArray(rawBudgets) ? rawBudgets : rawBudgets?.results || [];
      const goals = Array.isArray(rawGoals) ? rawGoals : rawGoals?.results || [];
      const recurring = Array.isArray(rawRecurring) ? rawRecurring : rawRecurring?.results || [];
      const monthlyTrend = summary?.monthly_trends || summary?.monthly_trend || [];

      // Pre-seed individual entity caches for instant zero-latency navigation
      queryClient.setQueryData(queryKeys.analytics.summary(), {
        summary,
        healthScore: summary?.health_score || null,
        anomalies: [],
        monthlyTrend,
        spendingByCategory: summary?.category_breakdown || summary?.spending_by_category || [],
      });
      queryClient.setQueryData(queryKeys.transactions.list({}), rawTransactions);
      queryClient.setQueryData(queryKeys.budgets.list(), rawBudgets);
      queryClient.setQueryData(queryKeys.goals.list(), rawGoals);
      queryClient.setQueryData(queryKeys.transactions.recurring(), rawRecurring);

      return {
        summary,
        transactions: transactions.slice(0, 5),
        budgets: budgets.slice(0, 3),
        goals: goals.slice(0, 4),
        recurring: recurring.slice(0, 4),
        monthlyTrend: Array.isArray(monthlyTrend) ? monthlyTrend : [],
      };
    },
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}
