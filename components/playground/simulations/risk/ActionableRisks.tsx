'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IRiskSuggestion } from '@/types/simulation';

interface Props {
  suggestions: IRiskSuggestion[];
  className?: string;
}

// ─── Single suggestion card ──────────────────────────────────

function SuggestionCard({
  suggestion,
  index,
}: {
  suggestion: IRiskSuggestion;
  index: number;
}) {
  const prefersReduced = useReducedMotion();
  const impactAbs = Math.abs(suggestion.estimatedChange);
  const isReduction = suggestion.estimatedChange < 0;

  return (
    <motion.div
      className={cn(S.inner, 'p-3 space-y-2')}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.07 + 0.1,
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }}
    >
      {/* Header: action + impact badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400/60 shrink-0 mt-0.5" />
          <span className={cn(T.mono, 'text-white/75 leading-relaxed')}>
            {suggestion.action}
          </span>
        </div>
        <span
          className={cn(
            T.badge,
            'shrink-0 px-2 py-0.5 rounded-full',
            isReduction
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-red-400 bg-red-500/10 border border-red-500/20',
          )}
        >
          <ArrowDownRight
            className={cn(
              'inline h-2.5 w-2.5 mr-0.5',
              !isReduction && 'rotate-180',
            )}
          />
          {isReduction ? '-' : '+'}
          {impactAbs} pts
        </span>
      </div>

      {/* Description */}
      <p className={cn(T.caption, 'leading-relaxed pl-5')}>
        {suggestion.impactDescription}
      </p>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────

export function ActionableRisks({ suggestions, className }: Props) {
  // Sort by impact magnitude (largest reduction first)
  const sorted = [...suggestions].sort(
    (a, b) => Math.abs(b.estimatedChange) - Math.abs(a.estimatedChange),
  );

  return (
    <div className={cn(S.card, 'p-4 md:p-5', className)}>
      <h3 className={cn(T.heading, 'text-white/70 mb-3')}>Actionable Insights</h3>
      {sorted.length === 0 ? (
        <p className={cn(T.caption, 'text-center py-6')}>
          No suggestions available for the current portfolio.
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((s, i) => (
            <SuggestionCard key={s.action} suggestion={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
