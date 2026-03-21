'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Activity,
  Gauge,
} from 'lucide-react';
import type { ICurrencyTechnicals, ICurrencyVolatility } from '@/src/types/analytics';

interface CurrencyPulseStripProps {
  technicals: ICurrencyTechnicals | null;
  volatility?: ICurrencyVolatility | null;
  activeSessions?: number;
}

const SIGNAL_STYLES: Record<string, { orb: string; text: string; label: string }> = {
  BUY: { orb: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]', text: 'text-green-400', label: 'Bullish' },
  SELL: { orb: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]', text: 'text-red-400', label: 'Bearish' },
  NEUTRAL: { orb: 'bg-white/40 shadow-[0_0_6px_rgba(255,255,255,0.2)]', text: 'text-white/60', label: 'Neutral' },
};

const REGIME_STYLES: Record<string, string> = {
  LOW: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  NORMAL: 'bg-white/[0.06] text-white/60 border-white/10',
  HIGH: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  EXTREME: 'bg-red-400/10 text-red-400 border-red-400/20',
};

function Separator() {
  return <div className="hidden sm:block w-px h-5 bg-white/[0.06]" />;
}

export function CurrencyPulseStrip({ technicals, volatility, activeSessions }: CurrencyPulseStripProps) {
  if (!technicals) return null;

  const signal = technicals.summary || 'NEUTRAL';
  const style = SIGNAL_STYLES[signal] || SIGNAL_STYLES.NEUTRAL;

  const rsi = technicals.rsi;
  const macd = technicals.macd;
  const rsiValue = rsi?.value ?? 50;
  const macdHist = macd?.histogram ?? 0;
  const regime = volatility?.regime || 'NORMAL';
  const regimeStyle = REGIME_STYLES[regime] || REGIME_STYLES.NORMAL;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md overflow-x-auto whitespace-nowrap shadow-[0_2px_16px_rgba(0,0,0,0.15)]">
      {/* Signal Orb + Direction */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${style.orb}`} />
        <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
      </div>

      <Separator />

      {/* RSI Inline Gauge */}
      <div className="hidden sm:flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-white/[0.06] relative overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${
                rsiValue > 70 ? 'bg-red-400' : rsiValue < 30 ? 'bg-green-400' : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(100, rsiValue)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums w-5">{Math.round(rsiValue)}</span>
        </div>
      </div>

      <Separator />

      {/* MACD Direction */}
      <div className="hidden sm:flex items-center gap-1.5">
        {macdHist > 0 ? (
          <TrendingUp className="h-3.5 w-3.5 text-green-400" />
        ) : macdHist < 0 ? (
          <TrendingDown className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <Minus className="h-3.5 w-3.5 text-white/40" />
        )}
        <span className="text-[10px] text-muted-foreground">MACD</span>
      </div>

      <Separator />

      {/* Volatility Regime */}
      <div className="flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${regimeStyle}`}>
          {regime}
        </span>
      </div>

      <Separator />

      {/* Active Sessions */}
      {activeSessions !== undefined && (
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {activeSessions} session{activeSessions !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
