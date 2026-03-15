'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { T, C, S } from './tokens';

interface Props {
  vix: number | null;
  vixChange: number | null;
}

function vixRegime(vix: number): { label: string; color: string; bg: string } {
  if (vix < 13) return { label: 'Low Vol', color: C.bullish.text, bg: C.bullish.bg };
  if (vix < 18) return { label: 'Normal', color: C.neutral.text, bg: C.neutral.bg };
  if (vix < 24) return { label: 'Elevated', color: 'text-orange-400', bg: 'bg-orange-500/10' };
  return { label: 'Crisis', color: C.bearish.text, bg: C.bearish.bg };
}

export function VIXRegimeCard({ vix, vixChange }: Props) {
  if (vix == null) return null;

  const regime = vixRegime(vix);
  const changeColor = vixChange != null && vixChange > 0 ? C.bearish.text : C.bullish.text;

  return (
    <div className={cn(S.inner, 'px-4 py-3 flex items-center gap-4')}>
      <div>
        <div className={cn(T.label, 'text-muted-foreground mb-0.5')}>India VIX</div>
        <div className="text-lg font-bold font-mono tabular-nums text-white">
          {vix.toFixed(2)}
        </div>
      </div>
      <div
        className={cn(
          'px-2 py-0.5 rounded-full text-[9px] font-semibold',
          regime.color,
          regime.bg,
        )}
      >
        {regime.label}
      </div>
      {vixChange != null && (
        <div className={cn(T.monoSm, changeColor)}>
          {vixChange > 0 ? '+' : ''}
          {vixChange.toFixed(2)}
        </div>
      )}
    </div>
  );
}
