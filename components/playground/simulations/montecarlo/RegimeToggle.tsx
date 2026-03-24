'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { IMonteCarloResult } from '@/types/simulation';
import { fmtPrice, fmtPct, fmtProb } from './mc-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  regimeAware: IMonteCarloResult;
  constant: IMonteCarloResult;
  currentPrice: number;
  className?: string;
}

// ─── Range Bar Comparison ────────────────────────────────────────

function RangeBar({
  label,
  p5,
  p95,
  median,
  color,
  globalMin,
  globalMax,
  delay,
}: {
  label: string;
  p5: number;
  p95: number;
  median: number;
  color: string;
  globalMin: number;
  globalMax: number;
  delay: number;
}) {
  const range = globalMax - globalMin;
  const leftPct = range > 0 ? ((p5 - globalMin) / range) * 100 : 0;
  const widthPct = range > 0 ? ((p95 - p5) / range) * 100 : 10;
  const medianPct = range > 0 ? ((median - globalMin) / range) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50">{label}</span>
        <span className="text-[10px] font-mono text-white/40">
          {fmtPrice(p5)} - {fmtPrice(p95)}
        </span>
      </div>
      <div className="relative w-full h-3 rounded-full bg-white/[0.03]">
        <motion.div
          className="absolute top-0 h-full rounded-full"
          style={{ backgroundColor: color, opacity: 0.25, left: `${leftPct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(widthPct, 2)}%` }}
          transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute top-0 w-0.5 h-full rounded-full"
          style={{ backgroundColor: color, opacity: 0.8 }}
          initial={{ left: `${leftPct}%` }}
          animate={{ left: `${medianPct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.4 }}
        />
      </div>
    </div>
  );
}

// ─── Metric Comparison Row ───────────────────────────────────────

function MetricRow({
  label,
  regimeValue,
  constantValue,
  formatter,
}: {
  label: string;
  regimeValue: number;
  constantValue: number;
  formatter: (v: number) => string;
}) {
  const diff = regimeValue - constantValue;
  const hasDiff = Math.abs(diff) > 0.001;

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
      <span className="text-[10px] text-white/40 flex-1">{label}</span>
      <span className="text-[10px] font-mono text-indigo-400 w-[72px] text-right">
        {formatter(regimeValue)}
      </span>
      <span className="text-[10px] font-mono text-slate-400 w-[72px] text-right">
        {formatter(constantValue)}
      </span>
      {hasDiff && (
        <span
          className={cn(
            'text-[9px] font-mono w-[48px] text-right',
            diff > 0 ? 'text-emerald-400/60' : 'text-amber-400/60',
          )}
        >
          {diff > 0 ? '+' : ''}
          {(diff * 100).toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function RegimeToggle({ regimeAware, constant, currentPrice, className }: Props) {
  const [showSideBySide, setShowSideBySide] = useState(true);

  const raBands = regimeAware.percentileBands;
  const cBands = constant.percentileBands;

  // Final day bands for range bars
  const raFinal = raBands.length > 0 ? raBands[raBands.length - 1] : null;
  const cFinal = cBands.length > 0 ? cBands[cBands.length - 1] : null;

  // Global min/max for range bar scaling
  const allPrices = [
    raFinal?.p5 ?? currentPrice,
    raFinal?.p95 ?? currentPrice,
    cFinal?.p5 ?? currentPrice,
    cFinal?.p95 ?? currentPrice,
  ];
  const globalMin = Math.min(...allPrices) * 0.95;
  const globalMax = Math.max(...allPrices) * 1.05;

  // Tail risk comparison
  const raRange = raFinal ? raFinal.p95 - raFinal.p5 : 0;
  const cRange = cFinal ? cFinal.p95 - cFinal.p5 : 0;
  const tailDiffPct = cRange > 0 ? ((raRange - cRange) / cRange) * 100 : 0;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <h4 className={cn(T.heading, 'text-white/80')}>Regime Comparison</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/30">Side-by-side</span>
          <Switch
            checked={showSideBySide}
            onCheckedChange={setShowSideBySide}
            className="data-[state=checked]:bg-indigo-600 h-4 w-7"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSideBySide ? (
          <motion.div
            key="side-by-side"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Range bars */}
            <div className="space-y-3">
              {raFinal && (
                <RangeBar
                  label="Regime-Aware"
                  p5={raFinal.p5}
                  p95={raFinal.p95}
                  median={raFinal.p50}
                  color="#818CF8"
                  globalMin={globalMin}
                  globalMax={globalMax}
                  delay={0.1}
                />
              )}
              {cFinal && (
                <RangeBar
                  label="Constant"
                  p5={cFinal.p5}
                  p95={cFinal.p95}
                  median={cFinal.p50}
                  color="#94A3B8"
                  globalMin={globalMin}
                  globalMax={globalMax}
                  delay={0.2}
                />
              )}
            </div>

            {/* Metric comparison table */}
            <div className="mt-3">
              <div className="flex items-center gap-2 py-1 mb-1 border-b border-white/[0.06]">
                <span className="text-[9px] text-white/30 flex-1">Metric</span>
                <span className="text-[9px] text-indigo-400/60 w-[72px] text-right font-semibold">
                  Regime
                </span>
                <span className="text-[9px] text-slate-400/60 w-[72px] text-right font-semibold">
                  Constant
                </span>
                <span className="text-[9px] text-white/20 w-[48px] text-right">Diff</span>
              </div>

              <MetricRow
                label="Prob of Profit"
                regimeValue={regimeAware.riskMetrics.probProfit}
                constantValue={constant.riskMetrics.probProfit}
                formatter={fmtProb}
              />
              <MetricRow
                label="Expected Return"
                regimeValue={regimeAware.riskMetrics.expectedReturn}
                constantValue={constant.riskMetrics.expectedReturn}
                formatter={fmtPct}
              />
              <MetricRow
                label="VaR 5%"
                regimeValue={regimeAware.riskMetrics.varPct}
                constantValue={constant.riskMetrics.varPct}
                formatter={fmtPct}
              />
              <MetricRow
                label="CVaR 5%"
                regimeValue={regimeAware.riskMetrics.cvarPct}
                constantValue={constant.riskMetrics.cvarPct}
                formatter={fmtPct}
              />
            </div>

            {/* Annotation */}
            {Math.abs(tailDiffPct) > 1 && (
              <div className={cn(S.inner, 'p-2.5 mt-2')}>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {tailDiffPct > 0
                    ? `Regime-aware model captures ${Math.abs(tailDiffPct).toFixed(0)}% wider tail risk than the constant-parameter model, reflecting changing market conditions.`
                    : `Constant model shows ${Math.abs(tailDiffPct).toFixed(0)}% wider spread. Current regime may be more stable than historical average.`}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="stacked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Regime-aware card */}
            <div className={cn(S.inner, 'p-3')}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className={cn(T.badge, 'text-indigo-400')}>Regime-Aware</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-white/30 block">Prob Profit</span>
                  <span className="text-[11px] font-mono text-white/70">
                    {fmtProb(regimeAware.riskMetrics.probProfit)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/30 block">Exp. Return</span>
                  <span className="text-[11px] font-mono text-white/70">
                    {fmtPct(regimeAware.riskMetrics.expectedReturn)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/30 block">VaR 5%</span>
                  <span className="text-[11px] font-mono text-white/70">
                    {fmtPct(regimeAware.riskMetrics.varPct)}
                  </span>
                </div>
              </div>
              {regimeAware.regimeParams && regimeAware.regimeParams.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[9px] text-white/25">
                    States: {regimeAware.regimeParams.map((r) => r.state).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Constant card */}
            <div className={cn(S.inner, 'p-3')}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className={cn(T.badge, 'text-slate-400')}>Constant Parameters</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-white/30 block">Prob Profit</span>
                  <span className="text-[11px] font-mono text-white/70">
                    {fmtProb(constant.riskMetrics.probProfit)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/30 block">Exp. Return</span>
                  <span className="text-[11px] font-mono text-white/70">
                    {fmtPct(constant.riskMetrics.expectedReturn)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/30 block">VaR 5%</span>
                  <span className="text-[11px] font-mono text-white/70">
                    {fmtPct(constant.riskMetrics.varPct)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
