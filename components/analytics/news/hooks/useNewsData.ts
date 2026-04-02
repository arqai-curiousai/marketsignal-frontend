'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  EntityData,
} from '@/types/analytics';

// Re-export for backward compatibility
export type { EntityData } from '@/types/analytics';

const NEWS_REFRESH_INTERVAL_MS = 300_000; // 5 minutes
const NEWS_STREAM_URL = '/api/analytics/news/stream';

export interface UseNewsDataReturn {
  // Feed data
  clusters: INewsCluster[];
  fallbackArticles: INewsArticle[];
  impactMap: Map<string, INewsImpact>;
  feedLoading: boolean;
  feedError: boolean;

  // Graph data
  graph: INewsGraph | null;
  graphLoading: boolean;
  graphError: boolean;
  fetchGraph: () => Promise<void>;

  // Mind map data
  mindMapTree: INewsMindMapNode | null;
  mindmapLoading: boolean;
  mindmapError: boolean;
  fetchMindMap: (ticker: string) => Promise<void>;

  // Timeline data
  timeline: INewsTimeline | null;
  timelineLoading: boolean;
  timelineError: boolean;
  fetchTimeline: () => Promise<void>;

  // Entity data (detail panel)
  entityData: EntityData | null;
  entityLoading: boolean;
  fetchEntityData: (articleId: string) => Promise<void>;

  // Search
  searchResults: INewsArticle[];
  searchLoading: boolean;
  handleSearch: (query: string) => void;

  // Breaking news (SSE)
  breakingArticles: INewsArticle[];
  dismissBreaking: (id: string) => void;
  hasNewArticles: boolean;
  clearNewArticlesFlag: () => void;

  // Refresh
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
  lastUpdated: string | null;
  secondsAgo: number;

  // Pagination
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;

  // SSE-injected article updater (for fallback list)
  setFallbackArticles: React.Dispatch<React.SetStateAction<INewsArticle[]>>;
}

export function useNewsData(
  timeRange: number,
  regionParam: string,
  exchange: string,
  selectedTicker: string | null,
): UseNewsDataReturn {
  // Feed state
  const [clusters, setClusters] = useState<INewsCluster[]>([]);
  const [fallbackArticles, setFallbackArticles] = useState<INewsArticle[]>([]);
  const [impactMap, setImpactMap] = useState<Map<string, INewsImpact>>(new Map());
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  // Graph state
  const [graph, setGraph] = useState<INewsGraph | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState(false);

  // Mind map state
  const [mindMapTree, setMindMapTree] = useState<INewsMindMapNode | null>(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState(false);

  // Timeline state
  const [timeline, setTimeline] = useState<INewsTimeline | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(false);

  // Entity state
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [entityLoading, setEntityLoading] = useState(false);

  // Search state
  const [searchResults, setSearchResults] = useState<INewsArticle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Entity request dedup — prevents stale responses from overwriting newer ones
  const entityRequestIdRef = useRef(0);

  // Breaking news (SSE)
  const [breakingArticles, setBreakingArticles] = useState<INewsArticle[]>([]);
  const [hasNewArticles, setHasNewArticles] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenArticleIdsRef = useRef(new Set<string>());

  // ── Feed fetch ─────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(false);
    offsetRef.current = 0;
    try {
      const settled = await Promise.allSettled([
        getNewsClusters(timeRange, 10, exchange, regionParam),
        getMarketNews(timeRange, 50, exchange, 0, regionParam),
        getNewsImpact(timeRange, undefined, 50, exchange, regionParam),
      ]);

      const clustersRes = settled[0].status === 'fulfilled' ? settled[0].value : { success: false as const, data: null };
      const articlesRes = settled[1].status === 'fulfilled' ? settled[1].value : { success: false as const, data: null };
      const impactRes = settled[2].status === 'fulfilled' ? settled[2].value : { success: false as const, data: null };

      if (clustersRes.success && clustersRes.data?.clusters) {
        setClusters(clustersRes.data.clusters);
      }
      if (articlesRes.success && articlesRes.data?.items) {
        setFallbackArticles(articlesRes.data.items);
        setHasMore(articlesRes.data.has_more ?? false);
        offsetRef.current = articlesRes.data.items.length;
      }
      if (impactRes.success && impactRes.data?.items) {
        const map = new Map<string, INewsImpact>();
        for (const item of impactRes.data.items) {
          map.set(item.news_id, item);
        }
        setImpactMap(map);
      }
      // Surface error if ALL primary data sources failed
      if (!clustersRes.success && !articlesRes.success) {
        setFeedError(true);
      }
      setLastUpdated(new Date().toISOString());
    } catch {
      console.warn('Failed to fetch news feed');
      setFeedError(true);
    } finally {
      setFeedLoading(false);
    }
  }, [timeRange, exchange, regionParam]);

  // Keep a stable ref to fetchFeed so the interval never churns
  const fetchFeedRef = useRef(fetchFeed);
  useEffect(() => { fetchFeedRef.current = fetchFeed; }, [fetchFeed]);

  // Initial fetch + re-fetch on deps change
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 5 minutes (stable interval — deps never change)
  useEffect(() => {
    const interval = setInterval(() => fetchFeedRef.current(), NEWS_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
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

  // ── SSE connection (reconnects on exchange/region change) ─────────────
  useEffect(() => {
    let retryDelay = 1000;
    const maxRetryDelay = 30_000;
    const MAX_RETRIES = 5;
    let retryCount = 0;
    const seenIds = seenArticleIdsRef.current;

    function connect() {
      if (eventSourceRef.current) eventSourceRef.current.close();
      seenIds.clear();

      let streamUrl = `${NEWS_STREAM_URL}?exchange=${encodeURIComponent(exchange)}`;
      if (regionParam) {
        streamUrl += `&region=${encodeURIComponent(regionParam)}`;
      }

      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCount = 0;
        retryDelay = 1000;
      };

      es.onmessage = (event) => {
        try {
          // Guard against oversized payloads
          if (event.data.length > 10_000) return;

          const article = JSON.parse(event.data) as INewsArticle;

          // O(1) dedup via bounded Set (prevent unbounded memory growth)
          if (seenIds.has(article.id)) return;
          seenIds.add(article.id);
          if (seenIds.size > 2000) {
            const keep = Array.from(seenIds).slice(-1000);
            seenIds.clear();
            keep.forEach((id) => seenIds.add(id));
          }

          setFallbackArticles((prev) => [article, ...prev].slice(0, 100));

          if (article.priority === 'breaking' || article.priority === 'high') {
            setBreakingArticles((prev) => [article, ...prev].slice(0, 5));
          }

          setHasNewArticles(true);
          setLastUpdated(new Date().toISOString());
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          console.warn('SSE max retries exceeded, stopping reconnection');
          setFeedError(true);
          return;
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, maxRetryDelay);
          connect();
        }, retryDelay);
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      seenIds.clear();
    };
  }, [exchange, regionParam]);

  const dismissBreaking = useCallback((id: string) => {
    setBreakingArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearNewArticlesFlag = useCallback(() => {
    setHasNewArticles(false);
  }, []);

  // ── Manual refresh ─────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncNewsNow();
      await fetchFeed();
    } catch {
      console.warn('News sync failed');
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  // ── Load more (pagination) ─────────────────────────────────────
  const loadingMoreRef = useRef(false);
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await getMarketNews(timeRange, 50, exchange, offsetRef.current, regionParam);
      if (res.success && res.data?.items) {
        setFallbackArticles((prev) => [...prev, ...res.data?.items ?? []]);
        setHasMore(res.data.has_more ?? false);
        offsetRef.current += res.data.items.length;
      }
    } catch {
      console.warn('Failed to load more news');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [timeRange, exchange, regionParam, hasMore]);

  // ── Search (debounced) ──────────────────────────────────────────
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchActiveRef = useRef(false);
  const handleSearch = useCallback(
    (query: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

      if (!query || query.length < 2) {
        // Only clear results if a search was previously active (avoid premature empty flash)
        if (searchActiveRef.current) {
          setSearchResults([]);
          searchActiveRef.current = false;
        }
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      searchTimerRef.current = setTimeout(async () => {
        searchActiveRef.current = true;
        try {
          const res = await searchNews(query, 20, exchange, regionParam);
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
      }, 300);
    },
    [exchange, regionParam]
  );

  // Cleanup search timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // ── Graph ──────────────────────────────────────────────────────
  const fetchGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError(false);
    try {
      const res = await getNewsGraph(
        timeRange,
        selectedTicker || undefined,
        exchange,
        regionParam
      );
      if (res.success && res.data) setGraph(res.data);
    } catch {
      console.warn('Failed to fetch news graph');
      setGraphError(true);
    } finally {
      setGraphLoading(false);
    }
  }, [selectedTicker, timeRange, exchange, regionParam]);

  // ── Mind Map ───────────────────────────────────────────────────
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
    } catch {
      console.warn('Failed to fetch mind map');
      setMindMapTree(null);
      setMindmapError(true);
    } finally {
      setMindmapLoading(false);
    }
  }, []);

  // ── Timeline ───────────────────────────────────────────────────
  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    setTimelineError(false);
    try {
      const res = await getNewsTimeline(
        timeRange,
        selectedTicker || undefined,
        exchange,
        regionParam
      );
      if (res.success && res.data) setTimeline(res.data);
    } catch {
      console.warn('Failed to fetch timeline');
      setTimelineError(true);
    } finally {
      setTimelineLoading(false);
    }
  }, [selectedTicker, timeRange, exchange, regionParam]);

  // ── Entity data (race-condition safe) ──────────────────────────
  const fetchEntityData = useCallback(async (articleId: string) => {
    const requestId = ++entityRequestIdRef.current;
    setEntityData(null);
    setEntityLoading(true);
    try {
      const res = await getNewsEntity(articleId);
      // Discard stale response if user clicked another article
      if (requestId !== entityRequestIdRef.current) return;
      if (res.success && res.data) setEntityData(res.data);
    } catch {
      // Entity data is optional
    } finally {
      if (requestId === entityRequestIdRef.current) setEntityLoading(false);
    }
  }, []);

  return {
    clusters,
    fallbackArticles,
    impactMap,
    feedLoading,
    feedError,
    graph,
    graphLoading,
    graphError,
    fetchGraph,
    mindMapTree,
    mindmapLoading,
    mindmapError,
    fetchMindMap,
    timeline,
    timelineLoading,
    timelineError,
    fetchTimeline,
    entityData,
    entityLoading,
    fetchEntityData,
    searchResults,
    searchLoading,
    handleSearch,
    breakingArticles,
    dismissBreaking,
    hasNewArticles,
    clearNewArticlesFlag,
    refreshing,
    handleRefresh,
    lastUpdated,
    secondsAgo,
    hasMore,
    loadingMore,
    loadMore,
    setFallbackArticles,
  };
}
