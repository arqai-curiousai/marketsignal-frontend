'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ForexOverviewKPIs } from './ForexOverviewKPIs';
import { ForexSessionMap } from './ForexSessionMap';
import { ForexHeatMap } from './ForexHeatMap';
import { CurrencyStrengthMeter } from './CurrencyStrengthMeter';
import { ForexTopMovers } from './ForexTopMovers';
import { CurrencyCorrelationMini } from './CurrencyCorrelationMini';
import {
  getCurrencyOverview,
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
}

const ANIM_STAGGER = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function MarketsView({ onSelectPair }: MarketsViewProps) {
  const [overview, setOverview] = useState<ICurrencyOverview | null>(null);
  const [strength, setStrength] = useState<ICurrencyStrength | null>(null);
  const [topMovers, setTopMovers] = useState<ITopMovers | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    try {
      const [ovRes, strRes, tmRes, mcRes] = await Promise.all([
        getCurrencyOverview(),
        getCurrencyStrength(),
        getCurrencyTopMovers(),
        getCurrencyMarketClock(),
      ]);
      if (ovRes.success) setOverview(ovRes.data);
      if (strRes.success) setStrength(strRes.data);
      if (tmRes.success) setTopMovers(tmRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
      hasLoaded.current = true;
    } catch {
      // Individual components handle their own error states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

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
    <div className="space-y-4">
      {/* KPI Strip */}
      <motion.div {...ANIM_STAGGER}>
        <ForexOverviewKPIs
          strength={strength}
          marketClock={marketClock}
          topMovers={topMovers}
        />
      </motion.div>

      {/* Session Map */}
      <motion.div {...ANIM_STAGGER} transition={{ ...ANIM_STAGGER.transition, delay: 0.05 }}>
        <ForexSessionMap />
      </motion.div>

      {/* 2-column grid: Heatmap + Strength/Movers/Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
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
          <CurrencyStrengthMeter />
          <ForexTopMovers onSelectPair={onSelectPair} />
          <CurrencyCorrelationMini />
        </motion.div>
      </div>
    </div>
  );
}
