'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, Zap } from 'lucide-react';
import type { INewsArticle, INewsImpact } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { SentimentBadge } from './SentimentBadge';
import { formatTimeAgo, getTimeGroup, getSourceDisplayName, getSentimentColor } from './constants';

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
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  if (trendingArticles.length === 0) return null;

  return (
    <div className="mb-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/[0.08] border border-amber-500/[0.12]">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-amber-300">Trending Now</span>
        </div>
        <span className="text-[10px] text-white/30 tabular-nums">
          {trendingArticles.length} stories
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
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
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/70 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all backdrop-blur-md shadow-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {/* Right arrow */}
        {showArrows && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/70 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all backdrop-blur-md shadow-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {trendingArticles.map((article, idx) => {
            const isBreaking = getTimeGroup(article.published_at) === 'breaking';
            const isSelected = selectedArticle?.id === article.id;
            const sentColor = getSentimentColor(article.sentiment, article.sentiment_score);
            const isHighImpact = impactMap.has(article.id) &&
              (impactMap.get(article.id)?.overall_impact_magnitude ?? 0) > 2;

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelectArticle(article)}
                className={cn(
                  'snap-start shrink-0 rounded-xl border cursor-pointer transition-all relative overflow-hidden group/card',
                  'min-w-[200px] max-w-[220px] sm:min-w-[210px] sm:max-w-[230px]',
                  isSelected
                    ? 'border-brand-blue/40 bg-brand-blue/[0.06]'
                    : isBreaking
                    ? 'border-red-500/30 bg-red-500/[0.03] hover:border-red-500/50'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]',
                )}
                style={{
                  boxShadow: isBreaking
                    ? '0 0 20px rgba(239, 68, 68, 0.08)'
                    : isSelected
                    ? '0 0 20px rgba(59, 130, 246, 0.1)'
                    : undefined,
                }}
              >
                {/* Rank badge */}
                <div className={cn(
                  'absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold tabular-nums',
                  idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  idx === 1 ? 'bg-white/[0.08] text-white/60 border border-white/[0.12]' :
                  idx === 2 ? 'bg-white/[0.06] text-white/50 border border-white/[0.10]' :
                  'bg-white/[0.04] text-white/30 border border-white/[0.06]'
                )}>
                  {idx + 1}
                </div>

                {/* Sentiment accent line at top */}
                <div
                  className="h-[2px] w-full"
                  style={{
                    background: `linear-gradient(90deg, ${sentColor}60, ${sentColor}20, transparent)`,
                  }}
                />

                <div className="p-3 pt-2">
                  {/* Time + breaking/high-impact indicator */}
                  <div className="flex items-center justify-between gap-1.5 mb-2 ml-6">
                    <span className="text-[10px] text-white/40">
                      {formatTimeAgo(article.published_at)}
                    </span>
                    <div className="flex items-center gap-1">
                      {isBreaking && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                      )}
                      {isHighImpact && !isBreaking && (
                        <Zap className="h-3 w-3 text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="text-xs font-medium text-white/90 leading-snug line-clamp-3 mb-2.5">
                    {article.headline}
                  </h4>

                  {/* Ticker pills (max 2) */}
                  {article.symbols.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {article.symbols.slice(0, 2).map((sym) => (
                        <button
                          key={sym}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTickerClick(sym);
                          }}
                          className="text-[9px] font-mono font-semibold text-brand-blue/80 bg-brand-blue/[0.08] px-1.5 py-0.5 rounded-md border border-brand-blue/[0.12] hover:bg-brand-blue/[0.15] transition-colors"
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bottom: sentiment + source */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/[0.06]">
                    <SentimentBadge sentiment={article.sentiment} score={article.sentiment_score} />
                    <span className="text-[9px] text-white/30 truncate">
                      {getSourceDisplayName(article.source)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-[#0d1117] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
