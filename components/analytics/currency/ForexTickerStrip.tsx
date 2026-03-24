'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ICurrencyOverview, ICurrencyPairSnapshot } from '@/src/types/analytics';

interface ForexTickerStripProps {
  onSelectPair: (pair: string) => void;
  overview: ICurrencyOverview | null;
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

/** Tiny 52-week range bar showing where current price sits */
function Range52w({ price, low, high }: { price: number; low: number | null; high: number | null }) {
  if (low == null || high == null || high <= low) return null;
  const pct = ((price - low) / (high - low)) * 100;
  return (
    <div className="hidden md:flex items-center gap-1.5 shrink-0" title={`52W: ${low.toFixed(2)} — ${high.toFixed(2)}`}>
      <span className="text-[8px] text-muted-foreground/50 font-mono">{low.toFixed(1)}</span>
      <div className="w-12 h-1 rounded-full bg-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500/60 to-sky-500/60" style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
      </div>
      <span className="text-[8px] text-muted-foreground/50 font-mono">{high.toFixed(1)}</span>
    </div>
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
      aria-label={`Select ${pair.ticker}, ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer shrink-0"
    >
      <span className="text-[11px] font-semibold text-white/80">{pair.ticker}</span>
      <span className="text-xs font-mono tabular-nums text-white/90">
        {pair.price?.toFixed(pair.price >= 100 ? 2 : 4) ?? '—'}
      </span>
      {/* Day range */}
      {pair.high != null && pair.low != null && (
        <span className="hidden lg:inline text-[9px] text-muted-foreground/60 font-mono">
          {pair.low.toFixed(pair.low >= 100 ? 2 : 4)}–{pair.high.toFixed(pair.high >= 100 ? 2 : 4)}
        </span>
      )}
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
      <Range52w price={pair.price} low={pair.low_52w} high={pair.high_52w} />
    </button>
  );
}

export function ForexTickerStrip({ onSelectPair, overview }: ForexTickerStripProps) {
  const pairs = useMemo(() => overview?.pairs ?? [], [overview]);

  if (!pairs.length) return null;

  // Triple for seamless scroll on wide screens
  const allChips = [...pairs, ...pairs, ...pairs];

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
