'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Skull,
  Landmark,
  Flame,
  TrendingDown,
  Globe,
  Factory,
  Vote,
  BadgeIndianRupee,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IScenarioPreset } from '@/types/simulation';

const ICON_MAP: Record<string, React.ElementType> = {
  covid_crash: Skull,
  rbi_rate_hike: Landmark,
  crude_120: Flame,
  fii_outflow: TrendingDown,
  rupee_90: BadgeIndianRupee,
  election_vol: Vote,
  global_recession: Globe,
  china_slowdown: Factory,
};

interface Props {
  presets: IScenarioPreset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ScenarioSelector({ presets, selectedId, onSelect, loading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {presets.map((preset, i) => {
        const Icon = ICON_MAP[preset.id] || Globe;
        const isActive = selectedId === preset.id;
        return (
          <motion.button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            disabled={loading}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              S.card,
              'px-3 py-2.5 text-left transition-all cursor-pointer',
              'hover:border-orange-500/30 hover:bg-orange-500/[0.04]',
              isActive && 'border-orange-500/40 bg-orange-500/[0.06]',
              loading && 'opacity-50 pointer-events-none',
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-orange-400' : 'text-white/40')} />
              <span className={cn(T.badge, isActive ? 'text-orange-300' : 'text-white/60')}>
                {preset.label}
              </span>
            </div>
            <p className="text-[9px] text-white/30 leading-tight line-clamp-2">
              {preset.description}
            </p>
            <div className="flex gap-2 mt-1.5">
              <span className="text-[8px] font-mono text-white/20">
                Vol ×{preset.volMultiplier.toFixed(1)}
              </span>
              {preset.driftShock !== 0 && (
                <span className="text-[8px] font-mono text-white/20">
                  Drift {(preset.driftShock * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </motion.button>
        );
      })}

      {/* Custom scenario card */}
      <motion.button
        type="button"
        onClick={() => onSelect('custom')}
        disabled={loading}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: presets.length * 0.04 }}
        className={cn(
          S.card,
          'px-3 py-2.5 text-left transition-all cursor-pointer border-dashed',
          'hover:border-orange-500/30 hover:bg-orange-500/[0.04]',
          selectedId === 'custom' && 'border-orange-500/40 bg-orange-500/[0.06]',
          loading && 'opacity-50 pointer-events-none',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className={cn('h-3.5 w-3.5', selectedId === 'custom' ? 'text-orange-400' : 'text-white/40')} />
          <span className={cn(T.badge, selectedId === 'custom' ? 'text-orange-300' : 'text-white/60')}>
            Custom
          </span>
        </div>
        <p className="text-[9px] text-white/30 leading-tight">
          Define your own vol multiplier, drift shock, and correlation shift.
        </p>
      </motion.button>
    </div>
  );
}
