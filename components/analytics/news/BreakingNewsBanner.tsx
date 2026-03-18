'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { INewsArticle } from '@/types/analytics';
import { SentimentBadge } from './SentimentBadge';
import { formatTimeAgo } from './constants';

const AUTO_DISMISS_MS = 60_000; // 60 seconds

interface BreakingNewsBannerProps {
  articles: INewsArticle[];
  onDismiss: (id: string) => void;
  onSelect: (article: INewsArticle) => void;
}

export function BreakingNewsBanner({
  articles,
  onDismiss,
  onSelect,
}: BreakingNewsBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Auto-dismiss after 60 seconds
  useEffect(() => {
    if (articles.length === 0) return;
    const timers = articles.map((a) =>
      setTimeout(() => {
        setDismissedIds((prev) => new Set(prev).add(a.id));
        onDismiss(a.id);
      }, AUTO_DISMISS_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [articles, onDismiss]);

  const visible = articles.filter((a) => !dismissedIds.has(a.id));

  if (visible.length === 0) return null;

  return (
    <AnimatePresence>
      {visible.map((article) => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div
            className={`
              relative flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer
              ${article.priority === 'breaking'
                ? 'border-red-500/40 bg-red-500/10'
                : 'border-amber-500/30 bg-amber-500/5'
              }
            `}
            onClick={() => onSelect(article)}
          >
            {/* Pulse indicator */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  article.priority === 'breaking' ? 'bg-red-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  article.priority === 'breaking' ? 'bg-red-500' : 'bg-amber-500'
                }`}
              />
            </span>

            {/* Label */}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                article.priority === 'breaking' ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {article.priority === 'breaking' ? 'Breaking' : 'Alert'}
            </span>

            {/* Headline */}
            <span className="text-xs text-zinc-200 truncate flex-1">
              {article.headline}
            </span>

            {/* Tickers */}
            {article.symbols.length > 0 && (
              <span className="text-[10px] text-zinc-400 shrink-0">
                {article.symbols.slice(0, 3).join(', ')}
              </span>
            )}

            {/* Sentiment */}
            {article.sentiment && (
              <SentimentBadge
                sentiment={article.sentiment}
                score={article.sentiment_score}
                size="sm"
              />
            )}

            {/* Time */}
            {article.published_at && (
              <span className="text-[10px] text-zinc-500 shrink-0">
                {formatTimeAgo(article.published_at)}
              </span>
            )}

            {/* Dismiss button */}
            <button
              className="text-zinc-500 hover:text-zinc-300 shrink-0 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setDismissedIds((prev) => new Set(prev).add(article.id));
                onDismiss(article.id);
              }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
