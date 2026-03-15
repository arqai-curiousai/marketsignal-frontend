'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Sparkles, Network } from 'lucide-react';
import type { INewsCluster, INewsArticle } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { ArticleCard } from './ArticleCard';
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { THEME_COLORS, SENTIMENT_COLORS, SENTIMENT_THRESHOLDS, getTimeGroup, getSourceDisplayName, classifySentiment } from './constants';

interface ClusterTab {
  label: string;
  count: number;
}

interface NewsFeedViewProps {
  clusters: INewsCluster[];
  loading: boolean;
  onSelectArticle: (article: INewsArticle) => void;
  onTickerClick: (ticker: string) => void;
  onExploreCluster: (cluster: INewsCluster) => void;
  selectedArticle: INewsArticle | null;
  activeClusterTab?: string;
  onClusterTabChange?: (tab: string) => void;
  highlightTerms?: string[];
}

export function NewsFeedView({
  clusters,
  loading,
  onSelectArticle,
  onTickerClick,
  onExploreCluster,
  selectedArticle,
  activeClusterTab = 'all',
  onClusterTabChange,
  highlightTerms,
}: NewsFeedViewProps) {
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());
  const [heroImgError, setHeroImgError] = useState(false);

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
        <p>No news clusters available. News syncs every 5 minutes.</p>
      </div>
    );
  }

  // Build cluster tabs
  const clusterTabs: ClusterTab[] = [
    { label: 'All', count: clusters.reduce((s, c) => s + c.article_count, 0) },
    ...clusters.map((c) => ({ label: c.cluster_label, count: c.article_count })),
  ];

  // When a specific cluster tab is active, show just that cluster's articles
  const selectedCluster = activeClusterTab !== 'all'
    ? clusters.find((c) => c.cluster_label === activeClusterTab) ?? null
    : null;

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
      {/* Cluster tab navigation */}
      {clusters.length > 1 && onClusterTabChange && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {clusterTabs.slice(0, 6).map((tab) => (
            <button
              key={tab.label}
              onClick={() => onClusterTabChange(tab.label === 'All' ? 'all' : tab.label)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                (activeClusterTab === 'all' && tab.label === 'All') || activeClusterTab === tab.label
                  ? 'bg-white/10 text-white border-brand-blue/40'
                  : 'bg-transparent text-muted-foreground border-white/10 hover:text-white hover:border-white/20'
              )}
            >
              <span className="max-w-[120px] truncate">{tab.label}</span>
              <span className="text-[9px] tabular-nums opacity-60">{tab.count}</span>
            </button>
          ))}
          {clusterTabs.length > 6 && (
            <span className="shrink-0 px-2 py-1.5 text-[10px] text-muted-foreground">
              +{clusterTabs.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Filtered cluster view — flat grid */}
      {selectedCluster && (
        <motion.div
          key={selectedCluster.cluster_label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: THEME_COLORS[selectedCluster.primary_theme] || '#94A3B8' }}
            />
            <span className="text-xs font-semibold text-white">{selectedCluster.cluster_label}</span>
            <span className="text-[10px] text-muted-foreground">{selectedCluster.article_count} articles</span>
            <SentimentBadge
              sentiment={
                classifySentiment(selectedCluster.avg_sentiment_score)
              }
              score={selectedCluster.avg_sentiment_score}
            />
          </div>
          {selectedCluster.cluster_summary && (
            <p className="text-xs text-muted-foreground italic">{selectedCluster.cluster_summary}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedCluster.articles.map((article, aidx) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={aidx}
                compact
                onTickerClick={onTickerClick}
                onSelect={onSelectArticle}
                selected={selectedArticle?.id === article.id}
                highlightTerms={highlightTerms}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Hero Card — only in "All" tab */}
      {!selectedCluster && (
        <>
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
          {heroArticle.image_url && !heroImgError && (
            <div className="absolute inset-0 z-0">
              <img
                src={heroArticle.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setHeroImgError(true)}
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
                  classifySentiment(heroCluster.avg_sentiment_score)
                }
                score={heroCluster.avg_sentiment_score}
                size="md"
              />
              <span className="text-[10px] text-muted-foreground">
                {getSourceDisplayName(heroArticle.source)}
              </span>
              {(() => {
                const uniqueSources = new Set(heroCluster.articles.map((a) => getSourceDisplayName(a.source)));
                return uniqueSources.size > 1 ? (
                  <span className="text-[9px] text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                    {uniqueSources.size} sources
                  </span>
                ) : null;
              })()}
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

              {(() => {
                const srcCount = new Set(cluster.articles.map((a) => getSourceDisplayName(a.source))).size;
                return srcCount > 1 ? (
                  <span className="text-[9px] text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded-full shrink-0">
                    {srcCount} sources
                  </span>
                ) : null;
              })()}

              <SentimentBadge
                sentiment={
                  classifySentiment(cluster.avg_sentiment_score)
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

            {/* Sentiment distribution mini-bar */}
            {(() => {
              const arts = cluster.articles;
              let bull = 0, neut = 0, bear = 0;
              for (const a of arts) {
                const s = a.sentiment_score;
                if (s != null && s > SENTIMENT_THRESHOLDS.BULLISH) bull++;
                else if (s != null && s < SENTIMENT_THRESHOLDS.BEARISH) bear++;
                else neut++;
              }
              const total = bull + neut + bear;
              if (total === 0) return null;
              return (
                <div className="h-[3px] flex mx-3 mb-0 rounded-full overflow-hidden">
                  {bull > 0 && (
                    <div
                      style={{ width: `${(bull / total) * 100}%`, backgroundColor: SENTIMENT_COLORS.bullish }}
                      className="h-full"
                    />
                  )}
                  {neut > 0 && (
                    <div
                      style={{ width: `${(neut / total) * 100}%`, backgroundColor: SENTIMENT_COLORS.neutral, opacity: 0.3 }}
                      className="h-full"
                    />
                  )}
                  {bear > 0 && (
                    <div
                      style={{ width: `${(bear / total) * 100}%`, backgroundColor: SENTIMENT_COLORS.bearish }}
                      className="h-full"
                    />
                  )}
                </div>
              );
            })()}

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
                                 group === 'today' ? 'Today' :
                                 group === 'this_week' ? 'This Week' : 'Earlier'}
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
                                highlightTerms={highlightTerms}
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
        </>
      )}
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
