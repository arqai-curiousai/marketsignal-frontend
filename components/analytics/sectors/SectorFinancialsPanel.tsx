'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getSectorFinancials } from '@/src/lib/api/analyticsApi';
import type { ISectorFinancials } from '@/types/analytics';

interface SectorFinancialsPanelProps {
  sector: string;
  exchange: string;
}

const COLORS = {
  revenue: '#4ADE80',
  ebitda: '#34D399',
  pat: '#FBBF24',
} as const;

/**
 * Format large numbers into compact Indian notation (Cr / L Cr).
 */
function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}L Cr`;
  if (abs >= 1e9) return `${(value / 1e7 / 100).toFixed(0)} Cr`;
  if (abs >= 1e7) return `${(value / 1e7).toFixed(1)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(1)} L`;
  return value.toLocaleString('en-IN');
}

function SkeletonChart() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-[200px] w-full rounded-lg bg-white/[0.04]" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white/[0.04] h-10" />
        ))}
      </div>
    </div>
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
            {formatCompact(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function YoYBadge({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-[9px] text-muted-foreground">--</span>;
  }
  const isPositive = value > 0;
  return (
    <span
      className={cn(
        'text-[9px] font-semibold tabular-nums',
        isPositive ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-muted-foreground',
      )}
    >
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

export function SectorFinancialsPanel({ sector, exchange }: SectorFinancialsPanelProps) {
  const [data, setData] = useState<ISectorFinancials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sector) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSectorFinancials(sector, undefined, exchange)
      .then((r) => {
        if (cancelled) return;
        if (r.success && r.data) {
          setData(r.data);
        } else {
          setError('Financial data unavailable');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load financial data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sector, exchange]);

  if (loading) {
    return <SkeletonChart />;
  }

  if (error || !data || data.quarters.length === 0) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-3">
        {error ?? 'No financial data'}
      </div>
    );
  }

  const chartData = data.quarters.map((q) => ({
    label: q.label,
    Revenue: q.revenue,
    EBITDA: q.ebitda,
    PAT: q.pat,
    revenue_yoy: q.revenue_yoy,
    ebitda_yoy: q.ebitda_yoy,
    pat_yoy: q.pat_yoy,
  }));

  // Latest quarter for summary
  const latest = data.quarters[data.quarters.length - 1];

  return (
    <div className="space-y-3">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Revenue', value: latest.revenue, yoy: latest.revenue_yoy, color: COLORS.revenue },
          { label: 'EBITDA', value: latest.ebitda, yoy: latest.ebitda_yoy, color: COLORS.ebitda },
          { label: 'PAT', value: latest.pat, yoy: latest.pat_yoy, color: COLORS.pat },
        ].map(({ label, value, yoy, color }) => (
          <div
            key={label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center"
          >
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">
              {label}
            </div>
            <div
              className="text-xs font-semibold tabular-nums"
              style={{ color }}
            >
              {formatCompact(value)}
            </div>
            <div className="mt-0.5">
              <YoYBadge value={yoy} />
              {yoy != null && (
                <span className="text-[8px] text-muted-foreground ml-0.5">YoY</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grouped Bar Chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 9, color: '#94A3B8' }}
              iconSize={8}
            />
            <Bar dataKey="Revenue" fill={COLORS.revenue} radius={[2, 2, 0, 0]} barSize={14} />
            <Bar dataKey="EBITDA" fill={COLORS.ebitda} radius={[2, 2, 0, 0]} barSize={14} />
            <Bar dataKey="PAT" fill={COLORS.pat} radius={[2, 2, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* YoY growth table */}
      {data.quarters.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">
            YoY Growth
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-1 text-[9px] text-muted-foreground px-1">
              <span>Quarter</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">EBITDA</span>
              <span className="text-right">PAT</span>
            </div>
            {data.quarters.map((q) => (
              <div
                key={q.label}
                className="grid grid-cols-4 gap-1 px-1 py-0.5 rounded-md hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-[10px] font-medium text-white">{q.label}</span>
                <span className="text-right"><YoYBadge value={q.revenue_yoy} /></span>
                <span className="text-right"><YoYBadge value={q.ebitda_yoy} /></span>
                <span className="text-right"><YoYBadge value={q.pat_yoy} /></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
