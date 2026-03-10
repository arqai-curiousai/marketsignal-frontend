'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { MANSFIELD_STAGE_COLORS, MANSFIELD_STAGE_LABELS } from './constants';
import type { ISectorMansfieldRS } from '@/types/analytics';

interface MansfieldRSChartProps {
  data: ISectorMansfieldRS;
  sectorColor: string;
}

export function MansfieldRSChart({ data, sectorColor }: MansfieldRSChartProps) {
  const chartData = data.dates.map((date, i) => ({
    date: date.slice(5),
    rs: data.mansfield_rs[i],
    sma: data.rs_sma[i],
  }));

  const stageColor = MANSFIELD_STAGE_COLORS[data.stage] ?? '#94A3B8';
  const stageLabel = MANSFIELD_STAGE_LABELS[data.stage] ?? data.stage;

  return (
    <div>
      {/* Stage badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${stageColor}20`,
            color: stageColor,
          }}
        >
          {stageLabel}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {data.stage_duration_days}d in stage
        </span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="mansfield-pos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="mansfield-neg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '10px',
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="rs"
            stroke={sectorColor}
            strokeWidth={1.5}
            fill="url(#mansfield-pos)"
            name="Mansfield RS"
          />
          <Line
            type="monotone"
            dataKey="sma"
            stroke="rgba(148,163,184,0.5)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            name="SMA"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
