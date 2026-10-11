import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SimulationParams {
  income_delta: number;
  category_cuts: Record<string, number>;
  extra_monthly_savings: number;
  extra_debt_payment: number;
  timeframe_months: number;
}

export function useSimulatorQuery(params: SimulationParams) {
  return useQuery({
    queryKey: ['analytics', 'simulation', params],
    queryFn: () => api.runFullSimulation(params),
    staleTime: 1000 * 60 * 5,
  });
}
