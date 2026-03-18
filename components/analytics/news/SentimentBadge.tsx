'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getSentimentColor } from './constants';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SentimentBadgeProps {
  sentiment: string | null;
  score?: number | null;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ sentiment, score, size = 'sm' }: SentimentBadgeProps) {
  if (!sentiment) return null;
  const color = getSentimentColor(sentiment, score);
  const label = sentiment.replace('_', ' ');
  const hasScore = score != null && score !== undefined;

  // Determine arrow direction
  const arrow = hasScore
    ? (score! > 0.05 ? ' \u25B2' : score! < -0.05 ? ' \u25BC' : '')
    : '';

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium capitalize',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      )}
      style={{
        backgroundColor: `${color}12`,
        color,
        border: `1px solid ${color}20`,
      }}
    >
      <span
        className="inline-block rounded-full shrink-0"
        style={{
          width: size === 'sm' ? 4 : 5,
          height: size === 'sm' ? 4 : 5,
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}40`,
        }}
      />
      {label}{arrow}
    </span>
  );

  if (!hasScore) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="px-2.5 py-1.5 text-[10px] font-mono tabular-nums bg-[#1a1f2e] border-white/[0.1]"
        >
          <span style={{ color }}>{score! > 0 ? '+' : ''}{score!.toFixed(2)}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
