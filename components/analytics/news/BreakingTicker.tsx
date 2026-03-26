'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { INewsArticle } from '@/types/analytics';
import { formatTimeAgo, getSentimentColor } from './constants';

interface BreakingTickerProps {
  articles: INewsArticle[];
  onSelect: (article: INewsArticle) => void;
  onDismiss: (id: string) => void;
}

/**
 * Breaking news as organic river insertion — a single-line ticker
 * that slides in from the top with a brief glow. Auto-dismisses
 * after 60 seconds. Replaces the heavy BreakingNewsBanner.
 */
export function BreakingTicker({ articles, onSelect, onDismiss }: BreakingTickerProps) {
  // Auto-dismiss after 60 seconds
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const currentIds = new Set(articles.map((a) => a.id));

    // Clear timers for articles that are no longer present
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
        }, 60_000);
        timersRef.current.set(article.id, timer);
      }
    }
  }, [articles, onDismiss]);

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (!articles.length) return null;

  // Show only the most recent breaking article
  const latest = articles[0];
  const sentimentColor = getSentimentColor(latest.sentiment, latest.sentiment_score);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        role="button"
        tabIndex={0}
        key={latest.id}
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={() => onSelect(latest)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(latest);
          }
        }}
        className="w-full text-left group cursor-pointer"
      >
        <div
          className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors hover:bg-white/[0.04]"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: sentimentColor,
            boxShadow: `inset 3px 0 8px -4px ${sentimentColor}40`,
          }}
        >
          {/* Ping indicator */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>

          {/* Headline */}
          <span className="text-xs font-medium text-white/80 line-clamp-1 flex-1">
            {latest.headline}
          </span>

          {/* Time */}
          <span className="text-[10px] text-white/30 shrink-0">
            {formatTimeAgo(latest.published_at)}
          </span>

          {/* Dismiss */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(latest.id);
            }}
            className="text-white/20 hover:text-white/50 text-xs shrink-0"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
