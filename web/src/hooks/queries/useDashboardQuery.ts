import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => {
      const [summary, transactions, budgets, goals, recurring, monthlyTrend] = await Promise.all([
        api.getAnalyticsSummary().catch(() => null),
        api.getTransactions().catch(() => []),
        api.getBudgets().catch(() => []),
        api.getGoals().catch(() => []),
        api.getRecurringPayments().catch(() => []),
        api.getMonthlyTrend().catch(() => []),
      ]);

      return {
        summary,
        transactions: Array.isArray(transactions) ? transactions.slice(0, 5) : transactions?.results?.slice(0, 5) || [],
        budgets: Array.isArray(budgets) ? budgets.slice(0, 3) : budgets?.results?.slice(0, 3) || [],
        goals: Array.isArray(goals) ? goals.slice(0, 4) : goals?.results?.slice(0, 4) || [],
        recurring: Array.isArray(recurring) ? recurring.slice(0, 4) : recurring?.results?.slice(0, 4) || [],
        monthlyTrend: Array.isArray(monthlyTrend) ? monthlyTrend : monthlyTrend?.results || [],
      };
    },
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}
