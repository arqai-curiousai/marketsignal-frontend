'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCotDashboard } from '@/src/lib/api/analyticsApi';
import type { ICotDashboard, ICotCurrencyData } from '@/src/types/analytics';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

const SIGNAL_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  extreme_long: { label: 'Extreme Long', color: 'text-sky-400', bgColor: 'bg-sky-500/10 border-sky-500/20' },
  bullish: { label: 'Bullish', color: 'text-sky-300', bgColor: 'bg-sky-500/5 border-sky-500/15' },
  neutral: { label: 'Neutral', color: 'text-white/60', bgColor: 'bg-white/[0.04] border-white/10' },
  bearish: { label: 'Bearish', color: 'text-orange-300', bgColor: 'bg-orange-500/5 border-orange-500/15' },
  extreme_short: { label: 'Extreme Short', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' },
};

/** Net positioning bar (horizontal diverging bar) */
function NetBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? Math.abs(value) / maxAbs * 50 : 0;
  const isPositive = value >= 0;

  return (
    <div className="flex items-center gap-1 h-4">
      {/* Negative side */}
      <div className="flex-1 flex justify-end">
        {!isPositive && (
          <div
            className="h-3 rounded-l bg-orange-400/60"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {/* Center line */}
      <div className="w-px h-full bg-white/10" />
      {/* Positive side */}
      <div className="flex-1">
        {isPositive && (
          <div
            className="h-3 rounded-r bg-sky-400/60"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

/** COT Index gauge (0-100 horizontal) */
function CotIndexGauge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[10px] text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden relative">
        {/* Zones: 0-15 extreme short, 15-35 bearish, 35-65 neutral, 65-85 bullish, 85-100 extreme long */}
        <div className="absolute inset-0 flex">
          <div className="w-[15%] bg-orange-500/20" />
          <div className="w-[20%] bg-orange-500/10" />
          <div className="w-[30%] bg-white/[0.02]" />
          <div className="w-[20%] bg-sky-500/10" />
          <div className="w-[15%] bg-sky-500/20" />
        </div>
        {/* Marker */}
        <div
          className="absolute top-0 h-full w-1 rounded-full bg-white shadow-sm"
          style={{ left: `${value}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <span className="text-[10px] font-mono font-medium tabular-nums w-8 text-right">
        {value.toFixed(0)}
      </span>
    </div>
  );
}

/** Mini net position sparkline */
function NetSparkline({ series }: { series: Array<{ spec_net: number }> }) {
  if (series.length < 3) return null;

  const width = 80;
  const height = 24;
  const values = series.map(s => s.spec_net);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Zero line position
  const zeroY = (1 - (0 - min) / range) * height;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = (1 - (v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="block">
      <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="rgba(255,255,255,0.06)" />
      <polyline points={points} fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

/** Currency positioning row */
function CurrencyRow({ data, maxNetAbs }: { data: ICotCurrencyData; maxNetAbs: number }) {
  const signal = SIGNAL_CONFIG[data.signal] ?? SIGNAL_CONFIG.neutral;

  return (
    <div className="grid grid-cols-[60px_1fr_80px_100px_60px_60px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
      {/* Currency */}
      <span className="text-xs font-semibold font-mono">{data.currency}</span>

      {/* Net bar */}
      <NetBar value={data.spec_net} maxAbs={maxNetAbs} />

      {/* Sparkline */}
      <NetSparkline series={data.time_series} />

      {/* COT Index */}
      <CotIndexGauge value={data.cot_index} />

      {/* WoW change */}
      <span className={cn(
        'text-[10px] font-mono tabular-nums text-right',
        data.wow_change != null
          ? data.wow_change > 0
            ? 'text-sky-400'
            : data.wow_change < 0
              ? 'text-orange-400'
              : 'text-muted-foreground'
          : 'text-muted-foreground'
      )}>
        {data.wow_change != null
          ? `${data.wow_change > 0 ? '+' : ''}${(data.wow_change / 1000).toFixed(1)}K`
          : '—'}
      </span>

      {/* Signal */}
      <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded border text-center', signal.bgColor, signal.color)}>
        {signal.label.split(' ').pop()}
      </span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function CotDashboard() {
  const [data, setData] = useState<ICotDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCotDashboard(52);
      if (res.success) setData(res.data);
      else setError('Failed to load COT positioning data');
    } catch {
      setError('Failed to load COT positioning data');
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

  if (!data || data.currencies.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
        <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No COT positioning data available</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          CFTC Commitment of Traders data needs to be synced. Weekly updates every Friday.
        </p>
      </div>
    );
  }

  // Max absolute net for bar scaling
  const maxNetAbs = Math.max(
    ...data.currencies.map(c => Math.abs(c.spec_net)),
    1
  );

  return (
    <motion.div {...ANIM}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-medium">COT Positioning</h3>
            <span className="text-[10px] text-muted-foreground">CFTC Weekly</span>
          </div>
          <div className="flex items-center gap-2">
            {data.extremes.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {data.extremes.length} extreme
              </span>
            )}
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

        {/* Column headers */}
        <div className="grid grid-cols-[60px_1fr_80px_100px_60px_60px] gap-2 px-3 py-1.5 text-[9px] text-muted-foreground uppercase tracking-wider">
          <span>CCY</span>
          <span className="text-center">Net Position</span>
          <span className="text-center">Trend</span>
          <span className="text-center">COT Index</span>
          <span className="text-right">WoW</span>
          <span className="text-center">Signal</span>
        </div>

        {/* Rows */}
        <div className="space-y-0.5">
          {data.currencies.map(ccy => (
            <CurrencyRow key={ccy.currency} data={ccy} maxNetAbs={maxNetAbs} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-3 h-2 rounded-sm bg-sky-400/60" />
            <span>Long</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-3 h-2 rounded-sm bg-orange-400/60" />
            <span>Short</span>
          </div>
          <div className="text-[10px] text-muted-foreground/50">
            Non-commercial (speculative) positions
          </div>
        </div>

        {/* Info */}
        <div className="flex gap-2 p-3 mt-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
          <Info className="h-3.5 w-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-violet-300/70 leading-relaxed">
            COT Index &gt;85 = crowded long (contrarian bearish). COT Index &lt;15 = crowded short (contrarian bullish).
            Speculative positioning extremes often precede major reversals.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
