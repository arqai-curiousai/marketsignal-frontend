'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IMonteCarloResult } from '@/types/simulation';
import { fmtPrice, fmtPct, fmtProb, fmtProbWords } from './mc-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';
import { formatNumber } from '@/src/lib/exchange/formatting';

interface Props {
  data: IMonteCarloResult;
  currentPrice: number;
  className?: string;
}

// ─── Outcome Card ────────────────────────────────────────────────

interface OutcomeCardProps {
  title: string;
  value: string;
  description: string;
  accent: 'emerald' | 'amber' | 'red' | 'indigo';
  progress?: number; // 0-1 for visual indicator
  index: number;
}

function OutcomeCard({ title, value, description, accent, progress, index }: OutcomeCardProps) {
  const accentMap = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      bar: 'bg-emerald-400',
      ring: 'border-emerald-500/20',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      bar: 'bg-amber-400',
      ring: 'border-amber-500/20',
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      bar: 'bg-red-400',
      ring: 'border-red-500/20',
    },
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      bar: 'bg-indigo-400',
      ring: 'border-indigo-500/20',
    },
  };

  const a = accentMap[accent];

  return (
    <motion.div
      className={cn(S.card, 'p-4')}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 + 0.15, type: 'spring', stiffness: 140, damping: 18 }}
    >
      <span className={cn(T.badge, 'text-white/35 uppercase tracking-wider')}>{title}</span>

      <div className="mt-2 mb-2">
        <span className={cn('text-xl font-bold font-mono tabular-nums', a.text)}>{value}</span>
      </div>

      {/* Progress bar */}
      {progress != null && (
        <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-2.5">
          <motion.div
            className={cn('h-full rounded-full', a.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(progress * 100, 2), 100)}%` }}
            transition={{ delay: index * 0.08 + 0.35, duration: 0.6, ease: 'easeOut' }}
            style={{ opacity: 0.7 }}
          />
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function OutcomeDashboard({ data, currentPrice, className }: Props) {
  const rm = data.riskMetrics;
  const stats = data.finalDistribution.stats;
  const bands = data.percentileBands;

  // Get P5 and P95 final prices
  const finalBand = bands.length > 0 ? bands[bands.length - 1] : null;
  const p5Price = finalBand?.p5 ?? 0;
  const p95Price = finalBand?.p95 ?? 0;

  const p5Return = currentPrice > 0 ? (p5Price - currentPrice) / currentPrice : 0;
  const p95Return = currentPrice > 0 ? (p95Price - currentPrice) / currentPrice : 0;

  const probProfitWords = fmtProbWords(rm.probProfit);
  const profitAccent = rm.probProfit >= 0.6 ? 'emerald' : rm.probProfit >= 0.4 ? 'amber' : 'red';

  const cards: OutcomeCardProps[] = [
    {
      title: 'Probability of Profit',
      value: fmtProb(rm.probProfit),
      description: `In ${probProfitWords} simulations, this stock gains value over the horizon period.`,
      accent: profitAccent,
      progress: rm.probProfit,
      index: 0,
    },
    {
      title: 'Expected Return',
      value: fmtPct(rm.expectedReturn),
      description: `The average outcome across all ${formatNumber(10000)} simulated paths. Median final price: ${fmtPrice(stats.median)}.`,
      accent: rm.expectedReturn >= 0 ? 'emerald' : 'red',
      progress: Math.min(Math.abs(rm.expectedReturn) * 2, 1),
      index: 1,
    },
    {
      title: 'Worst Case (P5)',
      value: fmtPrice(p5Price),
      description: `In the worst 5% of scenarios, the price drops to ${fmtPrice(p5Price)} (${fmtPct(p5Return)} from current).`,
      accent: 'red',
      progress: Math.min(Math.abs(p5Return), 1),
      index: 2,
    },
    {
      title: 'Best Case (P95)',
      value: fmtPrice(p95Price),
      description: `In the best 5% of scenarios, the price rises to ${fmtPrice(p95Price)} (${fmtPct(p95Return)} from current).`,
      accent: 'indigo',
      progress: Math.min(Math.abs(p95Return), 1),
      index: 3,
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {cards.map((card) => (
        <OutcomeCard key={card.title} {...card} />
      ))}
    </div>
  );
}
