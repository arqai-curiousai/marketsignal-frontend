'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { T, S } from './tokens';
import { SimGauge, type GaugeZone } from '@/components/playground/simulations/shared/SimGauge';
import type { ILayerResult, StrategySignal } from '@/types/strategy';

// ─── Gauge zones ─────────────────────────────────────────────

const BIAS_ZONES: GaugeZone[] = [
  { start: 0, end: 0.33, hex: '#F87171', label: 'Sell' },
  { start: 0.33, end: 0.66, hex: '#FBBF24', label: 'Hold' },
  { start: 0.66, end: 1.0, hex: '#34D399', label: 'Buy' },
];

const CONVICTION_ZONES: GaugeZone[] = [
  { start: 0, end: 0.33, hex: '#F87171', label: 'Low' },
  { start: 0.33, end: 0.66, hex: '#FBBF24', label: 'Medium' },
  { start: 0.66, end: 1.0, hex: '#34D399', label: 'High' },
];

// ─── Helpers ─────────────────────────────────────────────────

function biasToNorm(bias: StrategySignal | string, confidence: number): number {
  const base = bias === 'buy' ? 0.75 : bias === 'sell' ? 0.25 : 0.5;
  const offset = (confidence - 0.5) * 0.4;
  return Math.max(0, Math.min(1, base + (bias === 'buy' ? offset : bias === 'sell' ? -offset : 0)));
}

function biasLabel(bias: StrategySignal | string): string {
  if (bias === 'buy') return 'Accumulating';
  if (bias === 'sell') return 'Distributing';
  return 'Neutral';
}

function retailBiasLabel(bias: StrategySignal | string): string {
  if (bias === 'buy') return 'Bullish';
  if (bias === 'sell') return 'Bearish';
  return 'Confused';
}

// ─── Component ───────────────────────────────────────────────

interface Props {
  layers: Record<string, ILayerResult>;
  confidence: number;
  className?: string;
}

export function DualAgentGauges({ layers, confidence, className }: Props) {
  const mm = layers['market_maker'] ?? layers['technical'];
  const ri = layers['retail_investor'] ?? layers['sentiment'];

  const mmBias = mm?.bias ?? 'hold';
  const mmConf = mm?.confidence ?? 0.5;
  const riBias = ri?.bias ?? 'hold';
  const riConf = ri?.confidence ?? 0.5;

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {/* Market Maker gauge */}
      <div className={cn(S.card, 'p-3 flex flex-col items-center')}>
        <span className={cn(T.label, 'text-white/35 mb-2')}>Smart Money</span>
        <SimGauge
          value={biasToNorm(mmBias, mmConf)}
          displayValue={biasLabel(mmBias)}
          subLabel={`${(mmConf * 100).toFixed(0)}%`}
          zones={BIAS_ZONES}
          size={140}
          particleCount={0}
        />
      </div>

      {/* Retail Investor gauge */}
      <div className={cn(S.card, 'p-3 flex flex-col items-center')}>
        <span className={cn(T.label, 'text-white/35 mb-2')}>Retail</span>
        <SimGauge
          value={biasToNorm(riBias, riConf)}
          displayValue={retailBiasLabel(riBias)}
          subLabel={`${(riConf * 100).toFixed(0)}%`}
          zones={BIAS_ZONES}
          size={140}
          particleCount={0}
        />
      </div>

      {/* Conviction gauge */}
      <div className={cn(S.card, 'p-3 flex flex-col items-center')}>
        <span className={cn(T.label, 'text-white/35 mb-2')}>Conviction</span>
        <SimGauge
          value={confidence}
          displayValue={`${(confidence * 100).toFixed(0)}%`}
          subLabel={confidence > 0.7 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low'}
          zones={CONVICTION_ZONES}
          size={140}
          particleCount={0}
        />
      </div>
    </div>
  );
}
