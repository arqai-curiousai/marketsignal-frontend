'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { T, S, signalColor } from './tokens';
import { SignalDot } from '../SignalDot';
import { LAYERS } from './constants';
import type { ILayerResult, StrategySignal } from '@/types/strategy';

interface Props {
  layers: Record<string, ILayerResult>;
  topFeatures: Array<{ feature: string; impact: number }>;
  className?: string;
}

function resolveSignal(
  layers: Record<string, ILayerResult>,
  overrides: Record<string, number>,
): { signal: StrategySignal; confidence: number } {
  // Weighted average using layer importance (from topFeatures or default weights)
  let buyScore = 0;
  let sellScore = 0;
  let totalWeight = 0;

  for (const layer of LAYERS) {
    const result = layers[layer.id];
    if (!result) continue;

    const weight = overrides[layer.id] ?? result.confidence;
    const conf = weight;

    if (result.bias === 'buy') {
      buyScore += conf;
    } else if (result.bias === 'sell') {
      sellScore += conf;
    }
    totalWeight += 1;
  }

  if (totalWeight === 0) return { signal: 'hold', confidence: 0 };

  const avgBuy = buyScore / totalWeight;
  const avgSell = sellScore / totalWeight;

  if (avgBuy > avgSell && avgBuy > 0.3) {
    return { signal: 'buy', confidence: Math.min(avgBuy, 1) };
  }
  if (avgSell > avgBuy && avgSell > 0.3) {
    return { signal: 'sell', confidence: Math.min(avgSell, 1) };
  }
  return { signal: 'hold', confidence: Math.max(1 - avgBuy - avgSell, 0) };
}

export function LayerSensitivityPanel({ layers, topFeatures, className }: Props) {
  // Initialize overrides with current layer confidence values
  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const layer of LAYERS) {
      const result = layers[layer.id];
      init[layer.id] = result?.confidence ?? 0.5;
    }
    return init;
  });

  const resolved = useMemo(
    () => resolveSignal(layers, overrides),
    [layers, overrides],
  );

  const sc = signalColor(resolved.signal);

  const handleSliderChange = (layerId: string, value: number[]) => {
    setOverrides((prev) => ({ ...prev, [layerId]: value[0] }));
  };

  const handleReset = () => {
    const init: Record<string, number> = {};
    for (const layer of LAYERS) {
      const result = layers[layer.id];
      init[layer.id] = result?.confidence ?? 0.5;
    }
    setOverrides(init);
  };

  return (
    <div className={cn(S.card, 'p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn(T.heading, 'text-white/70')}>Layer Sensitivity</h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-[9px] text-white/25 hover:text-white/50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Resolved signal preview */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5',
            sc.bg,
            sc.border,
            'border',
          )}
          key={resolved.signal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <SignalDot signal={resolved.signal} size="md" />
          <span className={cn('text-sm font-bold', sc.text)}>
            {resolved.signal.toUpperCase()}
          </span>
        </motion.div>
        <span className={cn(T.mono, 'text-white/50')}>
          {(resolved.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Layer sliders */}
      <div className="space-y-3">
        {LAYERS.map((layer) => {
          const result = layers[layer.id];
          if (!result) return null;
          const currentVal = overrides[layer.id] ?? 0.5;
          const original = result.confidence;
          const changed = Math.abs(currentVal - original) > 0.01;

          return (
            <div key={layer.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={cn(T.label, 'text-white/40')}>
                  {layer.name}
                </span>
                <span className={cn(
                  T.monoSm,
                  changed ? 'text-orange-300' : 'text-white/30',
                )}>
                  {(currentVal * 100).toFixed(0)}%
                  {changed && (
                    <span className="text-white/20 ml-1">
                      (was {(original * 100).toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
              <Slider
                value={[currentVal]}
                onValueChange={(v) => handleSliderChange(layer.id, v)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          );
        })}
      </div>

      <p className={cn(T.legend, 'mt-3')}>
        Drag sliders to see how layer confidence affects the final signal. This is a client-side approximation.
      </p>
    </div>
  );
}
