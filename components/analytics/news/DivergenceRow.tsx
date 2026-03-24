'use client';

import React from 'react';
import type { ISentimentDivergence } from '@/types/analytics';
import { DivergenceAlert } from './DivergenceAlert';

interface DivergenceRowProps {
  divergences: Map<string, ISentimentDivergence>;
  loading: boolean;
}

/**
 * DivergenceRow — horizontal row of divergence chips for top movers.
 * Only renders tickers that have an active divergence (sentiment ≠ price direction).
 *
 * Mounted in Pulse mode below NarrativePulse.
 */
export function DivergenceRow({ divergences, loading }: DivergenceRowProps) {
  // Filter to only active divergences
  const active = Array.from(divergences.entries()).filter(
    ([, div]) => div.divergence
  );

  if (!loading && active.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {loading && active.length === 0 && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 w-40 shrink-0 rounded-lg bg-white/[0.02] animate-pulse"
            />
          ))}
        </>
      )}
      {active.map(([ticker, div]) => (
        <div key={ticker} className="shrink-0">
          <DivergenceAlert divergence={div} ticker={ticker} />
        </div>
      ))}
    </div>
  );
}
