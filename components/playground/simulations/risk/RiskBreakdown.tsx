'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IRiskSubScore } from '@/types/simulation';
import { SUB_SCORE_COLORS } from './risk-tokens';

interface Props {
  subScores: IRiskSubScore[];
  className?: string;
}

// ─── Single bar row ──────────────────────────────────────────

function SubScoreBar({
  sub,
  index,
  expanded,
  onToggle,
}: {
  sub: IRiskSubScore;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const barColor = SUB_SCORE_COLORS[sub.name] ?? '#818CF8';
  const fillWidth = Math.max(2, Math.min(100, (sub.score / 99) * 100));

  return (
    <motion.div
      className="space-y-1"
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.06 + 0.1,
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 group cursor-pointer"
      >
        {/* Label + score */}
        <div className="flex items-center justify-between w-full min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: sub.score >= 70 ? '#F87171' : sub.score >= 40 ? '#FBBF24' : '#4ADE80',
            }}
          />
          <span className={cn(T.label, 'text-white/60 truncate')}>{sub.label}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(T.mono, 'text-white/70')}>
              {Math.round(sub.score)}/99
              <span className="text-[8px] text-white/20 font-mono ml-1">
                ({(sub.weight * 100).toFixed(0)}%)
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-3 w-3 text-white/25 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </div>
        </div>
      </button>

      {/* Bar */}
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={prefersReduced ? { width: `${fillWidth}%` } : { width: 0 }}
          animate={{ width: `${fillWidth}%` }}
          transition={{
            delay: index * 0.06 + 0.15,
            duration: 0.6,
            ease: 'easeOut',
          }}
        />
      </div>

      {/* Detail expansion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className={cn(T.caption, 'pt-1 pb-2 pl-1 leading-relaxed')}>
              {sub.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────

export function RiskBreakdown({ subScores, className }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sorted = [...subScores].sort((a, b) => b.score - a.score);

  return (
    <div className={cn(S.card, 'p-4 md:p-5 space-y-3', className)}>
      <h3 className={cn(T.heading, 'text-white/70')}>Risk Breakdown</h3>
      <div className="space-y-3">
        {sorted.map((sub, i) => (
          <SubScoreBar
            key={sub.name}
            sub={sub}
            index={i}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.04]">
        <span className={cn(T.label, 'text-white/30')}>Weighted Composite</span>
        <span className={cn(T.mono, 'text-white/50')}>
          {Math.round(sorted.reduce((sum, s) => sum + s.score * s.weight, 0))}/99
        </span>
      </div>
    </div>
  );
}
