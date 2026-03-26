'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNewsStories,
  getSentimentDivergence,
  getMorningBrief,
} from '@/src/lib/api/analyticsApi';
import type { IStoryArc, ISentimentDivergence, IMorningBrief } from '@/types/analytics';

const BRIEF_CACHE_MS = 30 * 60_000; // 30 min
const STORIES_REFRESH_MS = 5 * 60_000; // 5 min

export interface UseMarketIntelligenceReturn {
  // Stories
  stories: IStoryArc[];
  storiesLoading: boolean;
  storiesError: boolean;
  fetchStories: () => Promise<void>;

  // Selected story (for slide-over)
  selectedStory: IStoryArc | null;
  storyOpen: boolean;
  openStory: (story: IStoryArc) => void;
  closeStory: () => void;

  // Divergences (keyed by ticker)
  divergences: Map<string, ISentimentDivergence>;
  divergenceLoading: boolean;
  fetchDivergence: (ticker: string) => Promise<void>;
  fetchDivergencesForTickers: (tickers: string[]) => Promise<void>;

  // Morning brief
  brief: IMorningBrief | null;
  briefLoading: boolean;
  briefError: boolean;
  briefDismissed: boolean;
  dismissBrief: () => void;
}

export function useMarketIntelligence(
  exchange: string,
  topTickers: string[]
): UseMarketIntelligenceReturn {
  // ── Stories ───────────────────────────────────────────────────
  const [stories, setStories] = useState<IStoryArc[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState(false);
  const [selectedStory, setSelectedStory] = useState<IStoryArc | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);

  const storiesControllerRef = useRef<AbortController | null>(null);
  const closeStoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStories = useCallback(async () => {
    storiesControllerRef.current?.abort();
    const controller = new AbortController();
    storiesControllerRef.current = controller;

    setStoriesLoading(true);
    setStoriesError(false);
    try {
      const res = await getNewsStories(168, 10, undefined, exchange, controller.signal);
      if (!controller.signal.aborted) {
        if (res.success && res.data?.stories) {
          setStories(res.data.stories);
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        console.warn('Failed to load story arcs');
        setStoriesError(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setStoriesLoading(false);
      }
    }
  }, [exchange]);

  const openStory = useCallback((story: IStoryArc) => {
    setSelectedStory(story);
    setStoryOpen(true);
  }, []);

  const closeStory = useCallback(() => {
    setStoryOpen(false);
    // Delay clearing to allow exit animation
    if (closeStoryTimerRef.current) clearTimeout(closeStoryTimerRef.current);
    closeStoryTimerRef.current = setTimeout(() => {
      setSelectedStory(null);
      closeStoryTimerRef.current = null;
    }, 300);
  }, []);

  // ── Divergences ──────────────────────────────────────────────
  const [divergences, setDivergences] = useState<Map<string, ISentimentDivergence>>(new Map());
  const [divergenceLoading, setDivergenceLoading] = useState(false);

  const divergenceControllerRef = useRef<AbortController | null>(null);

  const fetchDivergence = useCallback(
    async (ticker: string) => {
      try {
        const res = await getSentimentDivergence(ticker, exchange, divergenceControllerRef.current?.signal);
        if (!divergenceControllerRef.current?.signal.aborted) {
          if (res.success && res.data) {
            setDivergences((prev) => {
              const next = new Map(prev);
              next.set(ticker, res.data);
              return next;
            });
          }
        }
      } catch {
        // silent
      }
    },
    [exchange]
  );

  const fetchDivergencesForTickers = useCallback(
    async (tickers: string[]) => {
      if (tickers.length === 0) return;
      setDivergenceLoading(true);
      try {
        // Fetch in parallel, max 5 concurrent
        const batch = tickers.slice(0, 5);
        await Promise.allSettled(batch.map((t) => fetchDivergence(t)));
      } finally {
        setDivergenceLoading(false);
      }
    },
    [fetchDivergence]
  );

  // ── Morning Brief ────────────────────────────────────────────
  const [brief, setBrief] = useState<IMorningBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState(false);
  const [briefDismissed, setBriefDismissed] = useState(false);
  const briefFetchedAt = useRef<number>(0);

  const briefControllerRef = useRef<AbortController | null>(null);

  const fetchBrief = useCallback(async () => {
    // Respect cache
    if (Date.now() - briefFetchedAt.current < BRIEF_CACHE_MS) return;

    briefControllerRef.current?.abort();
    const controller = new AbortController();
    briefControllerRef.current = controller;

    setBriefLoading(true);
    setBriefError(false);
    try {
      const res = await getMorningBrief(exchange, controller.signal);
      if (!controller.signal.aborted) {
        if (res.success && res.data) {
          setBrief(res.data);
          briefFetchedAt.current = Date.now();
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        console.warn('Failed to load morning brief');
        setBriefError(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setBriefLoading(false);
      }
    }
  }, [exchange]);

  const dismissBrief = useCallback(() => {
    setBriefDismissed(true);
  }, []);

  // ── Auto-fetch on mount ──────────────────────────────────────
  useEffect(() => {
    fetchStories();
    fetchBrief();
    return () => {
      storiesControllerRef.current?.abort();
      briefControllerRef.current?.abort();
      if (closeStoryTimerRef.current) clearTimeout(closeStoryTimerRef.current);
    };
  }, [fetchStories, fetchBrief]);

  // Auto-refresh stories
  useEffect(() => {
    const interval = setInterval(fetchStories, STORIES_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchStories]);

  // Fetch divergences for top tickers when they change
  const tickersKey = topTickers.slice(0, 5).join(',');
  useEffect(() => {
    const controller = new AbortController();
    divergenceControllerRef.current = controller;
    if (tickersKey) {
      fetchDivergencesForTickers(tickersKey.split(','));
    }
    return () => {
      controller.abort();
      divergenceControllerRef.current?.abort();
    };
  }, [tickersKey, fetchDivergencesForTickers]);

  return {
    stories,
    storiesLoading,
    storiesError,
    fetchStories,
    selectedStory,
    storyOpen,
    openStory,
    closeStory,
    divergences,
    divergenceLoading,
    fetchDivergence,
    fetchDivergencesForTickers,
    brief,
    briefLoading,
    briefError,
    briefDismissed,
    dismissBrief,
  };
}
