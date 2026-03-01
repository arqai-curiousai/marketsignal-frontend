'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { SignalDot } from './SignalDot';
import { getSignalLabel } from '@/types/playground';
import type { IAlgoSignal } from '@/types/playground';

interface OutcomeCardProps {
  signal: IAlgoSignal;
  index?: number;
}

export function OutcomeCard({ signal, index = 0 }: OutcomeCardProps) {
  const isCorrect = signal.outcomeCorrect;
  const pnl = signal.pnlPercent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'rounded-xl border p-4 backdrop-blur-sm transition-colors',
        isCorrect === true
          ? 'border-green-500/30 bg-green-500/5'
          : isCorrect === false
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-white/10 bg-white/5'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-white">{signal.ticker}</span>
          <SignalDot signal={signal.signal} size="sm" pulse={false} />
          <span className="text-xs text-muted-foreground capitalize">
            {signal.algoName.replace(/_/g, ' ')}
          </span>
        </div>
        {isCorrect !== null && (
          isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )
        )}
      </div>

      {/* Prediction vs Outcome side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Predicted */}
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Predicted
          </p>
          <div className="flex items-center gap-1.5 mb-1">
            {signal.signal === 'buy' && <ArrowUp className="h-3.5 w-3.5 text-green-400" />}
            {signal.signal === 'sell' && <ArrowDown className="h-3.5 w-3.5 text-red-400" />}
            {signal.signal === 'hold' && <Minus className="h-3.5 w-3.5 text-white/60" />}
            <span className="text-sm font-semibold text-white">{getSignalLabel(signal.signal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {signal.priceAtSignal != null ? `$${signal.priceAtSignal.toFixed(2)}` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {(signal.confidence * 100).toFixed(0)}% confidence
          </p>
        </div>

        {/* Actual */}
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Outcome
          </p>
          <p className="text-sm font-semibold text-white mb-1">
            {signal.outcomePrice != null ? `$${signal.outcomePrice.toFixed(2)}` : 'Pending'}
          </p>
          {signal.pnlPercent != null && (
            <p
              className={cn(
                'text-xs font-mono font-semibold',
                pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-white/60'
              )}
            >
              {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Reason */}
      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">{signal.reason}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Outcomes list
// ---------------------------------------------------------------------------

interface OutcomeListProps {
  outcomes: IAlgoSignal[];
}

export function OutcomeList({ outcomes }: OutcomeListProps) {
  if (outcomes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        No evaluated outcomes yet. Signals are evaluated after 30 minutes.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {outcomes.map((o, i) => (
        <OutcomeCard key={o.id} signal={o} index={i} />
      ))}
    </div>
  );
}
