import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useAIConversationsQuery() {
  return useQuery({
    queryKey: queryKeys.ai.conversations(),
    queryFn: () => api.getAIConversations(),
    staleTime: 1000 * 60 * 3,
  });
}
