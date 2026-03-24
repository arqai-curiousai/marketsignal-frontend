'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IScenarioStockImpact } from '@/types/simulation';
import { deltaColor } from './scenario-tokens';

interface Props {
  impacts: IScenarioStockImpact[];
  className?: string;
}

export function ScenarioImpactTable({ impacts, className }: Props) {
  return (
    <div className={cn(S.card, 'overflow-hidden', className)}>
      <div className="px-3 py-2">
        <h3 className={cn(T.heading, 'text-white/70')}>Per-Stock Impact</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-t border-white/[0.06]">
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5')}>Ticker</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5')}>Sector</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 text-right')}>Weight</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 text-right')}>Base Ret</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 text-right')}>Stress Ret</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 text-right')}>Δ Return</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 text-right')}>Δ Vol</th>
              <th className={cn(T.label, 'text-white/30 px-3 py-1.5 text-right')}>β</th>
            </tr>
          </thead>
          <tbody>
            {impacts.map((stock, i) => (
              <tr
                key={stock.ticker}
                className={cn(
                  'border-t border-white/[0.04]',
                  i % 2 === 1 && 'bg-white/[0.01]',
                )}
              >
                <td className={cn(T.mono, 'text-white/70 px-3 py-1.5')}>{stock.ticker}</td>
                <td className={cn(T.caption, 'px-3 py-1.5')}>{stock.sector}</td>
                <td className={cn(T.monoSm, 'text-white/50 px-3 py-1.5 text-right')}>
                  {(stock.weight * 100).toFixed(1)}%
                </td>
                <td className={cn(T.monoSm, 'text-white/40 px-3 py-1.5 text-right')}>
                  {(stock.baselineReturn * 100).toFixed(1)}%
                </td>
                <td className={cn(T.monoSm, 'text-white/60 px-3 py-1.5 text-right')}>
                  {(stock.stressedReturn * 100).toFixed(1)}%
                </td>
                <td className={cn(T.monoSm, deltaColor(stock.deltaReturn), 'px-3 py-1.5 text-right font-semibold')}>
                  {stock.deltaReturn >= 0 ? '+' : ''}{(stock.deltaReturn * 100).toFixed(1)}%
                </td>
                <td className={cn(T.monoSm, deltaColor(stock.deltaVol), 'px-3 py-1.5 text-right')}>
                  {stock.deltaVol >= 0 ? '+' : ''}{(stock.deltaVol * 100).toFixed(1)}%
                </td>
                <td className={cn(T.monoSm, 'text-white/40 px-3 py-1.5 text-right')}>
                  {stock.sectorBeta.toFixed(1)}×
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
