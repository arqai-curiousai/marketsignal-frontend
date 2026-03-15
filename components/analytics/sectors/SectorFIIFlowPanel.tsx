'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getSectorFIIFlow } from '@/src/lib/api/analyticsApi';
import type { ISectorFIIFlow } from '@/types/analytics';

interface SectorFIIFlowPanelProps {
  sector: string;
}

const COLORS = {
  fii: '#4ADE80',
  dii: '#34D399',
  promoter: '#FBBF24',
  retail: '#A78BFA',
} as const;

/**
 * Format a quarter_end date like "2026-03-31" into Indian fiscal-year notation "Q4'26".
 * Indian fiscal year: Q4 ends Mar, Q1 ends Jun, Q2 ends Sep, Q3 ends Dec.
 */
function formatQuarter(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const q = month <= 3 ? 4 : month <= 6 ? 1 : month <= 9 ? 2 : 3;
  const fy = month <= 3 ? d.getFullYear() : d.getFullYear() + 1;
  return `Q${q}'${String(fy).slice(-2)}`;
}

function SkeletonChart() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-[200px] w-full rounded-lg bg-white/[0.04]" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white/[0.04] h-14" />
        ))}
      </div>
    </div>
  );
}

function ChangeBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className={cn(
          'text-xs font-semibold tabular-nums',
          isNeutral
            ? 'text-muted-foreground'
            : isPositive
              ? 'text-emerald-400'
              : 'text-red-400',
        )}
      >
        {isPositive ? '+' : ''}
        {value.toFixed(2)}%
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: ISectorFIIFlow['fii_trend'] }) {
  const config = {
    increasing: {
      icon: TrendingUp,
      label: 'FII Increasing',
      className: 'bg-emerald-500/10 text-emerald-400',
    },
    decreasing: {
      icon: TrendingDown,
      label: 'FII Decreasing',
      className: 'bg-red-500/10 text-red-400',
    },
    stable: {
      icon: Minus,
      label: 'FII Stable',
      className: 'bg-white/[0.06] text-muted-foreground',
    },
  } as const;

  const { icon: Icon, label, className } = config[trend];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/95 backdrop-blur-sm p-2 shadow-xl">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-[10px]">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono tabular-nums text-white">
            {entry.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function SectorFIIFlowPanel({ sector }: SectorFIIFlowPanelProps) {
  const [data, setData] = useState<ISectorFIIFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sector) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSectorFIIFlow(sector)
      .then((r) => {
        if (cancelled) return;
        if (r.success && r.data) {
          setData(r.data);
        } else {
          setError('FII flow data unavailable');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load FII flow data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sector]);

  if (loading) {
    return <SkeletonChart />;
  }

  if (error || !data) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-3">
        {error ?? 'No FII flow data'}
      </div>
    );
  }

  const chartData = data.quarters.map((q) => ({
    quarter: formatQuarter(q.quarter_end),
    FII: q.fii_pct,
    DII: q.dii_pct,
    Promoter: q.promoter_pct,
    Retail: q.retail_pct,
  }));

  return (
    <div className="space-y-3">
      {/* Trend badge */}
      <div className="flex items-center justify-between">
        <TrendBadge trend={data.fii_trend} />
        <div className="text-[9px] text-muted-foreground tabular-nums">
          {data.quarters.length} quarters
        </div>
      </div>

      {/* Area chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradFII" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.fii} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.fii} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradDII" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.dii} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.dii} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradPromoter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.promoter} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.promoter} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradRetail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.retail} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.retail} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="Promoter"
              stackId="1"
              stroke={COLORS.promoter}
              strokeWidth={1.5}
              fill="url(#gradPromoter)"
            />
            <Area
              type="monotone"
              dataKey="FII"
              stackId="1"
              stroke={COLORS.fii}
              strokeWidth={1.5}
              fill="url(#gradFII)"
            />
            <Area
              type="monotone"
              dataKey="DII"
              stackId="1"
              stroke={COLORS.dii}
              strokeWidth={1.5}
              fill="url(#gradDII)"
            />
            <Area
              type="monotone"
              dataKey="Retail"
              stackId="1"
              stroke={COLORS.retail}
              strokeWidth={1.5}
              fill="url(#gradRetail)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1.5">
          {[
            { label: 'FII', color: COLORS.fii },
            { label: 'DII', color: COLORS.dii },
            { label: 'Promoter', color: COLORS.promoter },
            { label: 'Retail', color: COLORS.retail },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current ownership badges with QoQ change */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            FII
          </div>
          <div className="text-sm font-semibold tabular-nums" style={{ color: COLORS.fii }}>
            {data.current.fii_pct.toFixed(1)}%
          </div>
          <ChangeBadge value={data.qoq_change.fii_change} label="QoQ" />
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            DII
          </div>
          <div className="text-sm font-semibold tabular-nums" style={{ color: COLORS.dii }}>
            {data.current.dii_pct.toFixed(1)}%
          </div>
          <ChangeBadge value={data.qoq_change.dii_change} label="QoQ" />
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            Promoter
          </div>
          <div className="text-sm font-semibold tabular-nums" style={{ color: COLORS.promoter }}>
            {data.current.promoter_pct.toFixed(1)}%
          </div>
          <ChangeBadge value={data.qoq_change.promoter_change} label="QoQ" />
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            Retail
          </div>
          <div className="text-sm font-semibold tabular-nums" style={{ color: COLORS.retail }}>
            {data.current.retail_pct.toFixed(1)}%
          </div>
          <ChangeBadge value={data.qoq_change.retail_change} label="QoQ" />
        </div>
      </div>

      {/* Stock breakdown */}
      {data.stock_breakdown.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">
            Stock Breakdown
          </div>
          <div className="space-y-1">
            {data.stock_breakdown.slice(0, 5).map((stock) => (
              <div
                key={stock.ticker}
                className="flex items-center justify-between px-1.5 py-1 rounded-md hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-[10px] font-medium text-white">
                  {stock.ticker}
                </span>
                <div className="flex items-center gap-3 text-[10px] tabular-nums">
                  <span style={{ color: COLORS.fii }}>
                    FII {stock.fii_pct.toFixed(1)}%
                  </span>
                  <span style={{ color: COLORS.dii }}>
                    DII {stock.dii_pct.toFixed(1)}%
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      stock.fii_change > 0
                        ? 'text-emerald-400'
                        : stock.fii_change < 0
                          ? 'text-red-400'
                          : 'text-muted-foreground',
                    )}
                  >
                    {stock.fii_change > 0 ? '+' : ''}
                    {stock.fii_change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
