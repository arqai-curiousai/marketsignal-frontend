'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ISectorRiskScorecard } from '@/types/analytics';

interface RiskRadarChartProps {
  data: ISectorRiskScorecard;
  sectorColor: string;
}

interface AxisDef {
  key: keyof ISectorRiskScorecard;
  label: string;
  benchKey: keyof ISectorRiskScorecard | null;
  invert?: boolean;
}

const AXES: AxisDef[] = [
  { key: 'sharpe_ratio', label: 'Sharpe', benchKey: 'benchmark_sharpe' },
  { key: 'sortino_ratio', label: 'Sortino', benchKey: 'benchmark_sortino' },
  { key: 'calmar_ratio', label: 'Calmar', benchKey: null },
  { key: 'max_drawdown', label: 'Max DD', benchKey: null, invert: true },
  { key: 'ulcer_index', label: 'Ulcer', benchKey: null, invert: true },
];

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 75;

function normalizeValue(val: number, key: string, invert?: boolean): number {
  // Normalize to 0-1 scale based on typical ranges
  let normalized: number;
  switch (key) {
    case 'sharpe_ratio':
    case 'sortino_ratio':
      normalized = (val + 2) / 7; // range roughly -2 to 5
      break;
    case 'calmar_ratio':
      normalized = (val + 1) / 6; // range roughly -1 to 5
      break;
    case 'max_drawdown':
      normalized = Math.abs(val) / 50; // range 0 to -50%
      break;
    case 'ulcer_index':
      normalized = val / 20; // range 0 to 20%
      break;
    default:
      normalized = val / 2;
  }
  normalized = Math.max(0, Math.min(1, normalized));
  return invert ? 1 - normalized : normalized;
}

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export function RiskRadarChart({ data, sectorColor }: RiskRadarChartProps) {
  const angleStep = 360 / AXES.length;

  const { sectorPoints, benchmarkPoints } = useMemo(() => {
    const sectorPts: string[] = [];
    const benchPts: string[] = [];

    AXES.forEach((axis, i) => {
      const angle = i * angleStep;
      const val = data[axis.key] as number ?? 0;
      const norm = normalizeValue(val, axis.key, axis.invert);
      const pt = polarToCartesian(angle, norm * RADIUS);
      sectorPts.push(`${pt.x},${pt.y}`);

      // Benchmark polygon (only for axes that have benchmark values)
      let benchVal: number;
      if (axis.benchKey) {
        benchVal = data[axis.benchKey!] as number ?? 0;
      } else {
        // For non-benchmark axes, use a moderate default
        benchVal = axis.key === 'max_drawdown' ? -10 : axis.key === 'ulcer_index' ? 3 : 1;
      }
      const benchNorm = normalizeValue(benchVal, axis.key, axis.invert);
      const benchPt = polarToCartesian(angle, benchNorm * RADIUS);
      benchPts.push(`${benchPt.x},${benchPt.y}`);
    });

    return { sectorPoints: sectorPts.join(' '), benchmarkPoints: benchPts.join(' ') };
  }, [data, angleStep]);

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon
            key={r}
            points={AXES.map((_, i) => {
              const pt = polarToCartesian(i * angleStep, r * RADIUS);
              return `${pt.x},${pt.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const pt = polarToCartesian(i * angleStep, RADIUS);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={pt.x}
              y2={pt.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Benchmark polygon */}
        <polygon
          points={benchmarkPoints}
          fill="rgba(148,163,184,0.08)"
          stroke="rgba(148,163,184,0.4)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* Sector polygon */}
        <polygon
          points={sectorPoints}
          fill={`${sectorColor}20`}
          stroke={sectorColor}
          strokeWidth={1.5}
          opacity={0.9}
        />

        {/* Sector dots */}
        {AXES.map((axis, i) => {
          const val = data[axis.key] as number ?? 0;
          const norm = normalizeValue(val, axis.key, axis.invert);
          const pt = polarToCartesian(i * angleStep, norm * RADIUS);
          return <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={sectorColor} opacity={0.9} />;
        })}

        {/* Labels */}
        {AXES.map((axis, i) => {
          const pt = polarToCartesian(i * angleStep, RADIUS + 16);
          return (
            <text
              key={axis.key}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize={9}
              fontWeight={500}
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: sectorColor }} />
          <span>Sector</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full border border-dashed border-gray-400 bg-transparent" />
          <span>NIFTY 50</span>
        </div>
      </div>

      {/* Metric values */}
      <div className="grid grid-cols-3 gap-1.5 mt-2 w-full">
        {[
          { label: 'Sharpe', val: data.sharpe_ratio, bench: data.benchmark_sharpe },
          { label: 'Sortino', val: data.sortino_ratio, bench: data.benchmark_sortino },
          { label: 'Calmar', val: data.calmar_ratio, bench: null },
          { label: 'Max DD', val: data.max_drawdown, bench: null, suffix: '%' },
          { label: 'DD Days', val: data.max_dd_duration_days, bench: null },
          { label: 'Ulcer', val: data.ulcer_index, bench: null, suffix: '%' },
        ].map((m) => (
          <div key={m.label} className="text-center p-1 rounded bg-white/[0.02]">
            <div className="text-[9px] text-muted-foreground">{m.label}</div>
            <div className={cn(
              'text-[11px] font-semibold tabular-nums',
              m.label === 'Max DD' || m.label === 'Ulcer'
                ? (Math.abs(m.val) < 10 ? 'text-white' : 'text-red-400')
                : m.label === 'DD Days'
                  ? 'text-white'
                  : (m.val > 0 ? 'text-white' : 'text-red-400'),
            )}>
              {typeof m.val === 'number' ? m.val.toFixed(m.label === 'DD Days' ? 0 : 2) : '—'}
              {m.suffix ?? ''}
            </div>
            {m.bench != null && (
              <div className="text-[8px] text-muted-foreground">
                vs {m.bench.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
