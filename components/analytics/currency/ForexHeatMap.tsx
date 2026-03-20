'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCrossRates } from '@/src/lib/api/analyticsApi';
import type { ICrossRatesMatrix } from '@/src/types/analytics';
import { Grid3X3, AlertCircle, RefreshCw } from 'lucide-react';

type Timeframe = '1d' | '1w' | '1m';

const TF_OPTIONS: { id: Timeframe; label: string }[] = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
];

interface Props {
  onSelectPair: (pair: string) => void;
}

/**
 * Map change_pct to a background color.
 * Positive (blue): hsl(210, 80%, lightness)
 * Negative (orange): hsl(30, 80%, lightness)
 * Clamped to ±2% range. Neutral at 50% lightness base.
 */
function changePctToColor(changePct: number): string {
  const clamped = Math.max(-2, Math.min(2, changePct));
  const intensity = Math.abs(clamped) / 2; // 0..1

  if (Math.abs(clamped) < 0.001) {
    return 'hsl(0, 0%, 20%)';
  }

  // Higher intensity → darker (more vivid) color; lower intensity → lighter (closer to bg)
  // Lightness: 85% (faint) → 35% (strong)
  const lightness = 85 - intensity * 50;

  if (clamped > 0) {
    return `hsl(210, 80%, ${lightness}%)`;
  }
  return `hsl(30, 80%, ${lightness}%)`;
}

function changePctToTextColor(changePct: number): string {
  const clamped = Math.max(-2, Math.min(2, changePct));
  const intensity = Math.abs(clamped) / 2;

  if (intensity > 0.4) return 'text-white';
  return 'text-foreground';
}

export function ForexHeatMap({ onSelectPair }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const [data, setData] = useState<ICrossRatesMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (tf: Timeframe) => {
    setLoading(prev => !data ? true : prev);
    setError(null);
    try {
      const res = await getCurrencyCrossRates(tf);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load cross-rates');
      }
    } catch {
      setError('Failed to load cross-rates');
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData(timeframe);
  }, [timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchData(timeframe)}
          className="mt-3 text-xs flex items-center gap-1 text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const currencies = data?.currencies ?? [];
  const matrix = data?.matrix ?? [];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Cross-Rates Heatmap</h3>
        </div>

        <div className="flex items-center gap-1">
          {TF_OPTIONS.map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                timeframe === tf.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[540px]">
          <thead>
            <tr>
              <th className="w-12 p-1" />
              {currencies.map(ccy => (
                <th
                  key={ccy}
                  className="text-[10px] font-semibold text-muted-foreground p-1 text-center"
                >
                  {ccy}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currencies.map((rowCcy, rowIdx) => (
              <tr key={rowCcy}>
                <td className="text-[10px] font-semibold text-muted-foreground p-1 text-right pr-2">
                  {rowCcy}
                </td>
                {currencies.map((colCcy, colIdx) => {
                  const cell = matrix[rowIdx]?.[colIdx];
                  const isDiagonal = rowIdx === colIdx;

                  if (isDiagonal) {
                    return (
                      <td
                        key={colCcy}
                        className="p-0.5"
                      >
                        <div className="flex items-center justify-center h-10 rounded bg-muted/40 text-[10px] font-mono text-muted-foreground/50">
                          1.0000
                        </div>
                      </td>
                    );
                  }

                  const rate = cell?.rate;
                  const changePct = cell?.change_pct ?? 0;
                  const bgColor = changePctToColor(changePct);
                  const textCls = changePctToTextColor(changePct);

                  return (
                    <td key={colCcy} className="p-0.5">
                      <button
                        onClick={() => onSelectPair(`${rowCcy}/${colCcy}`)}
                        className={cn(
                          'w-full h-10 rounded flex flex-col items-center justify-center',
                          'transition-transform hover:scale-105 hover:ring-1 hover:ring-primary/40',
                          'cursor-pointer',
                          textCls
                        )}
                        style={{ backgroundColor: bgColor }}
                        title={`${rowCcy}/${colCcy}: ${rate?.toFixed(4) ?? '—'} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`}
                      >
                        <span className="text-[9px] font-mono leading-tight">
                          {rate != null ? rate.toFixed(rate >= 100 ? 2 : 4) : '—'}
                        </span>
                        <span className="text-[8px] font-mono opacity-80 leading-tight">
                          {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(30, 80%, 55%)' }} />
          <span>-2%</span>
        </div>
        <div className="w-20 h-2 rounded bg-gradient-to-r from-[hsl(30,80%,55%)] via-[hsl(0,0%,20%)] to-[hsl(210,80%,55%)]" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(210, 80%, 55%)' }} />
          <span>+2%</span>
        </div>
      </div>
    </div>
  );
}
