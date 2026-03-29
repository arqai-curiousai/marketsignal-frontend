'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { INewsArticle, INewsCluster } from '@/types/analytics';
import { SENTIMENT_THRESHOLDS, scopeToExchange } from '../constants';
import type { NewsScope } from '../constants';

export type SentimentFilterValue = 'all' | 'bullish' | 'bearish';

export interface NewsFiltersState {
  scope: NewsScope;
  timeRange: number;
  sentimentFilter: SentimentFilterValue;
  sourceFilter: string;
  searchQuery: string;
}

export interface UseNewsFiltersReturn {
  // State
  scope: NewsScope;
  exchange: string;
  timeRange: number;
  sentimentFilter: SentimentFilterValue;
  sourceFilter: string;
  searchQuery: string;
  activeFilterCount: number;

  // Setters
  setScope: (scope: NewsScope) => void;
  setTimeRange: (range: number) => void;
  setSentimentFilter: (filter: SentimentFilterValue) => void;
  setSourceFilter: (source: string) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;

  // Derived
  matchesSource: (source: string) => boolean;
  filterClusters: (clusters: INewsCluster[]) => INewsCluster[];
  filterArticles: (articles: INewsArticle[]) => INewsArticle[];
}

const VALID_TIME_RANGES = new Set([6, 24, 72, 168]);
const VALID_SENTIMENTS = new Set<SentimentFilterValue>(['all', 'bullish', 'bearish']);
const VALID_SCOPES = new Set<NewsScope>(['india', 'global']);

function syncFilterParams(
  scope: NewsScope,
  timeRange: number,
  sentimentFilter: SentimentFilterValue,
  sourceFilter: string,
  searchQuery: string,
) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (scope !== 'india') url.searchParams.set('scope', scope); else url.searchParams.delete('scope');
  if (timeRange !== 24) url.searchParams.set('hours', String(timeRange)); else url.searchParams.delete('hours');
  if (sentimentFilter !== 'all') url.searchParams.set('sentiment', sentimentFilter); else url.searchParams.delete('sentiment');
  if (sourceFilter) url.searchParams.set('source', sourceFilter); else url.searchParams.delete('source');
  if (searchQuery) url.searchParams.set('q', searchQuery); else url.searchParams.delete('q');
  window.history.replaceState({}, '', url.toString());
}

export function useNewsFilters(): UseNewsFiltersReturn {
  const searchParams = useSearchParams();
  const isInitRef = useRef(true);

  const [scope, setScopeState] = useState<NewsScope>(() => {
    const v = searchParams.get('scope') as NewsScope;
    return VALID_SCOPES.has(v) ? v : 'india';
  });
  const [timeRange, setTimeRange] = useState(() => {
    const v = parseInt(searchParams.get('hours') || '', 10);
    return VALID_TIME_RANGES.has(v) ? v : 24;
  });
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterValue>(() => {
    const v = searchParams.get('sentiment') as SentimentFilterValue;
    return VALID_SENTIMENTS.has(v) ? v : 'all';
  });
  const [sourceFilter, setSourceFilter] = useState(() => searchParams.get('source') || '');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');

  // Reset source filter when scope changes (sources differ per scope)
  const setScope = useCallback((newScope: NewsScope) => {
    setScopeState(newScope);
    setSourceFilter('');
  }, []);

  // Derive exchange from scope
  const exchange = useMemo(() => scopeToExchange(scope), [scope]);

  // Sync filter state → URL (skip first render to avoid overwriting on mount)
  useEffect(() => {
    if (isInitRef.current) { isInitRef.current = false; return; }
    syncFilterParams(scope, timeRange, sentimentFilter, sourceFilter, searchQuery);
  }, [scope, timeRange, sentimentFilter, sourceFilter, searchQuery]);

  const matchesSource = useCallback(
    (source: string) => {
      if (!sourceFilter) return true;
      if (sourceFilter === 'google_news_rss')
        return source === 'google_news_rss' || source === 'searchapi';
      return source === sourceFilter;
    },
    [sourceFilter]
  );

  const filterArticles = useCallback(
    (articles: INewsArticle[]) =>
      articles
        .filter((a) => matchesSource(a.source))
        .filter((a) => {
          if (sentimentFilter === 'all') return true;
          const score = a.sentiment_score ?? 0;
          if (sentimentFilter === 'bullish') return score > SENTIMENT_THRESHOLDS.BULLISH;
          if (sentimentFilter === 'bearish') return score < SENTIMENT_THRESHOLDS.BEARISH;
          return true;
        }),
    [matchesSource, sentimentFilter]
  );

  const filterClusters = useCallback(
    (clusters: INewsCluster[]) =>
      clusters
        .map((c) => {
          if (!sourceFilter) return c;
          const filtered = c.articles.filter((a) => matchesSource(a.source));
          if (filtered.length === 0) return null;
          return { ...c, articles: filtered, article_count: filtered.length };
        })
        .filter((c): c is INewsCluster => c !== null)
        .filter((c) => {
          if (sentimentFilter === 'bullish')
            return c.avg_sentiment_score > SENTIMENT_THRESHOLDS.BULLISH;
          if (sentimentFilter === 'bearish')
            return c.avg_sentiment_score < SENTIMENT_THRESHOLDS.BEARISH;
          return true;
        }),
    [sourceFilter, matchesSource, sentimentFilter]
  );

  const clearAllFilters = useCallback(() => {
    setSentimentFilter('all');
    setSourceFilter('');
    setSearchQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sentimentFilter !== 'all') count++;
    if (sourceFilter) count++;
    if (timeRange !== 24) count++;
    return count;
  }, [sentimentFilter, sourceFilter, timeRange]);

  return {
    scope,
    exchange,
    timeRange,
    sentimentFilter,
    sourceFilter,
    searchQuery,
    activeFilterCount,
    setScope,
    setTimeRange,
    setSentimentFilter,
    setSourceFilter,
    setSearchQuery,
    clearAllFilters,
    matchesSource,
    filterClusters,
    filterArticles,
  };
}
