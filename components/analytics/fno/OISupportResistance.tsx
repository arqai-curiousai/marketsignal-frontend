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

interface Props {
  chain: IOptionStrike[];
  underlyingPrice: number;
  maxCeOiStrike: number | null;
  maxPeOiStrike: number | null;
}

function formatOI(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
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
      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-blue" />
          <span className="text-sm font-semibold text-white">OI Support & Resistance</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {maxPeOiStrike && (
            <span>
              Support: <span className="text-emerald-400 font-mono">{maxPeOiStrike.toLocaleString('en-IN')}</span>
            </span>
          )}
          {maxCeOiStrike && (
            <span>
              Resistance: <span className="text-blue-400 font-mono">{maxCeOiStrike.toLocaleString('en-IN')}</span>
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          barGap={0}
          barCategoryGap="15%"
        >
          <XAxis
            dataKey="strike"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            tickFormatter={formatOI}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 36, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelFormatter={(strike: number) => `Strike: ${strike.toLocaleString('en-IN')}`}
            formatter={(value: number, name: string) => [
              formatOI(value),
              name === 'ce_oi' ? 'CE OI (Resistance)' : 'PE OI (Support)',
            ]}
          />
          {chartData.length > 0 && (
            <ReferenceLine
              x={chartData.reduce((closest, s) =>
                Math.abs(s.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? s : closest,
                chartData[0]
              )?.strike}
              stroke="rgba(96, 165, 250, 0.5)"
              strokeDasharray="4 4"
              label={{
                value: 'Spot',
                fill: 'rgba(96, 165, 250, 0.7)',
                fontSize: 9,
                position: 'top',
              }}
            />
          )}
          <Bar dataKey="ce_oi" name="ce_oi" radius={[2, 2, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`ce-${entry.strike}`}
                fill={entry.strike === maxCeOiStrike ? 'rgba(96, 165, 250, 0.6)' : 'rgba(96, 165, 250, 0.25)'}
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

      <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
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
