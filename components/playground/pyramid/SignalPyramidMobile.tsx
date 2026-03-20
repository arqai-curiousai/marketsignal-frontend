'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ILayerResult, StrategySignal } from '@/types/strategy';
import { LAYERS } from './constants';
import { signalColor, layerColor, T, S, fmtPct } from './tokens';

interface SignalPyramidMobileProps {
  layers: Record<string, ILayerResult>;
  finalSignal: StrategySignal;
  finalConfidence: number;
  selectedLayer: string | null;
  onLayerClick: (layerId: string) => void;
}

function BiasLabel({ bias }: { bias: StrategySignal }) {
  const sc = signalColor(bias);
  return (
    <Badge
      variant="outline"
      className={cn(
        'border px-1.5 py-0',
        sc.text,
        sc.border,
        sc.bg,
        T.badge,
      )}
    >
      {bias.toUpperCase()}
    </Badge>
  );
}

function ConfidenceBar({
  confidence,
  color,
}: {
  confidence: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className={cn(T.monoSm, 'text-white/50 w-8 text-right')}>
        {fmtPct(confidence, 0)}
      </span>
    </div>
  );
}

export function SignalPyramidMobile({
  layers,
  finalSignal,
  finalConfidence: _finalConfidence,
  selectedLayer,
  onLayerClick,
}: SignalPyramidMobileProps) {
  const signalStyle = signalColor(finalSignal);
  const sortedLayers = [...LAYERS].sort((a, b) => b.order - a.order); // top to bottom on mobile

  return (
    <div className="flex flex-col gap-3">
      {/* Apex orb */}
      <div className="flex items-center justify-center py-3">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: `rgba(${signalStyle.rgb}, 0.15)`,
            border: `2px solid ${signalStyle.hex}`,
            boxShadow: `0 0 24px ${signalStyle.glow}`,
          }}
          animate={{
            boxShadow: [
              `0 0 16px ${signalStyle.glow}`,
              `0 0 30px ${signalStyle.glow}`,
              `0 0 16px ${signalStyle.glow}`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className={cn('font-bold text-sm', signalStyle.text)}>
            {finalSignal.toUpperCase()}
          </span>
        </motion.div>
      </div>

      {/* Layer accordion */}
      <Accordion
        type="single"
        collapsible
        value={selectedLayer ?? undefined}
        onValueChange={(val) => {
          onLayerClick(val || '');
        }}
      >
        {sortedLayers.map((layerDef) => {
          const result = layers[layerDef.id];
          const accent = layerColor(layerDef.id);
          const bias: StrategySignal = result?.bias ?? 'hold';
          const confidence = result?.confidence ?? 0;

          return (
            <AccordionItem
              key={layerDef.id}
              value={layerDef.id}
              className={cn(S.card, 'mb-2 overflow-hidden')}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: accent.hex,
              }}
            >
              <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                <div className="flex flex-1 items-center justify-between pr-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(T.heading, 'text-white')}>
                      {layerDef.shortName}
                    </span>
                    <BiasLabel bias={bias} />
                  </div>
                  <span className={cn(T.monoSm, 'text-white/50')}>
                    {fmtPct(confidence, 0)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="flex flex-col gap-2">
                  <p className={cn(T.caption, 'text-white/40')}>
                    {layerDef.description}
                  </p>
                  <ConfidenceBar confidence={confidence} color={accent.hex} />
                  {result && Object.keys(result.features).length > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                      <span className={cn(T.label, 'text-white/30')}>
                        Top Features
                      </span>
                      {Object.entries(result.features)
                        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                        .slice(0, 5)
                        .map(([name, val]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between"
                          >
                            <span className={cn(T.caption, 'text-white/50 truncate max-w-[180px]')}>
                              {name}
                            </span>
                            <span
                              className={cn(
                                T.monoSm,
                                val > 0 ? 'text-emerald-400' : val < 0 ? 'text-red-400' : 'text-white/40',
                              )}
                            >
                              {val > 0 ? '+' : ''}{val.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
