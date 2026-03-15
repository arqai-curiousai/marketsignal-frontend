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

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium capitalize',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: size === 'sm' ? 5 : 6,
          height: size === 'sm' ? 5 : 6,
          backgroundColor: color,
        }}
      />
      {label}
      {/* Intensity bar — fills proportionally to |score| */}
      {hasScore && (
        <span
          className="inline-block rounded-full ml-0.5"
          style={{
            width: Math.max(8, Math.abs(score!) * 20),
            height: 2,
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
      )}
    </span>
  );

  if (!hasScore) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="px-2 py-1 text-[10px] font-mono tabular-nums"
        >
          {score! > 0 ? '+' : ''}{score!.toFixed(2)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
