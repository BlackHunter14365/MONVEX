'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { AIChartConfig } from '@/types/ai';

interface Props {
  config: AIChartConfig;
}

export const FinancialDonutChart: React.FC<Props> = ({ config }) => {
  const { data } = config;

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[#858D9A] italic">
        No breakdown share data available.
      </div>
    );
  }

  const COLORS = ['#2563EB', '#059669', '#D97706', '#E11D48', '#7C3AED', '#0EA5E9', '#84CC16'];

  return (
    <div className="w-full h-56 pt-1 select-none flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
