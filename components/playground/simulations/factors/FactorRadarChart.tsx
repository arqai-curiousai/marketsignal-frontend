'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IFactorDefinition } from '@/types/simulation';

interface Props {
  factors: IFactorDefinition[];
  portfolioTilts: Record<string, number>;
  benchmarkTilts: Record<string, number>;
  className?: string;
}

export function FactorRadarChart({ factors, portfolioTilts, benchmarkTilts, className }: Props) {
  const data = factors.map((f) => ({
    factor: f.label,
    portfolio: portfolioTilts[f.id] ?? 50,
    benchmark: benchmarkTilts[f.id] ?? 50,
  }));

  return (
    <div className={cn(S.card, 'p-3', className)}>
      <h3 className={cn(T.heading, 'text-white/70 mb-2')}>Factor Tilts</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="factor"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
            />
            <Radar
              name="Portfolio"
              dataKey="portfolio"
              stroke="#A78BFA"
              fill="#A78BFA"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="NIFTY 50"
              dataKey="benchmark"
              stroke="rgba(255,255,255,0.3)"
              fill="rgba(255,255,255,0.05)"
              fillOpacity={0.1}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F1219',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value: number) => `${value.toFixed(0)}`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
