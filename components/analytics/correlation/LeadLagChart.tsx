'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { getLeadLag } from '@/src/lib/api/analyticsApi';
import type { ILeadLag } from '@/types/analytics';
import { corrColor } from './constants';
import { cn } from '@/lib/utils';

interface LeadLagChartProps {
  tickerA: string;
  tickerB: string;
  exchangeA?: string;
  exchangeB?: string;
  height?: number;
}

export function LeadLagChart({
  tickerA,
  tickerB,
  exchangeA = 'NSE',
  exchangeB = 'NSE',
  height = 200,
}: LeadLagChartProps) {
  const [data, setData] = useState<ILeadLag | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    getLeadLag(tickerA, tickerB, exchangeA, exchangeB).then((result) => {
      if (cancelled) return;
      if (result.success && result.data && !('error' in result.data)) {
        setData(result.data);
        setFetchError(null);
      } else {
        setData(null);
        setFetchError(!result.success ? (result.error.status === 422 ? 'Insufficient data for this pair' : 'Failed to load') : null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tickerA, tickerB, exchangeA, exchangeB]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400/70" style={{ height }}>
        <AlertTriangle className="h-3.5 w-3.5" />
        {fetchError}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        No lead-lag data available
      </div>
    );
  }

  const chartData = data.lags.map((lag, i) => ({
    lag,
    correlation: data.correlations[i],
    label: lag > 0
      ? `${tickerA} leads ${lag}d`
      : lag < 0
        ? `${tickerB} leads ${Math.abs(lag)}d`
        : 'Same day',
    isPeak: lag === data.peak_lag,
  }));

  const hasLeadLag = data.peak_lag !== 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Lead-Lag Analysis
        </h4>
        {hasLeadLag && (
          <span className="text-[9px] text-brand-blue flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Peak at lag {data.peak_lag > 0 ? '+' : ''}{data.peak_lag}
          </span>
        )}
      </div>

      <div role="img" aria-label={`Lead-lag analysis for ${tickerA} vs ${tickerB}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 20, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

          <XAxis
            dataKey="lag"
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            label={{
              value: `← ${tickerB} leads | ${tickerA} leads →`,
              position: 'bottom',
              offset: 5,
              style: { fontSize: 8, fill: '#6B7280' },
            }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            domain={[-1, 1]}
            ticks={[-0.5, 0, 0.5]}
          />

          <ReferenceLine x={0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="4 4" />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'white',
            }}
            formatter={(value: number | string | Array<number | string>) => {
              const num = typeof value === 'number' ? value : Number(value);
              return [isNaN(num) ? 'N/A' : num.toFixed(4), 'Correlation'];
            }}
            labelFormatter={(lag) => {
              const l = Number(lag);
              if (l > 0) return `${tickerA} leads by ${l} day${l > 1 ? 's' : ''}`;
              if (l < 0) return `${tickerB} leads by ${Math.abs(l)} day${Math.abs(l) > 1 ? 's' : ''}`;
              return 'Same day (lag 0)';
            }}
          />

          <Bar dataKey="correlation" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={corrColor(entry.correlation)}
                fillOpacity={entry.isPeak ? 1 : 0.6}
                stroke={entry.isPeak ? '#fff' : 'none'}
                strokeWidth={entry.isPeak ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>

      {/* Interpretation */}
      <div className={cn(
        'text-[10px] px-3 py-2 rounded-lg',
        hasLeadLag
          ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
          : 'bg-white/5 text-muted-foreground',
      )}>
        {data.lead_lag_interpretation}
        {hasLeadLag && (
          <span className="font-mono ml-1">
            (r={data.peak_correlation >= 0 ? '+' : ''}{data.peak_correlation.toFixed(3)})
          </span>
        )}
      </div>
    </div>
  );
}
