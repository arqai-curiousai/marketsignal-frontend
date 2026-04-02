'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { INewsArticle } from '@/types/analytics';
import type { NewsRegion } from './constants';
import { ALL_REGIONS, REGION_METADATA, formatTimeAgo, getSentimentColor } from './constants';
import { SourceBadge } from './SourceBadge';

interface MultiRegionDeckProps {
  articles: INewsArticle[];
  regions: Set<NewsRegion>;
  onSelectArticle: (article: INewsArticle) => void;
  onTickerClick: (ticker: string) => void;
}

type RegionBucket = {
  region: string;
  meta: (typeof REGION_METADATA)[string];
  items: INewsArticle[];
  avgSentiment: number;
};

function microSentimentBar(avg: number, color: string) {
  const pct = Math.min(Math.max((avg + 1) / 2, 0), 1) * 100;
  return (
    <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/**
 * MultiRegionDeck -- Bloomberg/TweetDeck multi-column layout.
 * Each column shows news for one region with independent scroll.
 */
export function MultiRegionDeck({
  articles,
  regions,
  onSelectArticle,
  onTickerClick,
}: MultiRegionDeckProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeRegions = useMemo(() => {
    if (regions.size === 0 || regions.has('all')) return ALL_REGIONS.filter((r) => r !== 'all');
    return Array.from(regions).filter((r) => r !== 'all');
  }, [regions]);

  const buckets = useMemo<RegionBucket[]>(() => {
    const map = new Map<string, INewsArticle[]>();
    for (const r of activeRegions) map.set(r, []);

    for (const a of articles) {
      const articleRegions = a.regions ?? [];
      for (const r of articleRegions) {
        if (map.has(r)) map.get(r)!.push(a);
      }
    }

    return activeRegions
      .map((r) => {
        const items = map.get(r) ?? [];
        const scores = items
          .map((a) => a.sentiment_score)
          .filter((s): s is number => s != null);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          region: r,
          meta: REGION_METADATA[r] ?? { displayName: r, flag: '', color: '#64748B', primaryCurrencies: '' },
          items,
          avgSentiment: avg,
        };
      })
      .filter((b) => b.items.length > 0);
  }, [articles, activeRegions]);

  // Build a set of article ids that appear in more than one column for cross-highlighting
  const multiColumnIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of buckets) {
      for (const a of b.items) {
        counts.set(a.id, (counts.get(a.id) ?? 0) + 1);
      }
    }
    const ids = new Set<string>();
    counts.forEach((c, id) => { if (c > 1) ids.add(id); });
    return ids;
  }, [buckets]);

  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);

  if (buckets.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-white/30 text-sm">
        No articles for selected regions
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(buckets.length, 6)}, minmax(280px, 1fr))`,
          minWidth: buckets.length > 3 ? `${buckets.length * 290}px` : undefined,
        }}
      >
        {buckets.slice(0, 6).map((bucket) => (
          <div
            key={bucket.region}
            className="flex flex-col rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden min-h-0"
          >
            {/* Sticky column header */}
            <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-white/[0.06] px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">{bucket.meta.flag}</span>
                <span className="text-[11px] font-semibold text-white/70 tracking-wide uppercase">
                  {bucket.meta.displayName}
                </span>
                <span className="ml-auto text-[10px] text-white/30 tabular-nums">
                  {bucket.items.length}
                </span>
              </div>
              {microSentimentBar(bucket.avgSentiment, bucket.meta.color)}
            </div>

            {/* Scrollable article list */}
            <div className="flex-1 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/10 divide-y divide-white/[0.04]">
              {bucket.items.map((article) => {
                const isShared = multiColumnIds.has(article.id);
                const isGlowing = isShared && hoveredId === article.id;
                const sentColor = getSentimentColor(article.sentiment, article.sentiment_score);

                return (
                  <div
                    key={article.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectArticle(article)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectArticle(article);
                      }
                    }}
                    onMouseEnter={() => isShared ? handleHover(article.id) : undefined}
                    onMouseLeave={() => isShared ? handleHover(null) : undefined}
                    className={cn(
                      'px-3 py-2.5 cursor-pointer transition-all hover:bg-white/[0.04]',
                      isGlowing && 'bg-white/[0.06] ring-1 ring-white/[0.12]'
                    )}
                  >
                    {/* Headline */}
                    <h4 className="text-[12px] font-medium text-white/85 leading-snug line-clamp-2 mb-1.5">
                      {article.headline}
                    </h4>

                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SourceBadge source={article.source} />
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: sentColor }}
                      />
                      <span className="text-[10px] text-white/30 ml-auto whitespace-nowrap">
                        {formatTimeAgo(article.published_at)}
                      </span>
                    </div>

                    {/* Ticker pills */}
                    {article.symbols.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {article.symbols.slice(0, 3).map((sym) => (
                          <button
                            key={sym}
                            onClick={(e) => { e.stopPropagation(); onTickerClick(sym); }}
                            className="text-[9px] font-mono text-white/50 bg-white/[0.06] hover:bg-white/[0.1] rounded px-1.5 py-0.5 transition-colors"
                          >
                            {sym}
                          </button>
                        ))}
                        {article.symbols.length > 3 && (
                          <span className="text-[9px] text-white/25 self-center">
                            +{article.symbols.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
