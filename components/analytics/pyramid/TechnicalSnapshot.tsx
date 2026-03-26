'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TechnicalSnapshotProps {
  patternData: {
    overall_signal?: string;
    active_pattern_count?: number;
    momentum?: {
      rsi?: { value: number; zone: string };
      macd?: { histogram: number; signal: string };
      adx?: { value: number; trend: string };
    };
    indicators?: {
      current_price?: number;
      obv_trend?: string;
    };
  } | null;
}

function GaugeIndicator({
  label,
  value,
  zone,
  min,
  max,
}: {
  label: string;
  value: number | null;
  zone: string;
  min: number;
  max: number;
}) {
  if (value == null) return null;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1) * 100;

  const zoneColor =
    zone === 'overbought' || zone === 'strong'
      ? 'text-emerald-400'
      : zone === 'oversold' || zone === 'weak'
        ? 'text-red-400'
        : 'text-amber-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className={cn('text-xs font-medium tabular-nums', zoneColor)}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor:
              zone === 'overbought' || zone === 'strong'
                ? '#10B981'
                : zone === 'oversold' || zone === 'weak'
                  ? '#EF4444'
                  : '#F59E0B',
          }}
        />
      </div>
    </div>
  );
}

export function TechnicalSnapshot({ patternData }: TechnicalSnapshotProps) {
  if (!patternData) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        No technical data available. View full analysis on the Patterns tab.
      </div>
    );
  }

  const { momentum, indicators } = patternData;

  return (
    <div className="space-y-3" role="img" aria-label="Technical indicators snapshot">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Technical Snapshot
        </h4>
        {patternData.overall_signal && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-medium',
              patternData.overall_signal === 'bullish'
                ? 'bg-emerald-500/15 text-emerald-400'
                : patternData.overall_signal === 'bearish'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-white/10 text-muted-foreground',
            )}
          >
            {patternData.overall_signal.toUpperCase()}
          </span>
        )}
      </div>

      {/* Active patterns count */}
      {patternData.active_pattern_count != null && patternData.active_pattern_count > 0 && (
        <div className="flex items-center justify-between py-1 px-2 rounded-md bg-white/[0.03]">
          <span className="text-[10px] text-muted-foreground">Active Patterns</span>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {patternData.active_pattern_count}
          </span>
        </div>
      )}

      {/* Momentum indicators */}
      <div className="space-y-2.5">
        {momentum?.rsi && (
          <GaugeIndicator
            label="RSI (14)"
            value={momentum.rsi.value}
            zone={momentum.rsi.zone}
            min={0}
            max={100}
          />
        )}
        {momentum?.adx && (
          <GaugeIndicator
            label="ADX"
            value={momentum.adx.value}
            zone={momentum.adx.trend}
            min={0}
            max={60}
          />
        )}
      </div>

      {/* MACD signal */}
      {momentum?.macd && (
        <div className="flex items-center justify-between py-1">
          <span className="text-[10px] text-muted-foreground">MACD</span>
          <span
            className={cn(
              'text-xs font-medium',
              momentum.macd.signal === 'bullish' ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {momentum.macd.signal.toUpperCase()}
          </span>
        </div>
      )}

      {/* Volume trend */}
      {indicators?.obv_trend && (
        <div className="flex items-center justify-between py-1">
          <span className="text-[10px] text-muted-foreground">Volume Trend</span>
          <span
            className={cn(
              'text-xs font-medium',
              indicators.obv_trend === 'rising'
                ? 'text-emerald-400'
                : indicators.obv_trend === 'falling'
                  ? 'text-red-400'
                  : 'text-muted-foreground',
            )}
          >
            {indicators.obv_trend.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
