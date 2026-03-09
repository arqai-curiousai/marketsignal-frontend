'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getRollingCorrelation } from '@/src/lib/api/analyticsApi';
import type { IRollingCorrelation } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface RollingCorrelationChartProps {
  tickerA: string;
  tickerB: string;
  exchangeA?: string;
  exchangeB?: string;
  height?: number;
}

export function RollingCorrelationChart({
  tickerA,
  tickerB,
  exchangeA = 'NSE',
  exchangeB = 'NSE',
  height = 240,
}: RollingCorrelationChartProps) {
  const [data, setData] = useState<IRollingCorrelation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRollingCorrelation(tickerA, tickerB, exchangeA, exchangeB, 365).then((result) => {
      if (cancelled) return;
      if (result.success && result.data && !('error' in result.data)) {
        setData(result.data);
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

  if (!data) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        No rolling correlation data available
      </div>
    );
  }

  // Transform for recharts
  const chartData = data.dates.map((date, i) => ({
    date,
    dateLabel: date.slice(5), // MM-DD
    r20: data.rolling_20d[i],
    r60: data.rolling_60d[i],
    r90: data.rolling_90d[i],
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Rolling Correlation
        </h4>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1">
            <div className="w-3 h-px bg-blue-400" style={{ borderTop: '2px dashed #60A5FA' }} />
            20d
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-brand-blue rounded" />
            60d
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-purple-400/50 rounded" />
            90d
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            ticks={[-1, -0.5, 0, 0.5, 1]}
          />

          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
          <ReferenceLine y={0.6} stroke="rgba(16,185,129,0.2)" strokeDasharray="4 4" />
          <ReferenceLine y={-0.6} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" />

          {/* Regime alert reference lines */}
          {data.regime_alerts.slice(-5).map((alert, i) => (
            <ReferenceLine
              key={`alert-${i}`}
              x={alert.date.slice(5)}
              stroke={
                alert.type === 'breakdown' ? '#EF4444' :
                alert.type === 'spike' ? '#F59E0B' :
                alert.type === 'sign_flip' ? '#8B5CF6' :
                '#3B82F6'
              }
              strokeDasharray="2 2"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          ))}

          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'white',
            }}
            formatter={(value: number | string | Array<number | string>, name: string) => {
              if (value === null || value === undefined) return ['N/A', name];
              const label = name === 'r20' ? '20d' : name === 'r60' ? '60d' : '90d';
              const num = typeof value === 'number' ? value : Number(value);
              return [isNaN(num) ? 'N/A' : num.toFixed(3), label];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />

          <Line
            type="monotone"
            dataKey="r20"
            stroke="#60A5FA"
            strokeWidth={1}
            strokeDasharray="4 3"
            dot={false}
            connectNulls
            strokeOpacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="r60"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="r90"
            stroke="#8B5CF6"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            strokeOpacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Regime alerts */}
      {data.regime_alerts.length > 0 && (
        <div className="space-y-1">
          {data.regime_alerts.slice(-3).map((alert, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px]">
              <AlertTriangle className={cn(
                'h-3 w-3 shrink-0 mt-0.5',
                alert.type === 'breakdown' ? 'text-red-400' :
                alert.type === 'spike' ? 'text-amber-400' :
                alert.type === 'sign_flip' ? 'text-purple-400' :
                'text-blue-400',
              )} />
              <span className="text-muted-foreground">
                <span className="text-white font-medium">{alert.date}</span>: {alert.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current values */}
      <div className="flex items-center gap-4 text-[10px]">
        {data.current_20d !== null && (
          <span className="text-muted-foreground">
            Current 20d: <span className="text-white font-mono">{data.current_20d.toFixed(3)}</span>
          </span>
        )}
        {data.current_60d !== null && (
          <span className="text-muted-foreground">
            60d: <span className="text-white font-mono">{data.current_60d.toFixed(3)}</span>
          </span>
        )}
        {data.current_90d !== null && (
          <span className="text-muted-foreground">
            90d: <span className="text-white font-mono">{data.current_90d.toFixed(3)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
