'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketAwarePolling } from '@/lib/hooks/useMarketAwarePolling';
import { ForexOverviewKPIs } from './ForexOverviewKPIs';
import { ForexSessionMap } from './ForexSessionMap';
import { ForexHeatMap } from './ForexHeatMap';
import { CurrencyStrengthMeter } from './CurrencyStrengthMeter';
import { ForexTopMovers } from './ForexTopMovers';
import { CurrencyCorrelationMini } from './CurrencyCorrelationMini';
import {
  getCurrencyStrength,
  getCurrencyTopMovers,
  getCurrencyMarketClock,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyOverview,
  ICurrencyStrength,
  ITopMovers,
  IMarketClock,
} from '@/src/types/analytics';

interface MarketsViewProps {
  onSelectPair: (pair: string) => void;
  overview: ICurrencyOverview | null;
}

const ANIM_STAGGER = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function MarketsView({ onSelectPair, overview }: MarketsViewProps) {
  const [strength, setStrength] = useState<ICurrencyStrength | null>(null);
  const [topMovers, setTopMovers] = useState<ITopMovers | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [minutesAgo, setMinutesAgo] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    try {
      const settled = await Promise.allSettled([
        getCurrencyStrength(),
        getCurrencyTopMovers(),
        getCurrencyMarketClock(),
      ]);
      const unwrap = <T,>(r: PromiseSettledResult<T>): T | { success: false; data: null } =>
        r.status === 'fulfilled' ? r.value : { success: false, data: null };
      const strRes = unwrap(settled[0]);
      const tmRes = unwrap(settled[1]);
      const mcRes = unwrap(settled[2]);
      if (strRes.success) setStrength(strRes.data);
      if (tmRes.success) setTopMovers(tmRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
      hasLoaded.current = true;
      setLastRefresh(Date.now());
      setMinutesAgo(0);
    } catch {
      // Individual components handle their own error states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useMarketAwarePolling({
    fetchFn: fetchAll,
    marketType: 'forex',
    activeIntervalMs: 60_000,
    inactiveIntervalMs: 300_000,
  });

  // Update "minutes ago" display every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo(Math.floor((Date.now() - lastRefresh) / 60_000));
    }, 30_000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  if (loading && !hasLoaded.current) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Staleness indicator */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] text-muted-foreground">
          {minutesAgo === 0 ? 'Just updated' : `Updated ${minutesAgo}m ago`}
        </span>
        <button
          onClick={fetchAll}
          className="p-1 rounded hover:bg-white/[0.06] transition-colors"
          title="Refresh market data"
        >
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* KPI Strip */}
      <motion.div {...ANIM_STAGGER}>
        <ForexOverviewKPIs
          strength={strength}
          marketClock={marketClock}
          topMovers={topMovers}
          overview={overview}
        />
      </motion.div>

      {/* Session Map */}
      <motion.div {...ANIM_STAGGER} transition={{ ...ANIM_STAGGER.transition, delay: 0.05 }}>
        <ForexSessionMap />
      </motion.div>

      {/* 2-column grid: Heatmap + Strength/Movers/Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-5">
        {/* Left: Heatmap */}
        <motion.div {...ANIM_STAGGER} transition={{ ...ANIM_STAGGER.transition, delay: 0.1 }}>
          <ForexHeatMap onSelectPair={onSelectPair} />
        </motion.div>

        {/* Right: Strength + Movers + Correlation */}
        <motion.div
          {...ANIM_STAGGER}
          transition={{ ...ANIM_STAGGER.transition, delay: 0.15 }}
          className="space-y-4"
        >
          <CurrencyStrengthMeter initialData={strength} />
          <ForexTopMovers onSelectPair={onSelectPair} initialData={topMovers} />
          <CurrencyCorrelationMini />
        </motion.div>
      </div>
    </div>
  );
}
