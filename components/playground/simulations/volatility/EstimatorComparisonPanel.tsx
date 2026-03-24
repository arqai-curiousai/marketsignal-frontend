'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IEstimatorResult } from '@/types/simulation';
import { ESTIMATOR_COLORS, fmtVol } from './vol-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  estimators: IEstimatorResult[];
  recommended: string;
  className?: string;
}

// ─── Single estimator row ─────────────────────────────────────────

function EstimatorRow({
  est,
  isRecommended,
  maxValue,
  index,
}: {
  est: IEstimatorResult;
  isRecommended: boolean;
  maxValue: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = ESTIMATOR_COLORS[est.name] ?? '#94A3B8';
  const barWidth = est.currentValue != null && maxValue > 0
    ? Math.max(4, (est.currentValue / maxValue) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
    >
      <button
        type="button"
        className="w-full text-left group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 py-2">
          {/* Label */}
          <div className="w-[120px] shrink-0 flex items-center gap-1.5">
            <span className={cn(T.monoSm, 'text-white/70')}>{est.label}</span>
            {isRecommended && (
              <Award className="h-3 w-3 text-amber-400 shrink-0" />
            )}
          </div>

          {/* Bar */}
          <div className="flex-1 h-5 rounded-full bg-white/[0.03] overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{
                delay: index * 0.06 + 0.2,
                type: 'spring',
                stiffness: 80,
                damping: 15,
              }}
            />
          </div>

          {/* Value */}
          <span className={cn(T.mono, 'w-[56px] text-right text-white/80')}>
            {fmtVol(est.currentValue)}
          </span>

          {/* Efficiency badge */}
          <span
            className={cn(
              'text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0',
              est.efficiency >= 10 ? 'bg-purple-500/15 text-purple-400' :
              est.efficiency >= 5 ? 'bg-indigo-500/15 text-indigo-400' :
              'bg-slate-500/10 text-slate-400',
            )}
          >
            {est.efficiency}x
          </span>

          {/* Expand toggle */}
          <ChevronDown
            className={cn(
              'h-3 w-3 text-white/20 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Description */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[10px] text-muted-foreground pb-2 pl-[120px] ml-3 leading-relaxed">
              {est.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function EstimatorComparisonPanel({ estimators, recommended, className }: Props) {
  const maxValue = Math.max(
    ...estimators.map((e) => e.currentValue ?? 0),
    0.01,
  );

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Estimator Comparison</h4>
        <span className={cn(T.badge, 'text-white/30')}>
          21-Day Window
        </span>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {estimators.map((est, i) => (
          <EstimatorRow
            key={est.name}
            est={est}
            isRecommended={est.name === recommended}
            maxValue={maxValue}
            index={i}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/[0.04]">
        <Award className="h-3 w-3 text-amber-400" />
        <span className="text-[9px] text-white/30">
          Recommended for Indian markets with overnight gaps
        </span>
      </div>
    </motion.div>
  );
}
