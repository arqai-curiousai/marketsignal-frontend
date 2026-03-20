'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ICurrencyPairSnapshot, ICurrencyTechnicals } from '@/src/types/analytics';

interface Props {
  pair: ICurrencyPairSnapshot | null;
  technicals?: ICurrencyTechnicals | null;
}

const Metric = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className={cn(
    'flex justify-between py-1.5 border-b border-border/50 last:border-0',
    highlight && 'bg-primary/5 -mx-1 px-1 rounded'
  )}>
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium">{value ?? '—'}</span>
  </div>
);

function SignalDot({ signal }: { signal: string }) {
  const color =
    signal === 'overbought' || signal === 'SELL' ? 'bg-red-500'
    : signal === 'oversold' || signal === 'BUY' ? 'bg-emerald-500'
    : 'bg-muted-foreground';
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full', color)} />;
}

export function CurrencyMetricsBar({ pair, technicals }: Props) {
  if (!pair) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">Metrics</h3>
        <p className="text-xs text-muted-foreground">Select a currency pair</p>
      </div>
    );
  }

  const isUp = pair.change_pct >= 0;
  const tech = technicals;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{pair.ticker}</h3>
        {tech?.summary && (
          <span className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
            tech.summary === 'BUY' ? 'bg-emerald-500/15 text-emerald-400'
              : tech.summary === 'SELL' ? 'bg-red-500/15 text-red-400'
              : 'bg-muted text-muted-foreground'
          )}>
            {tech.summary}
          </span>
        )}
      </div>

      <div className="space-y-0">
        {/* Price */}
        <Metric label="Price" value={`₹${pair.price.toFixed(4)}`} />
        <Metric
          label="Change"
          value={
            <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>
              {isUp ? '+' : ''}{pair.change_pct.toFixed(2)}%
            </span>
          }
        />
        <Metric label="Day High" value={pair.high ? `₹${pair.high.toFixed(4)}` : undefined} />
        <Metric label="Day Low" value={pair.low ? `₹${pair.low.toFixed(4)}` : undefined} />
        <Metric label="52W High" value={pair.high_52w ? `₹${pair.high_52w.toFixed(4)}` : undefined} />
        <Metric label="52W Low" value={pair.low_52w ? `₹${pair.low_52w.toFixed(4)}` : undefined} />

        {/* Technicals quick-glance */}
        {tech && (
          <>
            <div className="border-t border-border/30 mt-1 pt-1" />
            <Metric
              label="RSI (14)"
              value={
                <span className="flex items-center gap-1.5">
                  <SignalDot signal={tech.rsi.signal} />
                  <span className={cn(
                    'font-mono',
                    tech.rsi.value > 70 ? 'text-red-400' : tech.rsi.value < 30 ? 'text-emerald-400' : ''
                  )}>
                    {tech.rsi.value.toFixed(1)}
                  </span>
                </span>
              }
            />
            <Metric
              label="MACD"
              value={
                <span className={cn(
                  'font-mono',
                  tech.macd.histogram > 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {tech.macd.histogram > 0 ? '+' : ''}{tech.macd.histogram.toFixed(4)}
                </span>
              }
            />
            <Metric
              label="ADX"
              value={
                <span className="flex items-center gap-1.5">
                  <span className="font-mono">{tech.adx.value.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">{tech.adx.trend_strength}</span>
                </span>
              }
            />
            <Metric
              label="ATR"
              value={<span className="font-mono">{tech.atr.paise.toFixed(1)}p</span>}
            />
          </>
        )}
      </div>
    </div>
  );
}
