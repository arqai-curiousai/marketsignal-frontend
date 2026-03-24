'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Gem, TrendingUp, TrendingDown, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCommodityForexCorrelation } from '@/src/lib/api/analyticsApi';
import type { ICommodityForexCorrelation, ICommodityForexPair } from '@/src/types/analytics';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

const COMMODITY_ICONS: Record<string, typeof Gem> = {
  Gold: Gem,
  'Crude Oil': Flame,
};

const COMMODITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Gold: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  'Crude Oil': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
};

/** Correlation color */
function corrColor(r: number | null): string {
  if (r == null) return 'text-muted-foreground';
  if (r > 0.5) return 'text-sky-400';
  if (r > 0.2) return 'text-sky-300';
  if (r < -0.5) return 'text-orange-400';
  if (r < -0.2) return 'text-orange-300';
  return 'text-white/60';
}

/** Mini sparkline for rolling correlation */
function CorrelationSparkline({ series }: { series: Array<{ date: string; correlation: number }> }) {
  if (series.length < 3) return null;

  const width = 160;
  const height = 40;
  const padding = 2;

  const values = series.map(s => s.correlation);
  const min = Math.min(...values, -1);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // Zero line
  const zeroY = padding + (1 - (0 - min) / range) * (height - 2 * padding);

  return (
    <svg width={width} height={height} className="block" aria-label="Rolling correlation sparkline">
      {/* Zero line */}
      <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
      {/* Correlation line */}
      <polyline
        points={points}
        fill="none"
        stroke="rgba(56, 189, 248, 0.7)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Single commodity-forex pair card */
function PairCard({ pair }: { pair: ICommodityForexPair }) {
  const Icon = COMMODITY_ICONS[pair.commodity] ?? Gem;
  const colors = COMMODITY_COLORS[pair.commodity] ?? COMMODITY_COLORS.Gold;
  const latest = pair.price_series[pair.price_series.length - 1];
  const first = pair.price_series[0];

  const commodityChange = latest && first && first.commodity_price > 0
    ? ((latest.commodity_price - first.commodity_price) / first.commodity_price * 100)
    : 0;

  const fxChange = latest && first && first.fx_price > 0
    ? ((latest.fx_price - first.fx_price) / first.fx_price * 100)
    : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', colors.bg)}>
            <Icon className={cn('h-4 w-4', colors.text)} />
          </div>
          <div>
            <h4 className="text-sm font-medium">{pair.commodity} × {pair.fx_pair}</h4>
            <p className="text-[10px] text-muted-foreground">{pair.data_points} data points</p>
          </div>
        </div>
        {/* Correlation badge */}
        <div className={cn(
          'text-sm font-semibold font-mono tabular-nums px-2 py-0.5 rounded border',
          pair.overall_correlation > 0.3
            ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
            : pair.overall_correlation < -0.3
              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
              : 'bg-white/[0.04] border-white/10 text-white/60'
        )}>
          r = {pair.overall_correlation > 0 ? '+' : ''}{pair.overall_correlation.toFixed(3)}
        </div>
      </div>

      {/* Price changes row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">{pair.commodity}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-semibold tabular-nums">
              {latest?.commodity_price?.toLocaleString() ?? '—'}
            </span>
            {commodityChange !== 0 && (
              <span className={cn(
                'text-[10px] font-mono',
                commodityChange > 0 ? 'text-sky-400' : 'text-orange-400'
              )}>
                {commodityChange > 0 ? '+' : ''}{commodityChange.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">{pair.fx_pair}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-semibold tabular-nums">
              {latest?.fx_price?.toFixed(4) ?? '—'}
            </span>
            {fxChange !== 0 && (
              <span className={cn(
                'text-[10px] font-mono',
                fxChange > 0 ? 'text-sky-400' : 'text-orange-400'
              )}>
                {fxChange > 0 ? '+' : ''}{fxChange.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rolling correlation sparkline */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">30-day Rolling Correlation</p>
        <div className="flex items-center gap-3">
          <CorrelationSparkline series={pair.rolling_series} />
          <div className="text-right">
            <p className={cn('text-xs font-mono font-semibold tabular-nums', corrColor(pair.current_correlation))}>
              {pair.current_correlation != null
                ? `${pair.current_correlation > 0 ? '+' : ''}${pair.current_correlation.toFixed(3)}`
                : '—'}
            </p>
            <p className="text-[9px] text-muted-foreground/50">current</p>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        {pair.interpretation}
      </p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function CrossAssetPanel() {
  const [data, setData] = useState<ICommodityForexCorrelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCommodityForexCorrelation(180);
      if (res.success) setData(res.data);
      else setError('Failed to load cross-asset correlation data');
    } catch {
      setError('Failed to load cross-asset correlation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col items-center">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button onClick={fetchData} className="text-xs text-primary hover:underline flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  if (!data || data.pairs.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
        <p className="text-sm text-muted-foreground">No commodity-forex correlation data</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Requires Gold/Crude OHLCV and forex daily data in the system.
        </p>
      </div>
    );
  }

  // Separate Gold and Crude pairs
  const goldPairs = data.pairs.filter(p => p.commodity === 'Gold');
  const crudePairs = data.pairs.filter(p => p.commodity === 'Crude Oil');

  return (
    <motion.div {...ANIM}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium">Commodity × INR Cross-Asset</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{data.lookback_days}d lookback</span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1 rounded hover:bg-white/[0.06] transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Pair cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.pairs.map(pair => (
            <PairCard key={`${pair.commodity}-${pair.fx_pair}`} pair={pair} />
          ))}
        </div>

        {/* Info box */}
        <div className="flex gap-2 p-3 mt-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <Info className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-300/70 leading-relaxed">
            India imports ~85% of crude oil and is a major gold consumer. Rising crude/gold prices typically
            pressure INR. FII flows can amplify or offset these effects.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
