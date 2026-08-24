import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useTransactionsQuery(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => api.getTransactions(params),
    staleTime: 1000 * 60,
  });
}

export function useCategoriesQuery(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: queryKeys.transactions.categories(type),
    queryFn: () => api.getCategories(type),
    staleTime: 1000 * 60 * 10,
  });
}
