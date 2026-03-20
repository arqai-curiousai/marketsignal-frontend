'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyTechnicals, getCurrencyMeanReversion } from '@/src/lib/api/analyticsApi';
import type { ICurrencyTechnicals, ICurrencyMeanReversion } from '@/src/types/analytics';

interface Props {
  pair: string;
}

function SignalBadge({ signal }: { signal: string }) {
  const color =
    signal === 'BUY' || signal === 'bullish' || signal === 'oversold'
      ? 'bg-emerald-500/15 text-emerald-400'
      : signal === 'SELL' || signal === 'bearish' || signal === 'overbought'
        ? 'bg-red-500/15 text-red-400'
        : 'bg-muted text-muted-foreground';
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', color)}>
      {signal}
    </span>
  );
}

function MetricRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
        <span className="text-xs font-mono font-medium">{value}</span>
      </div>
    </div>
  );
}

export function CurrencyTechnicals({ pair }: Props) {
  const [tech, setTech] = useState<ICurrencyTechnicals | null>(null);
  const [mr, setMr] = useState<ICurrencyMeanReversion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [techRes, mrRes] = await Promise.all([
        getCurrencyTechnicals(pair),
        getCurrencyMeanReversion(pair),
      ]);
      if (techRes.success) setTech(techRes.data);
      if (mrRes.success) setMr(mrRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [pair]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !tech) {
    return <div className="space-y-3"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  }

  if (!tech) {
    return <p className="text-xs text-muted-foreground p-4">No technical data available</p>;
  }

  const price = tech.price;

  return (
    <div className="space-y-4">
      {/* Summary Signal */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Signal Summary</h3>
          <SignalBadge signal={tech.summary} />
        </div>

        {/* Quick Glance */}
        {mr && (
          <div className="flex flex-wrap gap-2 mb-3">
            <div className={cn(
              'rounded-md px-2 py-1 text-[10px] font-mono',
              Math.abs(mr.z_score) > 2 ? 'bg-amber-500/15 text-amber-400' : 'bg-muted text-muted-foreground'
            )}>
              Z: {mr.z_score > 0 ? '+' : ''}{mr.z_score.toFixed(2)}
            </div>
            <div className={cn(
              'rounded-md px-2 py-1 text-[10px] font-mono',
              mr.hurst_regime === 'mean_reverting' ? 'bg-blue-500/15 text-blue-400'
                : mr.hurst_regime === 'trending' ? 'bg-purple-500/15 text-purple-400'
                : 'bg-muted text-muted-foreground'
            )}>
              Hurst: {mr.hurst.toFixed(2)} ({mr.hurst_regime.replace('_', ' ')})
            </div>
            {mr.squeeze && (
              <div className="rounded-md px-2 py-1 text-[10px] font-mono bg-amber-500/15 text-amber-400 animate-pulse">
                BB SQUEEZE
              </div>
            )}
            {mr.half_life_days != null && (
              <div className="rounded-md px-2 py-1 text-[10px] font-mono bg-muted text-muted-foreground">
                Half-life: {mr.half_life_days.toFixed(0)}d
              </div>
            )}
          </div>
        )}
      </div>

      {/* Moving Averages */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Moving Averages</h3>
        <MetricRow
          label="SMA 20"
          value={tech.sma.sma20.toFixed(4)}
          sub={price > tech.sma.sma20 ? <span className="text-emerald-400">Above</span> : <span className="text-red-400">Below</span>}
        />
        <MetricRow
          label="SMA 50"
          value={tech.sma.sma50.toFixed(4)}
          sub={price > tech.sma.sma50 ? <span className="text-emerald-400">Above</span> : <span className="text-red-400">Below</span>}
        />
        {tech.sma.sma200 != null && (
          <MetricRow
            label="SMA 200"
            value={tech.sma.sma200.toFixed(4)}
            sub={price > tech.sma.sma200 ? <span className="text-emerald-400">Above</span> : <span className="text-red-400">Below</span>}
          />
        )}
        <MetricRow label="EMA 9" value={tech.ema.ema9.toFixed(4)} />
        <MetricRow label="EMA 21" value={tech.ema.ema21.toFixed(4)} />
      </div>

      {/* Oscillators */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Oscillators</h3>

        {/* RSI Gauge */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">RSI (14)</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium">{tech.rsi.value.toFixed(1)}</span>
              <SignalBadge signal={tech.rsi.signal} />
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                tech.rsi.value > 70 ? 'bg-red-500' : tech.rsi.value < 30 ? 'bg-emerald-500' : 'bg-blue-500'
              )}
              style={{ width: `${Math.min(tech.rsi.value, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-0.5">
            <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
          </div>
        </div>

        {/* MACD */}
        <MetricRow
          label="MACD"
          value={
            <span className={tech.macd.histogram > 0 ? 'text-emerald-400' : 'text-red-400'}>
              {tech.macd.histogram > 0 ? '+' : ''}{tech.macd.histogram.toFixed(4)}
            </span>
          }
          sub={tech.macd.crossover ? <SignalBadge signal={tech.macd.crossover} /> : null}
        />
        <MetricRow label="MACD Line" value={tech.macd.macd.toFixed(4)} />
        <MetricRow label="Signal Line" value={tech.macd.signal.toFixed(4)} />

        {/* Stochastic */}
        <div className="mt-2 pt-2 border-t border-border/30">
          <MetricRow
            label="Stochastic %K / %D"
            value={`${tech.stochastic.k.toFixed(1)} / ${tech.stochastic.d.toFixed(1)}`}
            sub={<SignalBadge signal={tech.stochastic.signal} />}
          />
        </div>

        {/* ADX */}
        <MetricRow
          label="ADX (14)"
          value={tech.adx.value.toFixed(1)}
          sub={<SignalBadge signal={tech.adx.trend_strength} />}
        />

        {/* ATR */}
        <MetricRow
          label="ATR (14)"
          value={`${tech.atr.paise.toFixed(1)} paise`}
        />
      </div>

      {/* Bollinger Bands */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Bollinger Bands</h3>
        <MetricRow label="Upper" value={tech.bollinger.upper.toFixed(4)} />
        <MetricRow label="Middle" value={tech.bollinger.middle.toFixed(4)} />
        <MetricRow label="Lower" value={tech.bollinger.lower.toFixed(4)} />
        <MetricRow label="%B" value={tech.bollinger.pctB.toFixed(2)} />
        <MetricRow label="Bandwidth" value={`${tech.bollinger.bandwidth.toFixed(2)}%`} />
      </div>

      {/* Pivot Points */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Pivot Points</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Classic */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Classic</p>
            {Object.entries(tech.pivots.classic).map(([key, val]) => (
              <div key={key} className="flex justify-between py-0.5">
                <span className={cn(
                  'text-[10px]',
                  key.startsWith('r') ? 'text-red-400/70' : key.startsWith('s') ? 'text-emerald-400/70' : 'text-muted-foreground'
                )}>
                  {key.toUpperCase()}
                </span>
                <span className={cn(
                  'text-[10px] font-mono',
                  price >= val - 0.05 && price <= val + 0.05 ? 'text-amber-400 font-semibold' : ''
                )}>
                  {val.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Camarilla */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Camarilla</p>
            {Object.entries(tech.pivots.camarilla).map(([key, val]) => (
              <div key={key} className="flex justify-between py-0.5">
                <span className={cn(
                  'text-[10px]',
                  key.startsWith('r') ? 'text-red-400/70' : 'text-emerald-400/70'
                )}>
                  {key.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono">{val.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Fibonacci */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Fibonacci</p>
            {Object.entries(tech.pivots.fibonacci).map(([key, val]) => (
              <div key={key} className="flex justify-between py-0.5">
                <span className={cn(
                  'text-[10px]',
                  key.startsWith('r') ? 'text-red-400/70' : key.startsWith('s') ? 'text-emerald-400/70' : 'text-muted-foreground'
                )}>
                  {key.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono">{val.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
