'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Gauge,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IMTFAlignment } from '@/types/analytics';

interface PatternKPICardsProps {
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
  bullish: { color: 'text-emerald-400', Icon: TrendingUp, label: 'Bullish' },
  bearish: { color: 'text-rose-400', Icon: TrendingDown, label: 'Bearish' },
  neutral: { color: 'text-amber-400', Icon: Minus, label: 'Neutral' },
} as const;

function gradeStyles(grade: string) {
  switch (grade) {
    case 'A+':
      return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 rounded-lg px-3 py-1';
    case 'A':
      return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 rounded-lg px-3 py-1';
    case 'B':
      return 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 rounded-lg px-3 py-1';
    default:
      return 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20 rounded-lg px-3 py-1';
  }
}

const cardBase = 'p-4 rounded-xl border border-white/[0.06] bg-[#111827]';
const cardTitle = 'text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2';

const alignmentConfig = {
  full: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30', label: 'Full' },
  partial: { color: 'text-amber-400', bg: 'bg-amber-500/15', ring: 'ring-amber-500/30', label: 'Partial' },
  conflicting: { color: 'text-rose-400', bg: 'bg-rose-500/15', ring: 'ring-rose-500/30', label: 'Conflicting' },
  insufficient_data: { color: 'text-gray-400', bg: 'bg-gray-500/15', ring: 'ring-gray-500/30', label: 'N/A' },
} as const;

const tfSignalDot: Record<string, string> = {
  bullish: 'bg-emerald-400',
  bearish: 'bg-rose-400',
  neutral: 'bg-amber-400',
  unavailable: 'bg-gray-600',
};

const tfSignalLabel: Record<string, string> = {
  bullish: 'Bull',
  bearish: 'Bear',
  neutral: 'Neutral',
  unavailable: '--',
};

export function PatternKPICards({
  overallSignal,
  overallQuality,
  patternCount,
  bullishCount,
  bearishCount,
  neutralCount,
  momentum,
  mtfAlignment,
  mtfLoading,
}: PatternKPICardsProps) {
  const normalizedSignal = (overallSignal?.toLowerCase() ?? 'neutral') as keyof typeof signalConfig;
  const sig = signalConfig[normalizedSignal] ?? signalConfig.neutral;
  const SigIcon = sig.Icon;

  const rsiPct = Math.min(100, Math.max(0, momentum.rsi.value));
  const isOverbought = momentum.rsi.value >= 70;
  const isOversold = momentum.rsi.value <= 30;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Card 1: Signal Summary */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0 }}
      >
        <p className={cardTitle}>Signal Summary</p>
        <div className="flex items-center gap-2 mb-2">
          <SigIcon className={cn('h-5 w-5', sig.color)} />
          <span className={cn('text-2xl font-semibold font-mono', sig.color)}>
            {sig.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {bullishCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
            {bearishCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            {neutralCount}
          </span>
          <span className="ml-auto text-gray-500">
            {patternCount} pattern{patternCount !== 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      {/* Card 2: Quality Score */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
      >
        <p className={cardTitle}>
          <Gauge className="inline h-3 w-3 mr-1 -mt-px" />
          Quality Score
        </p>
        <div className="flex items-center gap-3 mb-3">
          <motion.span
            className={cn('text-2xl font-bold font-mono', gradeStyles(overallQuality.grade))}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            {overallQuality.grade}
          </motion.span>
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                overallQuality.score >= 0.80
                  ? 'bg-gradient-to-r from-emerald-500/80 to-emerald-400/60'
                  : overallQuality.score >= 0.60
                    ? 'bg-gradient-to-r from-amber-500/80 to-amber-400/60'
                    : 'bg-gray-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, overallQuality.score * 100))}%` }}
              transition={{ duration: 0.6, delay: 0.15 }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-right">
            {Math.round(overallQuality.score * 100)}%
          </p>
        </div>
      </motion.div>

      {/* Card 3: Momentum Snapshot */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        <p className={cardTitle}>
          <Activity className="inline h-3 w-3 mr-1 -mt-px" />
          Momentum
        </p>

        {/* RSI */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">RSI</span>
            <span
              className={cn(
                'font-mono font-semibold',
                isOversold ? 'text-emerald-400' : isOverbought ? 'text-rose-400' : 'text-white'
              )}
            >
              {momentum.rsi.value.toFixed(1)}
            </span>
          </div>
          <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            {/* Oversold zone (0-30) — bullish opportunity */}
            <div className="absolute inset-y-0 left-0 w-[30%] bg-emerald-500/10 rounded-l-full" />
            {/* Overbought zone (70-100) — bearish warning */}
            <div className="absolute inset-y-0 right-0 w-[30%] bg-rose-500/10 rounded-r-full" />
            {/* Indicator dot */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-[#111827]',
                isOversold
                  ? 'bg-emerald-400'
                  : isOverbought
                    ? 'bg-rose-400'
                    : 'bg-white'
              )}
              style={{ left: `clamp(2px, calc(${rsiPct}% - 5px), calc(100% - 12px))` }}
            />
          </div>
        </div>

        {/* MACD + ADX row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">MACD</span>
            {momentum.macd.signal === 'bullish' ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : momentum.macd.signal === 'bearish' ? (
              <TrendingDown className="h-3 w-3 text-rose-400" />
            ) : (
              <Minus className="h-3 w-3 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">ADX</span>
            <span
              className={cn(
                'font-mono text-[11px]',
                momentum.adx.value >= 25 ? 'text-white' : 'text-gray-500'
              )}
            >
              {momentum.adx.value.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-500">
              {momentum.adx.trend}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 4: MTF Alignment */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
      >
        <p className={cardTitle}>
          <Layers className="inline h-3 w-3 mr-1 -mt-px" />
          MTF Alignment
        </p>
        {mtfAlignment && mtfAlignment.alignment !== 'insufficient_data' ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  'text-lg font-semibold px-3 py-1 rounded-lg ring-1',
                  alignmentConfig[mtfAlignment.alignment].bg,
                  alignmentConfig[mtfAlignment.alignment].color,
                  alignmentConfig[mtfAlignment.alignment].ring,
                )}
              >
                {alignmentConfig[mtfAlignment.alignment].label}
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(mtfAlignment.timeframes).map(([tf, info]) => (
                <div key={tf} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 uppercase font-mono">{tf}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full',
                        tfSignalDot[info.signal] ?? 'bg-gray-600',
                      )}
                    />
                    <span className="text-gray-300 text-[11px]">
                      {tfSignalLabel[info.signal] ?? info.signal}
                    </span>
                    <span className="text-gray-600 text-[10px]">
                      ({info.pattern_count})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-16">
            <span className="text-xs text-gray-600">
              {mtfAlignment ? 'Insufficient data' : mtfLoading ? 'Loading...' : 'Unavailable'}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
