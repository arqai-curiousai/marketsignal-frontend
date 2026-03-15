'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { INewsArticle, INewsImpact } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { SentimentBadge } from './SentimentBadge';
import { formatTimeAgo, getTimeGroup, getSourceDisplayName } from './constants';

interface TrendingCarouselProps {
  articles: INewsArticle[];
  impactMap: Map<string, INewsImpact>;
  onSelectArticle: (article: INewsArticle) => void;
  onTickerClick: (ticker: string) => void;
  selectedArticle: INewsArticle | null;
}

/** Compute a trending score for ranking. Higher = more trending. */
function trendingScore(
  article: INewsArticle,
  impactMap: Map<string, INewsImpact>
): number {
  if (!article.published_at) return 0;
  const hoursAgo = (Date.now() - new Date(article.published_at).getTime()) / 3600000;
  const recencyScore = Math.max(0, 1 - hoursAgo / 48);
  const sentimentIntensity = Math.abs(article.sentiment_score ?? 0);
  const impact = impactMap.get(article.id);
  const impactScore = impact ? Math.min(1, impact.overall_impact_magnitude / 5) : 0;
  const symbolBoost = article.symbols.length > 0 ? 0.2 : 0;
  return recencyScore * 0.4 + sentimentIntensity * 0.2 + impactScore * 0.3 + symbolBoost * 0.1;
}

export function TrendingCarousel({
  articles,
  impactMap,
  onSelectArticle,
  onTickerClick,
  selectedArticle,
}: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const trendingArticles = useMemo(() => {
    return [...articles]
      .filter((a) => a.published_at)
      .map((a) => ({ article: a, score: trendingScore(a, impactMap) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((t) => t.article);
  }, [articles, impactMap]);

  const [showArrows, setShowArrows] = useState(false);

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  if (trendingArticles.length === 0) return null;

  return (
    <div className="mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-brand-blue" />
        <span className="text-[11px] font-semibold text-white">Trending Now</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {trendingArticles.length} stories
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div
        className="relative group"
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
      >
        {/* Left arrow */}
        {showArrows && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {/* Right arrow */}
        {showArrows && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {trendingArticles.map((article, idx) => {
            const isBreaking = getTimeGroup(article.published_at) === 'breaking';
            const isSelected = selectedArticle?.id === article.id;

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelectArticle(article)}
                className={cn(
                  'snap-start shrink-0 rounded-lg border p-2.5 cursor-pointer transition-all',
                  'min-w-[190px] max-w-[210px] sm:min-w-[200px] sm:max-w-[220px]',
                  'bg-white/[0.03] hover:bg-white/[0.06]',
                  isSelected
                    ? 'border-brand-blue/40 bg-brand-blue/5'
                    : 'border-white/10 hover:border-white/20'
                )}
              >
                {/* Time + breaking indicator */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  {isBreaking && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(article.published_at)}
                  </span>
                </div>

                {/* Headline */}
                <h4 className="text-xs font-medium text-white leading-snug line-clamp-3 mb-2">
                  {article.headline}
                </h4>

                {/* Ticker pills (max 2) */}
                {article.symbols.length > 0 && (
                  <div className="flex gap-1 mb-1.5">
                    {article.symbols.slice(0, 2).map((sym) => (
                      <button
                        key={sym}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTickerClick(sym);
                        }}
                        className="text-[9px] font-mono text-brand-blue/80 bg-brand-blue/10 px-1 py-0.5 rounded hover:bg-brand-blue/20 transition-colors"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom: sentiment + source */}
                <div className="flex items-center gap-1.5">
                  <SentimentBadge sentiment={article.sentiment} score={article.sentiment_score} />
                  <span className="text-[9px] text-white/40 truncate">
                    {getSourceDisplayName(article.source)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right fade gradient — hints at more cards */}
        <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#0d1117] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
