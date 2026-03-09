'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IFnOSnapshot, FnOSentiment } from '@/types/analytics';

interface Props {
  snapshot: IFnOSnapshot;
}

const SENTIMENT_STYLES: Record<FnOSentiment, { bg: string; text: string; border: string; icon: typeof TrendingUp }> = {
  BULLISH: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: TrendingUp },
  BEARISH: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: TrendingDown },
  NEUTRAL: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: Minus },
};

function pcrColor(pcr: number | null): string {
  if (pcr == null) return 'text-muted-foreground';
  if (pcr > 1.3) return 'text-red-400';        // extreme greed / overbought puts
  if (pcr > 1.0) return 'text-emerald-400';     // mildly bullish
  if (pcr < 0.7) return 'text-red-400';         // extreme fear
  return 'text-yellow-400';                      // neutral zone
}

function basisColor(basis: number | null): string {
  if (basis == null) return 'text-muted-foreground';
  return basis >= 0 ? 'text-emerald-400' : 'text-red-400';
}

export function MarketPulseCard({ snapshot }: Props) {
  const sentiment = snapshot.sentiment ?? 'NEUTRAL';
  const sty = SENTIMENT_STYLES[sentiment];
  const SentimentIcon = sty.icon;

  const metrics = [
    {
      label: snapshot.underlying,
      value: snapshot.underlying_price.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      color: 'text-white',
      sub: snapshot.futures_price
        ? `Fut: ${snapshot.futures_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        : undefined,
    },
    {
      label: 'PCR (OI)',
      value: snapshot.pcr_oi?.toFixed(2) ?? '—',
      color: pcrColor(snapshot.pcr_oi),
      sub: snapshot.pcr_volume != null ? `Vol: ${snapshot.pcr_volume.toFixed(2)}` : undefined,
    },
    {
      label: 'Max Pain',
      value: snapshot.max_pain_strike?.toLocaleString('en-IN') ?? '—',
      color: 'text-brand-blue',
      sub: snapshot.max_pain_strike && snapshot.underlying_price
        ? `${snapshot.underlying_price > snapshot.max_pain_strike ? '+' : ''}${(snapshot.underlying_price - snapshot.max_pain_strike).toFixed(0)} pts`
        : undefined,
    },
    {
      label: 'ATM IV',
      value: snapshot.atm_iv != null ? `${(snapshot.atm_iv * 100).toFixed(1)}%` : '—',
      color: snapshot.atm_iv != null && snapshot.atm_iv > 0.25 ? 'text-orange-400' : 'text-emerald-400',
      sub: snapshot.iv_skew != null ? `Skew: ${(snapshot.iv_skew * 100).toFixed(1)}%` : undefined,
    },
    {
      label: 'Basis',
      value: snapshot.futures_basis != null ? `${snapshot.futures_basis >= 0 ? '+' : ''}${snapshot.futures_basis.toFixed(1)}` : '—',
      color: basisColor(snapshot.futures_basis),
      sub: snapshot.futures_basis_pct != null ? `${snapshot.futures_basis_pct.toFixed(3)}%` : undefined,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4',
        sty.border,
        'bg-gradient-to-r from-white/[0.02] to-transparent',
      )}
    >
      <div className="flex flex-wrap items-stretch gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {m.label}
            </div>
            <div className={cn('text-lg font-bold font-mono', m.color)}>
              {m.value}
            </div>
            {m.sub && (
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
            )}
          </div>
        ))}

        {/* Sentiment badge */}
        <div
          className={cn(
            'flex-1 min-w-[100px] px-3 py-2 rounded-lg border flex flex-col items-center justify-center',
            sty.bg,
            sty.border,
          )}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Sentiment
          </div>
          <div className="flex items-center gap-1.5">
            <SentimentIcon className={cn('h-4 w-4', sty.text)} />
            <span className={cn('text-sm font-bold', sty.text)}>{sentiment}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Zap className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">
              {new Date(snapshot.computed_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
