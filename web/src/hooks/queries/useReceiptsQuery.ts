import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useReceiptsQuery() {
  return useQuery({
    queryKey: queryKeys.transactions.receipts(),
    queryFn: () => api.getReceipts(),
    staleTime: 1000 * 60 * 2,
  });
}
