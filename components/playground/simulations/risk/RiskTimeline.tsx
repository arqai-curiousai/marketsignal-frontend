'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { cn } from '@/lib/utils';
import { T, S, TOOLTIP_STYLE, AXIS_STYLE } from '@/components/playground/pyramid/tokens';
import type { IRiskScoreResult } from '@/types/simulation';
import { RISK_ZONES, getZoneForScore } from './risk-tokens';

interface Props {
  data: IRiskScoreResult;
  className?: string;
}

// ─── Build chart data ────────────────────────────────────────

function buildChartData(score: number, computedAt: string) {
  // Single-point placeholder (historical data not yet available)
  const date = computedAt
    ? new Date(computedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : 'Now';
  return [{ date, score: Math.round(score) }];
}

// ─── Custom tooltip ──────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
}) {
  if (!active || !payload?.[0]) return null;
  const score = payload[0].value;
  const zone = getZoneForScore(score);
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-xs font-mono text-white/80">
        Score: <span style={{ color: zone.hex }}>{score}/99</span>
      </p>
      <p className="text-[10px] text-white/40">{zone.label}</p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export function RiskTimeline({ data, className }: Props) {
  const chartData = useMemo(
    () => buildChartData(data.compositeScore, data.computedAt),
    [data.compositeScore, data.computedAt],
  );

  const zoneConfig = getZoneForScore(data.compositeScore);
  const zones = Object.values(RISK_ZONES);

  return (
    <div className={cn(S.card, 'p-4 md:p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn(T.heading, 'text-white/70')}>Score Timeline</h3>
        <span className={cn(T.legend)}>
          Historical tracking starts after first computation
        </span>
      </div>

      <div className="h-[200px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
            {/* Zone background bands */}
            {zones.map((zone) => (
              <ReferenceArea
                key={zone.label}
                y1={zone.rangeStart}
                y2={zone.rangeEnd}
                fill={zone.hex}
                fillOpacity={0.04}
              />
            ))}

            <XAxis
              dataKey="date"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 99]}
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={zoneConfig.hex}
              strokeWidth={2}
              dot={{
                r: 5,
                fill: zoneConfig.hex,
                stroke: 'rgba(255,255,255,0.2)',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 7,
                fill: zoneConfig.hex,
                stroke: 'rgba(255,255,255,0.4)',
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
