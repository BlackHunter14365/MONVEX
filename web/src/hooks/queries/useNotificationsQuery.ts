import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useNotificationsQuery(type?: string) {
  const filter = type === 'ALL' ? undefined : type;
  return useQuery({
    queryKey: queryKeys.transactions.notifications(filter),
    queryFn: () => api.getNotifications(filter),
    staleTime: 1000 * 60 * 2,
  });
}
