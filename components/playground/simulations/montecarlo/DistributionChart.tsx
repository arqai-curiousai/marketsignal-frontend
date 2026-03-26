'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IFinalDistribution, IReturnDistribution } from '@/types/simulation';
import { DIST_COLORS, fmtPrice } from './mc-tokens';
import { T, S, TOOLTIP_STYLE, AXIS_STYLE } from '@/components/playground/pyramid/tokens';
import { formatNumber } from '@/src/lib/exchange/formatting';

interface Props {
  distribution: IFinalDistribution;
  returnDistribution: IReturnDistribution | null;
  currentPrice: number;
  className?: string;
}

interface ChartRow {
  price: number;
  density: number;
}

function DistTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-mono text-white/70 mb-0.5">{fmtPrice(d.price)}</p>
      <p className="text-[10px] text-white/40">Density: {d.density.toFixed(4)}</p>
    </div>
  );
}

export function DistributionChart({
  distribution,
  returnDistribution,
  currentPrice,
  className,
}: Props) {
  const chartData = useMemo<ChartRow[]>(() => {
    return distribution.bins.map((bin) => ({
      price: Math.round((bin.priceLow + bin.priceHigh) / 2),
      density: bin.density,
    }));
  }, [distribution.bins]);

  const { yMax } = useMemo(() => {
    const densities = chartData.map((d) => d.density);
    return { yMax: Math.max(...densities) * 1.1 };
  }, [chartData]);

  const stats = distribution.stats;
  const skew = stats.skew ?? 0;
  const kurtosis = stats.kurtosis ?? 0;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
          <h4 className={cn(T.heading, 'text-white/80')}>Price Distribution</h4>
        </div>
        <span className={cn(T.badge, 'text-white/30')}>
          {distribution.bins.length} bins
        </span>
      </div>

      {/* Chart */}
      <div className="h-[200px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="price"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                formatNumber(v, 'NSE', { maximumFractionDigits: 0 })
              }
              interval="preserveStartEnd"
            />
            <YAxis
              hide
              domain={[0, yMax]}
            />
            <Tooltip content={<DistTooltip />} />

            <Bar
              dataKey="density"
              fill={DIST_COLORS.histogram}
              radius={[2, 2, 0, 0]}
              animationDuration={800}
            />

            <ReferenceLine
              x={currentPrice}
              stroke={DIST_COLORS.normal}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Current',
                position: 'top',
                fill: 'rgba(255,255,255,0.3)',
                fontSize: 9,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Statistical annotations */}
      <div className={cn(S.inner, 'p-3 mt-3 grid grid-cols-2 md:grid-cols-4 gap-3')}>
        {/* Skewness */}
        <div>
          <span className="text-[9px] text-white/30 block mb-0.5">Skewness</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] font-mono font-semibold',
                skew > 0.1 ? 'text-emerald-400' : skew < -0.1 ? 'text-rose-400' : 'text-white/60',
              )}
            >
              {skew > 0 ? '+' : ''}
              {skew.toFixed(3)}
            </span>
            <span className="text-[9px] text-white/25">
              {skew > 0.1 ? '→ right' : skew < -0.1 ? '← left' : '≈ symmetric'}
            </span>
          </div>
        </div>

        {/* Kurtosis */}
        <div>
          <span className="text-[9px] text-white/30 block mb-0.5">Excess Kurtosis</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] font-mono font-semibold',
                kurtosis > 0.5
                  ? 'text-amber-400'
                  : kurtosis < -0.5
                    ? 'text-indigo-400'
                    : 'text-white/60',
              )}
            >
              {kurtosis > 0 ? '+' : ''}
              {kurtosis.toFixed(3)}
            </span>
            <span className="text-[9px] text-white/25">
              {kurtosis > 0.5 ? 'Fat tails' : kurtosis < -0.5 ? 'Thin tails' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Normality test */}
        {returnDistribution?.normalityTest && (
          <div>
            <span className="text-[9px] text-white/30 block mb-0.5">Normality (JB)</span>
            <span
              className={cn(
                'text-[9px] font-semibold px-1.5 py-0.5 rounded-full border inline-block',
                returnDistribution.normalityTest.isNormal
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              )}
            >
              {returnDistribution.normalityTest.isNormal ? 'Normal' : 'Non-Normal'}
            </span>
            <span className="text-[8px] text-white/20 ml-1">
              p={returnDistribution.normalityTest.pValue.toFixed(3)}
            </span>
          </div>
        )}

        {/* Tail ratio */}
        {returnDistribution && (
          <div>
            <span className="text-[9px] text-white/30 block mb-0.5">Tail Ratio</span>
            <span className="text-[10px] font-mono font-semibold text-white/60">
              {returnDistribution.tailRatio.toFixed(2)}×
            </span>
            <p className="text-[8px] text-white/20 mt-0.5">
              {returnDistribution.tailDescription}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
