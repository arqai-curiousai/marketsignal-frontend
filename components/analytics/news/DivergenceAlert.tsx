'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { ISentimentDivergence } from '@/types/analytics';

interface DivergenceAlertProps {
  divergence: ISentimentDivergence | null;
  ticker: string;
  loading?: boolean;
}

/**
 * DivergenceAlert — shows when news sentiment contradicts price action.
 *
 * Connects the news intelligence pipeline with the dual-agent signal engine
 * for contrarian insights: "News is bearish, but smart money is accumulating."
 */
export function DivergenceAlert({ divergence, ticker, loading }: DivergenceAlertProps) {
  if (loading) {
    return (
      <div className="h-8 rounded-lg bg-white/[0.02] animate-pulse" />
    );
  }

  if (!divergence?.divergence) return null;

  const isBullish = divergence.type === 'bullish_divergence';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
        isBullish
          ? 'border-emerald-500/15 bg-emerald-500/5 text-emerald-400/80'
          : 'border-amber-500/15 bg-amber-500/5 text-amber-400/80'
      }`}
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <div className="flex-1">
        <span className="font-medium">{ticker} divergence:</span>{' '}
        {isBullish ? (
          <>
            News is{' '}
            <span className="text-red-400/80">
              {divergence.sentiment_trend}
            </span>
            , but price is{' '}
            <span className="text-emerald-400">
              trending {divergence.price_trend}
            </span>
          </>
        ) : (
          <>
            News is{' '}
            <span className="text-emerald-400/80">
              {divergence.sentiment_trend}
            </span>
            , but price is{' '}
            <span className="text-red-400">
              trending {divergence.price_trend}
            </span>
          </>
        )}
      </div>
      {isBullish ? (
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
      )}
    </div>
  );
}
