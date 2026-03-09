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
  BarChart3,
  Fingerprint,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPatternV2 } from '@/types/analytics';

const categoryIcons: Record<
  IPatternV2['category'],
  React.ComponentType<{ className?: string }>
> = {
  chart: TrendingUp,
  momentum: Gauge,
  volatility: Activity,
  volume: BarChart3,
  regime: GitBranch,
  matrix_profile: Fingerprint,
  seasonality: Calendar,
};

function gradeStyles(grade: string) {
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

const directionConfig = {
  bullish: { color: 'bg-emerald-500/15 text-emerald-400', label: 'Bullish' },
  bearish: { color: 'bg-rose-500/15 text-rose-400', label: 'Bearish' },
  neutral: { color: 'bg-amber-500/15 text-amber-400', label: 'Neutral' },
} as const;

function formatPatternName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function confidenceBarColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-400';
  if (confidence >= 0.6) return 'bg-amber-400';
  return 'bg-gray-400';
}

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface PatternCardProps {
  pattern: IPatternV2;
}

export function PatternCard({ pattern }: PatternCardProps) {
  const CategoryIcon = categoryIcons[pattern.category] ?? Activity;
  const dir = directionConfig[pattern.direction];
  const confPct = Math.round(pattern.confidence * 100);
  const winPct = Math.round(pattern.historical_win_rate * 100);

  return (
    <motion.div
      className={cn(
        'p-4 rounded-xl border border-white/[0.06] bg-[#111827]',
        'hover:border-white/[0.12] transition-all duration-200'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <CategoryIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            {formatPatternName(pattern.type)}
          </span>
        </div>
        <span
          className={cn(
            'shrink-0 text-[11px] font-bold font-mono rounded-md px-2 py-0.5',
            gradeStyles(pattern.quality_grade)
          )}
        >
          {pattern.quality_grade}
        </span>
      </div>

      {/* Direction badge */}
      <div className="mb-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5',
            dir.color
          )}
        >
          {pattern.direction === 'bullish' && (
            <TrendingUp className="h-3 w-3" />
          )}
          {pattern.direction === 'bearish' && (
            <TrendingDown className="h-3 w-3" />
          )}
          {pattern.direction === 'neutral' && (
            <Minus className="h-3 w-3" />
          )}
          {dir.label}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-gray-500">Confidence</span>
          <span className="font-mono text-white">{confPct}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', confidenceBarColor(pattern.confidence))}
            style={{ width: `${confPct}%` }}
          />
        </div>
      </div>

      {/* Win rate */}
      <div className="flex items-center justify-between text-[11px] mb-3">
        <span className="text-gray-500">Win Rate</span>
        <span className="font-mono text-white">{winPct}%</span>
      </div>

      {/* Validation checkmarks */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px]',
            pattern.volume_confirmed ? 'text-emerald-400' : 'text-gray-600'
          )}
        >
          {pattern.volume_confirmed ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          Volume
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px]',
            pattern.trend_aligned ? 'text-emerald-400' : 'text-gray-600'
          )}
        >
          {pattern.trend_aligned ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          Trend
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px]',
            pattern.multi_tf_aligned ? 'text-emerald-400' : 'text-gray-600'
          )}
        >
          {pattern.multi_tf_aligned ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          Multi-TF
        </span>
      </div>

      {/* Price target & Stop loss */}
      {(pattern.price_target !== null || pattern.stop_loss !== null) && (
        <div className="flex items-center gap-4 mb-3 text-[11px]">
          {pattern.price_target !== null && (
            <div>
              <span className="text-gray-500">Target </span>
              <span className="font-mono text-emerald-400">
                {formatINR(pattern.price_target)}
              </span>
            </div>
          )}
          {pattern.stop_loss !== null && (
            <div>
              <span className="text-gray-500">Stop </span>
              <span className="font-mono text-rose-400">
                {formatINR(pattern.stop_loss)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {pattern.description && (
        <p className="text-[11px] leading-relaxed text-gray-500 line-clamp-3">
          {pattern.description}
        </p>
      )}
    </motion.div>
  );
}
