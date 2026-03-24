'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { INewsArticle, INewsCluster } from '@/types/analytics';
import { SENTIMENT_THRESHOLDS } from '../constants';

export type SentimentFilterValue = 'all' | 'bullish' | 'bearish';

export interface NewsFiltersState {
  timeRange: number;
  sentimentFilter: SentimentFilterValue;
  sourceFilter: string;
  searchQuery: string;
}

export interface UseNewsFiltersReturn {
  // State
  timeRange: number;
  sentimentFilter: SentimentFilterValue;
  sourceFilter: string;
  searchQuery: string;
  activeFilterCount: number;

  // Setters
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

function syncFilterParams(timeRange: number, sentimentFilter: SentimentFilterValue, sourceFilter: string) {
  const url = new URL(window.location.href);
  if (timeRange !== 24) url.searchParams.set('hours', String(timeRange)); else url.searchParams.delete('hours');
  if (sentimentFilter !== 'all') url.searchParams.set('sentiment', sentimentFilter); else url.searchParams.delete('sentiment');
  if (sourceFilter) url.searchParams.set('source', sourceFilter); else url.searchParams.delete('source');
  window.history.replaceState({}, '', url.toString());
}

export function useNewsFilters(): UseNewsFiltersReturn {
  const searchParams = useSearchParams();
  const isInitRef = useRef(true);

  const [timeRange, setTimeRange] = useState(() => {
    const v = parseInt(searchParams.get('hours') || '', 10);
    return VALID_TIME_RANGES.has(v) ? v : 24;
  });
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterValue>(() => {
    const v = searchParams.get('sentiment') as SentimentFilterValue;
    return VALID_SENTIMENTS.has(v) ? v : 'all';
  });
  const [sourceFilter, setSourceFilter] = useState(() => searchParams.get('source') || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync filter state → URL (skip first render to avoid overwriting on mount)
  useEffect(() => {
    if (isInitRef.current) { isInitRef.current = false; return; }
    syncFilterParams(timeRange, sentimentFilter, sourceFilter);
  }, [timeRange, sentimentFilter, sourceFilter]);

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
    timeRange,
    sentimentFilter,
    sourceFilter,
    searchQuery,
    activeFilterCount,
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
