'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCrossRates } from '@/src/lib/api/analyticsApi';
import type { ICrossRatesMatrix } from '@/src/types/analytics';
import { Grid3X3, AlertCircle, RefreshCw } from 'lucide-react';
import { DataFreshness } from '@/components/analytics/DataFreshness';
import { ALL_FOREX_PAIRS, HEATMAP_MODES, type HeatmapMode } from './constants';

/** Build clickable pair lookup from all 42 pairs + their inverses */
const PAIR_NORMALIZE = new Map<string, string>();
for (const p of ALL_FOREX_PAIRS) {
  PAIR_NORMALIZE.set(p, p);
  const [base, quote] = p.split('/');
  PAIR_NORMALIZE.set(`${quote}/${base}`, p);
}

type Timeframe = '1d' | '1w' | '1m';

const TF_OPTIONS: { id: Timeframe; label: string }[] = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
];

interface Props {
  onSelectPair: (pair: string) => void;
}

function changePctToColor(changePct: number): string {
  const clamped = Math.max(-2, Math.min(2, changePct));
  const intensity = Math.abs(clamped) / 2;
  if (Math.abs(clamped) < 0.001) return 'hsl(0, 0%, 20%)';
  const lightness = 85 - intensity * 50;
  return clamped > 0 ? `hsl(210, 80%, ${lightness}%)` : `hsl(30, 80%, ${lightness}%)`;
}

function changePctToTextColor(changePct: number): string {
  const intensity = Math.abs(Math.max(-2, Math.min(2, changePct))) / 2;
  return intensity > 0.4 ? 'text-white' : 'text-foreground';
}

export function ForexHeatMap({ onSelectPair }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const [matrixMode, setMatrixMode] = useState<HeatmapMode>('g10');
  const [data, setData] = useState<ICrossRatesMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const fetchData = useCallback(async (tf: Timeframe, mode: HeatmapMode) => {
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      const res = await getCurrencyCrossRates(tf, mode);
      if (res.success) {
        setData(res.data);
        setLastFetchedAt(new Date().toISOString());
        hasLoaded.current = true;
      } else {
        setError(res.error?.message || 'Failed to load cross-rates');
      }
    } catch {
      setError('Failed to load cross-rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeframe, matrixMode);
  }, [timeframe, matrixMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col items-center text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchData(timeframe, matrixMode)}
          className="mt-3 text-xs flex items-center gap-1 text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const currencies = data?.currencies ?? [];
  const matrix = data?.matrix ?? [];

  // Scale cell size based on matrix dimension to keep it manageable
  const isLargeMatrix = currencies.length > 12;
  const cellHeight = isLargeMatrix ? 'h-8' : 'h-10';
  const fontSize = isLargeMatrix ? 'text-[8px]' : 'text-[9px]';
  const subFontSize = isLargeMatrix ? 'text-[7px]' : 'text-[8px]';
  const minTableWidth = isLargeMatrix ? `min-w-[${currencies.length * 52}px]` : 'min-w-[540px]';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Cross-Rates Heatmap</h3>
          <DataFreshness computedAt={lastFetchedAt} staleTTLMinutes={2} />
        </div>

        <div className="flex items-center gap-3">
          {/* Matrix mode selector */}
          <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5">
            {HEATMAP_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setMatrixMode(mode.id)}
                title={mode.tooltip}
                className={cn(
                  'px-2.5 py-1 text-[10px] rounded-md font-medium transition-all duration-200',
                  matrixMode === mode.id
                    ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Timeframe selector */}
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
      </div>

      {/* Mode description */}
      <div className="mb-2 text-[10px] text-muted-foreground/50">
        {matrixMode === 'g10' && `${currencies.length} G10 currencies — institutional benchmark`}
        {matrixMode === 'full' && `${currencies.length} currencies — complete coverage`}
        {matrixMode === 'exotics' && `USD vs ${currencies.length - 1} exotic & emerging currencies`}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className={cn('w-full border-collapse', minTableWidth)} role="grid" aria-label="Currency pair heatmap">
          <thead>
            <tr>
              <th className="w-10 p-0.5 sticky left-0 z-10 bg-[inherit]" />
              {currencies.map(ccy => (
                <th
                  key={ccy}
                  className={cn('font-semibold text-muted-foreground p-0.5 text-center', isLargeMatrix ? 'text-[9px]' : 'text-[10px]')}
                >
                  {ccy}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currencies.map((rowCcy, rowIdx) => (
              <tr key={rowCcy}>
                <td className={cn('font-semibold text-muted-foreground p-0.5 text-right pr-1.5 sticky left-0 z-10 bg-[inherit]', isLargeMatrix ? 'text-[9px]' : 'text-[10px]')}>
                  {rowCcy}
                </td>
                {currencies.map((colCcy, colIdx) => {
                  const cell = matrix[rowIdx]?.[colIdx];
                  const isDiagonal = rowIdx === colIdx;

                  if (isDiagonal) {
                    return (
                      <td key={colCcy} className="p-0.5">
                        <div className={cn('flex items-center justify-center rounded bg-muted/40 font-mono text-muted-foreground/50', cellHeight, isLargeMatrix ? 'text-[8px]' : 'text-[10px]')}>
                          —
                        </div>
                      </td>
                    );
                  }

                  const rate = cell?.rate;
                  const changePct = cell?.change_pct ?? 0;
                  const bgColor = changePctToColor(changePct);
                  const textCls = changePctToTextColor(changePct);

                  const rawPair = `${rowCcy}/${colCcy}`;
                  const canonicalPair = PAIR_NORMALIZE.get(rawPair);
                  const hasDeepAnalytics = canonicalPair != null;

                  const isINRPair = rowCcy === 'INR' || colCcy === 'INR';
                  const isExoticPair = ['MXN', 'ZAR', 'TRY', 'CNH'].includes(rowCcy) || ['MXN', 'ZAR', 'TRY', 'CNH'].includes(colCcy);

                  const cellTitle = hasDeepAnalytics
                    ? `${rawPair}: ${rate?.toFixed(4) ?? '—'} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%) — Click for analytics`
                    : `${rawPair}: ${rate?.toFixed(4) ?? '—'} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;

                  const cellClassName = cn(
                    'w-full rounded flex flex-col items-center justify-center',
                    cellHeight,
                    'transition-all duration-300',
                    hasDeepAnalytics && 'hover:scale-105 hover:ring-1 hover:ring-primary/40 hover:shadow-[0_0_12px_rgba(56,189,248,0.15)] cursor-pointer',
                    !hasDeepAnalytics && 'cursor-default opacity-80',
                    isINRPair && 'ring-1 ring-amber-500/30',
                    isExoticPair && hasDeepAnalytics && 'ring-1 ring-violet-500/20',
                    textCls
                  );

                  const cellContent = (
                    <>
                      <span className={cn(fontSize, 'font-mono leading-tight tabular-nums')}>
                        {rate != null ? rate.toFixed(rate >= 100 ? 2 : 4) : '—'}
                      </span>
                      <span className={cn(subFontSize, 'font-mono opacity-80 leading-tight tabular-nums')}>
                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                    </>
                  );

                  return (
                    <td key={colCcy} className="p-0.5">
                      {hasDeepAnalytics ? (
                        <button
                          onClick={() => onSelectPair(canonicalPair)}
                          className={cellClassName}
                          style={{ backgroundColor: bgColor }}
                          title={cellTitle}
                        >
                          {cellContent}
                        </button>
                      ) : (
                        <div
                          role="cell"
                          className={cellClassName}
                          style={{ backgroundColor: bgColor }}
                          title={cellTitle}
                        >
                          {cellContent}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
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

        {/* Pair type indicators */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm ring-1 ring-amber-500/40" /> INR
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm ring-1 ring-violet-500/30" /> Exotic
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm ring-1 ring-sky-500/30" /> Clickable
          </span>
        </div>
      </div>
    </div>
  );
}
