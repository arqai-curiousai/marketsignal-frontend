'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ILayerResult } from '@/types/strategy';

/**
 * Three-letter signal quality code: [SmartMoney]-[Sentiment]-[Conviction]
 *
 * Smart Money (market_maker layer bias):
 *   A = accumulating (buy), D = distributing (sell), N = neutral (hold)
 *
 * Sentiment (retail_investor layer bias):
 *   B = bullish (buy), Be = bearish (sell), C = confused (hold)
 *
 * Conviction (resolved confidence):
 *   H = high (>0.7), M = medium (0.5-0.7), L = low (<0.5)
 */

function smartMoneyCode(layers: Record<string, ILayerResult>): string {
  const mm = layers['market_maker'] ?? layers['technical'];
  if (!mm) return 'N';
  if (mm.bias === 'buy') return 'A';
  if (mm.bias === 'sell') return 'D';
  return 'N';
}

function sentimentCode(layers: Record<string, ILayerResult>): string {
  const ri = layers['retail_investor'] ?? layers['sentiment'];
  if (!ri) return 'C';
  if (ri.bias === 'buy') return 'B';
  if (ri.bias === 'sell') return 'Be';
  return 'C';
}

function convictionCode(confidence: number): string {
  if (confidence > 0.7) return 'H';
  if (confidence >= 0.5) return 'M';
  return 'L';
}

function codeColor(sm: string, sent: string): string {
  // Alignment: same direction = green, divergence = amber
  const smDir = sm === 'A' ? 1 : sm === 'D' ? -1 : 0;
  const sentDir = sent === 'B' ? 1 : sent === 'Be' ? -1 : 0;

  if (smDir !== 0 && sentDir !== 0 && smDir === sentDir) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (smDir !== 0 && sentDir !== 0 && smDir !== sentDir) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-white/50 border-white/10 bg-white/[0.03]';
}

const TOOLTIP_MAP: Record<string, string> = {
  A: 'Accumulating (institutional buying)',
  D: 'Distributing (institutional selling)',
  N: 'Neutral (no institutional bias)',
  B: 'Bullish (retail buying)',
  Be: 'Bearish (retail selling)',
  C: 'Confused (mixed retail sentiment)',
  H: 'High conviction (>70%)',
  M: 'Medium conviction (50-70%)',
  L: 'Low conviction (<50%)',
};

interface Props {
  layers: Record<string, ILayerResult>;
  confidence: number;
  className?: string;
}

export function SignalCodeBadge({ layers, confidence, className }: Props) {
  const sm = smartMoneyCode(layers);
  const sent = sentimentCode(layers);
  const conv = convictionCode(confidence);
  const code = `${sm}-${sent}-${conv}`;
  const colorClass = codeColor(sm, sent);

  const tooltip = [
    `${sm}: ${TOOLTIP_MAP[sm]}`,
    `${sent}: ${TOOLTIP_MAP[sent]}`,
    `${conv}: ${TOOLTIP_MAP[conv]}`,
  ].join('\n');

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] font-semibold px-2 py-0.5 rounded border',
        colorClass,
        className,
      )}
      title={tooltip}
    >
      {code}
    </span>
  );
}
