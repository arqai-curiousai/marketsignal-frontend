'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ConfluenceIndicator } from './ConfluenceIndicator';
import type { IPatternInsight } from '@/types/stock';

interface PatternInsightCardProps {
  ticker: string;
  name?: string;
  exchange: string;
  insight: IPatternInsight | null;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  className?: string;
  onClick?: () => void;
}

export function PatternInsightCard({
  ticker,
  name,
  exchange,
  insight,
  price,
  change,
  changePercent,
  currency = 'INR',
  className,
  onClick,
}: PatternInsightCardProps) {
  const priceUp = (change ?? 0) >= 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-4',
        'transition-all hover:border-slate-700 hover:bg-slate-900',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{ticker}</h3>
          {name && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{name}</p>
          )}
          <span className="text-[10px] text-slate-600">{exchange}</span>
        </div>

        {insight && (
          <ConfluenceIndicator
            grade={insight.overallQualityGrade || 'C'}
            narrativeType={insight.narrativeType}
            patternCount={insight.activePatternCount}
          />
        )}
      </div>

      {/* Price */}
      {price !== undefined && (
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-100">
            {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency}{' '}
            {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {changePercent !== undefined && (
            <span
              className={cn(
                'text-xs font-medium',
                priceUp ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {priceUp ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {/* Narrative snippet */}
      {insight && (
        <div className="space-y-2">
          {/* Stance pills */}
          <div className="flex gap-2">
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-medium',
                insight.institutionalStance === 'accumulating'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : insight.institutionalStance === 'distributing'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-slate-500/10 text-slate-400',
              )}
            >
              Institutional: {insight.institutionalStance}
            </span>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-medium',
                insight.retailSentiment === 'bullish'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : insight.retailSentiment === 'bearish'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400',
              )}
            >
              Retail: {insight.retailSentiment}
            </span>
          </div>

          {/* Conviction bar */}
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-600 to-violet-400 transition-all duration-700"
                style={{ width: `${Math.round(insight.conviction * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">
              {Math.round(insight.conviction * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* No insight placeholder */}
      {!insight && (
        <div className="flex h-12 items-center justify-center">
          <span className="text-xs text-slate-600">Analyzing patterns...</span>
        </div>
      )}
    </div>
  );
}
