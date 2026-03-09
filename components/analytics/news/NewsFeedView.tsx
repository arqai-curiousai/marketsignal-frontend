'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Sparkles, Network } from 'lucide-react';
import type { INewsCluster, INewsArticle } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { ArticleCard } from './ArticleCard';
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { THEME_COLORS, getTimeGroup } from './constants';

interface NewsFeedViewProps {
  clusters: INewsCluster[];
  loading: boolean;
  onSelectArticle: (article: INewsArticle) => void;
  onTickerClick: (ticker: string) => void;
  onExploreCluster: (cluster: INewsCluster) => void;
  selectedArticle: INewsArticle | null;
}

export function NewsFeedView({
  clusters,
  loading,
  onSelectArticle,
  onTickerClick,
  onExploreCluster,
  selectedArticle,
}: NewsFeedViewProps) {
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 animate-pulse">
            <div className="h-4 w-48 bg-white/10 rounded mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 bg-white/5 rounded-lg" />
              <div className="h-24 bg-white/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No news clusters available. News syncs every 30 minutes.</p>
      </div>
    );
  }

  const heroCluster = clusters[0];
  const heroArticle = heroCluster.articles[0];
  const remainingClusters = clusters.slice(1);

  const toggleCluster = (label: string) => {
    setCollapsedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      {heroArticle && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative rounded-xl border overflow-hidden cursor-pointer transition-all',
            selectedArticle?.id === heroArticle.id
              ? 'border-brand-blue/40'
              : 'border-white/10 hover:border-white/20'
          )}
          onClick={() => onSelectArticle(heroArticle)}
        >
          {/* Background image */}
          {heroArticle.image_url && (
            <div className="absolute inset-0 z-0">
              <img
                src={heroArticle.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/80 to-[#0d1117]/40" />
            </div>
          )}

          <div className="relative z-10 p-5 min-h-[180px] flex flex-col justify-end gap-3">
            {/* Cluster label */}
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${THEME_COLORS[heroCluster.primary_theme] || '#94A3B8'}30`,
                  color: THEME_COLORS[heroCluster.primary_theme] || '#94A3B8',
                }}
              >
                {heroCluster.cluster_label}
              </span>
              {heroCluster.article_count > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  {heroCluster.article_count} related articles
                </span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-white leading-snug line-clamp-2">
              {heroArticle.headline}
            </h2>

            {heroArticle.summary && (
              <p className="text-sm text-white/70 line-clamp-2">{heroArticle.summary}</p>
            )}

            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-1">
                {heroCluster.tickers.slice(0, 5).map((t) => (
                  <TickerPill key={t} ticker={t} onClick={onTickerClick} />
                ))}
              </div>
              <SentimentBadge
                sentiment={
                  heroCluster.avg_sentiment_score > 0.1 ? 'bullish' :
                  heroCluster.avg_sentiment_score < -0.1 ? 'bearish' : 'neutral'
                }
                score={heroCluster.avg_sentiment_score}
                size="md"
              />
              <span className="text-[10px] text-muted-foreground">
                {heroArticle.source}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Remaining clusters */}
      {remainingClusters.map((cluster, cidx) => {
        const isCollapsed = collapsedClusters.has(cluster.cluster_label);
        const timeGroups = groupByTime(cluster.articles);

        return (
          <motion.div
            key={cluster.cluster_label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (cidx + 1) * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
          >
            {/* Cluster header */}
            <button
              onClick={() => toggleCluster(cluster.cluster_label)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: THEME_COLORS[cluster.primary_theme] || '#94A3B8' }}
              />

              <span className="text-xs font-semibold text-white truncate">
                {cluster.cluster_label}
              </span>

              <span className="text-[10px] text-muted-foreground shrink-0">
                {cluster.article_count} articles
              </span>

              <SentimentBadge
                sentiment={
                  cluster.avg_sentiment_score > 0.1 ? 'bullish' :
                  cluster.avg_sentiment_score < -0.1 ? 'bearish' : 'neutral'
                }
                score={cluster.avg_sentiment_score}
              />

              <div className="flex gap-1 ml-auto shrink-0">
                {cluster.tickers.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] font-mono text-muted-foreground">{t}</span>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExploreCluster(cluster);
                }}
                className="text-muted-foreground hover:text-brand-blue transition-colors shrink-0"
                title="Explore in network"
              >
                <Network className="h-3.5 w-3.5" />
              </button>
            </button>

            {/* Cluster content */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-3">
                    {cluster.cluster_summary && (
                      <p className="text-xs text-muted-foreground italic pl-6">
                        {cluster.cluster_summary}
                      </p>
                    )}

                    {Object.entries(timeGroups).map(([group, articles]) => {
                      if (articles.length === 0) return null;
                      return (
                        <div key={group}>
                          {group !== 'all' && (
                            <div className="flex items-center gap-2 mb-2 pl-6">
                              <span className={cn(
                                'text-[9px] uppercase tracking-wider font-semibold',
                                group === 'breaking' ? 'text-red-400' :
                                group === 'today' ? 'text-white/60' : 'text-muted-foreground'
                              )}>
                                {group === 'breaking' ? 'Breaking' :
                                 group === 'today' ? 'Today' : 'This Week'}
                              </span>
                              {group === 'breaking' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                            {articles.map((article, aidx) => (
                              <ArticleCard
                                key={article.id}
                                article={article}
                                index={aidx}
                                compact
                                onTickerClick={onTickerClick}
                                onSelect={onSelectArticle}
                                selected={selectedArticle?.id === article.id}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function groupByTime(articles: INewsArticle[]): Record<string, INewsArticle[]> {
  const groups: Record<string, INewsArticle[]> = {
    breaking: [],
    today: [],
    this_week: [],
    older: [],
  };

  for (const article of articles) {
    const group = getTimeGroup(article.published_at);
    groups[group].push(article);
  }

  // If all in same group, return single 'all' group
  const nonEmpty = Object.entries(groups).filter(([, arr]) => arr.length > 0);
  if (nonEmpty.length <= 1) {
    return { all: articles };
  }

  return groups;
}
