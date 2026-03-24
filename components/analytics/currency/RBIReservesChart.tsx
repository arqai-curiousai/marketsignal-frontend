'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, TrendingDown, Minus, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getRBIReserves } from '@/src/lib/api/analyticsApi';
import type { IRBIReserves, IRBIReservesPoint } from '@/src/types/analytics';

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

/** Area chart for reserves time series */
function ReservesChart({ data }: { data: IRBIReservesPoint[] }) {
  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
        Insufficient data for chart
      </div>
    );
  }

  const width = 600;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 20, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const values = data.map(d => d.total_reserves);
  const min = Math.min(...values) * 0.98;
  const max = Math.max(...values) * 1.02;
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * chartW;
    const y = pad.top + (1 - (d.total_reserves - min) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

  // Y-axis labels
  const yLabels = [min, min + range * 0.5, max].map(v => ({
    value: v,
    y: pad.top + (1 - (v - min) / range) * chartH,
    label: `$${v.toFixed(0)}B`,
  }));

  // X-axis labels (every ~3 months)
  const step = Math.max(1, Math.floor(data.length / 4));
  const xLabels = data
    .filter((_, i) => i % step === 0 || i === data.length - 1)
    .map((d, origIdx) => {
      const idx = data.indexOf(d);
      const dt = new Date(d.date);
      return {
        x: pad.left + (idx / (data.length - 1)) * chartW,
        label: dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      };
    });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label="RBI reserves time series chart">
      {/* Grid lines */}
      {yLabels.map((yl, i) => (
        <g key={i}>
          <line x1={pad.left} y1={yl.y} x2={width - pad.right} y2={yl.y} stroke="rgba(255,255,255,0.04)" />
          <text x={pad.left - 4} y={yl.y + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">
            {yl.label}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((xl, i) => (
        <text key={i} x={xl.x} y={height - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">
          {xl.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#reservesGradient)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Latest point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#38BDF8" />

      <defs>
        <linearGradient id="reservesGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.2)" />
          <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Stacked composition bar */
function CompositionBar({ current }: { current: IRBIReservesPoint }) {
  const total = current.total_reserves || 1;
  const segments = [
    { label: 'FCA', value: current.fca, color: 'bg-sky-400' },
    { label: 'Gold', value: current.gold, color: 'bg-amber-400' },
    { label: 'SDR', value: current.sdr, color: 'bg-violet-400' },
    { label: 'IMF', value: current.imf_reserve_tranche, color: 'bg-emerald-400' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Composition</p>
      <div className="h-3 rounded-full overflow-hidden flex">
        {segments.map(seg => (
          <div
            key={seg.label}
            className={cn(seg.color, 'transition-all')}
            style={{ width: `${(seg.value / total) * 100}%` }}
            title={`${seg.label}: $${seg.value.toFixed(1)}B (${((seg.value / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-sm', seg.color)} />
            <span className="text-[10px] text-muted-foreground">
              {seg.label} ${seg.value.toFixed(1)}B
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TREND_CONFIG = {
  increasing: { icon: TrendingUp, text: 'Increasing', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  decreasing: { icon: TrendingDown, text: 'Decreasing', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  stable: { icon: Minus, text: 'Stable', color: 'text-white/60 bg-white/[0.06] border-white/10' },
};

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function RBIReservesChart() {
  const [data, setData] = useState<IRBIReserves | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRBIReserves(52);
      if (res.success) setData(res.data);
      else setError('Failed to load RBI reserves data');
    } catch {
      setError('Failed to load RBI reserves data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
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
        <p className="text-sm text-muted-foreground">No RBI reserves data available</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Data syncs from EODHD economic events. Check scheduler.
        </p>
      </div>
    );
  }

  const current = data.current;
  const trendConfig = data.trend ? TREND_CONFIG[data.trend] : TREND_CONFIG.stable;
  const TrendIcon = trendConfig.icon;

  return (
    <motion.div {...ANIM}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-medium">RBI Forex Reserves</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border',
              trendConfig.color
            )}>
              <TrendIcon className="h-3 w-3" />
              {trendConfig.text}
            </span>
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
            label="Total Reserves"
            value={current ? `$${current.total_reserves.toFixed(1)}B` : '—'}
            sublabel={current?.date ?? ''}
          />
          <KPICard
            label="WoW Change"
            value={current?.wow_change != null ? `${current.wow_change >= 0 ? '+' : ''}$${current.wow_change.toFixed(1)}B` : '—'}
            sublabel="Last week"
            trend={current?.wow_change != null ? (current.wow_change >= 0 ? 'up' : 'down') : undefined}
          />
          <KPICard
            label="52W Peak"
            value={data.peak ? `$${data.peak.toFixed(1)}B` : '—'}
            sublabel={`${data.weeks_analyzed}W range`}
          />
          <KPICard
            label="INR Correlation"
            value={data.usdinr_correlation != null ? `r = ${data.usdinr_correlation.toFixed(3)}` : '—'}
            sublabel="Reserves ↔ USD/INR"
          />
        </div>

        {/* Chart */}
        <ReservesChart data={data.time_series} />

        {/* Composition bar */}
        {current && <div className="mt-4"><CompositionBar current={current} /></div>}

        {/* Info */}
        <div className="flex gap-2 p-3 mt-4 rounded-lg bg-sky-500/5 border border-sky-500/10">
          <Info className="h-3.5 w-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-sky-300/70 leading-relaxed">
            RBI forex reserves are published weekly. Rising reserves signal RBI intervention to cap INR appreciation;
            declining reserves may indicate defense against depreciation.
          </p>
        </div>
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
