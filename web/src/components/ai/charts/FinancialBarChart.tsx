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

export const FinancialBarChart: React.FC<Props> = ({ config }) => {
  const { data, series = [], xAxis = 'name' } = config;

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[#858D9A] italic">
        No comparative data available for bar chart.
      </div>
    );
  }

  const defaultColors = ['#2563EB', '#172033', '#059669', '#E11D48'];

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
            formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, '']}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />}
          {series.map((s, idx) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name || s.key}
              fill={s.color || defaultColors[idx % defaultColors.length]}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
