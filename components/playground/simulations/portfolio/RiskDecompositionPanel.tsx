'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IPortfolioStrategy } from '@/types/simulation';
import { T, S } from '@/components/playground/pyramid/tokens';
import { getSectorColor, fmtWeight, getStrategyLabel } from './portfolio-tokens';

interface Props {
  strategy: IPortfolioStrategy;
  sectors: Record<string, string>;
  className?: string;
}

interface SectorSlice {
  name: string;
  weight: number;
  riskContribution: number;
  color: string;
}

// ─── Tooltip ─────────────────────────────────────────────────────

function RiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SectorSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  const overUnder = d.riskContribution > d.weight * 1.2
    ? 'Over-contributing'
    : d.riskContribution < d.weight * 0.8
    ? 'Under-contributing'
    : 'Proportional';

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-white/70 mb-1">{d.name}</p>
      <div className="space-y-0.5 text-[10px]">
        <p>
          Weight: <span className="font-semibold text-white/80">{fmtWeight(d.weight)}</span>
        </p>
        <p>
          Risk: <span className="font-semibold text-rose-400">{fmtWeight(d.riskContribution)}</span>
        </p>
        <p className="text-white/40 text-[9px] mt-0.5">{overUnder}</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function RiskDecompositionPanel({ strategy, sectors, className }: Props) {
  // Aggregate risk contribution by sector
  const { sectorData, annotation, diversificationRatio } = useMemo(() => {
    const sectorWeights: Record<string, number> = {};
    const sectorRisk: Record<string, number> = {};

    for (const rc of strategy.riskContribution) {
      const sector = sectors[rc.ticker] ?? rc.sector ?? 'Other';
      sectorWeights[sector] = (sectorWeights[sector] ?? 0) + rc.weight;
      sectorRisk[sector] = (sectorRisk[sector] ?? 0) + rc.riskContribution;
    }

    const slices: SectorSlice[] = Object.keys(sectorWeights)
      .map((name) => ({
        name,
        weight: sectorWeights[name],
        riskContribution: sectorRisk[name] ?? 0,
        color: getSectorColor(name),
      }))
      .filter((s) => s.riskContribution > 0.001)
      .sort((a, b) => b.riskContribution - a.riskContribution);

    // Find the biggest risk over-contributor
    let maxOverContrib = slices[0];
    let maxRatio = 0;
    for (const s of slices) {
      const ratio = s.weight > 0 ? s.riskContribution / s.weight : 0;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxOverContrib = s;
      }
    }

    const annotationText = maxOverContrib
      ? `${maxOverContrib.name} contributes ${(maxOverContrib.riskContribution * 100).toFixed(0)}% of risk despite being ${(maxOverContrib.weight * 100).toFixed(0)}% of weight`
      : null;

    // Diversification ratio
    const totalWeight = Object.values(sectorWeights).reduce((a, b) => a + b, 0);
    const totalRisk = Object.values(sectorRisk).reduce((a, b) => a + b, 0);
    const divRatio = totalRisk > 0 ? totalWeight / totalRisk : 1;

    return {
      sectorData: slices,
      annotation: annotationText,
      diversificationRatio: divRatio,
    };
  }, [strategy.riskContribution, sectors]);

  if (sectorData.length === 0) {
    return (
      <div className={cn(S.card, 'p-4 flex items-center justify-center', className)}>
        <p className="text-xs text-muted-foreground py-8">
          No risk decomposition data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>
          Risk Decomposition
        </h4>
        <span className={cn(T.badge, 'text-white/30')}>
          {getStrategyLabel(strategy.mode)}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Pie chart */}
        <div className="relative w-[180px] h-[180px] md:w-[200px] md:h-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="80%"
                dataKey="riskContribution"
                nameKey="name"
                paddingAngle={1}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {sectorData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    opacity={0.75}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<RiskTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center: diversification ratio */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold font-mono text-white/80">
              {diversificationRatio.toFixed(2)}
            </span>
            <span className="text-[9px] text-white/30">Div. Ratio</span>
          </div>
        </div>

        {/* Legend: sector name + weight% + risk% */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {sectorData.map((s, i) => {
            const isOverContributor = s.riskContribution > s.weight * 1.2;

            return (
              <motion.div
                key={s.name}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 + 0.3 }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: s.color, opacity: 0.7 }}
                />
                <span className="text-[10px] text-white/60 truncate flex-1 min-w-0">
                  {s.name}
                </span>
                <span className={cn(T.monoSm, 'text-white/40 w-[38px] text-right shrink-0')}>
                  {fmtWeight(s.weight)}
                </span>
                <span className={cn(
                  T.monoSm,
                  'w-[38px] text-right shrink-0',
                  isOverContributor ? 'text-rose-400/70' : 'text-white/40',
                )}>
                  {fmtWeight(s.riskContribution)}
                </span>
              </motion.div>
            );
          })}

          {/* Column headers */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
            <span className="flex-1" />
            <span className="text-[8px] text-white/20 w-[38px] text-right">Wt</span>
            <span className="text-[8px] text-white/20 w-[38px] text-right">Risk</span>
          </div>
        </div>
      </div>

      {/* Annotation */}
      {annotation && (
        <motion.div
          className={cn(S.inner, 'p-2.5 mt-3')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {annotation}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
