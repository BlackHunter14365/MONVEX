'use client';

import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, HelpCircle } from 'lucide-react';
import { AIChartConfig } from '@/types/ai';
import { FinancialLineChart } from './FinancialLineChart';
import { FinancialBarChart } from './FinancialBarChart';
import { FinancialAreaChart } from './FinancialAreaChart';
import { FinancialDonutChart } from './FinancialDonutChart';
import { FinancialComparisonChart } from './FinancialComparisonChart';

interface DynamicAIChartProps {
  chart: AIChartConfig;
}

export const DynamicAIChart: React.FC<DynamicAIChartProps> = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  const renderChartBody = () => {
    switch (chart.type) {
      case 'line':
        return <FinancialLineChart config={chart} />;
      case 'bar':
        return <FinancialBarChart config={chart} />;
      case 'area':
        return <FinancialAreaChart config={chart} />;
      case 'donut':
        return <FinancialDonutChart config={chart} />;
      case 'comparison':
        return <FinancialComparisonChart config={chart} />;
      default:
        return <FinancialBarChart config={chart} />;
    }
  };

  const getChartIcon = () => {
    switch (chart.type) {
      case 'line':
      case 'area':
        return <TrendingUp className="h-3.5 w-3.5 text-[#2563EB]" />;
      case 'donut':
        return <PieChart className="h-3.5 w-3.5 text-[#059669]" />;
      case 'comparison':
        return <BarChart3 className="h-3.5 w-3.5 text-[#7C3AED]" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-[#2563EB]" />;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-[#E4E2DC] bg-[#FFFFFF] p-4 shadow-xs my-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#F6F5F1] border border-[#E4E2DC]">
            {getChartIcon()}
          </div>
          <h4 className="text-xs font-bold text-[#172033] tracking-tight">{chart.title}</h4>
        </div>
        <span className="text-[10px] font-semibold text-[#858D9A] uppercase tracking-wider bg-[#F6F5F1] px-2 py-0.5 rounded-md border border-[#E4E2DC]">
          Verified Data
        </span>
      </div>

      {/* Chart Canvas */}
      {renderChartBody()}

      {/* Chart Explanation / Footer */}
      {chart.description && (
        <div className="pt-2 border-t border-[#F1EFEA] flex items-start gap-1.5 text-[11px] text-[#5F6878] leading-normal font-medium">
          <HelpCircle className="h-3.5 w-3.5 text-[#858D9A] shrink-0 mt-0.5" />
          <span>{chart.description}</span>
        </div>
      )}
    </div>
  );
};
