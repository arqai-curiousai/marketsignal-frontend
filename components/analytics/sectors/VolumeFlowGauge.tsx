'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { flowColor, perfTextClass } from './constants';
import type { ISectorVolumeFlow } from '@/types/analytics';

interface VolumeFlowGaugeProps {
  data: ISectorVolumeFlow;
}

const GAUGE_SIZE = 160;
const GAUGE_CX = GAUGE_SIZE / 2;
const GAUGE_CY = GAUGE_SIZE * 0.6;
const GAUGE_R = 55;

export function VolumeFlowGauge({ data }: VolumeFlowGaugeProps) {
  // Semicircle arc from -100 to +100
  // Map score to angle: -100 → 180° (left), 0 → 90° (top), +100 → 0° (right)
  const scoreAngle = 180 - ((data.current_score + 100) / 200) * 180;
  const filledAngle = 180 - scoreAngle;

  // Arc path helper
  const describeArc = (startAngle: number, endAngle: number, r: number): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = GAUGE_CX + r * Math.cos(Math.PI - startRad);
    const y1 = GAUGE_CY - r * Math.sin(Math.PI - startRad);
    const x2 = GAUGE_CX + r * Math.cos(Math.PI - endRad);
    const y2 = GAUGE_CY - r * Math.sin(Math.PI - endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const gaugeColor = flowColor(data.current_score);

  return (
    <div>
      <div className="flex justify-center">
        <svg width={GAUGE_SIZE} height={GAUGE_SIZE * 0.55} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE * 0.65}`} role="img" aria-label="Volume flow gauge">
          {/* Background arc */}
          <path
            d={describeArc(0, 180, GAUGE_R)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {filledAngle > 1 && (
            <path
              d={describeArc(0, Math.min(filledAngle, 180), GAUGE_R)}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={0.8}
            />
          )}

          {/* Center text */}
          <text
            x={GAUGE_CX}
            y={GAUGE_CY - 10}
            textAnchor="middle"
            fill="white"
            fontSize={18}
            fontWeight={700}
          >
            {data.current_score > 0 ? '+' : ''}{data.current_score.toFixed(0)}
          </text>
          <text
            x={GAUGE_CX}
            y={GAUGE_CY + 6}
            textAnchor="middle"
            fill={gaugeColor}
            fontSize={10}
            fontWeight={600}
          >
            {data.current_label}
          </text>

          {/* Scale labels */}
          <text x={GAUGE_CX - GAUGE_R - 5} y={GAUGE_CY + 5} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={8}>-100</text>
          <text x={GAUGE_CX + GAUGE_R + 5} y={GAUGE_CY + 5} textAnchor="start" fill="rgba(255,255,255,0.3)" fontSize={8}>+100</text>
        </svg>
      </div>

      {/* Interpretation */}
      <p className="text-[10px] text-muted-foreground text-center mt-1 mb-2">
        {data.interpretation}
      </p>

      {/* Stock flow breakdown */}
      <div className="space-y-1">
        {data.stock_flows.slice(0, 5).map((sf) => (
          <div key={sf.ticker} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  sf.obv_trend === 'rising' ? 'bg-emerald-400' : sf.obv_trend === 'falling' ? 'bg-red-400' : 'bg-gray-400',
                )}
              />
              <span className="font-medium text-white">{sf.ticker}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">MFI {sf.mfi.toFixed(0)}</span>
              <span className={cn('font-medium tabular-nums', perfTextClass(sf.flow_score))}>
                {sf.flow_score > 0 ? '+' : ''}{sf.flow_score.toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
