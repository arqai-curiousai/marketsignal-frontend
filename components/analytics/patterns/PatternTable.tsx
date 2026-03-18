'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Gauge,
  GitBranch,
  BarChart3,
  Fingerprint,
  CandlestickChart,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPatternV2 } from '@/types/analytics';

const categoryIcons: Record<
  IPatternV2['category'],
  React.ComponentType<{ className?: string }>
> = {
  candlestick: CandlestickChart,
  chart: TrendingUp,
  momentum: Gauge,
  volatility: Activity,
  volume: BarChart3,
  regime: GitBranch,
  matrix_profile: Fingerprint,
};

function formatPatternName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function confidenceBarColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-400';
  if (confidence >= 0.6) return 'bg-amber-400';
  return 'bg-gray-400';
}

function winRateBarColor(winPct: number): string {
  if (winPct >= 65) return 'bg-emerald-400';
  if (winPct >= 50) return 'bg-amber-400';
  return 'bg-gray-400';
}

const directionAccent = {
  bullish: 'pattern-row-bullish',
  bearish: 'pattern-row-bearish',
  neutral: 'pattern-row-neutral',
} as const;

const directionDot = {
  bullish: 'bg-emerald-400',
  bearish: 'bg-rose-400',
  neutral: 'bg-amber-400',
} as const;

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface PatternTableProps {
  patterns: IPatternV2[];
  currentPrice?: number | null;
  onPatternClick?: (pattern: IPatternV2) => void;
  highlightedId?: string | null;
}

export function PatternTable({ patterns, currentPrice, onPatternClick, highlightedId }: PatternTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-expand and scroll to highlighted row (from chart click)
  useEffect(() => {
    if (!highlightedId) return;
    setExpandedId(highlightedId);
    // Scroll into view after a tick for DOM to settle
    const timer = setTimeout(() => {
      document.getElementById(`pattern-row-${highlightedId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden divide-y divide-white/[0.04]">
      {patterns.map((pattern, i) => {
        const id = pattern.id || `p-${i}`;
        const isExpanded = expandedId === id;
        const CategoryIcon = categoryIcons[pattern.category] ?? Activity;
        const confPct = Math.round(pattern.confidence * 100);
        const winPct = Math.round(pattern.historical_win_rate * 100);

        return (
          <motion.div
            key={id}
            id={`pattern-row-${id}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            className={cn(
              directionAccent[pattern.direction],
              highlightedId === id && 'ring-1 ring-blue-500/40 bg-blue-500/[0.04] transition-all duration-300',
            )}
          >
            {/* Collapsed Row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : id)}
              className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
            >
              {/* Direction dot */}
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', directionDot[pattern.direction])} />

              {/* Category icon */}
              <CategoryIcon className="h-3.5 w-3.5 text-gray-500 shrink-0 hidden md:block" />

              {/* Pattern name */}
              <span className="text-xs font-medium text-white truncate min-w-0 flex-1">
                {formatPatternName(pattern.type)}
              </span>

              {/* Grade */}
              <span className={cn('text-[10px] font-bold font-mono rounded px-1.5 py-0.5 shrink-0', gradeStyle(pattern.quality_grade))}>
                {pattern.quality_grade}
              </span>

              {/* Confidence bar — hidden on mobile */}
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-gray-600 w-7 text-right font-mono">{confPct}%</span>
                <div className="w-10 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', confidenceBarColor(pattern.confidence))}
                    style={{ width: `${confPct}%` }}
                  />
                </div>
              </div>

              {/* Win rate bar — hidden on mobile */}
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-gray-600 w-7 text-right font-mono">{winPct}%</span>
                <div className="w-10 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', winRateBarColor(winPct))}
                    style={{ width: `${winPct}%` }}
                  />
                </div>
              </div>

              {/* Validation dots — hidden on mobile */}
              <div className="hidden md:flex items-center gap-1 shrink-0">
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', pattern.volume_confirmed ? 'bg-emerald-400' : 'bg-gray-700')}
                  title={pattern.volume_confirmed ? 'Volume confirmed' : 'No volume confirmation'}
                />
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', pattern.trend_aligned ? 'bg-emerald-400' : 'bg-gray-700')}
                  title={pattern.trend_aligned ? 'Trend aligned' : 'Trend not aligned'}
                />
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', pattern.multi_tf_aligned ? 'bg-emerald-400' : 'bg-gray-700')}
                  title={pattern.multi_tf_aligned ? 'Multi-TF aligned' : 'Multi-TF not aligned'}
                />
              </div>

              {/* Locate on chart */}
              {onPatternClick && (
                <span
                  role="button"
                  tabIndex={0}
                  title="Show on chart"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPatternClick(pattern);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onPatternClick(pattern);
                    }
                  }}
                  className="p-1 rounded hover:bg-blue-500/10 text-gray-600 hover:text-blue-400 transition-colors shrink-0 cursor-pointer"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                </span>
              )}

              {/* Chevron */}
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-gray-600 shrink-0 transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
              />
            </button>

            {/* Expanded Detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 md:px-5 pb-3 pt-1 space-y-3 border-t border-white/[0.04]">
                    {/* Direction + Confidence + Win Rate (visible on mobile in expanded) */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5',
                        pattern.direction === 'bullish' ? 'bg-emerald-500/15 text-emerald-400' :
                        pattern.direction === 'bearish' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-amber-500/15 text-amber-400'
                      )}>
                        {pattern.direction === 'bullish' && <TrendingUp className="h-3 w-3" />}
                        {pattern.direction === 'bearish' && <TrendingDown className="h-3 w-3" />}
                        {pattern.direction === 'neutral' && <Minus className="h-3 w-3" />}
                        {pattern.direction.charAt(0).toUpperCase() + pattern.direction.slice(1)}
                      </span>

                      <span className="text-[11px] text-gray-500">
                        Conf: <span className="text-white font-mono">{confPct}%</span>
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Win: <span className="text-white font-mono">{winPct}%</span>
                      </span>
                    </div>

                    {/* Validation labels */}
                    <div className="flex items-center gap-3 flex-wrap text-[11px]">
                      <span className={pattern.volume_confirmed ? 'text-emerald-400' : 'text-gray-600'}>
                        {pattern.volume_confirmed ? '✓' : '✗'} Volume
                      </span>
                      <span className={pattern.trend_aligned ? 'text-emerald-400' : 'text-gray-600'}>
                        {pattern.trend_aligned ? '✓' : '✗'} Trend
                      </span>
                      <span className={pattern.multi_tf_aligned ? 'text-emerald-400' : 'text-gray-600'}>
                        {pattern.multi_tf_aligned ? '✓' : '✗'} Multi-TF
                      </span>
                    </div>

                    {/* Price target & Stop loss */}
                    {(pattern.price_target !== null || pattern.stop_loss !== null) && (
                      <div className="flex items-center gap-4 text-[11px]">
                        {pattern.price_target !== null && (
                          <div>
                            <span className="text-gray-500">Target </span>
                            <span className="font-mono text-emerald-400">
                              {formatINR(pattern.price_target)}
                            </span>
                            {currentPrice != null && currentPrice > 0 && (
                              <span className="text-[10px] text-gray-600 ml-1">
                                ({((pattern.price_target - currentPrice) / currentPrice * 100) >= 0 ? '+' : ''}
                                {((pattern.price_target - currentPrice) / currentPrice * 100).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        )}
                        {pattern.stop_loss !== null && (
                          <div>
                            <span className="text-gray-500">Stop </span>
                            <span className="font-mono text-rose-400">
                              {formatINR(pattern.stop_loss)}
                            </span>
                            {currentPrice != null && currentPrice > 0 && (
                              <span className="text-[10px] text-gray-600 ml-1">
                                ({((pattern.stop_loss - currentPrice) / currentPrice * 100) >= 0 ? '+' : ''}
                                {((pattern.stop_loss - currentPrice) / currentPrice * 100).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {pattern.description && (
                      <p className="text-[11px] leading-relaxed text-gray-500">
                        {pattern.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
