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
  getNewsEntity,
  syncNewsNow,
  searchNews,
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
import { SentimentPulse } from './SentimentPulse';
import { TrendingCarousel } from './TrendingCarousel';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { SENTIMENT_THRESHOLDS, type NewsViewMode } from './constants';

const TICKER_OPTIONS = ALL_ASSETS.map((a) => a.ticker);
const NEWS_REFRESH_INTERVAL_MS = 300_000; // 5 minutes

export function NewsIntelligence() {
  // View state
  const [activeView, setActiveView] = useState<NewsViewMode>('feed');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [activeClusterTab, setActiveClusterTab] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState('');
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

  // Error state
  const [feedError, setFeedError] = useState(false);
  const [graphError, setGraphError] = useState(false);
  const [mindmapError, setMindmapError] = useState(false);
  const [timelineError, setTimelineError] = useState(false);

  // Impact data for detail panel
  const [impactMap, setImpactMap] = useState<Map<string, INewsImpact>>(new Map());

  // Entity data for detail panel
  const [entityData, setEntityData] = useState<{
    entities: Array<{ name: string; type: string; ticker: string | null }>;
    themes: string[];
    key_facts: string[];
  } | null>(null);
  const [entityLoading, setEntityLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<INewsArticle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh state
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Fetch clusters + fallback articles on mount and time range change
  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(false);
    try {
      const [clustersRes, articlesRes, impactRes] = await Promise.all([
        getNewsClusters(timeRange, 10),
        getMarketNews(timeRange, 50),
        getNewsImpact(timeRange, undefined, 50),
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
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to fetch news feed:', err);
      setFeedError(true);
    } finally {
      setFeedLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchFeed, NEWS_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // Countdown timer for "last updated X ago"
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      setSecondsAgo(Math.max(0, diff));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Manual refresh — trigger backend sync then reload feed
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncNewsNow();
      await fetchFeed();
    } catch (err) {
      console.error('News sync failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  // Search handler — called from toolbar with debounced query
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await searchNews(query, 20);
      if (res.success && res.data?.items) {
        setSearchResults(res.data.items);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Fetch graph when switching to graph view (72h window for meaningful network)
  const fetchGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError(false);
    try {
      const res = await getNewsGraph(Math.max(timeRange, 72), selectedTicker || undefined);
      if (res.success && res.data) {
        setGraph(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch news graph:', err);
      setGraphError(true);
    } finally {
      setGraphLoading(false);
    }
  }, [selectedTicker, timeRange]);

  useEffect(() => {
    if (activeView === 'graph') {
      fetchGraph();
    }
  }, [activeView, fetchGraph]);

  // Fetch mind map when switching to mindmap view with a ticker
  const fetchMindMap = useCallback(async (ticker: string) => {
    setMindmapLoading(true);
    setMindmapError(false);
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
      setMindmapError(true);
    } finally {
      setMindmapLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'mindmap' && selectedTicker) {
      fetchMindMap(selectedTicker);
    }
  }, [activeView, selectedTicker, fetchMindMap]);

  // Fetch timeline (168h = 7 days for meaningful timeline view)
  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    setTimelineError(false);
    try {
      const res = await getNewsTimeline(Math.max(timeRange, 168), selectedTicker || undefined);
      if (res.success && res.data) {
        setTimeline(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      setTimelineError(true);
    } finally {
      setTimelineLoading(false);
    }
  }, [selectedTicker, timeRange]);

  useEffect(() => {
    if (activeView === 'timeline') {
      fetchTimeline();
    }
  }, [activeView, fetchTimeline]);

  // Handlers
  // Fetch entity data for a selected article
  const fetchEntityData = useCallback(async (articleId: string) => {
    setEntityData(null);
    setEntityLoading(true);
    try {
      const res = await getNewsEntity(articleId);
      if (res.success && res.data) {
        setEntityData(res.data);
      }
    } catch {
      // Entity data is optional — silently fail
    } finally {
      setEntityLoading(false);
    }
  }, []);

  const handleSelectArticle = useCallback(
    (article: INewsArticle) => {
      setSelectedArticle(article);
      fetchEntityData(article.id);
    },
    [fetchEntityData]
  );

  const handleSelectArticleById = useCallback(
    (articleId: string) => {
      // Try to find in fallback articles or cluster articles
      const found = fallbackArticles.find((a) => a.id === articleId);
      if (found) {
        setSelectedArticle(found);
        fetchEntityData(found.id);
        return;
      }
      for (const cluster of clusters) {
        const inCluster = cluster.articles.find((a) => a.id === articleId);
        if (inCluster) {
          setSelectedArticle(inCluster);
          fetchEntityData(inCluster.id);
          return;
        }
      }
      // Fallback: construct minimal article from graph node data
      // (graph uses 72h window, may contain articles not in 48h feed)
      if (graph?.nodes) {
        const graphNode = graph.nodes.find((n) => n.id === articleId && n.type === 'article');
        if (graphNode) {
          const minimalArticle: INewsArticle = {
            id: graphNode.id,
            headline: graphNode.label,
            summary: null,
            url: '',
            image_url: null,
            source: graphNode.source ?? '',
            published_at: graphNode.published_at,
            symbols: [],
            sentiment: graphNode.sentiment,
            sentiment_score: graphNode.sentiment_score,
          };
          setSelectedArticle(minimalArticle);
          fetchEntityData(minimalArticle.id);
          return;
        }
      }
    },
    [fallbackArticles, clusters, graph, fetchEntityData]
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
    (cluster: INewsCluster) => {
      if (cluster.tickers.length > 0) {
        setSelectedTicker(cluster.tickers[0]);
      }
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

  // Helper: check if an article matches the source filter
  const matchesSource = useCallback((source: string) => {
    if (!sourceFilter) return true;
    // Also match 'searchapi' when filtering by 'google_news_rss' (both are Google News)
    if (sourceFilter === 'google_news_rss') return source === 'google_news_rss' || source === 'searchapi';
    return source === sourceFilter;
  }, [sourceFilter]);

  // Apply sentiment + source filters to clusters
  const filteredClusters = clusters
    .map((c) => {
      if (!sourceFilter) return c;
      const filtered = c.articles.filter((a) => matchesSource(a.source));
      if (filtered.length === 0) return null;
      return { ...c, articles: filtered, article_count: filtered.length };
    })
    .filter((c): c is INewsCluster => c !== null)
    .filter((c) => {
      if (sentimentFilter === 'bullish') return c.avg_sentiment_score > SENTIMENT_THRESHOLDS.BULLISH;
      if (sentimentFilter === 'bearish') return c.avg_sentiment_score < SENTIMENT_THRESHOLDS.BEARISH;
      return true;
    });

  // Apply sentiment + source filters to fallback articles
  const filteredFallbackArticles = fallbackArticles
    .filter((a) => matchesSource(a.source))
    .filter((a) => {
      if (sentimentFilter === 'all') return true;
      const score = a.sentiment_score ?? 0;
      if (sentimentFilter === 'bullish') return score > SENTIMENT_THRESHOLDS.BULLISH;
      if (sentimentFilter === 'bearish') return score < SENTIMENT_THRESHOLDS.BEARISH;
      return true;
    });

  // If no clusters, create a single cluster from filtered fallback articles
  const baseClusters = filteredClusters.length > 0
    ? filteredClusters
    : filteredFallbackArticles.length > 0
    ? [{
        cluster_label: 'Latest News',
        cluster_summary: '',
        primary_theme: 'general',
        tickers: Array.from(new Set(filteredFallbackArticles.flatMap((a) => a.symbols))),
        avg_sentiment_score: 0,
        article_count: filteredFallbackArticles.length,
        latest_article_at: filteredFallbackArticles[0]?.published_at || '',
        articles: filteredFallbackArticles,
      }]
    : [];

  // Prepend synthetic search cluster when search is active
  const displayClusters = searchQuery.length >= 2 && searchResults.length > 0
    ? [{
        cluster_label: `Search: "${searchQuery}"`,
        cluster_summary: `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`,
        primary_theme: 'search',
        tickers: Array.from(new Set(searchResults.flatMap((a) => a.symbols))),
        avg_sentiment_score: 0,
        article_count: searchResults.length,
        latest_article_at: searchResults[0]?.published_at || '',
        articles: searchResults,
      }, ...baseClusters]
    : baseClusters;

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
        selectedTicker={selectedTicker}
        onTickerChange={setSelectedTicker}
        sentimentFilter={sentimentFilter}
        onSentimentChange={setSentimentFilter}
        tickerOptions={TICKER_OPTIONS}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        secondsAgo={secondsAgo}
        onSearch={handleSearch}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSelectArticle={handleSelectArticle}
      />

      {/* Sentiment Pulse — KPI bar + distribution gradient (respects active filters) */}
      {activeView === 'feed' && filteredFallbackArticles.length > 0 && (
        <SentimentPulse articles={filteredFallbackArticles} />
      )}

      {/* Trending Now — top 8 stories ranked by recency + impact + sentiment (respects source filter) */}
      {activeView === 'feed' && filteredFallbackArticles.length > 0 && (
        <TrendingCarousel
          articles={filteredFallbackArticles}
          impactMap={impactMap}
          onSelectArticle={handleSelectArticle}
          onTickerClick={handleTickerClick}
          selectedArticle={selectedArticle}
        />
      )}

      {/* Error banner */}
      {activeView === 'feed' && feedError && !feedLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
          Failed to load news feed. Auto-retrying in 5 minutes.
        </div>
      )}
      {activeView === 'graph' && graphError && !graphLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
          Failed to load network graph. Try a different time range or refresh.
        </div>
      )}
      {activeView === 'mindmap' && mindmapError && !mindmapLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
          Failed to load mind map. Try a different stock or refresh.
        </div>
      )}
      {activeView === 'timeline' && timelineError && !timelineLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
          Failed to load timeline. Try a different time range or refresh.
        </div>
      )}

      {/* Main content — full width */}
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
              activeClusterTab={activeClusterTab}
              onClusterTabChange={setActiveClusterTab}
              highlightTerms={searchQuery.length >= 2 ? searchQuery.split(/\s+/).filter(Boolean) : undefined}
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

      {/* Detail panel — bottom Sheet */}
      <Sheet
        open={!!selectedArticle}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedArticle(null);
            setEntityData(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[60vh] overflow-y-auto bg-[#0d1117] border-t border-white/10 px-0 pt-0"
        >
          <NewsDetailPanel
            selectedArticle={selectedArticle}
            onClose={() => { setSelectedArticle(null); setEntityData(null); setEntityLoading(false); }}
            onTickerClick={handleTickerClick}
            onViewMindMap={handleViewMindMap}
            entityData={entityData}
            entityLoading={entityLoading}
            impactData={selectedImpact}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
