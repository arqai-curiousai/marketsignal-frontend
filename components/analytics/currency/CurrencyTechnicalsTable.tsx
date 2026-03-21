'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ICurrencyTechnicals } from '@/src/types/analytics';

interface CurrencyTechnicalsTableProps {
  technicals: ICurrencyTechnicals | null;
}

interface IndicatorRow {
  name: string;
  value: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  details?: { label: string; value: string }[];
}

const SIGNAL_BADGE: Record<string, { bg: string; text: string }> = {
  BUY: { bg: 'bg-green-400/10 border-green-400/20', text: 'text-green-400' },
  SELL: { bg: 'bg-red-400/10 border-red-400/20', text: 'text-red-400' },
  NEUTRAL: { bg: 'bg-white/[0.06] border-white/10', text: 'text-white/50' },
};

function buildIndicatorRows(t: ICurrencyTechnicals): IndicatorRow[] {
  const rows: IndicatorRow[] = [];

  // RSI
  if (t.rsi) {
    const rsiSignal = t.rsi.value > 70 ? 'SELL' : t.rsi.value < 30 ? 'BUY' : 'NEUTRAL';
    rows.push({
      name: 'RSI (14)',
      value: t.rsi.value.toFixed(1),
      signal: rsiSignal as 'BUY' | 'SELL' | 'NEUTRAL',
      details: [
        { label: 'Zone', value: t.rsi.signal },
      ],
    });
  }

  // MACD
  if (t.macd) {
    const macdSignal = t.macd.histogram > 0 ? 'BUY' : t.macd.histogram < 0 ? 'SELL' : 'NEUTRAL';
    rows.push({
      name: 'MACD',
      value: t.macd.macd.toFixed(5),
      signal: macdSignal as 'BUY' | 'SELL' | 'NEUTRAL',
      details: [
        { label: 'Signal Line', value: t.macd.signal.toFixed(5) },
        { label: 'Histogram', value: t.macd.histogram.toFixed(5) },
        { label: 'Crossover', value: t.macd.crossover || 'none' },
      ],
    });
  }

  // Bollinger Bands
  if (t.bollinger) {
    const bbSignal = t.bollinger.pctB > 1 ? 'SELL' : t.bollinger.pctB < 0 ? 'BUY' : 'NEUTRAL';
    rows.push({
      name: 'Bollinger Bands',
      value: `%B: ${t.bollinger.pctB.toFixed(2)}`,
      signal: bbSignal as 'BUY' | 'SELL' | 'NEUTRAL',
      details: [
        { label: 'Upper', value: t.bollinger.upper.toFixed(4) },
        { label: 'Middle', value: t.bollinger.middle.toFixed(4) },
        { label: 'Lower', value: t.bollinger.lower.toFixed(4) },
        { label: 'Bandwidth', value: t.bollinger.bandwidth.toFixed(4) },
      ],
    });
  }

  // ADX
  if (t.adx) {
    const adxSignal = t.adx.value > 25 ? (t.adx.trend_strength === 'strong' ? 'BUY' : 'NEUTRAL') : 'NEUTRAL';
    rows.push({
      name: 'ADX',
      value: t.adx.value.toFixed(1),
      signal: adxSignal as 'BUY' | 'SELL' | 'NEUTRAL',
      details: [
        { label: 'Trend Strength', value: t.adx.trend_strength },
      ],
    });
  }

  // Stochastic
  if (t.stochastic) {
    const stochSignal = t.stochastic.k > 80 ? 'SELL' : t.stochastic.k < 20 ? 'BUY' : 'NEUTRAL';
    rows.push({
      name: 'Stochastic',
      value: `%K: ${t.stochastic.k.toFixed(1)}`,
      signal: stochSignal as 'BUY' | 'SELL' | 'NEUTRAL',
      details: [
        { label: '%D', value: t.stochastic.d.toFixed(1) },
        { label: 'Signal', value: t.stochastic.signal },
      ],
    });
  }

  // SMAs
  if (t.sma) {
    const price = t.price;
    const sma20Signal = price > t.sma.sma20 ? 'BUY' : 'SELL';
    rows.push({
      name: 'SMA 20 / 50 / 200',
      value: t.sma.sma20.toFixed(4),
      signal: sma20Signal as 'BUY' | 'SELL',
      details: [
        { label: 'SMA 20', value: t.sma.sma20.toFixed(4) },
        { label: 'SMA 50', value: t.sma.sma50.toFixed(4) },
        { label: 'SMA 200', value: t.sma.sma200?.toFixed(4) ?? '—' },
      ],
    });
  }

  // EMAs
  if (t.ema) {
    const price = t.price;
    const emaSignal = price > t.ema.ema9 ? 'BUY' : 'SELL';
    rows.push({
      name: 'EMA 9 / 21',
      value: t.ema.ema9.toFixed(4),
      signal: emaSignal as 'BUY' | 'SELL',
      details: [
        { label: 'EMA 9', value: t.ema.ema9.toFixed(4) },
        { label: 'EMA 21', value: t.ema.ema21.toFixed(4) },
      ],
    });
  }

  // ATR
  if (t.atr) {
    rows.push({
      name: 'ATR',
      value: t.atr.value.toFixed(4),
      signal: 'NEUTRAL',
      details: [
        { label: 'Paise', value: String(t.atr.paise) },
      ],
    });
  }

  return rows;
}

function SignalIcon({ signal }: { signal: string }) {
  if (signal === 'BUY') return <TrendingUp className="h-3 w-3 text-green-400" />;
  if (signal === 'SELL') return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-white/40" />;
}

export function CurrencyTechnicalsTable({ technicals }: CurrencyTechnicalsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!technicals) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No technical data available
      </div>
    );
  }

  const rows = buildIndicatorRows(technicals);

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-3 gap-px px-4 py-2 text-[10px] text-muted-foreground font-medium border-b border-white/[0.06] bg-white/[0.02]">
        <span>Indicator</span>
        <span className="text-right">Value</span>
        <span className="text-right">Signal</span>
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const isExpanded = expandedRow === row.name;
        const badge = SIGNAL_BADGE[row.signal] || SIGNAL_BADGE.NEUTRAL;

        return (
          <div key={row.name}>
            <button
              onClick={() => setExpandedRow(isExpanded ? null : row.name)}
              className="w-full grid grid-cols-3 gap-px px-4 py-2.5 text-xs hover:bg-white/[0.03] transition-colors border-b border-white/[0.02]"
            >
              <div className="flex items-center gap-2">
                <SignalIcon signal={row.signal} />
                <span className="text-white/90 font-medium">{row.name}</span>
                {row.details && (
                  <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </div>
              <span className="text-right text-white/70 tabular-nums">{row.value}</span>
              <div className="flex justify-end">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${badge.bg} ${badge.text}`}>
                  {row.signal}
                </span>
              </div>
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && row.details && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-2 bg-white/[0.01] space-y-1 border-b border-white/[0.04]">
                    {row.details.map((d) => (
                      <div key={d.label} className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{d.label}</span>
                        <span className="text-white/70 tabular-nums">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
