'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyVolatility } from '@/src/lib/api/analyticsApi';
import type { ICurrencyVolatility } from '@/src/types/analytics';

interface Props {
  pair: string;
}

const REGIME_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  NORMAL: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  EXTREME: 'bg-red-500/15 text-red-400 border-red-500/30',
};

function PercentileBar({ value }: { value: number }) {
  const v = value ?? 0;
  const color = v < 25 ? 'bg-emerald-500' : v < 75 ? 'bg-amber-500' : v < 90 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>Percentile Rank</span>
        <span className="font-mono font-semibold">{v.toFixed(0)}th</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-0.5">
        <span>Low</span><span>Normal</span><span>High</span>
      </div>
    </div>
  );
}

export function CurrencyVolatility({ pair }: Props) {
  const [data, setData] = useState<ICurrencyVolatility | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCurrencyVolatility(pair);
      if (res.success) setData(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [pair]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return <div className="space-y-3"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  }

  if (!data) {
    return <p className="text-xs text-muted-foreground p-4">No volatility data available</p>;
  }

  return (
    <div className="space-y-4">
      {/* Regime Badge + Percentile */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Volatility Regime</h3>
          <span className={cn(
            'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
            REGIME_COLORS[data.regime] || REGIME_COLORS.NORMAL
          )}>
            {data.regime}
          </span>
        </div>
        <PercentileBar value={data.percentile_rank ?? 0} />

        {data.squeeze && (
          <div className="mt-3 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400 animate-pulse">
            Bollinger Band Squeeze detected — breakout imminent
          </div>
        )}
      </div>

      {/* Multi-Window Realized Volatility */}
      {data.windows && data.windows.length > 0 && (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold mb-3">Realized Volatility (Annualized %)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-1.5 text-muted-foreground font-medium">Window</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Close-Close</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Parkinson</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Yang-Zhang</th>
              </tr>
            </thead>
            <tbody>
              {data.windows.map(w => (
                <tr key={w.window} className="border-b border-white/[0.04]">
                  <td className="py-1.5 font-medium">{w.window}</td>
                  <td className="text-right font-mono">{w.close_to_close.toFixed(2)}%</td>
                  <td className="text-right font-mono">{w.parkinson.toFixed(2)}%</td>
                  <td className="text-right font-mono">{w.yang_zhang.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Vol Term Structure */}
      {data.term_structure && data.term_structure.length > 0 && (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold mb-3">Volatility Term Structure</h3>
        <div className="flex items-end gap-1 h-32">
          {data.term_structure.map((ts, i) => {
            const maxRv = Math.max(...data.term_structure.map(t => t.rv), 1);
            const height = (ts.rv / maxRv) * 100;
            const isInverted = i > 0 && ts.rv < data.term_structure[i - 1].rv;
            return (
              <div key={ts.window} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-muted-foreground">{ts.rv.toFixed(1)}%</span>
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all',
                    isInverted ? 'bg-red-500/60' : 'bg-blue-500/60'
                  )}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <span className="text-[9px] text-muted-foreground">{ts.window}d</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {data.term_structure.length >= 2 &&
            data.term_structure[data.term_structure.length - 1].rv < data.term_structure[0].rv
            ? 'Inverted — short-term vol exceeds long-term (stress signal)'
            : 'Normal contango — long-term vol exceeds short-term'}
        </p>
      </div>
      )}

      {/* Bandwidth */}
      {data.current_bandwidth != null && (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bollinger Bandwidth</h3>
          <span className="text-xs font-mono">{data.current_bandwidth.toFixed(2)}%</span>
        </div>
      </div>
      )}
    </div>
  );
}
