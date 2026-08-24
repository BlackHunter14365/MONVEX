import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useBudgetsQuery() {
  return useQuery({
    queryKey: queryKeys.budgets.list(),
    queryFn: () => api.getBudgets(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCategoriesQuery(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: queryKeys.transactions.categories(),
    queryFn: () => api.getCategories(type),
    staleTime: 1000 * 60 * 10,
  });
}
