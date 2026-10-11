import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useSecurityQuery() {
  return useQuery({
    queryKey: queryKeys.security.overview(),
    queryFn: async () => {
      const [overview, logData] = await Promise.all([
        api.getSecurityOverview().catch(() => null),
        api.getSecurityLogs().catch(() => ({ results: [] })),
      ]);
      const logs = Array.isArray(logData) ? logData : logData?.results || [];
      return { overview, logs };
    },
    staleTime: 1000 * 60 * 2,
  });
}
