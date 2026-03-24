'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getINRFIICorrelation } from '@/src/lib/api/analyticsApi';
import type { IINRFIICorrelation, IINRFIICorrelationPoint } from '@/src/types/analytics';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

/** Simple inline bar chart for the dual-axis time series */
function DualAxisChart({ data }: { data: IINRFIICorrelationPoint[] }) {
  const validData = useMemo(
    () => data.filter(d => d.usdinr_close != null && d.fii_change !== 0),
    [data]
  );

  if (validData.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
        Insufficient data for chart (need 2+ quarters with FII changes)
      </div>
    );
  }

  // Scale calculations
  const fiiChanges = validData.map(d => d.fii_change);
  const usdinrCloses = validData.map(d => d.usdinr_close!);

  const fiiMax = Math.max(...fiiChanges.map(Math.abs), 0.1);
  const usdinrMin = Math.min(...usdinrCloses);
  const usdinrMax = Math.max(...usdinrCloses);
  const usdinrRange = usdinrMax - usdinrMin || 1;

  const barWidth = Math.max(12, Math.min(32, Math.floor(600 / validData.length) - 4));

  return (
    <div className="space-y-2">
      {/* Chart area */}
      <div className="relative h-52 flex items-end gap-1 px-2 overflow-x-auto">
        {/* Zero line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.06]" />

        {validData.map((d, i) => {
          const fiiBarH = Math.abs(d.fii_change) / fiiMax * 40; // max 40% of height
          const isPositive = d.fii_change >= 0;
          const usdinrY = ((d.usdinr_close! - usdinrMin) / usdinrRange) * 80 + 10; // 10-90% range

          return (
            <div
              key={d.quarter_end}
              className="flex flex-col items-center gap-0.5 relative"
              style={{ minWidth: barWidth }}
            >
              {/* USD/INR dot (line chart overlay) */}
              <div
                className="absolute w-2 h-2 rounded-full bg-amber-400 z-10"
                style={{ bottom: `${usdinrY}%` }}
              />

              {/* Connect dots with line */}
              {i > 0 && (
                <svg
                  className="absolute z-0 pointer-events-none"
                  style={{
                    left: -(barWidth + 4) / 2,
                    bottom: 0,
                    width: barWidth + 4,
                    height: '100%',
                  }}
                >
                  <line
                    x1="0"
                    y1={`${100 - (((validData[i - 1].usdinr_close! - usdinrMin) / usdinrRange) * 80 + 10)}%`}
                    x2={barWidth + 4}
                    y2={`${100 - usdinrY}%`}
                    stroke="rgba(251, 191, 36, 0.4)"
                    strokeWidth="1.5"
                  />
                </svg>
              )}

              {/* FII bar */}
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className={cn(
                    'rounded-sm transition-all',
                    isPositive ? 'bg-sky-400/60' : 'bg-orange-400/60'
                  )}
                  style={{
                    width: barWidth - 4,
                    height: `${fiiBarH}%`,
                    marginTop: isPositive ? 'auto' : undefined,
                    marginBottom: isPositive ? undefined : 'auto',
                    position: 'absolute',
                    ...(isPositive ? { bottom: '50%' } : { top: '50%' }),
                  }}
                />
              </div>

              {/* Quarter label */}
              <span className="text-[8px] text-muted-foreground/60 whitespace-nowrap mt-1">
                {formatQuarter(d.quarter_end)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-sky-400/60" />
          <span>FII% Change (QoQ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>USD/INR</span>
        </div>
      </div>
    </div>
  );
}

function formatQuarter(dateStr: string): string {
  const d = new Date(dateStr);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q}'${d.getFullYear().toString().slice(-2)}`;
}

/** Correlation badge */
function CorrelationBadge({ r }: { r: number }) {
  const absR = Math.abs(r);
  let color = 'text-white/60 bg-white/[0.06] border-white/10';
  let strength = 'Weak';

  if (absR > 0.7) {
    color = r < 0 ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    strength = 'Strong';
  } else if (absR > 0.4) {
    color = r < 0 ? 'text-sky-300 bg-sky-500/5 border-sky-500/15' : 'text-orange-300 bg-orange-500/5 border-orange-500/15';
    strength = 'Moderate';
  }

  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', color)}>
      r = {r > 0 ? '+' : ''}{r.toFixed(3)} ({strength} {r < 0 ? 'Inverse' : 'Positive'})
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function FIIFlowPanel() {
  const [data, setData] = useState<IINRFIICorrelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getINRFIICorrelation(12);
      if (res.success) setData(res.data);
      else setError('Failed to load FII flow data');
    } catch {
      setError('Failed to load FII flow data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return <Skeleton className="h-80 w-full rounded-xl" />;
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

  if (!data || data.time_series.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
        <p className="text-sm text-muted-foreground">No FII flow data available</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Shareholding pattern data needs to be synced from BSE/NSE filings.
        </p>
      </div>
    );
  }

  const current = data.current;
  const latestFiiChange = current?.fii_change ?? 0;
  const isFiiIncreasing = latestFiiChange > 0;

  return (
    <motion.div {...ANIM}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-medium">FII Flow × USD/INR</h3>
          </div>
          <div className="flex items-center gap-2">
            {data.correlation != null && <CorrelationBadge r={data.correlation} />}
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

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <KPICard
            label="FII Avg %"
            value={`${current?.fii_pct_avg?.toFixed(1) ?? '—'}%`}
            sublabel={`${data.quarters_analyzed}Q avg`}
          />
          <KPICard
            label="Latest FII Change"
            value={`${latestFiiChange >= 0 ? '+' : ''}${latestFiiChange.toFixed(2)}%`}
            sublabel={current?.quarter_end ? formatQuarter(current.quarter_end) : '—'}
            trend={isFiiIncreasing ? 'up' : 'down'}
          />
          <KPICard
            label="USD/INR"
            value={current?.usdinr_close?.toFixed(2) ?? '—'}
            sublabel={`${current?.usdinr_change_pct ? (current.usdinr_change_pct >= 0 ? '+' : '') + current.usdinr_change_pct.toFixed(1) + '%' : '—'} QoQ`}
          />
          <KPICard
            label="Stocks Tracked"
            value={current?.stock_count?.toString() ?? '—'}
            sublabel="NIFTY 50 coverage"
          />
        </div>

        {/* Chart */}
        <DualAxisChart data={data.time_series} />

        {/* Interpretation */}
        {data.interpretation && (
          <div className="flex gap-2 p-3 mt-4 rounded-lg bg-sky-500/5 border border-sky-500/10">
            <Info className="h-3.5 w-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-sky-300/70 leading-relaxed">
              {data.interpretation}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function KPICard({
  label,
  value,
  sublabel,
  trend,
}: {
  label: string;
  value: string;
  sublabel: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1">
        {trend === 'up' && <TrendingUp className="h-3 w-3 text-sky-400" />}
        {trend === 'down' && <TrendingDown className="h-3 w-3 text-orange-400" />}
        <p className={cn(
          'text-sm font-semibold font-mono tabular-nums',
          trend === 'up' ? 'text-sky-400' : trend === 'down' ? 'text-orange-400' : 'text-foreground'
        )}>
          {value}
        </p>
      </div>
      <p className="text-[9px] text-muted-foreground/50 mt-0.5">{sublabel}</p>
    </div>
  );
}
