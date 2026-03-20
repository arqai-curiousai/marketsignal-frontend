'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCorrelation } from '@/src/lib/api/analyticsApi';
import type { ICorrelationMatrix } from '@/src/types/analytics';

type Category = 'all' | 'major' | 'inr' | 'cross' | 'exotic';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'major', label: 'Major' },
  { id: 'inr', label: 'INR' },
  { id: 'cross', label: 'Cross' },
  { id: 'exotic', label: 'Exotic' },
];

/**
 * Colorblind-safe Blue-Orange palette for correlation values.
 * Positive = blue, Negative = orange, Neutral = muted.
 */
function corrColorClass(v: number): string {
  if (v >= 0.8) return 'bg-blue-700/90 text-white';
  if (v >= 0.5) return 'bg-blue-500/70 text-white';
  if (v >= 0.2) return 'bg-blue-400/40 text-blue-100';
  if (v > -0.2) return 'bg-muted text-muted-foreground';
  if (v > -0.5) return 'bg-orange-400/40 text-orange-100';
  if (v > -0.8) return 'bg-orange-500/70 text-white';
  return 'bg-orange-700/90 text-white';
}

function shortLabel(ticker: string): string {
  // "USD/INR" -> "USD/INR", but truncate if long
  if (ticker.length > 7) return ticker.slice(0, 7);
  return ticker;
}

interface PairDetail {
  row: string;
  col: string;
  value: number;
}

export function ForexCorrelationFull() {
  const [matrix, setMatrix] = useState<ICorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('all');
  const [selectedCell, setSelectedCell] = useState<PairDetail | null>(null);

  const fetchData = useCallback(async (cat: Category) => {
    setLoading(true);
    setError(null);
    try {
      const param = cat === 'all' ? undefined : cat;
      const res = await getCurrencyCorrelation(param);
      if (res.success) {
        setMatrix(res.data);
      } else {
        setError('Failed to load correlation data');
      }
    } catch {
      setError('Network error loading correlations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(category);
  }, [category, fetchData]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setSelectedCell(null);
  };

  if (loading && !matrix) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button
          onClick={() => fetchData(category)}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  if (!matrix?.tickers?.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">No correlation data available</p>
      </div>
    );
  }

  const { tickers, matrix: values } = matrix;

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
              category === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {cat.label}
          </button>
        ))}
        {loading && (
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-2" />
        )}
      </div>

      {/* Matrix */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="overflow-x-auto">
          <table className="text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card p-1.5 text-left text-muted-foreground min-w-[70px]" />
                {tickers.map((t) => (
                  <th
                    key={t}
                    className="p-1.5 text-center text-muted-foreground font-medium min-w-[52px]"
                  >
                    <span className="writing-mode-vertical whitespace-nowrap">
                      {shortLabel(t)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((row, ri) => (
                <tr key={row}>
                  <td className="sticky left-0 z-10 bg-card p-1.5 text-muted-foreground font-medium whitespace-nowrap">
                    {shortLabel(row)}
                  </td>
                  {tickers.map((col, ci) => {
                    const val = values?.[ri]?.[ci] ?? 0;
                    const isDiag = ri === ci;
                    const isSelected =
                      selectedCell?.row === row && selectedCell?.col === col;

                    return (
                      <td key={col} className="p-0.5 text-center">
                        <button
                          onClick={() => {
                            if (!isDiag) {
                              setSelectedCell({ row, col, value: val });
                            }
                          }}
                          className={cn(
                            'inline-block w-11 py-0.5 rounded text-[10px] font-mono transition-all',
                            isDiag
                              ? 'bg-muted/50 text-muted-foreground cursor-default'
                              : corrColorClass(val),
                            isSelected && 'ring-2 ring-primary',
                            !isDiag && 'hover:ring-1 hover:ring-primary/50 cursor-pointer'
                          )}
                          title={`${row} x ${col}: ${val.toFixed(3)}`}
                        >
                          {isDiag ? '1.00' : val.toFixed(2)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Color legend */}
        <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-muted-foreground">
          <span className="inline-block w-6 h-3 rounded bg-orange-700/90" />
          <span>-1</span>
          <span className="inline-block w-6 h-3 rounded bg-orange-400/40" />
          <span className="inline-block w-6 h-3 rounded bg-muted" />
          <span>0</span>
          <span className="inline-block w-6 h-3 rounded bg-blue-400/40" />
          <span className="inline-block w-6 h-3 rounded bg-blue-700/90" />
          <span>+1</span>
        </div>
      </div>

      {/* Selected cell detail */}
      {selectedCell && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold">
                  {selectedCell.row} / {selectedCell.col}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Correlation coefficient:{' '}
                <span
                  className={cn(
                    'font-mono font-semibold',
                    selectedCell.value >= 0 ? 'text-blue-400' : 'text-orange-400'
                  )}
                >
                  {selectedCell.value.toFixed(4)}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {Math.abs(selectedCell.value) >= 0.8
                  ? 'Very strong correlation — moves largely in sync.'
                  : Math.abs(selectedCell.value) >= 0.5
                    ? 'Moderate correlation — some co-movement.'
                    : Math.abs(selectedCell.value) >= 0.2
                      ? 'Weak correlation — largely independent.'
                      : 'Near zero — no meaningful linear relationship.'}
              </p>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Computed at */}
      {matrix.computed_at && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated: {new Date(matrix.computed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
