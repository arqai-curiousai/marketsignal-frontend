'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IFactorAttribution } from '@/types/simulation';
import { FACTOR_COLORS } from './factor-tokens';

interface Props {
  attribution: IFactorAttribution[];
  className?: string;
}

export function FactorReturnAttribution({ attribution, className }: Props) {
  const data = attribution.map((a) => ({
    name: a.label,
    contribution: a.contribution * 100,
    factorId: a.factorId,
  }));

  return (
    <div className={cn(S.card, 'p-3', className)}>
      <h3 className={cn(T.heading, 'text-white/70 mb-3')}>Factor Return Attribution</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              width={85}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F1219',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
            <Bar dataKey="contribution" radius={[0, 3, 3, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.factorId}
                  fill={FACTOR_COLORS[entry.factorId] || '#A78BFA'}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
