'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PatternCategory {
  name: string;
  count: number;
  avgQuality: number;
  direction: 'bullish' | 'bearish' | 'neutral';
}

interface PatternRadarProps {
  categories: PatternCategory[];
  overallGrade: string;
  className?: string;
}

const CATEGORY_ORDER = [
  'candlestick',
  'chart',
  'momentum',
  'volume',
  'volatility',
  'regime',
  'supertrend',
];

const CATEGORY_LABELS: Record<string, string> = {
  candlestick: 'Candlestick',
  chart: 'Chart',
  momentum: 'Momentum',
  volume: 'Volume',
  volatility: 'Volatility',
  regime: 'Regime',
  supertrend: 'Trend',
  matrix_profile: 'Structure',
};

export function PatternRadar({ categories, overallGrade, className }: PatternRadarProps) {
  const cx = 100;
  const cy = 100;
  const maxR = 80;

  const sortedCategories = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.name, c]));
    return CATEGORY_ORDER.map((name) => catMap.get(name)).filter(Boolean) as PatternCategory[];
  }, [categories]);

  const n = sortedCategories.length || 1;
  const angleStep = (2 * Math.PI) / n;

  const points = useMemo(() => {
    return sortedCategories.map((cat, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = Math.max(0.1, cat.avgQuality) * maxR;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        cat,
        angle,
      };
    });
  }, [sortedCategories, angleStep]);

  const pathD = points.length > 0
    ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')} Z`
    : '';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg viewBox="0 0 200 200" className="h-48 w-48">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <circle
            key={frac}
            cx={cx}
            cy={cy}
            r={frac * maxR}
            fill="none"
            stroke="rgb(51, 65, 85)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(p.angle)}
            y2={cy + maxR * Math.sin(p.angle)}
            stroke="rgb(51, 65, 85)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Data polygon */}
        {pathD && (
          <path
            d={pathD}
            fill="rgba(139, 92, 246, 0.15)"
            stroke="rgba(139, 92, 246, 0.6)"
            strokeWidth="1.5"
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={
              p.cat.direction === 'bullish'
                ? 'rgb(52, 211, 153)'
                : p.cat.direction === 'bearish'
                  ? 'rgb(248, 113, 113)'
                  : 'rgb(148, 163, 184)'
            }
          />
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const lx = cx + (maxR + 16) * Math.cos(p.angle);
          const ly = cy + (maxR + 16) * Math.sin(p.angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 text-[7px]"
            >
              {CATEGORY_LABELS[p.cat.name] || p.cat.name}
            </text>
          );
        })}

        {/* Center grade */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-violet-400 text-lg font-bold"
        >
          {overallGrade}
        </text>
      </svg>
    </div>
  );
}
