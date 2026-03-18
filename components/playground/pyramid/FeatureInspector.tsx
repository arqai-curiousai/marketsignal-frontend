'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { IFeatureInspection, IFeatureDetail } from '@/types/strategy';
import { S, T, LAYER, layerColor, fmtNum } from './tokens';
import { LAYERS } from './constants';

interface FeatureInspectorProps {
  inspection: IFeatureInspection | null;
  loading?: boolean;
  className?: string;
}

// ─── Direction Dot ─────────────────────────────────────────────────────

function DirectionDot({ direction }: { direction: IFeatureDetail['direction'] }) {
  const colorClass =
    direction === 'bullish'
      ? 'bg-emerald-400'
      : direction === 'bearish'
        ? 'bg-red-400'
        : 'bg-slate-500';
  return <span className={cn('inline-block h-2 w-2 rounded-full', colorClass)} />;
}

// ─── Z-Score Badge ─────────────────────────────────────────────────────

function ZScoreBadge({ zScore }: { zScore: number | null }) {
  if (zScore == null) {
    return <span className={cn(T.monoSm, 'text-muted-foreground')}>{'\u2014'}</span>;
  }
  const colorClass =
    zScore > 2
      ? 'text-emerald-400'
      : zScore < -2
        ? 'text-red-400'
        : Math.abs(zScore) > 1
          ? 'text-amber-400'
          : 'text-muted-foreground';
  return (
    <span className={cn(T.monoSm, colorClass)}>
      {zScore >= 0 ? '+' : ''}
      {zScore.toFixed(2)}
    </span>
  );
}

// ─── Importance Bar ────────────────────────────────────────────────────

function ImportanceBar({
  importance,
  maxImportance,
  color,
}: {
  importance: number;
  maxImportance: number;
  color: string;
}) {
  const widthPct = maxImportance > 0 ? (importance / maxImportance) * 100 : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${widthPct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
    </div>
  );
}

// ─── Layer Section ─────────────────────────────────────────────────────

function LayerSection({
  layerId,
  features,
  maxImportance,
  defaultOpen,
}: {
  layerId: string;
  features: IFeatureDetail[];
  maxImportance: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const layerDef = LAYERS.find((l) => l.id === layerId);
  const colors = layerColor(layerId);

  return (
    <div className={cn('border-b', S.divider)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2.5 px-1 hover:bg-white/[0.02] transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <Badge
          variant="outline"
          className={cn(T.badge, colors.text, colors.bg, colors.border, 'border')}
        >
          {layerDef?.shortName ?? layerId}
        </Badge>
        <span className={cn(T.caption, 'ml-auto')}>
          {features.length} feature{features.length !== 1 ? 's' : ''}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className={cn('border-b', S.rowDivider)}>
                    <th
                      className={cn(
                        T.label,
                        'text-left py-1.5 px-2 sticky left-0 bg-background z-10'
                      )}
                    >
                      Feature
                    </th>
                    <th className={cn(T.label, 'text-right py-1.5 px-2')}>
                      Value
                    </th>
                    <th className={cn(T.label, 'text-right py-1.5 px-2')}>
                      Z-Score
                    </th>
                    <th className={cn(T.label, 'text-center py-1.5 px-2')}>
                      Dir
                    </th>
                    <th className={cn(T.label, 'text-left py-1.5 px-2 w-24')}>
                      Importance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feat) => (
                    <tr
                      key={feat.name}
                      className={cn(
                        'border-b hover:bg-white/[0.02] transition-colors',
                        S.rowDivider
                      )}
                    >
                      <td
                        className={cn(
                          T.monoSm,
                          'py-1.5 px-2 text-left truncate max-w-[200px] sticky left-0 bg-background z-10'
                        )}
                      >
                        {feat.name}
                      </td>
                      <td className={cn(T.mono, 'py-1.5 px-2 text-right')}>
                        {fmtNum(feat.value, 4)}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <ZScoreBadge zScore={feat.zScore} />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <DirectionDot direction={feat.direction} />
                      </td>
                      <td className="py-1.5 px-2">
                        <ImportanceBar
                          importance={feat.importance}
                          maxImportance={maxImportance}
                          color={colors.hex}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function FeatureInspector({
  inspection,
  loading,
  className,
}: FeatureInspectorProps) {
  const [search, setSearch] = useState('');

  // Filter features by search and organize by layer
  const { layerData, maxImportance } = useMemo(() => {
    if (!inspection) return { layerData: [], maxImportance: 0 };

    const q = search.trim().toLowerCase();
    let globalMax = 0;
    const entries: Array<{ layerId: string; features: IFeatureDetail[] }> = [];

    // Use LAYERS order for consistent display
    for (const layer of LAYERS) {
      const features = inspection.layers[layer.id];
      if (!features || features.length === 0) continue;

      const filtered = q
        ? features.filter((f) => f.name.toLowerCase().includes(q))
        : features;

      if (filtered.length === 0) continue;

      for (const f of filtered) {
        if (f.importance > globalMax) globalMax = f.importance;
      }

      entries.push({ layerId: layer.id, features: filtered });
    }

    return { layerData: entries, maxImportance: globalMax };
  }, [inspection, search]);

  if (loading) {
    return (
      <div className={cn(S.glass, 'p-6 space-y-3', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted/60" />
            <div className="h-3 w-3/4 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className={cn(S.glass, 'p-6 text-center', className)}>
        <p className={T.caption}>No feature data available</p>
      </div>
    );
  }

  return (
    <div className={cn(S.glass, 'p-4 space-y-3', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'pl-8 h-8 bg-white/[0.02] border-white/[0.06]',
            T.monoSm,
            'placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/10'
          )}
        />
      </div>

      {/* Ticker + timestamp */}
      <div className="flex items-center gap-2">
        <span className={cn(T.heading)}>{inspection.ticker}</span>
        <span className={T.caption}>
          {new Date(inspection.generatedAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Layer sections */}
      <div>
        {layerData.length > 0 ? (
          layerData.map((entry, i) => (
            <LayerSection
              key={entry.layerId}
              layerId={entry.layerId}
              features={entry.features}
              maxImportance={maxImportance}
              defaultOpen={i === 0}
            />
          ))
        ) : (
          <p className={cn(T.caption, 'text-center py-6')}>
            {search ? 'No features match search' : 'No feature data available'}
          </p>
        )}
      </div>
    </div>
  );
}
