'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { S, T } from '@/components/playground/pyramid/tokens';
import { useSimulationContextSafe } from '@/context/SimulationContext';

/**
 * Renders 2-3 sentence-form insights above the tabs when sufficient
 * cross-tab data exists. Only shows when data is available.
 */
export function CrossSimulationInsights() {
  const ctx = useSimulationContextSafe();

  const insights = useMemo(() => {
    if (!ctx) return [];
    const items: string[] = [];

    // Regime + Volatility
    if (ctx.regime && ctx.volatility) {
      const regimeLabel = ctx.regime.currentState.label;
      const regimeProb = (ctx.regime.currentState.probability * 100).toFixed(0);
      const volPercentile = ctx.volatility.regime.percentile;
      const volLevel = volPercentile < 25 ? 'below-average' : volPercentile < 75 ? 'average' : 'elevated';
      items.push(
        `${ctx.volatility.ticker} is in a ${regimeLabel} regime (${regimeProb}%) with ${volLevel} volatility (P${volPercentile.toFixed(0)}).`
      );
    }

    // Risk Score + Portfolio
    if (ctx.riskScore && ctx.portfolio) {
      const score = ctx.riskScore.compositeScore;
      const zone = ctx.riskScore.zone.label;
      const bestStrategy = ctx.portfolio.bestStrategy;
      items.push(
        `Portfolio risk score is ${score} (${zone}). Best optimization: ${bestStrategy}.`
      );
    }

    // Monte Carlo + Backtest
    if (ctx.montecarlo && ctx.backtest) {
      const probProfit = (ctx.montecarlo.regimeAware.riskMetrics.probProfit * 100).toFixed(0);
      const bestStrat = ctx.backtest.strategies[0];
      if (bestStrat) {
        const pbo = bestStrat.overfitting.pbo;
        const pboWarning = pbo > 0.4 ? ` but PBO of ${pbo.toFixed(2)} suggests caution` : '';
        items.push(
          `Monte Carlo shows ${probProfit}% profit probability${pboWarning}.`
        );
      }
    }

    // Scenario insight
    if (ctx.scenario) {
      const worstStock = ctx.scenario.perStockImpact[0];
      if (worstStock) {
        items.push(
          `Under ${ctx.scenario.scenario.label}: ${worstStock.ticker} is hardest hit (${(worstStock.deltaReturn * 100).toFixed(1)}pp return drop).`
        );
      }
    }

    return items.slice(0, 3); // Max 3 insights
  }, [ctx]);

  if (insights.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(S.card, 'px-4 py-2.5 flex items-start gap-2.5')}
      >
        <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          {insights.map((insight, i) => (
            <p key={i} className={cn(T.caption, 'text-white/50 leading-relaxed')}>
              {insight}
            </p>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
