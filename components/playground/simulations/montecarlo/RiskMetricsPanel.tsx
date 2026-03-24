'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IRiskMetrics } from '@/types/simulation';
import { fmtPrice, fmtPct } from './mc-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  metrics: IRiskMetrics;
  className?: string;
}

// ─── Risk Bar ────────────────────────────────────────────────────

function RiskBar({
  label,
  value,
  maxValue,
  color,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  delay: number;
}) {
  const barPct = maxValue > 0 ? Math.min(Math.abs(value) / maxValue, 1) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50">{label}</span>
        <span className="text-[11px] font-mono text-white/70">{fmtPct(value)}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, opacity: 0.7 }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(barPct, 2)}%` }}
          transition={{ delay, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function RiskMetricsPanel({ metrics, className }: Props) {
  const { var5, cvar5, varPct, cvarPct, maxDrawdownMedian, descriptionVar, descriptionCvar } =
    metrics;

  // For scaling the bars relative to each other (ratios, e.g. -0.15)
  const maxAbsValue = Math.max(Math.abs(var5), Math.abs(cvar5), 0.01);

  // Compute per-lakh values for plain English (var5 is a ratio like -0.15)
  const varPerLakh = Math.abs(var5) * 100_000;
  const cvarPerLakh = Math.abs(cvar5) * 100_000;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Risk Metrics</h4>
      </div>

      <div className="space-y-4">
        {/* VaR Section */}
        <div className={cn(S.inner, 'p-3')}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(T.badge, 'text-amber-400')}>Value at Risk (5%)</span>
            <span className={cn(T.monoSm, 'text-amber-400/80')}>{fmtPct(varPct)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
            {descriptionVar ||
              `In the worst 5% of scenarios, you could lose ${fmtPrice(varPerLakh)} per ₹1 lakh invested (${fmtPct(varPct)}).`}
          </p>
          <RiskBar
            label="VaR 5%"
            value={var5}
            maxValue={maxAbsValue}
            color="#FBBF24"
            delay={0.4}
          />
        </div>

        {/* CVaR Section */}
        <div className={cn(S.inner, 'p-3')}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(T.badge, 'text-red-400')}>Conditional VaR (5%)</span>
            <span className={cn(T.monoSm, 'text-red-400/80')}>{fmtPct(cvarPct)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
            {descriptionCvar ||
              `If things go really bad (beyond VaR), the average loss would be ${fmtPrice(cvarPerLakh)} per ₹1 lakh invested.`}
          </p>
          <RiskBar
            label="CVaR 5%"
            value={cvar5}
            maxValue={maxAbsValue}
            color="#F87171"
            delay={0.5}
          />
        </div>

        {/* Comparative bar */}
        <div className="pt-2 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/40">VaR vs CVaR Comparison</span>
          </div>
          <div className="flex items-center gap-2 h-6">
            <div className="flex-1 flex items-center gap-1">
              <motion.div
                className="h-4 rounded bg-amber-400/30"
                initial={{ width: 0 }}
                animate={{
                  width: `${maxAbsValue > 0 ? (Math.abs(var5) / maxAbsValue) * 100 : 0}%`,
                }}
                transition={{ delay: 0.6, duration: 0.5 }}
              />
              <span className="text-[9px] text-amber-400/60 font-mono shrink-0">VaR</span>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <motion.div
                className="h-4 rounded bg-red-400/30"
                initial={{ width: 0 }}
                animate={{
                  width: `${maxAbsValue > 0 ? (Math.abs(cvar5) / maxAbsValue) * 100 : 0}%`,
                }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
              <span className="text-[9px] text-red-400/60 font-mono shrink-0">CVaR</span>
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        {maxDrawdownMedian != null && (
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] text-white/40">Median Max Drawdown</span>
            <span className={cn(T.monoSm, 'text-white/60')}>{fmtPct(maxDrawdownMedian)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
