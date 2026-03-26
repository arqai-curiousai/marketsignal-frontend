'use client';

import React, { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { cn } from '@/lib/utils';
import type { IPortfolioStrategy } from '@/types/simulation';
import { T, S } from '@/components/playground/pyramid/tokens';
import { getSectorColor, fmtWeight, fmtSharpe, fmtReturn, getStrategyLabel } from './portfolio-tokens';

interface Props {
  strategy: IPortfolioStrategy;
  sectors: Record<string, string>;
  onCycleStrategy?: () => void;
  className?: string;
}

interface SectorSlice {
  name: string;
  value: number;
  color: string;
}

interface StockSlice {
  name: string;
  value: number;
  sector: string;
  color: string;
}

// ─── Active sector shape (for hover) ────────────────────────────

interface ActiveSectorShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

function createActiveSectorShape(filterId: string) {
  return function ActiveSectorShape(rawProps: unknown) {
    const props = rawProps as ActiveSectorShapeProps;
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
    } = props;

    return (
      <g>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.9}
          filter={`url(#${filterId})`}
        />
      </g>
    );
  };
}

// ─── Main Component ─────────────────────────────────────────────

export function AllocationSunburst({ strategy, sectors, onCycleStrategy, className }: Props) {
  const gId = useId();
  const [activeInnerIndex, setActiveInnerIndex] = useState<number | null>(null);

  const activeSectorShape = useMemo(() => createActiveSectorShape(`${gId}-sector-glow`), [gId]);

  // Build sector aggregation
  const { sectorSlices, stockSlices } = useMemo(() => {
    const sectorWeights: Record<string, number> = {};
    const stocks: StockSlice[] = [];

    // Map each ticker to its sector and aggregate
    for (const [ticker, weight] of Object.entries(strategy.weights)) {
      if (weight < 0.001) continue;
      const sector = sectors[ticker] ?? 'Other';
      sectorWeights[sector] = (sectorWeights[sector] ?? 0) + weight;
      stocks.push({
        name: ticker,
        value: weight,
        sector,
        color: getSectorColor(sector),
      });
    }

    // Sort stocks by sector then weight for visual grouping
    stocks.sort((a, b) => {
      if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
      return b.value - a.value;
    });

    const sectorData: SectorSlice[] = Object.entries(sectorWeights)
      .map(([name, value]) => ({
        name,
        value,
        color: getSectorColor(name),
      }))
      .sort((a, b) => b.value - a.value);

    return { sectorSlices: sectorData, stockSlices: stocks };
  }, [strategy.weights, sectors]);

  if (sectorSlices.length === 0) {
    return (
      <div className={cn(S.card, 'p-4 flex items-center justify-center', className)}>
        <p className="text-xs text-muted-foreground">No allocation data</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4 flex flex-col items-center', className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <h4 className={cn(T.heading, 'text-white/80')}>Allocation</h4>
        <span className={cn(T.badge, 'text-white/30')}>Sunburst</span>
      </div>

      <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Inner ring: Sectors */}
            <Pie
              data={sectorSlices}
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="58%"
              dataKey="value"
              nameKey="name"
              paddingAngle={1}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
              activeIndex={activeInnerIndex ?? undefined}
              activeShape={activeSectorShape}
              onMouseEnter={(_, index) => setActiveInnerIndex(index)}
              onMouseLeave={() => setActiveInnerIndex(null)}
            >
              {sectorSlices.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={0.85}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={1}
                />
              ))}
            </Pie>

            {/* Outer ring: Individual stocks */}
            <Pie
              data={stockSlices}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="78%"
              dataKey="value"
              nameKey="name"
              paddingAngle={0.5}
              animationBegin={200}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {stockSlices.map((entry, idx) => (
                <Cell
                  key={`${entry.name}-${idx}`}
                  fill={entry.color}
                  opacity={0.55}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth={0.5}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay: Strategy name + Sharpe */}
        <button
          type="button"
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
          onClick={onCycleStrategy}
          aria-label="Click to cycle strategy"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={strategy.mode}
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <span className="text-[9px] uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
                {getStrategyLabel(strategy.mode)}
              </span>
              <span className="text-xl md:text-2xl font-bold font-mono text-white/90 mt-0.5">
                {fmtSharpe(strategy.metrics.sharpe)}
              </span>
              <span className="text-[9px] text-white/25 mt-0.5">Sharpe Ratio</span>
              <span className="text-[9px] font-mono text-emerald-400/50 mt-0.5">
                {fmtReturn(strategy.metrics.annualReturn)} p.a.
              </span>
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      {/* Sector legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 max-w-[280px]">
        {sectorSlices.slice(0, 8).map((s) => (
          <span key={s.name} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: s.color, opacity: 0.8 }}
            />
            <span className="text-[8px] text-white/30">
              {s.name} {fmtWeight(s.value)}
            </span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
