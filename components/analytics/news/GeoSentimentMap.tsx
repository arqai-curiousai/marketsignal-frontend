'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { NewsRegion } from './constants';
import { REGION_METADATA } from './constants';
import type { IGeoSentiment } from '@/types/analytics';

interface GeoSentimentMapProps {
  geoSentiment: IGeoSentiment[];
  activeRegions: Set<NewsRegion>;
  onRegionClick: (region: NewsRegion) => void;
  compact?: boolean;
}

/** Geographic grid positions: row 1 = Americas, Europe, Scandinavia; row 2 = India, Asia-Pac, EM */
const GRID_POS: Record<string, { col: string; row: string }> = {
  americas:          { col: 'col-start-1', row: 'row-start-1' },
  europe:            { col: 'col-start-2', row: 'row-start-1' },
  scandinavia:       { col: 'col-start-3', row: 'row-start-1' },
  india:             { col: 'col-start-1', row: 'row-start-2' },
  asia_pacific:      { col: 'col-start-2', row: 'row-start-2' },
  emerging_markets:  { col: 'col-start-3', row: 'row-start-2' },
};

/** Connection lines drawn between adjacent regions (SVG overlay for desktop). */
const CONNECTIONS: [string, string][] = [
  ['americas', 'europe'],
  ['europe', 'scandinavia'],
  ['europe', 'india'],
  ['india', 'asia_pacific'],
  ['asia_pacific', 'emerging_markets'],
  ['americas', 'emerging_markets'],
];

function sentimentBarPct(score: number): number {
  return Math.round(((score + 1) / 2) * 100);
}

function sentimentBarColor(score: number): string {
  if (score > 0.15) return '#10B981';
  if (score < -0.15) return '#EF4444';
  return '#64748B';
}

function RegionCard({
  geo,
  active,
  onClick,
}: {
  geo: IGeoSentiment;
  active: boolean;
  onClick: () => void;
}) {
  const meta = REGION_METADATA[geo.region];
  if (!meta) return null;

  const pct = sentimentBarPct(geo.avg_sentiment);
  const barColor = sentimentBarColor(geo.avg_sentiment);
  const sign = geo.avg_sentiment >= 0 ? '+' : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full rounded-lg border px-3 py-2.5 text-left transition-all',
        'bg-white/[0.02] hover:bg-white/[0.05]',
        active
          ? 'border-opacity-90 shadow-md shadow-white/5'
          : 'border-opacity-30 hover:border-opacity-60',
      )}
      style={{
        borderColor: active ? meta.color : `${meta.color}66`,
      }}
    >
      {/* Breaking pulse */}
      {geo.breaking_count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: '#EF4444' }}
          />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}

      {/* Header: flag + name */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
        <span>{meta.flag}</span>
        <span className="truncate">{meta.displayName}</span>
      </div>

      {/* Sentiment bar */}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        <span className="shrink-0 text-[10px] font-mono text-white/60">
          {sign}{geo.avg_sentiment.toFixed(2)}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/50">
        <span>{geo.article_count} articles</span>
        {geo.breaking_count > 0 && (
          <span className="flex items-center gap-0.5 text-red-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
            {geo.breaking_count}
          </span>
        )}
      </div>

      {/* Currency pairs */}
      <div className="mt-1 truncate text-[10px] text-white/35">
        {meta.primaryCurrencies}
      </div>
    </button>
  );
}

/** SVG overlay: subtle dashed lines connecting adjacent regions. */
function ConnectionLines() {
  // Grid centres for a 3x2 layout (percentage-based)
  const centres: Record<string, [number, number]> = {
    americas:         [16.7, 25],
    europe:           [50, 25],
    scandinavia:      [83.3, 25],
    india:            [16.7, 75],
    asia_pacific:     [50, 75],
    emerging_markets: [83.3, 75],
  };

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      {CONNECTIONS.map(([a, b]) => {
        const [x1, y1] = centres[a];
        const [x2, y2] = centres[b];
        return (
          <line
            key={`${a}-${b}`}
            x1={`${x1}%`} y1={`${y1}%`}
            x2={`${x2}%`} y2={`${y2}%`}
            stroke="white"
            strokeOpacity={0.06}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        );
      })}
    </svg>
  );
}

export default function GeoSentimentMap({
  geoSentiment,
  activeRegions,
  onRegionClick,
  compact = false,
}: GeoSentimentMapProps) {
  const lookup = React.useMemo(() => {
    const m = new Map<string, IGeoSentiment>();
    for (const g of geoSentiment) m.set(g.region, g);
    return m;
  }, [geoSentiment]);

  const regions = Object.keys(GRID_POS) as NewsRegion[];

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {regions.map((r) => {
          const geo = lookup.get(r);
          if (!geo) return null;
          return (
            <RegionCard
              key={r}
              geo={geo}
              active={activeRegions.has(r) || activeRegions.has('all')}
              onClick={() => onRegionClick(r)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl bg-white/[0.02] p-3">
      <ConnectionLines />
      <div className="relative grid grid-cols-3 grid-rows-2 gap-3">
        {regions.map((r) => {
          const geo = lookup.get(r);
          if (!geo) return null;
          const pos = GRID_POS[r];
          return (
            <div key={r} className={cn(pos.col, pos.row)}>
              <RegionCard
                geo={geo}
                active={activeRegions.has(r) || activeRegions.has('all')}
                onClick={() => onRegionClick(r)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
