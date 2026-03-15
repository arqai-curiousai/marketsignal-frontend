'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFnOTermStructure } from '@/src/lib/api/analyticsApi';
import type { IIVTermStructure } from '@/types/analytics';
import { T, S, C, TOOLTIP_STYLE, AXIS_STYLE } from './tokens';

interface Props {
  underlying: string;
}


function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ─── Stat Badge ────────────────────────────────────────────────────────

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'red' | 'amber' | 'muted';
}) {
  const colorClasses = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    muted: 'text-muted-foreground',
  };

  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', colorClasses[color])}>{value}</span>
    </div>
  );
}

// ─── IV Context Color ──────────────────────────────────────────────────

function getIVContextColor(
  current: number | null,
  p25: number,
  p75: number,
): 'green' | 'red' | 'amber' {
  if (current == null) return 'amber';
  if (current < p25) return 'green';
  if (current > p75) return 'red';
  return 'amber';
}

function getIVLabel(
  current: number | null,
  p25: number,
  p75: number,
  p10: number,
  p90: number,
): string {
  if (current == null) return 'N/A';
  if (current < p10) return 'Very Cheap';
  if (current < p25) return 'Cheap';
  if (current > p90) return 'Very Expensive';
  if (current > p75) return 'Expensive';
  return 'Fair';
}

// ─── Custom Tooltip ────────────────────────────────────────────────────

interface ConePayload {
  date: string;
  iv: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

function ConeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ConePayload }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={TOOLTIP_STYLE}
      className="px-3 py-2 space-y-0.5"
    >
      <p className="text-[10px] text-muted-foreground">{d.date}</p>
      <p className="text-[11px]">
        IV: <span className="font-semibold text-blue-400">{d.iv?.toFixed(1)}%</span>
      </p>
      <p className="text-[10px] text-muted-foreground">
        P10: {d.p10?.toFixed(1)}% | P25: {d.p25?.toFixed(1)}% | Med: {d.median?.toFixed(1)}% | P75: {d.p75?.toFixed(1)}% | P90: {d.p90?.toFixed(1)}%
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function VolatilityCone({ underlying }: Props) {
  const [data, setData] = useState<IIVTermStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await getFnOTermStructure(underlying);
        if (cancelled) return;
        if (result.success && result.data) {
          if (result.data.error) {
            setError(result.data.error);
          } else {
            setData(result.data);
          }
        } else {
          setError(!result.success ? result.error.message : 'Failed to load IV data');
        }
      } catch {
        if (!cancelled) setError('Failed to fetch IV term structure.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [underlying]);

  // Build chart data: IV history with static percentile band lines
  const chartData = useMemo(() => {
    if (!data?.volatility_cone?.history?.length) return [];
    const cone = data.volatility_cone;
    return cone.history.map((h) => ({
      date: formatDate(h.date),
      iv: h.iv,
      p10: cone.p10,
      p25: cone.p25,
      median: cone.median,
      p75: cone.p75,
      p90: cone.p90,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        {error || 'No IV data available.'}
      </div>
    );
  }

  const cone = data.volatility_cone;

  // No cone data — show minimal term structure info
  if (!cone) {
    const ts = data.term_structure[0];
    return (
      <div className={cn(S.card, 'p-4')}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className={cn('h-3.5 w-3.5', C.call.text)} />
          <h4 className={cn(T.mono, 'text-muted-foreground')}>
            IV Term Structure
          </h4>
        </div>
        <div className="text-center py-6">
          {ts && ts.atm_iv != null ? (
            <div>
              <p className="text-sm text-muted-foreground">Current ATM IV</p>
              <p className="text-2xl font-bold text-blue-400">{ts.atm_iv.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expiry: {ts.expiry} ({ts.days_to_expiry}d)
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Insufficient historical data for volatility cone (need 20+ days).
            </p>
          )}
        </div>
      </div>
    );
  }

  const ivColor = getIVContextColor(cone.current, cone.p25, cone.p75);
  const ivLabel = getIVLabel(cone.current, cone.p25, cone.p75, cone.p10, cone.p90);

  return (
    <div className={cn(S.card, 'p-4 space-y-4')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={cn('h-3.5 w-3.5', C.call.text)} />
          <h4 className={cn(T.mono, 'text-muted-foreground')}>
            Volatility Cone
          </h4>
        </div>
        <span
          className={cn(
            T.badge, 'px-2 py-0.5 rounded-full',
            ivColor === 'green' && cn(C.bullish.bg, C.bullish.text),
            ivColor === 'red' && cn(C.bearish.bg, C.bearish.text),
            ivColor === 'amber' && cn(C.neutral.bg, C.neutral.text),
          )}
        >
          {ivLabel}
        </span>
      </div>

      {/* IV History Chart with Percentile Bands */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {/* P10-P90 band (lightest) */}
              <linearGradient id="ivBandOuter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.02} />
              </linearGradient>
              {/* P25-P75 band (medium) */}
              <linearGradient id="ivBandInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={AXIS_STYLE} interval="preserveStartEnd" />
            <YAxis
              tick={AXIS_STYLE}
              width={45}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            />
            <Tooltip content={<ConeTooltip />} />

            {/* P10-P90 outer band */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="none"
              fill="url(#ivBandOuter)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="p10"
              stroke="none"
              fill="white"
              fillOpacity={0}
              isAnimationActive={false}
            />

            {/* P25-P75 inner band */}
            <Area
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill="url(#ivBandInner)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="p25"
              stroke="none"
              fill="white"
              fillOpacity={0}
              isAnimationActive={false}
            />

            {/* Median reference line */}
            <ReferenceLine
              y={cone.median}
              stroke="#9CA3AF"
              strokeDasharray="4 4"
              strokeWidth={1}
            />

            {/* P10 & P90 reference lines */}
            <ReferenceLine
              y={cone.p10}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="2 4"
            />
            <ReferenceLine
              y={cone.p90}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="2 4"
            />

            {/* Current IV line */}
            <Line
              type="monotone"
              dataKey="iv"
              stroke="#4ADE80"
              strokeWidth={1.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Stat badges */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <StatBadge
          label="Current"
          value={cone.current != null ? `${cone.current.toFixed(1)}%` : 'N/A'}
          color={ivColor}
        />
        <StatBadge
          label="Median"
          value={`${cone.median.toFixed(1)}%`}
          color="muted"
        />
        <StatBadge
          label="P25"
          value={`${cone.p25.toFixed(1)}%`}
          color="muted"
        />
        <StatBadge
          label="P75"
          value={`${cone.p75.toFixed(1)}%`}
          color="muted"
        />
        <StatBadge
          label="P10"
          value={`${cone.p10.toFixed(1)}%`}
          color="muted"
        />
        <StatBadge
          label="P90"
          value={`${cone.p90.toFixed(1)}%`}
          color="muted"
        />
      </div>
    </div>
  );
}
