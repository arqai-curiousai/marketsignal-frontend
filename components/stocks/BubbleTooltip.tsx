'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BubbleTooltipProps {
  ticker: string;
  name: string;
  sector: string;
  lastPrice: number | null;
  changePercent: number | null;
  x: number;
  y: number;
  visible: boolean;
}

export function BubbleTooltip({
  ticker,
  name,
  sector,
  lastPrice,
  changePercent,
  x,
  y,
  visible,
}: BubbleTooltipProps) {
  if (!visible) return null;

  const isPositive = (changePercent ?? 0) >= 0;
  const isNeutral = changePercent == null || Math.abs(changePercent) < 0.01;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: x,
        top: y - 10,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-white">{ticker}</span>
          {isNeutral ? (
            <Minus className="h-3 w-3 text-slate-400" />
          ) : isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
        </div>
        <div className="text-[11px] text-muted-foreground mb-2 leading-snug">{name}</div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Price</span>
          <span className="font-semibold text-white">
            {lastPrice != null ? `₹${lastPrice.toLocaleString()}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-0.5">
          <span className="text-muted-foreground">Change</span>
          <span
            className={cn(
              'font-semibold',
              isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {changePercent != null
              ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-0.5">
          <span className="text-muted-foreground">Sector</span>
          <span className="font-medium text-white/70">{sector || 'N/A'}</span>
        </div>

        {/* Tooltip arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-slate-900/95 border-r border-b border-white/10 rotate-45" />
      </div>
    </div>
  );
}
