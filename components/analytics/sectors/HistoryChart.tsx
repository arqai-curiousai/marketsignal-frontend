'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ISectorHistory } from '@/types/analytics';

interface HistoryChartProps {
  data: ISectorHistory;
  sectorColor: string;
}

type ChartMode = 'returns' | 'drawdown';

export function HistoryChart({ data, sectorColor }: HistoryChartProps) {
  const [mode, setMode] = useState<ChartMode>('returns');

  const chartData = data.dates.map((date, i) => ({
    date: date.slice(5), // MM-DD
    sector: data.sector_cumulative[i],
    benchmark: data.benchmark_cumulative[i],
    drawdown: data.sector_drawdown[i],
  }));

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center rounded-md border border-white/10 bg-white/[0.02] p-0.5">
          {(['returns', 'drawdown'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded transition-all capitalize',
                mode === m ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white/70',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === 'returns' && (
          <span className={cn(
            'text-[10px] font-semibold',
            data.active_return >= 0 ? 'text-emerald-400' : 'text-red-400',
          )}>
            Alpha: {data.active_return >= 0 ? '+' : ''}{data.active_return.toFixed(1)}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
            tickLine={false}
            axisLine={false}
            width={35}
            domain={mode === 'drawdown' ? ['dataMin', 0] : ['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '10px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />

          {mode === 'returns' ? (
            <>
              <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="rgba(148,163,184,0.5)"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name="NIFTY 50"
              />
              <Line
                type="monotone"
                dataKey="sector"
                stroke={sectorColor}
                strokeWidth={2}
                dot={false}
                name="Sector"
              />
            </>
          ) : (
            <>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Area
                type="monotone"
                dataKey="drawdown"
                fill="rgba(239,68,68,0.15)"
                stroke="#EF4444"
                strokeWidth={1.5}
                name="Drawdown %"
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
