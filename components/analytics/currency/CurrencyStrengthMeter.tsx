'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyStrength } from '@/src/lib/api/analyticsApi';
import type { ICurrencyStrength } from '@/src/types/analytics';

type Timeframe = '1d' | '1w' | '1m' | '3m';

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD', 'INR'] as const;

interface CurrencyValues {
  '1d': number;
  '1w': number;
  '1m': number;
  '3m': number;
}

function StrengthBar({
  currency,
  value,
  maxAbsValue,
}: {
  currency: string;
  value: number;
  maxAbsValue: number;
}) {
  const positive = value >= 0;
  const normalizedWidth = maxAbsValue > 0 ? (Math.abs(value) / maxAbsValue) * 50 : 0;

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs font-semibold w-8 shrink-0">{currency}</span>
      <div className="flex-1 h-5 relative bg-muted/30 rounded-sm overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
        {/* Bar */}
        <div
          className={cn(
            'absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-500',
            positive ? 'bg-emerald-500/70' : 'bg-rose-500/70'
          )}
          style={{
            left: positive ? '50%' : `${50 - normalizedWidth}%`,
            width: `${normalizedWidth}%`,
          }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-mono w-14 text-right shrink-0',
          positive ? 'text-emerald-400' : 'text-rose-400'
        )}
      >
        {positive ? '+' : ''}
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function DivergenceBadge({ currency, values }: { currency: string; values: CurrencyValues }) {
  const daySign = values['1d'] >= 0;
  const weekSign = values['1w'] >= 0;
  if (daySign === weekSign) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
      <span className="text-amber-400">
        <span className="font-medium">{currency}</span>: 1D{' '}
        {daySign ? 'positive' : 'negative'} vs 1W{' '}
        {weekSign ? 'positive' : 'negative'}
      </span>
    </div>
  );
}

export function CurrencyStrengthMeter() {
  const [data, setData] = useState<ICurrencyStrength | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTf, setSelectedTf] = useState<Timeframe>('1d');

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await getCurrencyStrength();
      if (res.success) {
        setData(res.data);
      } else {
        setError('Failed to load strength data');
      }
    } catch {
      setError('Network error loading strength data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  if (!data?.currencies) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">No strength data available</p>
      </div>
    );
  }

  const currencies = data.currencies;

  // Build sorted list for selected timeframe
  const sorted = CURRENCIES.filter((c) => currencies[c])
    .map((c) => ({
      currency: c,
      values: currencies[c] as CurrencyValues,
      sortValue: (currencies[c] as CurrencyValues)[selectedTf] ?? 0,
    }))
    .sort((a, b) => b.sortValue - a.sortValue);

  const maxAbsValue = Math.max(
    ...sorted.map((s) => Math.abs(s.sortValue)),
    1
  );

  // Find strongest and weakest for trade suggestion
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Collect divergences
  const divergences = sorted.filter((s) => {
    const daySign = s.values['1d'] >= 0;
    const weekSign = s.values['1w'] >= 0;
    return daySign !== weekSign;
  });

  return (
    <div className="space-y-4">
      {/* Header + Timeframe selector */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Currency Strength Meter</h3>
          <div className="flex gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTf(tf.id)}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors',
                  selectedTf === tf.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strength bars */}
        <div className="space-y-0">
          {sorted.map((item) => (
            <StrengthBar
              key={item.currency}
              currency={item.currency}
              value={item.sortValue}
              maxAbsValue={maxAbsValue}
            />
          ))}
        </div>

        {/* Multi-timeframe grid */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
            Multi-Timeframe Grid
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  <th className="text-left py-1 text-muted-foreground" />
                  {TIMEFRAMES.map((tf) => (
                    <th
                      key={tf.id}
                      className={cn(
                        'text-center py-1 font-medium',
                        selectedTf === tf.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {tf.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.currency}>
                    <td className="py-0.5 font-medium">{item.currency}</td>
                    {TIMEFRAMES.map((tf) => {
                      const val = item.values[tf.id] ?? 0;
                      const intensity = Math.min(Math.abs(val) / 100, 1);
                      const bg =
                        val > 0
                          ? `rgba(16, 185, 129, ${intensity * 0.45})`
                          : val < 0
                            ? `rgba(239, 68, 68, ${intensity * 0.45})`
                            : 'transparent';
                      return (
                        <td key={tf.id} className="text-center py-0.5">
                          <span
                            className={cn(
                              'inline-block w-12 rounded py-0.5 font-mono',
                              selectedTf === tf.id && 'ring-1 ring-primary/40'
                            )}
                            style={{ backgroundColor: bg }}
                          >
                            {val > 0 ? '+' : ''}
                            {val.toFixed(0)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Divergence alerts */}
      {divergences.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-xs font-semibold mb-2 text-amber-400">
            Timeframe Divergences
          </h4>
          <div className="space-y-1.5">
            {divergences.map((d) => (
              <DivergenceBadge
                key={d.currency}
                currency={d.currency}
                values={d.values}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trade suggestion */}
      {strongest && weakest && strongest.currency !== weakest.currency && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-xs font-semibold mb-2">Trade Suggestion</h4>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                {strongest.currency}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ({strongest.sortValue > 0 ? '+' : ''}
                {strongest.sortValue.toFixed(1)})
              </span>
            </div>
            <span className="text-xs text-muted-foreground">vs</span>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span className="text-sm font-semibold text-rose-400">
                {weakest.currency}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ({weakest.sortValue > 0 ? '+' : ''}
                {weakest.sortValue.toFixed(1)})
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              Buy{' '}
              <span className="font-semibold text-foreground">
                {strongest.currency}/{weakest.currency}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Computed at */}
      {data.computed_at && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated: {new Date(data.computed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
