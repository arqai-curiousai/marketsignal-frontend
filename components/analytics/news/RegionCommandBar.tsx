'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { NewsRegion } from './constants';
import { ALL_REGIONS, REGION_METADATA } from './constants';
import type { IGeoSentiment } from '@/types/analytics';

interface RegionCommandBarProps {
  regions: Set<NewsRegion>;
  onToggle: (region: NewsRegion) => void;
  geoSentiment?: IGeoSentiment[];
}

function sentimentDot(score: number): string {
  if (score > 0.15) return 'bg-emerald-400';
  if (score < -0.15) return 'bg-red-400';
  return 'bg-slate-400';
}

/**
 * RegionCommandBar — multi-select region pills replacing binary ScopeTabs.
 *
 * Supports multi-select (union), shows article count + sentiment per region.
 * "All" clears individual selections.
 */
export function RegionCommandBar({ regions, onToggle, geoSentiment }: RegionCommandBarProps) {
  const isAll = regions.size === 0;

  const sentimentByRegion = React.useMemo(() => {
    const map = new Map<string, IGeoSentiment>();
    if (geoSentiment) {
      for (const gs of geoSentiment) map.set(gs.region, gs);
    }
    return map;
  }, [geoSentiment]);

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5" role="tablist" aria-label="News regions">
      {/* All pill */}
      <button
        role="tab"
        aria-selected={isAll}
        onClick={() => onToggle('all')}
        className={cn(
          'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
          isAll
            ? 'bg-white/[0.10] text-white shadow-sm'
            : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
        )}
      >
        All
      </button>

      {/* Region pills */}
      {ALL_REGIONS.map((r) => {
        const meta = REGION_METADATA[r];
        if (!meta) return null;
        const active = regions.has(r);
        const gs = sentimentByRegion.get(r);

        return (
          <button
            key={r}
            role="tab"
            aria-selected={active}
            onClick={() => onToggle(r)}
            className={cn(
              'group relative shrink-0 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-all',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
              active
                ? 'bg-white/[0.10] text-white shadow-sm'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
            )}
            style={active ? { borderBottom: `2px solid ${meta.color}` } : undefined}
          >
            {/* Sentiment dot */}
            {gs && (
              <span className={cn('h-1.5 w-1.5 rounded-full', sentimentDot(gs.avg_sentiment))} />
            )}

            {/* Flag + name */}
            <span className="font-medium">{meta.displayName}</span>

            {/* Article count badge */}
            {gs && gs.article_count > 0 && (
              <span className={cn(
                'ml-0.5 min-w-[18px] rounded-full px-1 py-px text-center text-[10px] leading-tight',
                active ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/30',
              )}>
                {gs.article_count > 99 ? '99+' : gs.article_count}
              </span>
            )}

            {/* Breaking indicator */}
            {gs && gs.breaking_count > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
