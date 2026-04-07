'use client';

/**
 * Hook that fetches live news intelligence for the globe visualization.
 * Data is stored in refs (not state) to avoid re-renders that would reset
 * the canvas animation loop.
 */

import { useRef, useEffect, useState } from 'react';
import { getGeoSentiment, getMarketNews } from '@/lib/api/analyticsApi';
import type { IGeoSentiment, INewsArticle } from '@/types/analytics';

/* ── Region → financial-centre index mapping ── */

export const REGION_CITY_MAP: Record<string, number[]> = {
  india: [0, 9, 18],           // Mumbai, Delhi, Bangalore
  americas: [1, 11, 12, 13],   // New York, Chicago, Toronto, São Paulo
  europe: [2, 5, 14, 15],      // London, Frankfurt, Zurich, Paris
  asia_pacific: [3, 4, 6, 7, 8, 16, 19], // Tokyo, Shanghai, Singapore, HK, Sydney, Seoul, Jakarta
  emerging_markets: [10, 17],   // Dubai, Johannesburg
};

/** Reverse map: city index → region key */
export const CITY_REGION_MAP: Record<number, string> = {};
for (const [region, indices] of Object.entries(REGION_CITY_MAP)) {
  for (const idx of indices) {
    CITY_REGION_MAP[idx] = region;
  }
}

export interface GlobeNewsData {
  geoRef: React.MutableRefObject<IGeoSentiment[]>;
  headlinesRef: React.MutableRefObject<Map<string, string[]>>;
  articlesRef: React.MutableRefObject<INewsArticle[]>;
  ready: boolean;
}

export function useGlobeNewsData(): GlobeNewsData {
  const geoRef = useRef<IGeoSentiment[]>([]);
  const headlinesRef = useRef<Map<string, string[]>>(new Map());
  const articlesRef = useRef<INewsArticle[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [geoResult, newsResult] = await Promise.allSettled([
          getGeoSentiment(24),
          getMarketNews(72, 50),
        ]);

        if (cancelled) return;

        // Geo-sentiment
        if (geoResult.status === 'fulfilled' && geoResult.value.success) {
          const data = geoResult.value.data;
          geoRef.current = Array.isArray(data) ? data : [];
        }

        // Headlines grouped by region
        if (newsResult.status === 'fulfilled' && newsResult.value.success) {
          const items = newsResult.value.data.items ?? [];
          articlesRef.current = items;

          const map = new Map<string, string[]>();
          for (const article of items) {
            if (!article.headline) continue;
            for (const region of article.regions) {
              const existing = map.get(region) ?? [];
              if (existing.length < 8) {
                existing.push(article.headline);
                map.set(region, existing);
              }
            }
          }
          headlinesRef.current = map;
        }

        if (!cancelled) setReady(true);
      } catch {
        // Graceful degradation — globe works without live data
      }
    }

    fetchData();

    // Re-poll geo-sentiment every 60s, headlines every 5min
    const geoInterval = setInterval(async () => {
      try {
        const result = await getGeoSentiment(24);
        if (!cancelled && result.success) {
          const data = result.data;
          geoRef.current = Array.isArray(data) ? data : [];
        }
      } catch { /* silent */ }
    }, 60_000);

    const newsInterval = setInterval(async () => {
      try {
        const result = await getMarketNews(72, 50);
        if (!cancelled && result.success) {
          const items = result.data.items ?? [];
          articlesRef.current = items;

          const map = new Map<string, string[]>();
          for (const article of items) {
            if (!article.headline) continue;
            for (const region of article.regions) {
              const existing = map.get(region) ?? [];
              if (existing.length < 8) {
                existing.push(article.headline);
                map.set(region, existing);
              }
            }
          }
          headlinesRef.current = map;
        }
      } catch { /* silent */ }
    }, 300_000);

    return () => {
      cancelled = true;
      clearInterval(geoInterval);
      clearInterval(newsInterval);
    };
  }, []);

  return { geoRef, headlinesRef, articlesRef, ready };
}
