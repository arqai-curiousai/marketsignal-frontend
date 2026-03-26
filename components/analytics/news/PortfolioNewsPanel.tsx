'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { getPortfolioNews } from '@/src/lib/api/analyticsApi';
import type { IPortfolioTickerDigest } from '@/src/lib/api/analyticsApi';
import { getSentimentColor } from './constants';

interface PortfolioNewsPanelProps {
  exchange: string;
  onTickerFilter?: (ticker: string | null) => void;
}

const CACHE_MS = 5 * 60_000; // 5 min

/**
 * PortfolioNewsPanel — horizontal scroll of per-ticker mini-cards
 * showing article count, sentiment dot, and latest headline.
 *
 * Only visible when user has watchlist items. Placed above Morning Brief
 * in Pulse mode for personalized news at a glance.
 */
export function PortfolioNewsPanel({ exchange, onTickerFilter }: PortfolioNewsPanelProps) {
  const [tickers, setTickers] = useState<IPortfolioTickerDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const fetchedAt = useRef(0);

  const fetchControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    // Respect cache
    if (Date.now() - fetchedAt.current < CACHE_MS) return;
    setLoading(true);
    try {
      const res = await getPortfolioNews(exchange, 24, signal);
      if (signal?.aborted) return;
      if (res.success && res.data?.tickers) {
        setTickers(res.data.tickers);
        fetchedAt.current = Date.now();
      }
    } catch {
      // Auth failures are expected when not logged in — clear tickers gracefully
      setTickers([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [exchange]);

  useEffect(() => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleTickerClick = useCallback(
    (ticker: string) => {
      const next = activeTicker === ticker ? null : ticker;
      setActiveTicker(next);
      onTickerFilter?.(next);
    },
    [activeTicker, onTickerFilter]
  );

  // Don't render if no watchlist or loading with no data
  if (!loading && tickers.length === 0) return null;

  if (loading && tickers.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <Briefcase className="w-3.5 h-3.5 text-white/20" />
        <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04]">
        <Briefcase className="w-3.5 h-3.5 text-white/25" />
        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
          My Stocks
        </span>
        {activeTicker && (
          <button
            onClick={() => handleTickerClick(activeTicker)}
            className="ml-auto text-[10px] text-white/25 hover:text-white/40"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Horizontal scroll of ticker cards */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
        <AnimatePresence mode="popLayout">
          {tickers.map((t) => {
            const sentColor = getSentimentColor(t.sentiment, t.avg_sentiment);
            const isActive = activeTicker === t.ticker;
            return (
              <motion.button
                key={t.ticker}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => handleTickerClick(t.ticker)}
                className={`shrink-0 flex flex-col gap-1 px-3 py-2 rounded-lg border text-left transition-colors min-w-[140px] max-w-[180px] ${
                  isActive
                    ? 'border-white/[0.15] bg-white/[0.05]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {/* Ticker + sentiment dot */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: sentColor }}
                  />
                  <span className="text-[11px] font-medium text-white/60">
                    {t.ticker}
                  </span>
                  {t.article_count > 0 && (
                    <span className="ml-auto text-[9px] text-white/25 tabular-nums">
                      {t.article_count}
                    </span>
                  )}
                </div>

                {/* Latest headline */}
                {t.latest_headline ? (
                  <span className="text-[10px] text-white/35 line-clamp-2 leading-snug">
                    {t.latest_headline}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/15 italic">No recent news</span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
