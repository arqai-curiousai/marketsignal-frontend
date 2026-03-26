'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyTopMovers } from '@/src/lib/api/analyticsApi';
import type { ITopMovers, ITopMover } from '@/src/types/analytics';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DataFreshness } from '@/components/analytics/DataFreshness';

interface Props {
  onSelectPair: (pair: string) => void;
  /** Pre-fetched data from parent — skips internal fetch when provided. */
  initialData?: ITopMovers | null;
}

function MoverChip({
  mover,
  variant,
  onClick,
}: {
  mover: ITopMover;
  variant: 'gainer' | 'loser';
  onClick: () => void;
}) {
  const isGainer = variant === 'gainer';
  const Arrow = isGainer ? ArrowUpRight : ArrowDownRight;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
        'hover:ring-1 hover:ring-primary/30 cursor-pointer shrink-0',
        isGainer
          ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
          : 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
      )}
    >
      <span className="font-medium text-foreground">{mover.pair}</span>
      <span className="font-mono text-muted-foreground text-[10px]">
        {mover.price.toFixed(mover.price >= 100 ? 2 : 4)}
      </span>
      <span
        className={cn(
          'flex items-center gap-0.5 font-mono font-semibold text-[10px]',
          isGainer ? 'text-emerald-400' : 'text-red-400'
        )}
      >
        <Arrow className="h-3 w-3" />
        {isGainer ? '+' : ''}{mover.change_pct.toFixed(2)}%
      </span>
    </button>
  );
}

export function ForexTopMovers({ onSelectPair, initialData }: Props) {
  const [data, setData] = useState<ITopMovers | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(initialData ? new Date().toISOString() : null);
  const hasLoaded = useRef(!!initialData);

  // Sync external data when parent refreshes
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLastFetchedAt(new Date().toISOString());
      hasLoaded.current = true;
      setLoading(false);
    }
  }, [initialData]);

  const fetchData = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      const res = await getCurrencyTopMovers();
      if (res.success) {
        setData(res.data);
        setLastFetchedAt(new Date().toISOString());
        hasLoaded.current = true;
      } else {
        setError(res.error?.message || 'Failed to load top movers');
      }
    } catch {
      setError('Failed to load top movers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Only self-fetch if no data was provided by parent
  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        {error}
      </p>
    );
  }

  const gainers = data?.gainers ?? [];
  const losers = data?.losers ?? [];

  if (gainers.length === 0 && losers.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        No mover data available
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Top Movers</h3>
          <DataFreshness computedAt={lastFetchedAt} staleTTLMinutes={2} />
        </div>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pb-1">
        {/* Gainers */}
        {gainers.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            {gainers.slice(0, 5).map(m => (
              <MoverChip
                key={m.pair}
                mover={m}
                variant="gainer"
                onClick={() => onSelectPair(m.pair)}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        {gainers.length > 0 && losers.length > 0 && (
          <div className="w-px h-6 bg-white/[0.08] shrink-0" />
        )}

        {/* Losers */}
        {losers.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
            {losers.slice(0, 5).map(m => (
              <MoverChip
                key={m.pair}
                mover={m}
                variant="loser"
                onClick={() => onSelectPair(m.pair)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
