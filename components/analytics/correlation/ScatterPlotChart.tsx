'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getScatterData } from '@/src/lib/api/analyticsApi';
import type { IScatterData } from '@/types/analytics';
import { corrColor } from './constants';

interface ScatterPlotChartProps {
  tickerA: string;
  tickerB: string;
  exchangeA?: string;
  exchangeB?: string;
  windowDays?: number;
  height?: number;
}

export function ScatterPlotChart({
  tickerA,
  tickerB,
  exchangeA = 'NSE',
  exchangeB = 'NSE',
  windowDays = 90,
  height = 280,
}: ScatterPlotChartProps) {
  const [data, setData] = useState<IScatterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    getScatterData(tickerA, tickerB, exchangeA, exchangeB, windowDays).then((result) => {
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
  }, [tickerA, tickerB, exchangeA, exchangeB, windowDays]);

  // Regression line endpoints
  const regressionPoints = useMemo(() => {
    if (!data) return [];
    const { slope, intercept } = data.regression_line;
    const xs = data.points.map((p) => p.return_a);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    return [
      { return_a: minX, fit: slope * minX + intercept },
      { return_a: maxX, fit: slope * maxX + intercept },
    ];
  }, [data]);

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

  if (!data || data.points.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        No scatter data available
      </div>
    );
  }

  // Merge scatter + regression line data
  const chartData = data.points.map((p, i) => ({
    return_a: p.return_a,
    return_b: p.return_b,
    date: p.date,
    // Color gradient: older → newer
    opacity: 0.3 + (i / data.points.length) * 0.7,
  }));

  const r2 = data.regression_line.r_squared;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Return Scatter Plot
        </h4>
        <span className="text-[9px] text-muted-foreground font-mono">
          R²={r2.toFixed(3)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart margin={{ top: 10, right: 15, bottom: 25, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

          <XAxis
            dataKey="return_a"
            type="number"
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            label={{
              value: `${tickerA} Return (%)`,
              position: 'bottom',
              offset: 10,
              style: { fontSize: 9, fill: '#6B7280' },
            }}
          />
          <YAxis
            dataKey="return_b"
            type="number"
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            label={{
              value: `${tickerB} Return (%)`,
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 9, fill: '#6B7280' },
            }}
          />

          {/* Quadrant reference lines */}
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/* Regression line */}
          <Line
            data={regressionPoints}
            dataKey="fit"
            type="linear"
            stroke={corrColor(data.regression_line.slope >= 0 ? r2 : -r2)}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            legendType="none"
            isAnimationActive={false}
          />

          {/* Scatter dots */}
          <Scatter
            data={chartData}
            fill="#4ADE80"
            fillOpacity={0.6}
            r={3}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'white',
            }}
            formatter={(value: number | string | Array<number | string>, name: string) => {
              const num = typeof value === 'number' ? value : Number(value);
              if (name === 'return_a') return [`${isNaN(num) ? 'N/A' : num.toFixed(3)}%`, tickerA];
              if (name === 'return_b') return [`${isNaN(num) ? 'N/A' : num.toFixed(3)}%`, tickerB];
              return [String(value), name];
            }}
            labelFormatter={() => ''}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Quadrant labels */}
      <div className="flex items-center justify-between px-4 text-[8px] text-muted-foreground/50">
        <span>Both Down ↙</span>
        <span>↗ Both Up</span>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>
          Slope: <span className="text-white font-mono">{data.regression_line.slope.toFixed(3)}</span>
        </span>
        <span>
          {data.n_observations} observations
        </span>
      </div>
    </div>
  );
}
