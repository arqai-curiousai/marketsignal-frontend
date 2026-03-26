'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IStockFactorScores, IFactorDefinition } from '@/types/simulation';
import { FACTOR_TEXT_COLORS } from './factor-tokens';

interface Props {
  factors: IFactorDefinition[];
  perStockScores: IStockFactorScores[];
  portfolioTilts: Record<string, number>;
  benchmarkTilts: Record<string, number>;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-green-400';
  if (score >= 40) return 'text-white/60';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
}

export function FactorTiltTable({ factors, perStockScores, portfolioTilts, benchmarkTilts, className }: Props) {
  return (
    <div className={cn(S.card, 'overflow-hidden', className)}>
      <div className="px-3 py-2">
        <h3 className={cn(T.heading, 'text-white/70')}>Factor Scores by Stock</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-t border-white/[0.06]">
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 sticky left-0 bg-[#0B0F19]')}>Ticker</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5')}>Sector</th>
              {factors.map((f) => (
                <th key={f.id} className={cn(T.label, FACTOR_TEXT_COLORS[f.id] || 'text-white/30', 'px-3 py-1.5 text-right')}>
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perStockScores.map((stock, i) => (
              <tr
                key={stock.ticker}
                className={cn(
                  'border-t border-white/[0.04]',
                  i % 2 === 1 && 'bg-white/[0.01]',
                )}
              >
                <td className={cn(T.mono, 'text-white/70 px-3 py-1.5 sticky left-0 bg-inherit')}>{stock.ticker}</td>
                <td className={cn(T.caption, 'px-3 py-1.5')}>{stock.sector}</td>
                {factors.map((f) => {
                  const score = stock.scores[f.id] ?? 0;
                  return (
                    <td key={f.id} className={cn(T.monoSm, scoreColor(score), 'px-3 py-1.5 text-right')}>
                      {score.toFixed(0)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Portfolio row */}
            <tr className="border-t-2 border-violet-500/20">
              <td className={cn(T.mono, 'text-violet-400 px-3 py-1.5 font-semibold sticky left-0 bg-[#0B0F19]')}>Portfolio</td>
              <td className={cn(T.caption, 'px-3 py-1.5')}>—</td>
              {factors.map((f) => {
                const val = portfolioTilts[f.id] ?? 0;
                return (
                  <td key={f.id} className={cn(T.mono, 'text-violet-300 px-3 py-1.5 text-right font-semibold')}>
                    {val.toFixed(0)}
                  </td>
                );
              })}
            </tr>
            {/* Benchmark row */}
            <tr className="border-t border-white/[0.04]">
              <td className={cn(T.mono, 'text-white/30 px-3 py-1.5 sticky left-0 bg-[#0B0F19]')}>NIFTY 50</td>
              <td className={cn(T.caption, 'px-3 py-1.5')}>—</td>
              {factors.map((f) => {
                const val = benchmarkTilts[f.id] ?? 0;
                return (
                  <td key={f.id} className={cn(T.monoSm, 'text-white/25 px-3 py-1.5 text-right')}>
                    {val.toFixed(0)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
