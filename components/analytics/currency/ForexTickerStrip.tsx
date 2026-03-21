'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencyOverview } from '@/src/lib/api/analyticsApi';
import type { ICurrencyOverview, ICurrencyPairSnapshot } from '@/src/types/analytics';

interface ForexTickerStripProps {
  onSelectPair: (pair: string) => void;
}

/** Tiny inline sparkline (SVG polyline, 40px wide) */
function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 40;
  const h = 16;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? 'hsl(210, 80%, 60%)' : 'hsl(30, 80%, 55%)'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TickerChip({
  pair,
  onClick,
}: {
  pair: ICurrencyPairSnapshot;
  onClick: () => void;
}) {
  const pct = pair.change_pct ?? 0;
  const positive = pct >= 0;
  const Arrow = positive ? TrendingUp : TrendingDown;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer shrink-0"
    >
      <span className="text-[11px] font-semibold text-white/80">{pair.ticker}</span>
      <span className="text-xs font-mono tabular-nums text-white/90">
        {pair.price?.toFixed(pair.price >= 100 ? 2 : 4) ?? '—'}
      </span>
      <span
        className={cn(
          'flex items-center gap-0.5 text-[10px] font-mono font-medium',
          positive ? 'text-sky-400' : 'text-orange-400'
        )}
      >
        <Arrow className="h-3 w-3" />
        {positive ? '+' : ''}{pct.toFixed(2)}%
      </span>
      <MiniSparkline data={pair.sparkline ?? []} positive={positive} />
    </button>
  );
}

export function ForexTickerStrip({ onSelectPair }: ForexTickerStripProps) {
  const [overview, setOverview] = useState<ICurrencyOverview | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getCurrencyOverview();
      if (res.success) setOverview(res.data);
    } catch {
      // Silent fail — decorative element
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pairs = useMemo(() => overview?.pairs ?? [], [overview]);

  if (!pairs.length) return null;

  // Duplicate for seamless scroll
  const allChips = [...pairs, ...pairs];

  return (
    <div className="relative overflow-hidden border-y border-white/[0.04] bg-white/[0.015]">
      <div
        className="flex items-center gap-1 py-2 animate-[forexScroll_30s_linear_infinite] hover:[animation-play-state:paused]"
        style={{ width: 'max-content' }}
      >
        {allChips.map((pair, idx) => (
          <TickerChip
            key={`${pair.ticker}-${idx}`}
            pair={pair}
            onClick={() => onSelectPair(pair.ticker)}
          />
        ))}
      </div>
    </div>
  );
}
