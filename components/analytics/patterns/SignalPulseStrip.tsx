'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IMTFAlignment } from '@/types/analytics';

interface SignalPulseStripProps {
  overallSignal: 'bullish' | 'bearish' | 'neutral';
  overallQuality: { score: number; grade: string };
  patternCount: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  momentum: {
    rsi: { value: number; zone: string };
    macd: { histogram: number; signal: string; strengthening: boolean };
    adx: { value: number; trend: string; direction: string };
  };
  mtfAlignment?: IMTFAlignment | null;
  mtfLoading?: boolean;
}

const signalConfig = {
  bullish: { orbClass: 'signal-orb--buy', label: 'Bullish', color: 'text-emerald-400' },
  bearish: { orbClass: 'signal-orb--sell', label: 'Bearish', color: 'text-rose-400' },
  neutral: { orbClass: 'signal-orb--hold', label: 'Neutral', color: 'text-gray-300' },
} as const;

function gradeStyle(grade: string) {
  switch (grade) {
    case 'A+':
      return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30';
    case 'A':
      return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20';
    case 'B':
      return 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20';
  }
}

const alignmentConfig = {
  full: { Icon: CheckCircle2, color: 'text-emerald-400', label: 'Full' },
  partial: { Icon: AlertTriangle, color: 'text-amber-400', label: 'Partial' },
  conflicting: { Icon: XCircle, color: 'text-rose-400', label: 'Conflicting' },
  insufficient_data: { Icon: Minus, color: 'text-gray-500', label: 'N/A' },
} as const;

const Separator = () => <div className="w-px h-5 bg-white/[0.06] shrink-0" />;

export function SignalPulseStrip({
  overallSignal,
  overallQuality,
  patternCount,
  bullishCount,
  bearishCount,
  neutralCount,
  momentum,
  mtfAlignment,
  mtfLoading,
}: SignalPulseStripProps) {
  const normalizedSignal = (overallSignal?.toLowerCase() ?? 'neutral') as keyof typeof signalConfig;
  const sig = signalConfig[normalizedSignal] ?? signalConfig.neutral;

  const rsiValue = momentum.rsi.value;
  const rsiPct = Math.min(100, Math.max(0, rsiValue));
  const isOverbought = rsiValue >= 70;
  const isOversold = rsiValue <= 30;

  const alignment = mtfAlignment?.alignment ?? 'insufficient_data';
  const mtfConf = alignmentConfig[alignment] ?? alignmentConfig.insufficient_data;
  const MtfIcon = mtfConf.Icon;

  return (
    <div className="flex items-center gap-3 md:gap-4 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#111827] overflow-x-auto scrollbar-none">
      {/* Direction Orb + Signal */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={cn('signal-orb', sig.orbClass)} />
        <div className="flex flex-col">
          <span className={cn('text-sm font-semibold leading-tight', sig.color)}>
            {sig.label}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <span className="inline-block h-1 w-1 rounded-full bg-emerald-400" />
              {bullishCount}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block h-1 w-1 rounded-full bg-rose-400" />
              {bearishCount}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block h-1 w-1 rounded-full bg-amber-400" />
              {neutralCount}
            </span>
            <span className="text-gray-600">· {patternCount}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Grade */}
      <div className="shrink-0">
        <span className={cn('text-sm font-bold font-mono rounded-md px-2 py-0.5', gradeStyle(overallQuality.grade))}>
          {overallQuality.grade}
        </span>
      </div>

      {/* RSI Inline Gauge — desktop only */}
      <div className="hidden md:contents">
        <Separator />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">RSI</span>
          <div className="relative w-16 h-1 bg-white/[0.06] rounded-full">
            <div className="absolute inset-y-0 left-0 w-[30%] bg-emerald-500/10 rounded-l-full" />
            <div className="absolute inset-y-0 right-0 w-[30%] bg-rose-500/10 rounded-r-full" />
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border border-[#111827]',
                isOversold ? 'bg-emerald-400' : isOverbought ? 'bg-rose-400' : 'bg-white'
              )}
              style={{ left: `clamp(0px, calc(${rsiPct}% - 4px), calc(100% - 8px))` }}
            />
          </div>
          <span
            className={cn(
              'text-[11px] font-mono font-semibold tabular-nums',
              isOversold ? 'text-emerald-400' : isOverbought ? 'text-rose-400' : 'text-white'
            )}
          >
            {rsiValue.toFixed(0)}
          </span>
        </div>

        {/* MACD */}
        <Separator />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">MACD</span>
          {momentum.macd.signal === 'bullish' ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : momentum.macd.signal === 'bearish' ? (
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>
      </div>

      <Separator />

      {/* MTF Alignment */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Layers className="h-3 w-3 text-gray-500" />
        {mtfLoading ? (
          <span className="text-[11px] text-gray-600">...</span>
        ) : (
          <span className={cn('flex items-center gap-1 text-[11px] font-medium', mtfConf.color)}>
            <MtfIcon className="h-3 w-3" />
            {mtfConf.label}
          </span>
        )}
      </div>
    </div>
  );
}
