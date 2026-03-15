'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IFnOSnapshot, FnOSentiment } from '@/types/analytics';
import { T, C, S, pcrColor, basisColor, ivRankColor, ivColor } from './tokens';

interface Props {
  snapshot: IFnOSnapshot;
}

const SENTIMENT_CFG: Record<FnOSentiment, { text: string; bg: string; border: string; icon: typeof TrendingUp }> = {
  BULLISH: { text: C.bullish.text, bg: C.bullish.bg, border: C.bullish.border, icon: TrendingUp },
  BEARISH: { text: C.bearish.text, bg: C.bearish.bg, border: C.bearish.border, icon: TrendingDown },
  NEUTRAL: { text: C.neutral.text, bg: C.neutral.bg, border: C.neutral.border, icon: Minus },
};

// ─── Metric Pill ────────────────────────────────────────────────────

function Pill({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="min-w-0">
      <div className={cn(T.label, 'text-muted-foreground mb-0.5 whitespace-nowrap')}>
        {label}
      </div>
      <div className={cn('text-sm font-bold font-mono tabular-nums whitespace-nowrap', color)}>
        {value}
      </div>
      {sub && (
        <div className={cn(T.caption, 'mt-0.5 whitespace-nowrap')}>{sub}</div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-white/[0.08] shrink-0 hidden md:block" />;
}

// ─── HUD Strip ──────────────────────────────────────────────────────

export function MarketPulseCard({ snapshot }: Props) {
  const sentiment = snapshot.sentiment ?? 'NEUTRAL';
  const sty = SENTIMENT_CFG[sentiment];
  const SentimentIcon = sty.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        S.card,
        'px-4 py-3',
        'bg-gradient-to-r from-white/[0.02] to-transparent',
      )}
      role="region"
      aria-label="Market Pulse"
    >
      {/* Desktop: horizontal flex strip */}
      <div className="hidden md:flex items-start gap-5">
        {/* Hero — Underlying price */}
        <div className="shrink-0">
          <div className={cn(T.label, 'text-muted-foreground mb-0.5')}>
            {snapshot.underlying}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {snapshot.underlying_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          {snapshot.futures_price && (
            <div className={cn(T.caption, 'mt-0.5')}>
              Fut: {snapshot.futures_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <Divider />

        <Pill
          label="PCR"
          value={snapshot.pcr_oi?.toFixed(2) ?? '\u2014'}
          color={pcrColor(snapshot.pcr_oi)}
          sub={snapshot.pcr_volume != null ? `Vol: ${snapshot.pcr_volume.toFixed(2)}` : undefined}
        />

        <Divider />

        <Pill
          label="ATM IV"
          value={snapshot.atm_iv != null ? `${(snapshot.atm_iv * 100).toFixed(1)}%` : '\u2014'}
          color={ivColor(snapshot.atm_iv)}
          sub={snapshot.iv_skew != null ? `Skew: ${(snapshot.iv_skew * 100).toFixed(1)}%` : undefined}
        />

        <Pill
          label="IV Rank"
          value={snapshot.iv_rank != null ? snapshot.iv_rank.toFixed(0) : 'N/A'}
          color={ivRankColor(snapshot.iv_rank)}
          sub={snapshot.iv_percentile != null ? `P: ${snapshot.iv_percentile.toFixed(0)}%` : undefined}
        />

        <Divider />

        <Pill
          label="Max Pain"
          value={snapshot.max_pain_strike?.toLocaleString('en-IN') ?? '\u2014'}
          color="text-violet-400"
          sub={
            snapshot.max_pain_strike && snapshot.underlying_price
              ? `${snapshot.underlying_price > snapshot.max_pain_strike ? '+' : ''}${(snapshot.underlying_price - snapshot.max_pain_strike).toFixed(0)} pts`
              : undefined
          }
        />

        <Pill
          label="Basis"
          value={
            snapshot.futures_basis != null
              ? `${snapshot.futures_basis >= 0 ? '+' : ''}${snapshot.futures_basis.toFixed(1)}`
              : '\u2014'
          }
          color={basisColor(snapshot.futures_basis)}
          sub={snapshot.futures_basis_pct != null ? `${snapshot.futures_basis_pct.toFixed(3)}%` : undefined}
        />

        {/* Sentiment badge — rightmost */}
        <div className="ml-auto shrink-0 flex flex-col items-center justify-center">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
              sty.bg,
              sty.border,
            )}
            role="status"
            aria-label={`Market sentiment: ${sentiment}`}
          >
            <SentimentIcon className={cn('h-3.5 w-3.5', sty.text)} />
            <span className={cn(T.badge, sty.text)}>{sentiment}</span>
          </div>
          <div className={cn(T.legend, 'mt-1')}>
            {new Date(snapshot.computed_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      {/* Mobile: 2-row grid layout */}
      <div className="md:hidden space-y-3">
        {/* Row 1: Price hero + Sentiment badge */}
        <div className="flex items-start justify-between">
          <div>
            <div className={cn(T.label, 'text-muted-foreground mb-0.5')}>
              {snapshot.underlying}
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {snapshot.underlying_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            {snapshot.futures_price && (
              <div className={cn(T.caption, 'mt-0.5')}>
                Fut: {snapshot.futures_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
                sty.bg,
                sty.border,
              )}
              role="status"
              aria-label={`Market sentiment: ${sentiment}`}
            >
              <SentimentIcon className={cn('h-3.5 w-3.5', sty.text)} />
              <span className={cn(T.badge, sty.text)}>{sentiment}</span>
            </div>
            <div className={cn(T.legend, 'mt-1')}>
              {new Date(snapshot.computed_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Metrics in 3-column grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.04]">
          <Pill
            label="PCR"
            value={snapshot.pcr_oi?.toFixed(2) ?? '\u2014'}
            color={pcrColor(snapshot.pcr_oi)}
            sub={snapshot.pcr_volume != null ? `Vol: ${snapshot.pcr_volume.toFixed(2)}` : undefined}
          />
          <Pill
            label="ATM IV"
            value={snapshot.atm_iv != null ? `${(snapshot.atm_iv * 100).toFixed(1)}%` : '\u2014'}
            color={ivColor(snapshot.atm_iv)}
            sub={snapshot.iv_skew != null ? `Skew: ${(snapshot.iv_skew * 100).toFixed(1)}%` : undefined}
          />
          <Pill
            label="IV Rank"
            value={snapshot.iv_rank != null ? snapshot.iv_rank.toFixed(0) : 'N/A'}
            color={ivRankColor(snapshot.iv_rank)}
            sub={snapshot.iv_percentile != null ? `P: ${snapshot.iv_percentile.toFixed(0)}%` : undefined}
          />
          <Pill
            label="Max Pain"
            value={snapshot.max_pain_strike?.toLocaleString('en-IN') ?? '\u2014'}
            color="text-violet-400"
            sub={
              snapshot.max_pain_strike && snapshot.underlying_price
                ? `${snapshot.underlying_price > snapshot.max_pain_strike ? '+' : ''}${(snapshot.underlying_price - snapshot.max_pain_strike).toFixed(0)} pts`
                : undefined
            }
          />
          <Pill
            label="Basis"
            value={
              snapshot.futures_basis != null
                ? `${snapshot.futures_basis >= 0 ? '+' : ''}${snapshot.futures_basis.toFixed(1)}`
                : '\u2014'
            }
            color={basisColor(snapshot.futures_basis)}
            sub={snapshot.futures_basis_pct != null ? `${snapshot.futures_basis_pct.toFixed(3)}%` : undefined}
          />
        </div>
      </div>
    </motion.div>
  );
}
