'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/src/lib/exchange/formatting';
import type { StrategySignal } from '@/types/strategy';
import { SignalDot } from '../SignalDot';
import { ConfidenceRing } from './ConfidenceRing';
import { CountdownTimer } from './CountdownTimer';
import { NIFTY50_TICKERS, PIPELINE_INTERVAL_MS } from './constants';
import {
  S,
  T,
  L,
  signalColor,
  fmtPct,
  fmtNum,
} from './tokens';

interface LiveSignalPanelProps {
  ticker: string;
  signal: StrategySignal | null;
  confidence: number;
  positionSizePct: number;
  priceAtSignal: number | null;
  currentPrice: number | null;
  reasoning: string;
  riskMetrics: Record<string, number>;
  generatedAt: string | null;
  pipelineHealth: Record<string, boolean>;
  onTickerChange: (ticker: string) => void;
}

function PriceDelta({
  from,
  to,
}: {
  from: number | null;
  to: number | null;
}) {
  if (from == null || to == null) return <span className={T.mono}>{'\u2014'}</span>;
  const delta = ((to - from) / from) * 100;
  const isUp = delta >= 0;
  return (
    <span
      className={cn(
        T.mono,
        isUp ? 'text-emerald-400' : 'text-red-400',
      )}
    >
      {isUp ? '+' : ''}{delta.toFixed(2)}%
    </span>
  );
}

function HealthDots({
  health,
}: {
  health: Record<string, boolean>;
}) {
  const entries = Object.entries(health);
  if (entries.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      {entries.map(([name, ok]) => (
        <div key={name} className="flex items-center gap-1">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              ok ? 'bg-emerald-400' : 'bg-red-400',
            )}
          />
          <span className={cn(T.legend, 'capitalize')}>{name}</span>
        </div>
      ))}
    </div>
  );
}

function RiskGrid({ metrics }: { metrics: Record<string, number> }) {
  const labels: Record<string, string> = {
    iv_rank: 'IV Rank',
    regime: 'Regime',
    kelly_pct: 'Kelly %',
    volatility: 'Volatility',
    sharpe: 'Sharpe',
    drawdown: 'Drawdown',
  };

  const entries = Object.entries(metrics).slice(0, 6);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {entries.map(([key, val]) => (
        <div key={key} className={cn(S.inner, 'px-2 py-1.5 text-center')}>
          <div className={cn(T.label, 'text-white/30')}>
            {labels[key] ?? key}
          </div>
          <div className={cn(T.mono, 'text-white/80')}>
            {typeof val === 'number' ? fmtNum(val) : String(val)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LiveSignalPanel({
  ticker,
  signal,
  confidence,
  positionSizePct,
  priceAtSignal,
  currentPrice,
  reasoning,
  riskMetrics,
  generatedAt,
  pipelineHealth,
  onTickerChange,
}: LiveSignalPanelProps) {
  const [showFullReasoning, setShowFullReasoning] = useState(false);
  const sc = signal ? signalColor(signal) : signalColor('hold');
  const mappedSignal = signal ?? 'hold';

  return (
    <div className={cn(S.card, L.pad, 'flex flex-col gap-4')}>
      {/* Ticker selector */}
      <div className="flex items-center justify-between">
        <Select value={ticker} onValueChange={onTickerChange}>
          <SelectTrigger className="w-[160px] border-white/[0.06] bg-white/[0.02]">
            <SelectValue placeholder="Select ticker" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[240px]">
              {NIFTY50_TICKERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        {generatedAt && (
          <span className={cn(T.caption, 'text-white/25')}>
            {formatDateTime(generatedAt, 'NSE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* Signal + Confidence */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2',
              sc.bg,
              sc.border,
              'border',
            )}
          >
            <SignalDot signal={mappedSignal} size="lg" pulse />
            <span className={cn('text-lg font-bold', sc.text)}>
              {signal ? signal.toUpperCase() : '\u2014'}
            </span>
          </div>
        </div>
        <ConfidenceRing
          value={confidence}
          size={80}
          strokeWidth={5}
          color={sc.hex}
          label="Confidence"
        />
      </div>

      {/* Price info */}
      <div className={cn(S.inner, 'flex items-center justify-between px-3 py-2')}>
        <div className="flex flex-col">
          <span className={cn(T.label, 'text-white/30')}>Signal Price</span>
          <span className={T.mono}>
            {priceAtSignal != null ? fmtNum(priceAtSignal) : '\u2014'}
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-white/20" />
        <div className="flex flex-col">
          <span className={cn(T.label, 'text-white/30')}>Current</span>
          <span className={T.mono}>
            {currentPrice != null ? fmtNum(currentPrice) : '\u2014'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={cn(T.label, 'text-white/30')}>Delta</span>
          <PriceDelta from={priceAtSignal} to={currentPrice} />
        </div>
      </div>

      {/* Position size bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={cn(T.label, 'text-white/30')}>Position Size</span>
          <span className={cn(T.mono, 'text-white/60')}>
            {fmtPct(positionSizePct / 100, 1)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: sc.hex }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(positionSizePct, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Risk metrics */}
      <RiskGrid metrics={riskMetrics} />

      {/* Reasoning */}
      {reasoning && (
        <div>
          <span className={cn(T.label, 'text-white/30 mb-1 block')}>
            Reasoning
          </span>
          <p
            className={cn(
              T.caption,
              'text-white/50 leading-relaxed',
              !showFullReasoning && 'line-clamp-3',
            )}
          >
            {reasoning}
          </p>
          {reasoning.length > 200 && (
            <button
              aria-expanded={showFullReasoning}
              onClick={() => setShowFullReasoning((v) => !v)}
              className={cn(
                T.caption,
                'mt-1 text-white/30 hover:text-white/50 inline-flex items-center gap-0.5',
              )}
            >
              {showFullReasoning ? 'Show less' : 'Show more'}
              <ChevronRight
                className={cn(
                  'h-3 w-3 transition-transform',
                  showFullReasoning && 'rotate-90',
                )}
              />
            </button>
          )}
        </div>
      )}

      {/* Pipeline health + countdown */}
      <div className={cn('flex items-center justify-between border-t pt-3', S.divider)}>
        <HealthDots health={pipelineHealth} />
        <CountdownTimer intervalMs={PIPELINE_INTERVAL_MS} />
      </div>
    </div>
  );
}
