'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IRegimeForecast, RegimeLabel } from '@/types/simulation';
import { REGIME_COLORS, getRegimeColor, fmtProb } from './regime-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  forecast: IRegimeForecast[];
  className?: string;
}

const REGIME_KEYS: RegimeLabel[] = ['growth', 'neutral', 'contraction'];

// ─── Tooltip ──────────────────────────────────────────────────────

function ForecastTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown>; dataKey?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const horizon = d.horizon as number;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-white/70 mb-1">{horizon}-Day Horizon</p>
      <div className="space-y-0.5 text-[10px]">
        {REGIME_KEYS.map((key) => {
          const prob = d[key] as number | undefined;
          if (prob == null) return null;
          const color = getRegimeColor(key);
          return (
            <p key={key}>
              <span style={{ color: color.hex }} className="font-semibold">
                {color.label}:
              </span>{' '}
              <span className="text-white/60">{fmtProb(prob)}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function RegimeForecastStrip({ forecast, className }: Props) {
  // Determine available regime keys (only those that exist in data)
  const availableKeys = useMemo(() => {
    const existing = new Set<RegimeLabel>();
    for (const f of forecast) {
      for (const key of REGIME_KEYS) {
        if (f.probabilities[key] != null) existing.add(key);
      }
    }
    return REGIME_KEYS.filter((k) => existing.has(k));
  }, [forecast]);

  // Build chart data
  const chartData = useMemo(() => {
    return forecast.map((f) => {
      const row: Record<string, unknown> = {
        horizon: f.horizon,
        label: `${f.horizon}D`,
      };
      for (const key of availableKeys) {
        row[key] = f.probabilities[key] ?? 0;
      }
      return row;
    });
  }, [forecast, availableKeys]);

  // Find dominant regime for annotation text
  const dominantInfo = useMemo(() => {
    if (!forecast.length) return null;
    const first = forecast[0];
    let maxKey: RegimeLabel = 'neutral';
    let maxProb = 0;
    for (const key of availableKeys) {
      const p = first.probabilities[key] ?? 0;
      if (p > maxProb) {
        maxProb = p;
        maxKey = key;
      }
    }
    const color = getRegimeColor(maxKey);
    return {
      label: color.label,
      prob: maxProb,
      horizon: first.horizon,
      hex: color.hex,
    };
  }, [forecast, availableKeys]);

  if (!forecast.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No forecast data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Regime Forecast</h4>
        <span className={cn(T.badge, 'text-white/30')}>
          Forward Probabilities
        </span>
      </div>

      {/* Dominant regime annotation */}
      {dominantInfo && dominantInfo.prob > 0.5 && (
        <motion.p
          className="text-[10px] text-muted-foreground mb-3 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span style={{ color: dominantInfo.hex }} className="font-semibold">
            {fmtProb(dominantInfo.prob)}
          </span>{' '}
          chance of staying in{' '}
          <span style={{ color: dominantInfo.hex }} className="font-medium">
            {dominantInfo.label}
          </span>{' '}
          in {dominantInfo.horizon} days
        </motion.p>
      )}

      {/* Stacked bar chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip content={<ForecastTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />

          {availableKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="forecast"
              fill={REGIME_COLORS[key].hex}
              fillOpacity={0.7}
              animationDuration={1000}
              animationEasing="ease-out"
              radius={key === availableKeys[availableKeys.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        {availableKeys.map((key) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: REGIME_COLORS[key].hex, opacity: 0.7 }}
            />
            <span className="text-[8px] text-white/25">{REGIME_COLORS[key].label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
