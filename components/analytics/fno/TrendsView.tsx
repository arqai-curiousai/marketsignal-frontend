'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFnOHistory } from '@/src/lib/api/analyticsApi';
import type { IFnOHistory } from '@/types/analytics';
import { T, S, L, TOOLTIP_STYLE, AXIS_STYLE } from './tokens';

interface Props {
  underlying: string;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ─── Panel wrapper ──────────────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn(S.card, 'p-4')}>
      <h4 className={cn(T.mono, 'text-muted-foreground mb-3')}>{title}</h4>
      <div className={L.chartSm}>
        {children}
      </div>
    </div>
  );
}

// ─── Chart panels ───────────────────────────────────────────────────────

function PCRTrendPanel({ data }: { data: IFnOHistory[] }) {
  const chartData = useMemo(
    () => data.map((d) => ({ date: formatDate(d.timestamp), pcr_oi: d.pcr_oi })),
    [data],
  );

  return (
    <Panel title="PCR Trend (OI)">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="date" tick={AXIS_STYLE as Record<string, unknown>} interval="preserveStartEnd" />
          <YAxis tick={AXIS_STYLE as Record<string, unknown>} width={40} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE as React.CSSProperties}
            formatter={(value: number) => [value?.toFixed(3) ?? 'N/A', 'PCR (OI)']}
          />
          <ReferenceLine y={0.7} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <ReferenceLine y={1.3} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="pcr_oi"
            stroke="#4ADE80"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function ATMIVPanel({ data }: { data: IFnOHistory[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: formatDate(d.timestamp),
        atm_iv: d.atm_iv != null ? d.atm_iv * 100 : null,
      })),
    [data],
  );

  return (
    <Panel title="ATM IV + IV Rank">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="date" tick={AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis
            tick={AXIS_STYLE}
            width={45}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE as React.CSSProperties}
            formatter={(value: number) => [value != null ? `${value.toFixed(1)}%` : 'N/A', 'ATM IV']}
          />
          <Line
            type="monotone"
            dataKey="atm_iv"
            stroke="#FBBF24"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function GEXRegimePanel({ data }: { data: IFnOHistory[] }) {
  const chartData = useMemo(
    () => data.map((d) => ({ date: formatDate(d.timestamp), net_gex: d.net_gex })),
    [data],
  );

  return (
    <Panel title="GEX Regime">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gexGradPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gexGradNeg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#F87171" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis tick={AXIS_STYLE} width={50} tickFormatter={(v: number) => {
            const abs = Math.abs(v);
            if (abs >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
            if (abs >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
            if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
            return v.toFixed(0);
          }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE as React.CSSProperties}
            formatter={(value: number) => {
              if (value == null) return ['N/A', 'Net GEX'];
              const abs = Math.abs(value);
              const fmt = abs >= 1e7 ? `${(value / 1e7).toFixed(2)}Cr` : abs >= 1e5 ? `${(value / 1e5).toFixed(1)}L` : value.toFixed(0);
              return [fmt, 'Net GEX'];
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="net_gex"
            stroke="#34D399"
            strokeWidth={1.5}
            fill="url(#gexGradPos)"
            connectNulls
            baseValue={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function WallMigrationPanel({ data }: { data: IFnOHistory[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: formatDate(d.timestamp),
        call_wall: d.call_wall_strike,
        put_wall: d.put_wall_strike,
        spot: d.underlying_price,
      })),
    [data],
  );

  return (
    <Panel title="Wall Migration">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="date" tick={AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis
            tick={AXIS_STYLE}
            width={50}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString())}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE as React.CSSProperties}
            formatter={(value: number, name: string) => {
              const label =
                name === 'call_wall'
                  ? 'Call Wall'
                  : name === 'put_wall'
                    ? 'Put Wall'
                    : 'Spot';
              return [value != null ? value.toLocaleString('en-IN') : 'N/A', label];
            }}
          />
          <Line
            type="monotone"
            dataKey="call_wall"
            stroke="#4ADE80"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="put_wall"
            stroke="#34D399"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="spot"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function FuturesBasisPanel({ data }: { data: IFnOHistory[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: formatDate(d.timestamp),
        basis_pct: d.futures_basis_pct,
      })),
    [data],
  );

  return (
    <Panel title="Futures Basis (%)">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="basisGradPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="basisGradNeg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#F87171" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis
            tick={AXIS_STYLE}
            width={45}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v.toFixed(2)}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE as React.CSSProperties}
            formatter={(value: number) => [
              value != null ? `${value.toFixed(3)}%` : 'N/A',
              'Basis %',
            ]}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="basis_pct"
            stroke="#34D399"
            strokeWidth={1.5}
            fill="url(#basisGradPos)"
            connectNulls
            baseValue={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function OIConcentrationPanel({ data }: { data: IFnOHistory[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: formatDate(d.timestamp),
        ce_oi: d.total_ce_oi != null ? d.total_ce_oi / 100000 : null,
        pe_oi: d.total_pe_oi != null ? d.total_pe_oi / 100000 : null,
      })),
    [data],
  );

  return (
    <Panel title="OI Concentration (CE vs PE)">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="ceOiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="peOiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FB7185" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis
            tick={AXIS_STYLE}
            width={50}
            tickFormatter={(v: number) => `${v.toFixed(0)}L`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE as React.CSSProperties}
            formatter={(value: number, name: string) => {
              const label = name === 'ce_oi' ? 'CE OI' : 'PE OI';
              return [value != null ? `${value.toFixed(1)}L` : 'N/A', label];
            }}
          />
          <Area
            type="monotone"
            dataKey="ce_oi"
            stroke="#4ADE80"
            strokeWidth={1.5}
            fill="url(#ceOiGrad)"
            stackId="oi"
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="pe_oi"
            stroke="#FB7185"
            strokeWidth={1.5}
            fill="url(#peOiGrad)"
            stackId="oi"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

// ─── Main TrendsView ────────────────────────────────────────────────────

export function TrendsView({ underlying }: Props) {
  const [history, setHistory] = useState<IFnOHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await getFnOHistory(underlying, 30);
        if (cancelled) return;
        if (result.success && result.data) {
          setHistory(result.data.items ?? []);
        } else {
          setError(!result.success ? result.error.message : 'Failed to load history');
        }
      } catch {
        if (!cancelled) setError('Failed to fetch F&O history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [underlying]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">{error}</div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No F&O history available for {underlying}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PCRTrendPanel data={history} />
      <ATMIVPanel data={history} />
      <GEXRegimePanel data={history} />
      <WallMigrationPanel data={history} />
      <FuturesBasisPanel data={history} />
      <OIConcentrationPanel data={history} />
    </div>
  );
}
