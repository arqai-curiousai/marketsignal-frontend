'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { T, C, fmtNum } from './tokens';

type DealerRegime = 'positive_gamma' | 'negative_gamma';

interface Props {
  dealerRegime: DealerRegime | null;
  zeroGammaLevel: number | null;
  callWallStrike: number | null;
  putWallStrike: number | null;
  gexPredictedRangeLow: number | null;
  gexPredictedRangeHigh: number | null;
  underlyingPrice: number;
  netGex: number | null;
}

const REGIME_CONFIG: Record<DealerRegime, {
  label: string;
  symbol: string;
  textColor: string;
  bgColor: string;
  stripGradient: string;
}> = {
  positive_gamma: {
    label: 'Stabilizing',
    symbol: '+\u0393',
    textColor: C.bullish.text,
    bgColor: C.bullish.bg,
    stripGradient: 'from-emerald-500/[0.04] via-transparent to-emerald-500/[0.02]',
  },
  negative_gamma: {
    label: 'Amplifying',
    symbol: '\u2212\u0393',
    textColor: C.bearish.text,
    bgColor: C.bearish.bg,
    stripGradient: 'from-red-500/[0.04] via-transparent to-red-500/[0.02]',
  },
};

/** Compute % position of a value within [lo, hi], clamped to 0-100. */
function pct(value: number, lo: number, hi: number): number {
  if (hi === lo) return 50;
  return Math.max(0, Math.min(100, ((value - lo) / (hi - lo)) * 100));
}

export function DealerRegimeStrip({
  dealerRegime,
  zeroGammaLevel,
  callWallStrike,
  putWallStrike,
  gexPredictedRangeLow,
  gexPredictedRangeHigh,
  underlyingPrice,
  netGex: _netGex,
}: Props) {
  // ── Null state ──────────────────────────────────────────────────────
  if (
    dealerRegime == null &&
    callWallStrike == null &&
    putWallStrike == null
  ) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-[40px] rounded-lg',
          'border border-white/[0.04] bg-white/[0.015]',
        )}
      >
        <span className={cn(T.caption, 'italic')}>Awaiting data\u2026</span>
      </div>
    );
  }

  const regime = dealerRegime ? REGIME_CONFIG[dealerRegime] : null;

  // ── Range bar boundaries ────────────────────────────────────────────
  const lo = putWallStrike ?? underlyingPrice * 0.98;
  const hi = callWallStrike ?? underlyingPrice * 1.02;
  const spotPct = pct(underlyingPrice, lo, hi);
  const zeroPct = zeroGammaLevel != null ? pct(zeroGammaLevel, lo, hi) : null;
  const rangeLoPct =
    gexPredictedRangeLow != null ? pct(gexPredictedRangeLow, lo, hi) : null;
  const rangeHiPct =
    gexPredictedRangeHigh != null ? pct(gexPredictedRangeHigh, lo, hi) : null;

  const hasRange = rangeLoPct != null && rangeHiPct != null;

  return (
    <div
      className={cn(
        'flex items-center h-[40px] rounded-lg px-3 gap-3',
        'border border-white/[0.04]',
        regime ? `bg-gradient-to-r ${regime.stripGradient}` : 'bg-white/[0.015]',
      )}
    >
      {/* ── Regime badge ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-md shrink-0',
          'border',
          regime ? regime.bgColor : 'bg-white/[0.04]',
          regime ? `border-white/[0.06]` : 'border-white/[0.04]',
        )}
      >
        <span
          className={cn(
            T.badge,
            'tracking-wide',
            regime ? regime.textColor : 'text-muted-foreground',
          )}
        >
          {regime ? `${regime.symbol} ${regime.label}` : '\u2014'}
        </span>
      </div>

      {/* ── Range bar ────────────────────────────────────────────────── */}
      <div className="flex-1 relative h-[14px] flex items-center min-w-0">
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-white/[0.08]" />

        {/* Put wall label — hidden on very narrow screens */}
        {putWallStrike != null && (
          <span
            className="absolute -bottom-[1px] left-0 text-[8px] font-mono text-white/20 leading-none hidden sm:block"
            style={{ transform: 'translateY(100%)' }}
          >
            {fmtNum(putWallStrike, 0)}
          </span>
        )}

        {/* Call wall label — hidden on very narrow screens */}
        {callWallStrike != null && (
          <span
            className="absolute -bottom-[1px] right-0 text-[8px] font-mono text-white/20 leading-none hidden sm:block"
            style={{ transform: 'translateY(100%)' }}
          >
            {fmtNum(callWallStrike, 0)}
          </span>
        )}

        {/* Predicted range highlight */}
        {hasRange && (
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-[8px] rounded-sm',
              dealerRegime === 'positive_gamma'
                ? 'bg-emerald-400/15'
                : dealerRegime === 'negative_gamma'
                  ? 'bg-red-400/15'
                  : 'bg-white/10',
            )}
            style={{
              left: `${rangeLoPct}%`,
              width: `${rangeHiPct - rangeLoPct}%`,
            }}
          />
        )}

        {/* Zero gamma tick */}
        {zeroPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[10px] rounded-full bg-amber-400/60"
            style={{ left: `${zeroPct}%` }}
          />
        )}

        {/* Spot price dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.4)]"
          style={{ left: `${spotPct}%`, marginLeft: '-3px' }}
        />
      </div>

      {/* ── Predicted range text ─────────────────────────────────────── */}
      <div className="shrink-0 text-right">
        {gexPredictedRangeLow != null && gexPredictedRangeHigh != null ? (
          <span className={cn(T.monoSm, 'text-white/50')}>
            {fmtNum(gexPredictedRangeLow, 0)}
            {' \u2014 '}
            {fmtNum(gexPredictedRangeHigh, 0)}
          </span>
        ) : (
          <span className={cn(T.monoSm, 'text-white/20')}>{'\u2014'}</span>
        )}
      </div>
    </div>
  );
}
