'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Shield } from 'lucide-react';
import type { IOptionStrike } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { T, S, C, L, TOOLTIP_STYLE, AXIS_STYLE, fmtOI, fmtStrike } from './tokens';

interface Props {
  chain: IOptionStrike[];
  underlyingPrice: number;
  maxCeOiStrike: number | null;
  maxPeOiStrike: number | null;
}

export function OISupportResistance({ chain, underlyingPrice, maxCeOiStrike, maxPeOiStrike }: Props) {
  // Filter to ±15 strikes around ATM for chart readability
  const chartData = useMemo(() => {
    if (chain.length <= 30) return chain.map((s) => ({
      strike: s.strike,
      ce_oi: s.ce_oi,
      pe_oi: s.pe_oi,
    }));

    const atmIdx = chain.reduce(
      (closest, s, i) => (Math.abs(s.strike - underlyingPrice) < Math.abs(chain[closest].strike - underlyingPrice) ? i : closest),
      0,
    );
    const start = Math.max(0, atmIdx - 15);
    const end = Math.min(chain.length, atmIdx + 16);
    return chain.slice(start, end).map((s) => ({
      strike: s.strike,
      ce_oi: s.ce_oi,
      pe_oi: s.pe_oi,
    }));
  }, [chain, underlyingPrice]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(S.card, 'p-4')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-blue" />
          <span className={T.heading}>OI Support & Resistance</span>
        </div>
        <div className={cn('flex items-center gap-3', T.caption)}>
          {maxPeOiStrike && (
            <span>
              Support: <span className={cn(C.put.text, 'font-mono')}>{fmtStrike(maxPeOiStrike)}</span>
            </span>
          )}
          {maxCeOiStrike && (
            <span>
              Resistance: <span className={cn(C.call.text, 'font-mono')}>{fmtStrike(maxCeOiStrike)}</span>
            </span>
          )}
        </div>
      </div>

      <div className={L.chartMd}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          barGap={0}
          barCategoryGap="15%"
        >
          <XAxis
            dataKey="strike"
            tick={AXIS_STYLE}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={AXIS_STYLE}
            tickFormatter={fmtOI}
            width={50}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(strike: number) => `Strike: ${strike.toLocaleString('en-IN')}`}
            formatter={(value: number, name: string) => [
              fmtOI(value),
              name === 'ce_oi' ? 'CE OI (Resistance)' : 'PE OI (Support)',
            ]}
          />
          {chartData.length > 0 && (
            <ReferenceLine
              x={chartData.reduce((closest, s) =>
                Math.abs(s.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? s : closest,
                chartData[0]
              )?.strike}
              stroke="rgba(74, 222, 128, 0.5)"
              strokeDasharray="4 4"
              label={{
                value: 'Spot',
                fill: 'rgba(74, 222, 128, 0.7)',
                fontSize: 9,
                position: 'top',
              }}
            />
          )}
          <Bar dataKey="ce_oi" name="ce_oi" radius={[2, 2, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`ce-${entry.strike}`}
                fill={entry.strike === maxCeOiStrike ? 'rgba(74, 222, 128, 0.6)' : 'rgba(74, 222, 128, 0.25)'}
              />
            ))}
          </Bar>
          <Bar dataKey="pe_oi" name="pe_oi" radius={[2, 2, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`pe-${entry.strike}`}
                fill={entry.strike === maxPeOiStrike ? 'rgba(110, 231, 183, 0.6)' : 'rgba(110, 231, 183, 0.25)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>

      <div className={cn('flex flex-wrap items-center gap-2 md:gap-4 mt-2', T.legend)}>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-blue-500/40 inline-block" /> CE OI (Resistance)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-emerald-500/40 inline-block" /> PE OI (Support)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-0.5 bg-brand-blue/50 inline-block" /> Spot Price
        </span>
      </div>
    </motion.div>
  );
}
