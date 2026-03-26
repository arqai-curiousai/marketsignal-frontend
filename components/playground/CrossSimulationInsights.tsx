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
  const { regime, volatility, riskScore, portfolio, montecarlo, backtest, scenario } = ctx ?? {};

  const insights = useMemo(() => {
    const items: string[] = [];

    // Regime + Volatility
    if (regime && volatility) {
      const regimeLabel = regime.currentState.label;
      const regimeProb = (regime.currentState.probability * 100).toFixed(0);
      const volPercentile = volatility.regime.percentile;
      const volLevel = volPercentile < 25 ? 'below-average' : volPercentile < 75 ? 'average' : 'elevated';
      items.push(
        `${volatility.ticker} is in a ${regimeLabel} regime (${regimeProb}%) with ${volLevel} volatility (P${volPercentile.toFixed(0)}).`
      );
    }

    // Risk Score + Portfolio
    if (riskScore && portfolio) {
      const score = riskScore.compositeScore;
      const zone = riskScore.zone.label;
      const bestStrategy = portfolio.bestStrategy;
      items.push(
        `Portfolio risk score is ${score} (${zone}). Best optimization: ${bestStrategy}.`
      );
    }

    // Monte Carlo + Backtest
    if (montecarlo && backtest) {
      const probProfit = (montecarlo.regimeAware.riskMetrics.probProfit * 100).toFixed(0);
      const bestStrat = backtest.strategies[0];
      if (bestStrat) {
        const pbo = bestStrat.overfitting.pbo;
        const pboWarning = pbo > 0.4 ? ` but PBO of ${pbo.toFixed(2)} suggests caution` : '';
        items.push(
          `Monte Carlo shows ${probProfit}% profit probability${pboWarning}.`
        );
      }
    }

    // Scenario insight
    if (scenario) {
      const worstStock = scenario.perStockImpact[0];
      if (worstStock) {
        items.push(
          `Under ${scenario.scenario.label}: ${worstStock.ticker} is hardest hit (${(worstStock.deltaReturn * 100).toFixed(1)}pp return drop).`
        );
      }
    }

    return items.slice(0, 3); // Max 3 insights
  }, [regime, volatility, riskScore, portfolio, montecarlo, backtest, scenario]);

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
