'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Gauge,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatternKPICardsProps {
  overallSignal: 'bullish' | 'bearish' | 'neutral';
  overallQuality: { score: number; grade: string };
  patternCount: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  regime: {
    current: string;
    hurst_exponent: number;
    hurst_classification: string;
    last_changepoint_index: number | null;
  };
  momentum: {
    rsi: { value: number; zone: string };
    macd: { histogram: number; signal: string; strengthening: boolean };
    adx: { value: number; trend: string; direction: string };
  };
}

const signalConfig = {
  bullish: { color: 'text-emerald-400', Icon: TrendingUp, label: 'Bullish' },
  bearish: { color: 'text-rose-400', Icon: TrendingDown, label: 'Bearish' },
  neutral: { color: 'text-amber-400', Icon: Minus, label: 'Neutral' },
} as const;

const regimeDotColor: Record<string, string> = {
  bull: 'bg-emerald-400',
  bear: 'bg-rose-400',
  sideways: 'bg-amber-400',
};

const regimeLabel: Record<string, string> = {
  bull: 'Bull',
  bear: 'Bear',
  sideways: 'Sideways',
};

const hurstLabel: Record<string, string> = {
  trending: 'Trending',
  mean_reverting: 'Mean-Reverting',
  random_walk: 'Random Walk',
};

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

export function PatternKPICards({
  overallSignal,
  overallQuality,
  patternCount,
  bullishCount,
  bearishCount,
  neutralCount,
  regime,
  momentum,
}: PatternKPICardsProps) {
  const normalizedSignal = (overallSignal?.toLowerCase() ?? 'neutral') as keyof typeof signalConfig;
  const sig = signalConfig[normalizedSignal] ?? signalConfig.neutral;
  const SigIcon = sig.Icon;

  const rsiPct = Math.min(100, Math.max(0, momentum.rsi.value));
  const isOverbought = momentum.rsi.value >= 70;
  const isOversold = momentum.rsi.value <= 30;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Card 2: Market Regime */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
      >
        <p className={cardTitle}>
          <GitBranch className="inline h-3 w-3 mr-1 -mt-px" />
          Market Regime
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full',
              regimeDotColor[regime.current] ?? 'bg-gray-400'
            )}
          />
          <span className="text-lg font-semibold text-white">
            {regimeLabel[regime.current] ?? regime.current}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Hurst</span>
            <span className="text-2xl font-semibold font-mono text-white">
              {regime.hurst_exponent.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-gray-500">
            {hurstLabel[regime.hurst_classification] ?? regime.hurst_classification}
          </p>
        </div>
      </motion.div>

      {/* Card 3: Quality Score */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
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
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                overallQuality.score >= 80
                  ? 'bg-emerald-400'
                  : overallQuality.score >= 60
                    ? 'bg-amber-400'
                    : 'bg-gray-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, overallQuality.score))}%` }}
              transition={{ duration: 0.6, delay: 0.15 }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-right">
            {Math.round(overallQuality.score)}%
          </p>
        </div>
      </motion.div>

      {/* Card 4: Momentum Snapshot */}
      <motion.div
        className={cardBase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
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
                isOversold ? 'text-rose-400' : isOverbought ? 'text-emerald-400' : 'text-white'
              )}
            >
              {momentum.rsi.value.toFixed(1)}
            </span>
          </div>
          <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            {/* Oversold zone (0-30) */}
            <div className="absolute inset-y-0 left-0 w-[30%] bg-rose-500/10 rounded-l-full" />
            {/* Overbought zone (70-100) */}
            <div className="absolute inset-y-0 right-0 w-[30%] bg-emerald-500/10 rounded-r-full" />
            {/* Indicator dot */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-[#111827]',
                isOversold
                  ? 'bg-rose-400'
                  : isOverbought
                    ? 'bg-emerald-400'
                    : 'bg-white'
              )}
              style={{ left: `calc(${rsiPct}% - 5px)` }}
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
    </div>
  );
}
