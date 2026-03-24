'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IQualityScore } from '@/types/simulation';
import { fmtQuality } from './mc-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  narrative: string;
  qualityScore: IQualityScore | null;
  className?: string;
}

export function NarrativeSummary({ narrative, qualityScore, className }: Props) {
  return (
    <motion.div
      className={cn(S.card, 'p-4 flex flex-col', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 140, damping: 18 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Simulation Insight</h4>
      </div>

      {/* Narrative text */}
      <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{narrative}</p>

      {/* Quality badge */}
      {qualityScore && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
          <span className="text-[9px] text-white/30">Simulation Quality</span>
          <span
            className={cn(
              'text-[9px] font-semibold px-2 py-0.5 rounded-full border',
              qualityScore.compositeScore >= 80
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : qualityScore.compositeScore >= 60
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : qualityScore.compositeScore >= 40
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400',
            )}
          >
            {fmtQuality(qualityScore.compositeScore)} ({qualityScore.compositeScore}/100)
          </span>
        </div>
      )}
    </motion.div>
  );
}
