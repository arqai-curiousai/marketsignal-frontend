'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TickerPillProps {
  ticker: string;
  onClick?: (ticker: string) => void;
  active?: boolean;
}

export function TickerPill({ ticker, onClick, active }: TickerPillProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(ticker);
      }}
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold',
        'transition-all duration-150',
        active
          ? 'bg-brand-blue/30 text-brand-blue border border-brand-blue/40'
          : 'bg-white/[0.06] text-muted-foreground border border-white/10 hover:bg-white/[0.1] hover:text-white hover:scale-105',
        onClick && 'cursor-pointer'
      )}
    >
      {ticker}
    </button>
  );
}
