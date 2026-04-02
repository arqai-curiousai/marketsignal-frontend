'use client';

import React, { useMemo } from 'react';
import { Globe, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IMorningBrief, IGeoSentiment } from '@/types/analytics';
import { REGION_METADATA, getSentimentColor } from './constants';

interface GlobalBriefCardProps {
  brief: IMorningBrief | null;
  loading: boolean;
  dismissed: boolean;
  onDismiss: () => void;
  geoSentiment?: IGeoSentiment[];
}

const DIR_ICON: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-3 h-3" />, down: <TrendingDown className="w-3 h-3" />, flat: <Minus className="w-3 h-3" />,
};
const DIR_SM: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-2.5 h-2.5" />, down: <TrendingDown className="w-2.5 h-2.5" />, flat: <Minus className="w-2.5 h-2.5" />,
};
const DIR_CLS: Record<string, string> = {
  up: 'text-emerald-400', down: 'text-red-400', flat: 'text-white/40',
};

function getSubtitle(): string {
  const h = new Date().getUTCHours();
  return h >= 4 && h < 10 ? 'Market Opening' : h < 16 ? 'Midday Update' : 'Evening Wrap';
}

function sentDir(s: number): 'up' | 'down' | 'flat' {
  return s > 0.15 ? 'up' : s < -0.15 ? 'down' : 'flat';
}

/**
 * GlobalBriefCard -- Multi-region morning brief that replaces MorningBriefCard.
 * Shows "While You Were Sleeping" overnight events, narrative, key numbers,
 * and per-region sentiment pills.
 */
export function GlobalBriefCard({
  brief,
  loading,
  dismissed,
  onDismiss,
  geoSentiment = [],
}: GlobalBriefCardProps) {
  const subtitle = useMemo(getSubtitle, []);
  const overnight = useMemo(
    () => geoSentiment.filter((g) => g.breaking_count > 0).sort((a, b) => b.breaking_count - a.breaking_count),
    [geoSentiment],
  );

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-32 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  if (!brief) return null;

  const sentimentColor = getSentimentColor(brief.market_sentiment);
  const hasKeyNumbers = brief.key_numbers && brief.key_numbers.length > 0;

  return (
    <div className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0">
        <Globe className="w-4 h-4 text-blue-400/70" />
        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
          Global Brief
        </span>
        <span className="text-[10px] text-white/30">{subtitle}</span>
        <span
          className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${sentimentColor}15`, color: sentimentColor }}
        >
          {brief.market_sentiment}
        </span>
        <button
          onClick={onDismiss}
          className="text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Dismiss brief"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* While You Were Sleeping */}
      {overnight.length > 0 && (
        <div className="px-4 pt-2.5">
          <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
            While You Were Sleeping
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {overnight.slice(0, 4).map((g) => {
              const meta = REGION_METADATA[g.region];
              const dir = sentDir(g.avg_sentiment);
              return (
                <div
                  key={g.region}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] shrink-0"
                >
                  <span className="text-xs">{meta?.flag ?? g.flag}</span>
                  <span className="text-[10px] text-white/60 font-medium">
                    {meta?.displayName ?? g.display_name}
                  </span>
                  <span className="text-[10px] text-amber-400/80 tabular-nums font-medium">
                    {g.breaking_count} new
                  </span>
                  <span className={cn('flex items-center', DIR_CLS[dir])}>
                    {DIR_ICON[dir]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Numbers */}
      {hasKeyNumbers && (
        <div className="flex gap-1 px-4 pt-2.5 overflow-x-auto scrollbar-none">
          {brief.key_numbers?.map((kn, i) => {
            const dir = kn.direction || 'flat';
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] shrink-0"
              >
                <span className="text-[10px] text-white/35 whitespace-nowrap">{kn.label}</span>
                <span className="text-[11px] text-white/70 font-medium tabular-nums">{kn.value}</span>
                <span className={cn('flex items-center gap-0.5 text-[10px]', DIR_CLS[dir])}>
                  {DIR_ICON[dir]}
                  <span className="tabular-nums">{kn.change}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Narrative */}
      <div className="px-4 pt-2.5 pb-2">
        <p className="text-[13px] text-white/70 leading-relaxed line-clamp-4">
          {brief.narrative}
        </p>
      </div>

      {/* Top Stories */}
      {brief.top_stories && brief.top_stories.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {brief.top_stories.slice(0, 4).map((s, i) => (
            <span key={i} className="text-[10px] text-white/40 bg-white/[0.04] rounded-md px-2 py-0.5 truncate max-w-[220px]">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Region Sentiment Pills */}
      {geoSentiment.length > 0 && (
        <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-white/[0.04]">
          {geoSentiment.map((g) => {
            const meta = REGION_METADATA[g.region];
            const dir = sentDir(g.avg_sentiment);
            const color = meta?.color ?? g.color;
            return (
              <div key={g.region} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}12` }}>
                <span className="text-[10px]">{meta?.flag ?? g.flag}</span>
                <span className="text-[10px] font-medium" style={{ color }}>{meta?.displayName ?? g.display_name}</span>
                <span className={cn('flex items-center', DIR_CLS[dir])}>{DIR_SM[dir]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
