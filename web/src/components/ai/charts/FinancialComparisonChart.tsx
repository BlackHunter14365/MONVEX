'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AIChartConfig } from '@/types/ai';

interface Props {
  config: AIChartConfig;
}

export const FinancialComparisonChart: React.FC<Props> = ({ config }) => {
  const { data, series = [], xAxis = 'name' } = config;

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[#858D9A] italic">
        No comparative variance data available.
      </div>
    );
  }

  return (
    <div className="w-full h-56 pt-2 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" vertical={false} />
          <XAxis
            dataKey={xAxis}
            tickLine={false}
            axisLine={{ stroke: '#E4E2DC' }}
            tick={{ fill: '#858D9A', fontSize: 10.5, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#858D9A', fontSize: 10, fontWeight: 500 }}
            tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#172033',
              borderRadius: '12px',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            formatter={(value: any, name: any) => [
              `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              name === 'previous' ? 'Previous Month' : name === 'current' ? 'Current Month' : name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
          <Bar dataKey="previous" name="Previous Period" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="current" name="Current Period" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
