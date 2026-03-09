'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getNewsClusters,
  getNewsGraph,
  getNewsMindMap,
  getNewsTimeline,
  getMarketNews,
  getNewsImpact,
} from '@/src/lib/api/analyticsApi';
import type {
  INewsCluster,
  INewsGraph,
  INewsMindMapNode,
  INewsTimeline,
  INewsArticle,
  INewsImpact,
} from '@/types/analytics';
import { ALL_ASSETS } from '@/components/analytics/correlation/constants';
import { NewsToolbar } from './NewsToolbar';
import { NewsFeedView } from './NewsFeedView';
import { NewsNetworkGraph } from './NewsNetworkGraph';
import { NewsMindMap } from './NewsMindMap';
import { NewsTimeline } from './NewsTimeline';
import { NewsDetailPanel } from './NewsDetailPanel';
import type { NewsViewMode } from './constants';

const TICKER_OPTIONS = ALL_ASSETS.map((a) => a.ticker);

export function NewsIntelligence() {
  // View state
  const [activeView, setActiveView] = useState<NewsViewMode>('feed');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(72);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [selectedArticle, setSelectedArticle] = useState<INewsArticle | null>(null);

  // Data state
  const [clusters, setClusters] = useState<INewsCluster[]>([]);
  const [graph, setGraph] = useState<INewsGraph | null>(null);
  const [mindMapTree, setMindMapTree] = useState<INewsMindMapNode | null>(null);
  const [timeline, setTimeline] = useState<INewsTimeline | null>(null);
  const [fallbackArticles, setFallbackArticles] = useState<INewsArticle[]>([]);

  // Loading state
  const [feedLoading, setFeedLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Impact data for detail panel
  const [impactMap, setImpactMap] = useState<Map<string, INewsImpact>>(new Map());

  // Fetch clusters + fallback articles on mount and time range change
  useEffect(() => {
    async function fetchFeed() {
      setFeedLoading(true);
      try {
        const [clustersRes, articlesRes, impactRes] = await Promise.all([
          getNewsClusters(timeRange, 10),
          getMarketNews(timeRange, 30),
          getNewsImpact(timeRange, undefined, 30),
        ]);

        if (clustersRes.success && clustersRes.data?.clusters) {
          setClusters(clustersRes.data.clusters);
        }
        if (articlesRes.success && articlesRes.data?.items) {
          setFallbackArticles(articlesRes.data.items);
        }
        if (impactRes.success && impactRes.data?.items) {
          const map = new Map<string, INewsImpact>();
          for (const item of impactRes.data.items) {
            map.set(item.news_id, item);
          }
          setImpactMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch news feed:', err);
      } finally {
        setFeedLoading(false);
      }
    }
    fetchFeed();
  }, [timeRange]);

  // Fetch graph when switching to graph view
  const fetchGraph = useCallback(async () => {
    setGraphLoading(true);
    try {
      const res = await getNewsGraph(timeRange, selectedTicker || undefined);
      if (res.success && res.data) {
        setGraph(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch news graph:', err);
    } finally {
      setGraphLoading(false);
    }
  }, [timeRange, selectedTicker]);

  useEffect(() => {
    if (activeView === 'graph') {
      fetchGraph();
    }
  }, [activeView, fetchGraph]);

  // Fetch mind map when switching to mindmap view with a ticker
  const fetchMindMap = useCallback(async (ticker: string) => {
    setMindmapLoading(true);
    try {
      const res = await getNewsMindMap(ticker);
      if (res.success && res.data) {
        setMindMapTree(res.data.tree);
      } else {
        setMindMapTree(null);
      }
    } catch (err) {
      console.error('Failed to fetch mind map:', err);
      setMindMapTree(null);
    } finally {
      setMindmapLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'mindmap' && selectedTicker) {
      fetchMindMap(selectedTicker);
    }
  }, [activeView, selectedTicker, fetchMindMap]);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const res = await getNewsTimeline(timeRange, selectedTicker || undefined);
      if (res.success && res.data) {
        setTimeline(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  }, [timeRange, selectedTicker]);

  useEffect(() => {
    if (activeView === 'timeline') {
      fetchTimeline();
    }
  }, [activeView, fetchTimeline]);

  // Handlers
  const handleSelectArticle = useCallback(
    (article: INewsArticle) => {
      setSelectedArticle(article);
    },
    []
  );

  const handleSelectArticleById = useCallback(
    (articleId: string) => {
      // Try to find in fallback articles or cluster articles
      const found = fallbackArticles.find((a) => a.id === articleId);
      if (found) {
        setSelectedArticle(found);
        return;
      }
      for (const cluster of clusters) {
        const inCluster = cluster.articles.find((a) => a.id === articleId);
        if (inCluster) {
          setSelectedArticle(inCluster);
          return;
        }
      }
    },
    [fallbackArticles, clusters]
  );

  const handleTickerClick = useCallback(
    (ticker: string) => {
      setSelectedTicker(ticker);
      if (activeView === 'feed') {
        setActiveView('mindmap');
      }
    },
    [activeView]
  );

  const handleViewMindMap = useCallback(
    (ticker: string) => {
      setSelectedTicker(ticker);
      setActiveView('mindmap');
    },
    []
  );

  const handleExploreCluster = useCallback(
    (_cluster: INewsCluster) => {
      setActiveView('graph');
    },
    []
  );

  const handleMindMapSelectTicker = useCallback(
    (ticker: string) => {
      setSelectedTicker(ticker);
    },
    []
  );

  // Apply sentiment filter to clusters
  const filteredClusters = sentimentFilter === 'all'
    ? clusters
    : clusters.filter((c) => {
        if (sentimentFilter === 'bullish') return c.avg_sentiment_score > 0.1;
        if (sentimentFilter === 'bearish') return c.avg_sentiment_score < -0.1;
        return true;
      });

  // If no clusters, create a single cluster from fallback articles
  const displayClusters = filteredClusters.length > 0
    ? filteredClusters
    : fallbackArticles.length > 0
    ? [{
        cluster_label: 'Latest News',
        cluster_summary: '',
        primary_theme: 'general',
        tickers: Array.from(new Set(fallbackArticles.flatMap((a) => a.symbols))),
        avg_sentiment_score: 0,
        article_count: fallbackArticles.length,
        latest_article_at: fallbackArticles[0]?.published_at || '',
        articles: fallbackArticles,
      }]
    : [];

  // Impact data for detail panel
  const selectedImpact = selectedArticle
    ? impactMap.get(selectedArticle.id)?.impact_scores ?? null
    : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <NewsToolbar
        activeView={activeView}
        onViewChange={setActiveView}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedTicker={selectedTicker}
        onTickerChange={setSelectedTicker}
        sentimentFilter={sentimentFilter}
        onSentimentChange={setSentimentFilter}
        tickerOptions={TICKER_OPTIONS}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main view area (2/3) */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'feed' && (
                <NewsFeedView
                  clusters={displayClusters}
                  loading={feedLoading}
                  onSelectArticle={handleSelectArticle}
                  onTickerClick={handleTickerClick}
                  onExploreCluster={handleExploreCluster}
                  selectedArticle={selectedArticle}
                />
              )}

              {activeView === 'graph' && (
                <NewsNetworkGraph
                  nodes={graph?.nodes ?? []}
                  edges={graph?.edges ?? []}
                  loading={graphLoading}
                  onSelectArticle={handleSelectArticleById}
                  onSelectTicker={handleMindMapSelectTicker}
                />
              )}

              {activeView === 'mindmap' && (
                <NewsMindMap
                  tree={mindMapTree}
                  loading={mindmapLoading}
                  ticker={selectedTicker}
                  onSelectTicker={handleMindMapSelectTicker}
                  onSelectArticle={handleSelectArticleById}
                  tickerOptions={TICKER_OPTIONS}
                />
              )}

              {activeView === 'timeline' && (
                <NewsTimeline
                  data={timeline}
                  loading={timelineLoading}
                  ticker={selectedTicker}
                  onSelectArticle={handleSelectArticleById}
                  onTickerClick={handleTickerClick}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Detail panel (1/3) */}
        <NewsDetailPanel
          selectedArticle={selectedArticle}
          selectedTicker={selectedTicker}
          onClose={() => setSelectedArticle(null)}
          onTickerClick={handleTickerClick}
          onViewMindMap={handleViewMindMap}
          impactData={selectedImpact}
        />
      </div>
    </div>
  );
}
