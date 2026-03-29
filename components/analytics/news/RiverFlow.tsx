'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import type { INewsCluster, INewsArticle } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { THEME_COLORS, getSentimentColor, getTimeGroup, formatTimeAgo } from './constants';
import { SourceBadge } from './SourceBadge';

interface RiverFlowProps {
  clusters: INewsCluster[];
  articles: INewsArticle[];
  loading: boolean;
  onSelectArticle: (article: INewsArticle) => void;
  onTickerClick: (ticker: string) => void;
  selectedArticle: INewsArticle | null;
  previousClusterCounts?: React.MutableRefObject<Map<string, number>>;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

/** Quality tier thresholds for visual hierarchy */
const QUALITY_TIERS = {
  TIER_1: 0.7,  // Full card with image
  TIER_2: 0.4,  // Compact card
  // Below 0.4 = minimal single-line
} as const;

/**
 * RiverFlow — a flat, breathing feed where clusters are implied through
 * negative space (Ma principle) rather than explicit tabs and groups.
 *
 * Quality scores drive visual hierarchy:
 * - Tier 1 (≥0.7): Full card with summary + image + ticker pills
 * - Tier 2 (0.4-0.7): Compact card, headline + tickers as text
 * - Tier 3 (<0.4): Single-line headline, muted
 */
export function RiverFlow({
  clusters,
  articles,
  loading,
  onSelectArticle,
  onTickerClick,
  selectedArticle,
  previousClusterCounts,
  hasMore,
  loadingMore,
  onLoadMore,
}: RiverFlowProps) {
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());

  const toggleCluster = (label: string) => {
    setCollapsedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Detect developing stories (growing clusters)
  const developingClusters = useMemo(() => {
    if (!previousClusterCounts?.current) return new Set<string>();
    const developing = new Set<string>();
    for (const cluster of clusters) {
      const prev = previousClusterCounts.current.get(cluster.cluster_label);
      if (prev != null && cluster.article_count > prev) {
        developing.add(cluster.cluster_label);
      }
    }
    return developing;
  }, [clusters, previousClusterCounts]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 animate-pulse"
          >
            <div className="h-3.5 w-3/4 bg-white/[0.06] rounded-md mb-2" />
            <div className="h-3 w-1/2 bg-white/[0.04] rounded-md mb-3" />
            <div className="flex gap-2">
              <div className="h-4 w-14 bg-white/[0.04] rounded-md" />
              <div className="h-4 w-14 bg-white/[0.04] rounded-md" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // If no clusters, render flat article list
  if (!clusters.length && articles.length > 0) {
    return (
      <div className="space-y-2">
        {articles.map((article, i) => (
          <RiverArticle
            key={article.id}
            article={article}
            index={i}
            isSelected={selectedArticle?.id === article.id}
            onSelect={onSelectArticle}
            onTickerClick={onTickerClick}
          />
        ))}
        <LoadMoreButton hasMore={hasMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
      </div>
    );
  }

  // Empty state
  if (!clusters.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/20">
        <p className="text-sm">No news articles for this time range.</p>
        <p className="text-xs mt-1">Try expanding the time range or changing filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {clusters.map((cluster, clusterIdx) => {
        const isCollapsed = collapsedClusters.has(cluster.cluster_label);
        const themeColor = THEME_COLORS[cluster.primary_theme] || '#94A3B8';
        const isDeveloping = developingClusters.has(cluster.cluster_label);

        return (
          <div key={`${cluster.cluster_label}-${clusterIdx}`}>
            {/* Inter-cluster breathing space (Ma) */}
            {clusterIdx > 0 && (
              <div className="my-6 flex items-center gap-3">
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: `${themeColor}20` }}
                />
              </div>
            )}

            {/* Story pill — the cluster identity */}
            <button
              onClick={() => toggleCluster(cluster.cluster_label)}
              className="flex items-center gap-2 mb-3 group w-full text-left"
            >
              {/* Chevron */}
              <span className="text-white/20 group-hover:text-white/40 transition-colors">
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>

              {/* Theme dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: themeColor }}
              />

              {/* Label */}
              <span className="text-xs font-medium text-white/50 group-hover:text-white/70 transition-colors line-clamp-1 flex-1">
                {cluster.cluster_label}
              </span>

              {/* Developing indicator — "whisper" ring */}
              {isDeveloping && (
                <span className="relative flex h-3 w-3 shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
                    style={{ backgroundColor: themeColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-3 w-3 opacity-60"
                    style={{ backgroundColor: themeColor }}
                  />
                </span>
              )}

              {/* Article count */}
              <span className="text-[10px] text-white/20 shrink-0">
                {cluster.article_count} article{cluster.article_count !== 1 ? 's' : ''}
              </span>

              {/* Sentiment micro-bar */}
              <div
                className="w-8 h-1 rounded-full shrink-0"
                style={{
                  background: `linear-gradient(to right, ${getSentimentColor(null, cluster.avg_sentiment_score)}40, ${getSentimentColor(null, cluster.avg_sentiment_score)}80)`,
                }}
              />
            </button>

            {/* Cluster summary */}
            {!isCollapsed && cluster.cluster_summary && (
              <p className="text-[11px] text-white/25 italic ml-6 mb-3 leading-relaxed line-clamp-2">
                {cluster.cluster_summary}
              </p>
            )}

            {/* Articles within cluster */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 ml-0"
                >
                  {cluster.articles.map((article, i) => (
                    <RiverArticle
                      key={article.id}
                      article={article}
                      index={i}
                      isSelected={selectedArticle?.id === article.id}
                      onSelect={onSelectArticle}
                      onTickerClick={onTickerClick}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <LoadMoreButton hasMore={hasMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
    </div>
  );
}

// ─── Load More Button ────────────────────────────────────────────

function LoadMoreButton({
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  if (!hasMore || !onLoadMore) return null;
  return (
    <div className="flex justify-center pt-4 pb-2">
      <button
        onClick={onLoadMore}
        disabled={loadingMore}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all disabled:opacity-50"
      >
        {loadingMore ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </>
        ) : (
          'Load more articles'
        )}
      </button>
    </div>
  );
}

// ─── Individual Article in River ─────────────────────────────────

interface RiverArticleProps {
  article: INewsArticle;
  index: number;
  isSelected: boolean;
  onSelect: (article: INewsArticle) => void;
  onTickerClick: (ticker: string) => void;
}

function RiverArticle({ article, index, isSelected, onSelect, onTickerClick }: RiverArticleProps) {
  const quality = article.quality_score ?? 0.5;
  const sentimentColor = getSentimentColor(article.sentiment, article.sentiment_score);
  const timeGroup = getTimeGroup(article.published_at);

  // Tier 1: Full card (quality >= 0.7)
  if (quality >= QUALITY_TIERS.TIER_1) {
    return (
      <motion.button
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
        onClick={() => onSelect(article)}
        className={cn(
          'w-full text-left rounded-lg border bg-white/[0.02] p-3.5 transition-all duration-200',
          'hover:bg-white/[0.04] hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/20',
          isSelected
            ? 'border-blue-500/30 shadow-md shadow-blue-500/5'
            : 'border-white/[0.06]'
        )}
        style={{ borderLeftWidth: 2, borderLeftColor: sentimentColor }}
      >
        <div className="flex gap-3">
          {/* Image thumbnail — hidden on mobile to conserve space */}
          {article.image_url && (
            <div className="hidden sm:block w-16 h-16 rounded-md overflow-hidden bg-white/[0.03] shrink-0">
              <img
                src={article.image_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Breaking indicator */}
            {timeGroup === 'breaking' && (
              <span className="inline-flex items-center gap-1 text-[9px] text-amber-400/70 mb-1">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                Just now
              </span>
            )}

            {/* Headline */}
            <h3 className="text-[13px] font-medium text-white/80 leading-snug line-clamp-2 mb-1">
              {article.headline}
            </h3>

            {/* Summary */}
            {article.summary && (
              <p className="text-[11px] text-white/35 leading-relaxed line-clamp-2 mb-2">
                {article.summary}
              </p>
            )}

            {/* Footer: tickers + metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              {article.symbols.slice(0, 4).map((t) => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTickerClick(t);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[10px] text-teal-400/60 hover:text-teal-400 transition-colors"
                >
                  {t}
                </button>
              ))}
              {article.symbols.length > 4 && (
                <span className="text-[10px] text-white/20">
                  +{article.symbols.length - 4}
                </span>
              )}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <SourceBadge source={article.source} />
                <span className="text-[10px] text-white/20">
                  {formatTimeAgo(article.published_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Tier 2: Compact card (quality 0.4-0.7)
  if (quality >= QUALITY_TIERS.TIER_2) {
    return (
      <motion.button
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.15 }}
        onClick={() => onSelect(article)}
        className={cn(
          'w-full text-left rounded-md border bg-white/[0.015] px-3 py-2.5 min-h-[44px] transition-all duration-200',
          'hover:bg-white/[0.03] hover:-translate-y-[0.5px]',
          isSelected
            ? 'border-blue-500/25'
            : 'border-white/[0.04]'
        )}
        style={{ borderLeftWidth: 2, borderLeftColor: `${sentimentColor}80` }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[12px] text-white/65 leading-snug line-clamp-1 flex-1">
            {article.headline}
          </h3>
          {article.symbols.length > 0 && (
            <span className="text-[10px] text-teal-400/40 shrink-0">
              {article.symbols.slice(0, 2).join(', ')}
            </span>
          )}
          <SourceBadge source={article.source} />
          <span className="text-[10px] text-white/15 shrink-0">
            {formatTimeAgo(article.published_at)}
          </span>
        </div>
      </motion.button>
    );
  }

  // Tier 3: Minimal single-line (quality < 0.4)
  return (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.1 }}
      onClick={() => onSelect(article)}
      className="w-full text-left px-3 py-2 min-h-[36px] rounded hover:bg-white/[0.02] transition-colors group"
      style={{ borderLeftWidth: 1, borderLeftColor: `${sentimentColor}40` }}
    >
      <span className="text-[11px] text-white/35 group-hover:text-white/50 line-clamp-1">
        {article.headline}
      </span>
    </motion.button>
  );
}

