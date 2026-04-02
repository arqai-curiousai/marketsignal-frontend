'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Triangle, ChevronDown, ChevronUp } from 'lucide-react';
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

/** G10 + INR shown by default; exotic/EM currencies in "Show all" */
const CORE_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'INR', 'SEK', 'NOK']);
const DEFAULT_VISIBLE = 10;

interface CurrencyValues {
  '1d': number;
  '1w': number;
  '1m': number;
  '3m': number;
}

/** Colorblind-safe: Blue for positive, Orange for negative */
function strengthBarColor(value: number): string {
  if (value >= 0) return 'bg-sky-500/70';
  return 'bg-orange-500/70';
}

function strengthTextColor(value: number): string {
  if (value >= 0) return 'text-sky-400';
  return 'text-orange-400';
}

/** Momentum arrow: compare 1D vs 1W to determine direction change */
function MomentumArrow({ values }: { values: CurrencyValues }) {
  const d = values['1d'];
  const w = values['1w'];

  // If same sign and day is stronger in magnitude → accelerating
  if (d > 0 && d > w) {
    return <Triangle className="h-3 w-3 text-sky-400 fill-sky-400" />;
  }
  if (d < 0 && d < w) {
    return <Triangle className="h-3 w-3 text-orange-400 fill-orange-400 rotate-180" />;
  }
  // Diverging or decelerating → flat
  return <div className="h-3 w-3 flex items-center justify-center"><div className="w-2 h-px bg-white/20" /></div>;
}

function StrengthBar({
  currency,
  value,
  maxAbsValue,
  values,
}: {
  currency: string;
  value: number;
  maxAbsValue: number;
  values: CurrencyValues;
}) {
  const positive = value >= 0;
  const normalizedWidth = maxAbsValue > 0 ? (Math.abs(value) / maxAbsValue) * 50 : 0;

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <span className="text-xs font-semibold w-8 shrink-0">{currency}</span>
      <MomentumArrow values={values} />
      <div
        className="flex-1 h-5 relative bg-muted/20 rounded-sm overflow-hidden"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={-maxAbsValue}
        aria-valuemax={maxAbsValue}
        aria-label={`${currency} strength`}
      >
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/50 z-10" />
        {/* Bar */}
        <div
          className={cn(
            'absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-700 ease-out',
            strengthBarColor(value),
          )}
          style={{
            left: positive ? '50%' : `${50 - normalizedWidth}%`,
            width: `${normalizedWidth}%`,
          }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-mono w-14 text-right shrink-0 tabular-nums',
          strengthTextColor(value),
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

interface CurrencyStrengthMeterProps {
  /** Pre-fetched data from parent — skips internal fetch when provided. */
  initialData?: ICurrencyStrength | null;
}

export function CurrencyStrengthMeter({ initialData }: CurrencyStrengthMeterProps = {}) {
  const [data, setData] = useState<ICurrencyStrength | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [selectedTf, setSelectedTf] = useState<Timeframe>('1d');
  const [showAll, setShowAll] = useState(false);

  // Sync external data when parent refreshes
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData]);

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

  // Only self-fetch if no data was provided by parent
  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]);

  // All hooks must be called before any early returns (React rules of hooks)
  const currencies = data?.currencies ?? {};

  const sorted = useMemo(() =>
    Object.keys(currencies)
      .filter((c) => currencies[c])
      .map((c) => ({
        currency: c,
        values: currencies[c] as CurrencyValues,
        sortValue: (currencies[c] as CurrencyValues)[selectedTf] ?? 0,
        isCore: CORE_CURRENCIES.has(c),
      }))
      .sort((a, b) => b.sortValue - a.sortValue),
    [currencies, selectedTf],
  );

  const visibleSorted = useMemo(() => {
    if (showAll) return sorted;
    const core = sorted.filter(s => s.isCore);
    const exotic = sorted.filter(s => !s.isCore);
    return [...core, ...exotic].slice(0, DEFAULT_VISIBLE);
  }, [sorted, showAll]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: DEFAULT_VISIBLE }).map((_, i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
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

  if (!data?.currencies || sorted.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6">
        <p className="text-sm text-muted-foreground">No strength data available</p>
      </div>
    );
  }

  const hasHidden = sorted.length > DEFAULT_VISIBLE;

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
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Currency Strength</h3>
          <div className="flex gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTf(tf.id)}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors',
                  selectedTf === tf.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]'
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strength bars */}
        <div className="space-y-0">
          {visibleSorted.map((item) => (
            <StrengthBar
              key={item.currency}
              currency={item.currency}
              value={item.sortValue}
              maxAbsValue={maxAbsValue}
              values={item.values}
            />
          ))}
        </div>

        {/* Show more / less toggle */}
        {hasHidden && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="flex items-center gap-1 mx-auto mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show fewer ({DEFAULT_VISIBLE})
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show all {sorted.length} currencies
              </>
            )}
          </button>
        )}

        {/* Multi-timeframe grid */}
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
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
                {visibleSorted.map((item) => (
                  <tr key={item.currency}>
                    <td className="py-0.5 font-medium">{item.currency}</td>
                    {TIMEFRAMES.map((tf) => {
                      const val = item.values[tf.id] ?? 0;
                      const intensity = Math.min(Math.abs(val) / 100, 1);
                      // Blue-Orange colorblind safe
                      const bg =
                        val > 0
                          ? `rgba(56, 189, 248, ${intensity * 0.45})`
                          : val < 0
                            ? `rgba(251, 146, 60, ${intensity * 0.45})`
                            : 'transparent';
                      return (
                        <td key={tf.id} className="text-center py-0.5">
                          <span
                            className={cn(
                              'inline-block w-12 rounded py-0.5 font-mono tabular-nums',
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
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
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

      {/* Relative strength signal */}
      {strongest && weakest && strongest.currency !== weakest.currency && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <h4 className="text-xs font-semibold mb-2">Relative Strength Signal</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-semibold text-sky-400">
                {strongest.currency}
              </span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                ({strongest.sortValue > 0 ? '+' : ''}
                {strongest.sortValue.toFixed(1)})
              </span>
            </div>
            <span className="text-xs text-muted-foreground">vs</span>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">
                {weakest.currency}
              </span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                ({weakest.sortValue > 0 ? '+' : ''}
                {weakest.sortValue.toFixed(1)})
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              Relative strength favors{' '}
              <span className="font-semibold text-foreground">
                {strongest.currency}
              </span>
              {' '}over{' '}
              <span className="font-semibold text-foreground">
                {weakest.currency}
              </span>
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground/60 mt-2">
            For informational purposes only. Not investment advice.
          </p>
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
