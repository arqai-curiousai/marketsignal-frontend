'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Target } from 'lucide-react';
import type { IOptionStrike } from '@/types/analytics';

interface Props {
  chain: IOptionStrike[];
  underlyingPrice: number;
  maxPainStrike: number | null;
  lotSize: number;
}

export function MaxPainChart({ chain, underlyingPrice, maxPainStrike, lotSize }: Props) {
  const painData = useMemo(() => {
    // Filter to ±15 strikes around ATM
    let subset = chain;
    if (chain.length > 30) {
      const atmIdx = chain.reduce(
        (closest, s, i) => (Math.abs(s.strike - underlyingPrice) < Math.abs(chain[closest].strike - underlyingPrice) ? i : closest),
        0,
      );
      subset = chain.slice(Math.max(0, atmIdx - 15), Math.min(chain.length, atmIdx + 16));
    }

    const strikes = subset.map((s) => s.strike);

    return strikes.map((settlement) => {
      let callPain = 0;
      let putPain = 0;

      for (const s of subset) {
        if (settlement > s.strike && s.ce_oi > 0) {
          callPain += (settlement - s.strike) * s.ce_oi * lotSize;
        }
        if (s.strike > settlement && s.pe_oi > 0) {
          putPain += (s.strike - settlement) * s.pe_oi * lotSize;
        }
      }

      return {
        strike: settlement,
        callPain: callPain / 10000000, // Convert to Cr for readability
        putPain: putPain / 10000000,
        totalPain: (callPain + putPain) / 10000000,
      };
    });
  }, [chain, underlyingPrice, lotSize]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-violet" />
          <span className="text-sm font-semibold text-white">Max Pain</span>
        </div>
        {maxPainStrike && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-muted-foreground">Max Pain:</span>
            <span className="text-brand-violet font-mono font-bold">
              {maxPainStrike.toLocaleString('en-IN')}
            </span>
            <span className="text-muted-foreground">
              ({underlyingPrice > maxPainStrike ? '+' : ''}{(underlyingPrice - maxPainStrike).toFixed(0)} pts from spot)
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={painData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="callPainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="putPainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="strike"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            tickFormatter={(v: number) => `${v.toFixed(0)}Cr`}
            width={55}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 36, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelFormatter={(strike: number) => `Settlement: ${strike.toLocaleString('en-IN')}`}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} Cr`,
              name === 'callPain' ? 'Call Writer Pain' : name === 'putPain' ? 'Put Writer Pain' : 'Total Pain',
            ]}
          />

          {/* Spot price reference */}
          {painData.length > 0 && (
            <ReferenceLine
              x={painData.reduce((closest, s) =>
                Math.abs(s.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? s : closest,
                painData[0]
              )?.strike}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeDasharray="4 4"
              label={{ value: 'Spot', fill: 'rgba(255,255,255,0.5)', fontSize: 9, position: 'top' }}
            />
          )}

          {/* Max pain reference */}
          {maxPainStrike && painData.length > 0 && (
            <ReferenceLine
              x={painData.reduce((closest, s) =>
                Math.abs(s.strike - maxPainStrike) < Math.abs(closest.strike - maxPainStrike) ? s : closest,
                painData[0]
              )?.strike}
              stroke="rgba(124, 58, 237, 0.6)"
              strokeDasharray="6 3"
              label={{ value: 'Max Pain', fill: 'rgba(124, 58, 237, 0.8)', fontSize: 9, position: 'top' }}
            />
          )}

          <Area
            type="monotone"
            dataKey="callPain"
            stroke="#60A5FA"
            strokeWidth={1.5}
            fill="url(#callPainGrad)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="putPain"
            stroke="#F87171"
            strokeWidth={1.5}
            fill="url(#putPainGrad)"
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-blue-500/40 inline-block" /> Call Writer Pain
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-red-400/40 inline-block" /> Put Writer Pain
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-0.5 bg-brand-violet/60 inline-block" /> Max Pain
        </span>
        <span className="ml-auto text-muted-foreground">Values in Crores (INR)</span>
      </div>
    </motion.div>
  );
}
