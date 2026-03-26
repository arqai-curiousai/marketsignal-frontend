'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BarChart3, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ILayerResult, ILayerDefinition, StrategySignal } from '@/types/strategy';
import { S, T, L, signalColor, layerColor, fmtPct } from './tokens';

interface LayerDetailCardProps {
  layer: ILayerResult | null;
  layerDef: ILayerDefinition | null;
  className?: string;
}

function BiasTag({ bias }: { bias: StrategySignal }) {
  const sc = signalColor(bias);
  return (
    <Badge
      variant="outline"
      className={cn('px-2 py-0.5', sc.text, sc.border, sc.bg, T.badge)}
    >
      {bias.toUpperCase()}
    </Badge>
  );
}

interface FeatureBarProps {
  name: string;
  value: number;
  maxAbs: number;
}

function FeatureBar({ name, value, maxAbs }: FeatureBarProps) {
  const isPositive = value >= 0;
  const widthPct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          T.caption,
          'w-[120px] shrink-0 truncate text-white/50',
        )}
        title={name}
      >
        {name}
      </span>
      <div className="relative flex h-3 flex-1 items-center">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.08]" />
        {/* Bar */}
        <motion.div
          className={cn(
            'absolute h-2.5 rounded-sm',
            isPositive ? 'bg-emerald-500/40' : 'bg-red-500/40',
          )}
          style={{
            left: isPositive ? '50%' : undefined,
            right: !isPositive ? '50%' : undefined,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${widthPct / 2}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span
        className={cn(
          T.monoSm,
          'w-[52px] shrink-0 text-right',
          isPositive ? 'text-emerald-400' : 'text-red-400',
        )}
      >
        {isPositive ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  );
}

function MetadataSection({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return null;

  return (
    <details className="group">
      <summary
        className={cn(
          T.label,
          'cursor-pointer text-white/30 hover:text-white/50 select-none',
        )}
      >
        Metadata ({entries.length} fields)
      </summary>
      <div className="mt-2 flex flex-col gap-1 pl-1">
        {entries.slice(0, 12).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between">
            <span className={cn(T.caption, 'text-white/40 truncate max-w-[140px]')}>
              {key}
            </span>
            <span className={cn(T.monoSm, 'text-white/50 truncate max-w-[120px]')}>
              {typeof val === 'number'
                ? val.toFixed(4)
                : typeof val === 'object' && val !== null
                  ? JSON.stringify(val)
                  : String(val ?? '\u2014')}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

export function LayerDetailCard({
  layer,
  layerDef,
  className,
}: LayerDetailCardProps) {
  return (
    <AnimatePresence mode="wait">
      {!layer || !layerDef ? (
        <motion.div
          key="placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            S.card,
            L.pad,
            'flex items-center justify-center min-h-[200px]',
            className,
          )}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <Brain className="h-8 w-8 text-white/10" />
            <span className={cn(T.caption, 'text-white/20')}>
              Select a layer to inspect
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={layerDef.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(S.card, L.pad, 'flex flex-col gap-4', className)}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: layerColor(layerDef.id).hex,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(T.heading, 'text-white')}>
                {layerDef.name}
              </span>
              <BiasTag bias={layer.bias} />
            </div>
            <div className="flex items-center gap-3 text-white/30">
              <span className={cn(T.mono, 'text-white/60')}>
                {fmtPct(layer.confidence, 0)}
              </span>
              <span className={cn(T.caption, 'flex items-center gap-1')}>
                <Clock className="h-3 w-3" />
                {layer.computationMs}ms
              </span>
            </div>
          </div>

          {/* Description */}
          <p className={cn(T.caption, 'text-white/40')}>
            {layerDef.description}
          </p>

          {/* Feature importance bars */}
          {Object.keys(layer.features).length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="h-3 w-3 text-white/30" />
                <span className={cn(T.label, 'text-white/30')}>
                  Feature Importance
                </span>
              </div>
              {(() => {
                const sorted = Object.entries(layer.features)
                  .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                  .slice(0, 10);
                const maxAbs =
                  sorted.length > 0
                    ? Math.max(...sorted.map(([, v]) => Math.abs(v)))
                    : 1;
                return sorted.map(([name, val]) => (
                  <FeatureBar
                    key={name}
                    name={name}
                    value={val}
                    maxAbs={maxAbs}
                  />
                ));
              })()}
            </div>
          )}

          {/* Metadata */}
          <MetadataSection metadata={layer.metadata} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
