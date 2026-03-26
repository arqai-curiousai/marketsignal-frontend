'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Filter } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/src/lib/exchange/formatting';
import type { IStrategySignal, StrategySignal } from '@/types/strategy';
import { S, T, SIGNAL, signalColor, fmtNum, fmtPct } from './tokens';

interface SignalTimelineProps {
  signals: IStrategySignal[];
  onSignalClick?: (signal: IStrategySignal) => void;
  className?: string;
}

type FilterType = 'all' | StrategySignal;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'BUY', value: 'buy' },
  { label: 'SELL', value: 'sell' },
  { label: 'HOLD', value: 'hold' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDate(iso: string): string {
  return formatDateTime(iso, 'NSE', { day: '2-digit', month: 'short' });
}

function SignalDotIcon({
  signal,
  outcomeCorrect,
}: {
  signal: StrategySignal;
  outcomeCorrect: boolean | null;
}) {
  const colors = signalColor(signal);
  return (
    <span className="relative inline-flex items-center justify-center">
      <span
        className={cn('h-3 w-3 rounded-full shadow-lg', colors.bg)}
        style={{
          backgroundColor: colors.hex,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
      />
      {outcomeCorrect === true && (
        <CheckCircle2 className="absolute -right-1 -top-1 h-2.5 w-2.5 text-emerald-400" />
      )}
      {outcomeCorrect === false && (
        <XCircle className="absolute -right-1 -top-1 h-2.5 w-2.5 text-red-400" />
      )}
    </span>
  );
}

function SignalTooltipContent({ signal }: { signal: IStrategySignal }) {
  const colors = signalColor(signal.signal);
  const pnlColor =
    signal.pnlPercent != null && signal.pnlPercent >= 0
      ? 'text-emerald-400'
      : 'text-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={cn('font-semibold', colors.text)}>
          {signal.signal.toUpperCase()}
        </span>
        <span className={T.mono}>{signal.ticker}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className={T.caption}>Confidence</span>
        <span className={T.mono}>{fmtPct(signal.confidence)}</span>
        <span className={T.caption}>Price</span>
        <span className={T.mono}>{fmtNum(signal.priceAtSignal)}</span>
        {signal.pnlPercent != null && (
          <>
            <span className={T.caption}>PnL</span>
            <span className={cn(T.mono, pnlColor)}>
              {fmtPct(signal.pnlPercent / 100, 2)}
            </span>
          </>
        )}
        {signal.outcomeCorrect != null && (
          <>
            <span className={T.caption}>Outcome</span>
            <span className={T.mono}>
              {signal.outcomeCorrect ? 'Correct' : 'Wrong'}
            </span>
          </>
        )}
      </div>
      <div className={T.caption}>{formatDate(signal.generatedAt)}</div>
    </div>
  );
}

export function SignalTimeline({
  signals,
  onSignalClick,
  className,
}: SignalTimelineProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [tickerSearch, setTickerSearch] = useState('');

  const filtered = useMemo(() => {
    let result = signals;
    if (filter !== 'all') {
      result = result.filter((s) => s.signal === filter);
    }
    if (tickerSearch.trim()) {
      const q = tickerSearch.trim().toUpperCase();
      result = result.filter((s) => s.ticker.toUpperCase().includes(q));
    }
    return result;
  }, [signals, filter, tickerSearch]);

  if (signals.length === 0) {
    return (
      <div className={cn(S.glass, 'p-6 text-center', className)}>
        <p className={T.caption}>No signals yet</p>
      </div>
    );
  }

  return (
    <div className={cn(S.glass, 'p-4 space-y-3', className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-2.5 py-0.5 rounded-full transition-colors',
              T.badge,
              filter === f.value
                ? f.value === 'buy'
                  ? cn(SIGNAL.buy.bg, SIGNAL.buy.text, SIGNAL.buy.border, 'border')
                  : f.value === 'sell'
                    ? cn(SIGNAL.sell.bg, SIGNAL.sell.text, SIGNAL.sell.border, 'border')
                    : f.value === 'hold'
                      ? cn(SIGNAL.hold.bg, SIGNAL.hold.text, SIGNAL.hold.border, 'border')
                      : 'bg-white/10 text-white border border-white/20'
                : 'text-muted-foreground hover:text-white/60'
            )}
          >
            {f.label}
          </button>
        ))}
        <input
          type="text"
          placeholder="Ticker..."
          value={tickerSearch}
          onChange={(e) => setTickerSearch(e.target.value)}
          aria-label="Search tickers"
          className={cn(
            'ml-auto w-20 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5',
            T.monoSm,
            'placeholder:text-white/20 focus:outline-none focus:border-white/[0.12]'
          )}
        />
      </div>

      {/* Desktop: horizontal scroll */}
      <div className="hidden sm:block">
        <ScrollArea className="w-full">
          <TooltipProvider delayDuration={150}>
            <div className="flex gap-2 pb-2" style={{ minHeight: 120 }}>
              {filtered.map((sig, i) => (
                <Tooltip key={sig.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      onClick={() => onSignalClick?.(sig)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg',
                        'hover:bg-white/[0.04] transition-colors cursor-pointer',
                        'min-w-[52px]'
                      )}
                    >
                      <SignalDotIcon
                        signal={sig.signal}
                        outcomeCorrect={sig.outcomeCorrect}
                      />
                      <span
                        className={cn(
                          T.monoSm,
                          'text-muted-foreground leading-none truncate max-w-[48px]'
                        )}
                      >
                        {sig.ticker}
                      </span>
                      <span className={cn('text-[9px] text-muted-foreground leading-none')}>
                        {formatTime(sig.generatedAt)}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[rgba(10,15,28,0.96)] border-white/[0.08] shadow-xl"
                  >
                    <SignalTooltipContent signal={sig} />
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile: vertical list */}
      <div className="block sm:hidden space-y-1">
        {filtered.map((sig, i) => {
          const colors = signalColor(sig.signal);
          const pnlColor =
            sig.pnlPercent != null && sig.pnlPercent >= 0
              ? 'text-emerald-400'
              : 'text-red-400';
          return (
            <motion.button
              key={sig.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => onSignalClick?.(sig)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
                'hover:bg-white/[0.04] transition-colors text-left'
              )}
            >
              <SignalDotIcon
                signal={sig.signal}
                outcomeCorrect={sig.outcomeCorrect}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={T.mono}>{sig.ticker}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      T.badge,
                      colors.text,
                      colors.bg,
                      colors.border,
                      'border'
                    )}
                  >
                    {sig.signal.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {formatDate(sig.generatedAt)} {formatTime(sig.generatedAt)}
                </span>
              </div>
              {sig.pnlPercent != null && (
                <span className={cn(T.monoSm, pnlColor)}>
                  {fmtPct(sig.pnlPercent / 100, 2)}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className={cn(T.caption, 'text-center py-4')}>
          No signals match filters
        </p>
      )}
    </div>
  );
}
