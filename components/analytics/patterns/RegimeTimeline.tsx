'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface RegimeZone {
  start: number;
  end: number;
  regime: string;
}

interface RegimeData {
  current: 'bull' | 'bear' | 'sideways';
  hurst_exponent: number;
  hurst_classification: 'trending' | 'mean_reverting' | 'random_walk';
  last_changepoint_index: number | null;
  changepoint_indices: number[];
  regime_zones: RegimeZone[];
}

interface RegimeTimelineProps {
  regime: RegimeData;
  totalBars: number;
  chartDates?: string[];
}

const REGIME_COLORS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  bull: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    dot: '#10B981',
    label: 'Bull',
  },
  bear: {
    bg: 'bg-rose-500',
    text: 'text-rose-400',
    dot: '#F43F5E',
    label: 'Bear',
  },
  sideways: {
    bg: 'bg-amber-500/70',
    text: 'text-amber-400',
    dot: '#F59E0B',
    label: 'Sideways',
  },
};

function getRegimeStyle(regime: string) {
  return REGIME_COLORS[regime] ?? REGIME_COLORS.sideways;
}

function HurstGauge({ value, classification }: { value: number; classification: string }) {
  const width = 120;
  const height = 70;
  const cx = width / 2;
  const cy = 58;
  const radius = 44;

  // Semicircle from PI to 0 (left to right)
  const startAngle = Math.PI;
  const endAngle = 0;

  // Zone boundaries as angles
  const zoneAngles = {
    meanRevertEnd: Math.PI - (0.45 / 1.0) * Math.PI, // 0 -> 0.45
    randomEnd: Math.PI - (0.55 / 1.0) * Math.PI, // 0.45 -> 0.55
  };

  // Arc path helper
  const arcPath = (startA: number, endA: number, r: number): string => {
    const x1 = cx + r * Math.cos(startA);
    const y1 = cy - r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy - r * Math.sin(endA);
    const largeArc = startA - endA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle angle: value 0 = PI, value 1 = 0
  const clampedValue = Math.max(0, Math.min(1, value));
  const needleAngle = Math.PI - clampedValue * Math.PI;
  const needleLen = radius - 6;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy - needleLen * Math.sin(needleAngle);

  const classLabel = useMemo(() => {
    switch (classification) {
      case 'mean_reverting':
        return 'Mean-Reverting';
      case 'trending':
        return 'Trending';
      case 'random_walk':
        return 'Random Walk';
      default:
        return classification;
    }
  }, [classification]);

  const classColor = useMemo(() => {
    switch (classification) {
      case 'mean_reverting':
        return 'text-blue-400';
      case 'trending':
        return 'text-emerald-400';
      case 'random_walk':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  }, [classification]);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background track */}
        <path
          d={arcPath(startAngle, endAngle, radius)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
          strokeLinecap="round"
        />

        {/* Mean-reverting zone: 0 to 0.45 (blue) */}
        <path
          d={arcPath(startAngle, zoneAngles.meanRevertEnd, radius)}
          fill="none"
          stroke="rgba(59,130,246,0.5)"
          strokeWidth={8}
          strokeLinecap="butt"
        />

        {/* Random walk zone: 0.45 to 0.55 (gray) */}
        <path
          d={arcPath(zoneAngles.meanRevertEnd, zoneAngles.randomEnd, radius)}
          fill="none"
          stroke="rgba(148,163,184,0.35)"
          strokeWidth={8}
          strokeLinecap="butt"
        />

        {/* Trending zone: 0.55 to 1.0 (emerald) */}
        <path
          d={arcPath(zoneAngles.randomEnd, endAngle, radius)}
          fill="none"
          stroke="rgba(16,185,129,0.5)"
          strokeWidth={8}
          strokeLinecap="butt"
        />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
          const tickAngle = Math.PI - tick * Math.PI;
          const outerR = radius + 6;
          const innerR = radius + 2;
          return (
            <line
              key={tick}
              x1={cx + innerR * Math.cos(tickAngle)}
              y1={cy - innerR * Math.sin(tickAngle)}
              x2={cx + outerR * Math.cos(tickAngle)}
              y2={cy - outerR * Math.sin(tickAngle)}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
          );
        })}

        {/* Labels at ends */}
        <text x={cx - radius - 10} y={cy + 4} className="fill-slate-600" fontSize={7} textAnchor="middle">
          0
        </text>
        <text x={cx + radius + 10} y={cy + 4} className="fill-slate-600" fontSize={7} textAnchor="middle">
          1
        </text>
        <text x={cx} y={cy - radius - 4} className="fill-slate-600" fontSize={7} textAnchor="middle">
          0.5
        </text>

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#E2E8F0"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={3} fill="#E2E8F0" />
      </svg>

      {/* Value display */}
      <div className="flex flex-col items-center mt-1">
        <span className="text-lg font-bold text-white font-mono">
          {value.toFixed(3)}
        </span>
        <span className={cn('text-[10px] font-medium', classColor)}>
          {classLabel}
        </span>
      </div>
    </div>
  );
}

export function RegimeTimeline({ regime, totalBars, chartDates }: RegimeTimelineProps) {
  const currentStyle = getRegimeStyle(regime.current);

  const segments = useMemo(() => {
    if (!regime.regime_zones || regime.regime_zones.length === 0) {
      return [{ start: 0, end: totalBars, regime: regime.current, widthPct: 100 }];
    }
    const maxEnd = Math.max(totalBars, ...regime.regime_zones.map((z) => z.end));
    return regime.regime_zones.map((zone) => ({
      ...zone,
      widthPct: ((zone.end - zone.start) / maxEnd) * 100,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regime.regime_zones, regime.current, totalBars]);

  const changepointPositions = useMemo(() => {
    if (!regime.changepoint_indices || regime.changepoint_indices.length === 0) return [];
    const maxEnd = Math.max(
      totalBars,
      ...(regime.regime_zones?.map((z) => z.end) ?? [totalBars]),
    );
    return regime.changepoint_indices.map((idx) => ({
      idx,
      pct: (idx / maxEnd) * 100,
    }));
  }, [regime.changepoint_indices, regime.regime_zones, totalBars]);

  return (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-[#111827]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Market Regime</h3>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04]">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentStyle.dot }}
            />
            <span className={cn('text-[11px] font-medium', currentStyle.text)}>
              {currentStyle.label}
            </span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {Object.entries(REGIME_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: val.dot }}
              />
              <span className="text-[9px] text-slate-500">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Ribbon */}
      <div className="relative mb-8">
        <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.03]">
          {segments.map((seg, i) => {
            const style = getRegimeStyle(seg.regime);
            const isFirst = i === 0;
            const isLast = i === segments.length - 1;
            return (
              <div
                key={i}
                className={cn(
                  'h-full transition-all relative',
                  style.bg,
                  isFirst && 'rounded-l-full',
                  isLast && 'rounded-r-full',
                )}
                style={{ width: `${seg.widthPct}%`, opacity: 0.7 }}
                title={`${style.label}: bars ${seg.start}-${seg.end}`}
              />
            );
          })}
        </div>

        {/* Changepoint markers */}
        {changepointPositions.map((cp, i) => (
          <div
            key={i}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${cp.pct}%`, transform: 'translateX(-50%)' }}
            title={`Changepoint at bar ${cp.idx}`}
          >
            <div className="w-px h-5 bg-white/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/70 -mt-0.5" />
            {chartDates?.[cp.idx] && (
              <span className="text-[7px] text-gray-500 mt-1 whitespace-nowrap">
                {new Date(chartDates[cp.idx]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        ))}

        {/* NOW marker */}
        <div
          className="absolute top-0 right-0 flex flex-col items-center"
          style={{ transform: 'translateX(50%)' }}
        >
          <div className="w-0.5 h-5 bg-white/80" />
          <span className="text-[8px] text-white/70 font-bold mt-0.5 tracking-wider">
            NOW
          </span>
        </div>
      </div>

      {/* Hurst Exponent Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          <div className="text-[10px] text-slate-500 font-medium mb-2 uppercase tracking-wider text-center">
            Hurst Exponent
          </div>
          <HurstGauge
            value={regime.hurst_exponent}
            classification={regime.hurst_classification}
          />
        </div>

        {/* Hurst interpretation */}
        <div className="flex-1 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-1 h-6 rounded-full',
                  regime.hurst_classification === 'mean_reverting' && 'bg-blue-500',
                  regime.hurst_classification === 'random_walk' && 'bg-slate-500',
                  regime.hurst_classification === 'trending' && 'bg-emerald-500',
                )}
              />
              <div>
                <div className="text-xs text-white font-medium">
                  {regime.hurst_classification === 'mean_reverting' &&
                    'Price tends to revert to the mean'}
                  {regime.hurst_classification === 'random_walk' &&
                    'Price follows a random walk'}
                  {regime.hurst_classification === 'trending' &&
                    'Price is exhibiting persistent trends'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {regime.hurst_classification === 'mean_reverting' &&
                    'Reversals are more likely than continuation. Range-bound strategies may work.'}
                  {regime.hurst_classification === 'random_walk' &&
                    'No significant persistence or anti-persistence detected.'}
                  {regime.hurst_classification === 'trending' &&
                    'Momentum is strong. Trend-following strategies may be effective.'}
                </div>
              </div>
            </div>

            {/* Zone key */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-full bg-blue-500/50" />
                <span className="text-[9px] text-slate-500">0-0.45 Mean-reverting</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-full bg-slate-500/40" />
                <span className="text-[9px] text-slate-500">0.45-0.55 Random</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 rounded-full bg-emerald-500/50" />
                <span className="text-[9px] text-slate-500">0.55-1.0 Trending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
