'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { INewsArticle } from '@/types/analytics';
import { formatTimeAgo, getSentimentColor, REGION_METADATA } from './constants';

interface BreakingWireProps {
  articles: INewsArticle[];
  onSelect: (article: INewsArticle) => void;
  onDismiss: (id: string) => void;
}

const MAX_WIRE_ITEMS = 5;
const AUTO_DISMISS_MS = 120_000; // 2 minutes

/**
 * BreakingWire — multi-line ticker tape for breaking news.
 *
 * Shows up to 5 breaking/high-priority items with ticker pills,
 * sentiment indicators, and timestamps. Replaces the single-headline
 * BreakingTicker with a denser, more actionable wire feed.
 */
export function BreakingWire({ articles, onSelect, onDismiss }: BreakingWireProps) {
  const [collapsed, setCollapsed] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-dismiss articles after timeout
  useEffect(() => {
    const currentIds = new Set(articles.map((a) => a.id));

    // Clear timers for articles no longer present
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });

    // Create timers for new articles
    for (const article of articles) {
      if (!timersRef.current.has(article.id)) {
        const timer = setTimeout(() => {
          onDismiss(article.id);
          timersRef.current.delete(article.id);
        }, AUTO_DISMISS_MS);
        timersRef.current.set(article.id, timer);
      }
    }
  }, [articles, onDismiss]);

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (articles.length === 0) return null;

  const visible = articles.slice(0, MAX_WIRE_ITEMS);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-semibold">
          Wire
        </span>
        <span className="text-[10px] text-white/20">{articles.length} breaking</span>
        <div className="flex-1" />
        {collapsed ? (
          <ChevronDown className="h-3 w-3 text-white/20" />
        ) : (
          <ChevronUp className="h-3 w-3 text-white/20" />
        )}
      </button>

      {/* Wire items */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="divide-y divide-white/[0.04]">
              {visible.map((article) => {
                const sentimentColor = getSentimentColor(
                  article.sentiment,
                  article.sentiment_score,
                );
                const primaryRegion = article.regions?.[0];
                const regionMeta = primaryRegion ? REGION_METADATA[primaryRegion] : undefined;
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => onSelect(article)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors group"
                    style={{
                      borderLeftWidth: 2,
                      borderLeftColor: sentimentColor,
                    }}
                  >
                    {/* Region flag + Headline */}
                    {regionMeta && (
                      <span className="text-xs shrink-0" title={regionMeta.displayName}>
                        {regionMeta.flag}
                      </span>
                    )}
                    <span className="text-xs text-white/70 group-hover:text-white/85 line-clamp-1 flex-1 min-w-0">
                      {article.headline}
                    </span>

                    {/* Ticker pills (max 2) */}
                    {(article.symbols ?? []).slice(0, 2).map((sym) => (
                      <span
                        key={sym}
                        className="text-[9px] text-white/30 bg-white/[0.05] rounded px-1.5 py-0.5 shrink-0 font-mono"
                      >
                        {sym}
                      </span>
                    ))}

                    {/* Region badge */}
                    {regionMeta && (
                      <span
                        className="text-[9px] rounded px-1 py-0.5 shrink-0 font-medium"
                        style={{
                          color: regionMeta.color,
                          backgroundColor: `${regionMeta.color}15`,
                        }}
                      >
                        {regionMeta.displayName}
                      </span>
                    )}

                    {/* Time */}
                    <span className="text-[10px] text-white/20 shrink-0 tabular-nums">
                      {formatTimeAgo(article.published_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
