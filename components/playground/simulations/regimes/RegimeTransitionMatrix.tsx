'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IRegimeTransitionCell, IRegimeState } from '@/types/simulation';
import { getRegimeColor, fmtProb } from './regime-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  matrix: IRegimeTransitionCell[][];
  states: IRegimeState[];
  className?: string;
}

// ─── Cell Component ──────────────────────────────────────────────

function MatrixCell({
  cell,
  rowIndex,
  colIndex,
}: {
  cell: IRegimeTransitionCell;
  rowIndex: number;
  colIndex: number;
}) {
  const [hovered, setHovered] = useState(false);
  const isSelf = cell.fromLabel === cell.toLabel;
  const color = getRegimeColor(cell.fromLabel);
  const toColor = getRegimeColor(cell.toLabel);

  // Intensity: stronger color for higher probability
  const intensity = Math.max(0.04, Math.min(0.5, cell.probability * 0.6));
  const bgColor = isSelf
    ? `rgba(${color.rgb}, ${intensity})`
    : `rgba(${toColor.rgb}, ${intensity * 0.6})`;

  const textOpacity = cell.probability > 0.1 ? 0.85 : 0.5;
  const delay = rowIndex * 0.08 + colIndex * 0.08 + 0.2;

  return (
    <div className="relative">
      <motion.div
        className={cn(
          'aspect-square flex items-center justify-center rounded-lg cursor-default',
          'transition-shadow duration-200',
        )}
        style={{ backgroundColor: bgColor }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay,
          type: 'spring',
          stiffness: 140,
          damping: 18,
        }}
        whileHover={{ scale: 1.08 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        <span
          className={cn(T.monoSm, 'font-semibold')}
          style={{ opacity: textOpacity, color: cell.probability > 0.3 ? '#fff' : 'rgba(255,255,255,0.7)' }}
        >
          {fmtProb(cell.probability)}
        </span>
      </motion.div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && cell.description && (
          <motion.div
            className={cn(
              'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
              'rounded-lg border border-white/[0.08] bg-black/95 backdrop-blur-sm',
              'px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none',
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-[10px] text-white/60 mb-0.5">
              {getRegimeColor(cell.fromLabel).label} &rarr; {getRegimeColor(cell.toLabel).label}
            </p>
            <p className="text-[10px] text-white/80 font-semibold">
              {fmtProb(cell.probability)}
            </p>
            <p className="text-[9px] text-white/40 max-w-[200px] whitespace-normal mt-0.5">
              {cell.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function RegimeTransitionMatrix({ matrix, states, className }: Props) {
  if (!matrix.length || !states.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No transition matrix available.
        </p>
      </div>
    );
  }

  const n = states.length;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className={cn(T.heading, 'text-white/80')}>Transition Matrix</h4>
        <span className={cn(T.badge, 'text-white/30')}>
          Markov Probabilities
        </span>
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[200px]">
          {/* Column headers */}
          <div
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `48px repeat(${n}, 1fr)` }}
          >
            {/* Empty corner cell */}
            <div className="flex items-end justify-center pb-1">
              <span className="text-[8px] text-white/20">From \ To</span>
            </div>
            {states.map((state) => {
              const color = getRegimeColor(state.label);
              return (
                <div
                  key={`col-${state.label}`}
                  className="flex items-center justify-center"
                >
                  <span
                    className={cn(T.badge, 'px-2 py-0.5 rounded-full')}
                    style={{ color: color.hex }}
                  >
                    {state.displayName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {matrix.map((row, ri) => {
            const rowState = states[ri];
            if (!rowState) return null;
            const rowColor = getRegimeColor(rowState.label);

            return (
              <div
                key={`row-${rowState.label}`}
                className="grid gap-2 mb-2"
                style={{ gridTemplateColumns: `48px repeat(${n}, 1fr)` }}
              >
                {/* Row header */}
                <div className="flex items-center justify-center">
                  <span
                    className={cn(T.badge, 'px-2 py-0.5 rounded-full')}
                    style={{ color: rowColor.hex }}
                  >
                    {rowState.displayName}
                  </span>
                </div>
                {/* Cells */}
                {row.map((cell, ci) => (
                  <MatrixCell
                    key={`${cell.fromLabel}-${cell.toLabel}`}
                    cell={cell}
                    rowIndex={ri}
                    colIndex={ci}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2 border-t border-white/[0.04]">
        <p className="text-[9px] text-white/25 text-center">
          Each row sums to 100%. Diagonal cells show regime persistence.
        </p>
      </div>
    </motion.div>
  );
}
