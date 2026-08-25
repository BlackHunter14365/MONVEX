'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AIChartConfig } from '@/types/ai';

interface Props {
  config: AIChartConfig;
}

export const FinancialAreaChart: React.FC<Props> = ({ config }) => {
  const { data, series = [], xAxis = 'day' } = config;

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[#858D9A] italic">
        No projection trajectory data available.
      </div>
    );
  }

  const primarySeries = series[0] || { key: 'projected', name: 'Projected Balance', color: '#2563EB' };

  return (
    <div className="w-full h-56 pt-2 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <defs>
            <linearGradient id="aiForecastArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primarySeries.color || '#2563EB'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={primarySeries.color || '#2563EB'} stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
            formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, primarySeries.name]}
          />
          <Area
            type="monotone"
            dataKey={primarySeries.key}
            stroke={primarySeries.color || '#2563EB'}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#aiForecastArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
