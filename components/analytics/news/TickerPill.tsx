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
        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold',
        'transition-all duration-150 border',
        active
          ? 'bg-brand-blue/20 text-brand-blue border-brand-blue/30'
          : 'bg-white/[0.04] text-white/45 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70 hover:border-white/[0.12]',
        onClick && 'cursor-pointer'
      )}
    >
      {ticker}
    </button>
  );
}
