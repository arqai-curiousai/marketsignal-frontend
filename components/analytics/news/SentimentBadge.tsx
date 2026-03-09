'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getSentimentColor } from './constants';

interface SentimentBadgeProps {
  sentiment: string | null;
  score?: number | null;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ sentiment, score, size = 'sm' }: SentimentBadgeProps) {
  if (!sentiment) return null;
  const color = getSentimentColor(sentiment, score);
  const label = sentiment.replace('_', ' ');

  return (
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
    </span>
  );
}
