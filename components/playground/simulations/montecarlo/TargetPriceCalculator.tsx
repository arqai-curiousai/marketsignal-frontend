'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { simulationApi } from '@/lib/api/simulationApi';
import type { ITargetProbability } from '@/types/simulation';
import { fmtPrice, fmtProb, fmtProbWords, HORIZON_LABELS } from './mc-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  ticker: string;
  exchange: string;
  currentPrice: number;
  horizon: number;
  initialTarget?: ITargetProbability | null;
  className?: string;
}

// ─── Preset Buttons ──────────────────────────────────────────────

const PRESETS = [
  { label: '-20%', mult: 0.8 },
  { label: '-10%', mult: 0.9 },
  { label: '+10%', mult: 1.1 },
  { label: '+20%', mult: 1.2 },
  { label: '+50%', mult: 1.5 },
] as const;

// ─── Main Component ───────────────────────────────────────────────

export function TargetPriceCalculator({
  ticker,
  exchange,
  currentPrice,
  horizon,
  initialTarget,
  className,
}: Props) {
  const [targetPrice, setTargetPrice] = useState<number>(
    Math.round(currentPrice * 1.1 * 100) / 100,
  );
  const [result, setResult] = useState<ITargetProbability | null>(initialTarget ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const horizonLabel = HORIZON_LABELS[horizon] ?? `${horizon}d`;

  // Fetch target probability
  const fetchTarget = useCallback(
    async (price: number) => {
      if (price <= 0) return;
      setLoading(true);
      setError(null);

      try {
        const res = await simulationApi.getTargetProbability(ticker, price, exchange, horizon);
        if (res.success) {
          setResult(res.data);
        } else {
          setError(res.error.message);
          setResult(null);
        }
      } catch {
        setError('Failed to compute probability');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [ticker, exchange, horizon],
  );

  // Debounced fetch on target price change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (targetPrice > 0 && targetPrice !== currentPrice) {
        fetchTarget(targetPrice);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [targetPrice, fetchTarget, currentPrice]);

  const handlePreset = (mult: number) => {
    setTargetPrice(Math.round(currentPrice * mult * 100) / 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setTargetPrice(val);
    }
  };

  const pctFromCurrent =
    currentPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-3.5 w-3.5 text-pink-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Target Price Calculator</h4>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={targetPrice}
              onChange={handleInputChange}
              min={0}
              step={10}
              className={cn(
                'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg',
                'px-3 py-2 text-sm font-mono text-white/80',
                'focus:outline-none focus:border-indigo-500/30',
                'appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              )}
              aria-label="Target price"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono">
              {pctFromCurrent >= 0 ? '+' : ''}
              {pctFromCurrent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 text-[10px] font-mono px-2',
                'bg-white/[0.03] border border-white/[0.06]',
                'hover:bg-white/[0.06] hover:border-white/[0.10]',
                'text-white/50 hover:text-white/70',
              )}
              onClick={() => handlePreset(p.mult)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="flex items-center justify-center py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
            <span className="ml-2 text-[10px] text-white/40">Computing probability...</span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            className={cn(S.inner, 'p-3 mt-4')}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-[10px] text-red-400/70">{error}</p>
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            className={cn(S.inner, 'p-4 mt-4')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            <div className="space-y-3">
              {/* Probability display */}
              <div className="text-center">
                <p className="text-[10px] text-white/40 mb-1">
                  Probability of reaching {fmtPrice(targetPrice)} in {horizonLabel}
                </p>
                <p className="text-2xl font-bold font-mono tabular-nums text-pink-400">
                  {fmtProb(result.probability)}
                </p>
                <p className="text-[10px] text-white/35 mt-1">
                  {fmtProbWords(result.probability)} simulations reach this target
                </p>
              </div>

              {/* Probability bar */}
              <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-pink-400/70"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(Math.max(result.probability * 100, 2), 100)}%`,
                  }}
                  transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              {/* Median time to target */}
              {result.medianTimeToTarget != null && result.medianTimeToTarget > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                  <span className="text-[10px] text-white/35">Median time to target</span>
                  <span className="text-[11px] font-mono text-white/60">
                    {result.medianTimeToTarget} trading days
                  </span>
                </div>
              )}

              {/* Final probability (at horizon end) */}
              {result.probabilityFinal != null &&
                Math.abs(result.probabilityFinal - result.probability) > 0.01 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/35">At horizon end</span>
                    <span className="text-[11px] font-mono text-white/60">
                      {fmtProb(result.probabilityFinal)} probability
                    </span>
                  </div>
                )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="py-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-[10px] text-white/25">
              Enter a target price to see the probability of reaching it.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
