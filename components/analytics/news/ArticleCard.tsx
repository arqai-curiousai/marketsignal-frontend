'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { INewsArticle } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { formatTimeAgo, getSentimentColor, getSourceDisplayName, PRIMARY_SOURCES } from './constants';

interface ArticleCardProps {
  article: INewsArticle;
  index?: number;
  compact?: boolean;
  onTickerClick?: (ticker: string) => void;
  onSelect?: (article: INewsArticle) => void;
  selected?: boolean;
  highlightTerms?: string[];
}

function highlightText(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const splitRegex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const testRegex = new RegExp(`^(${escaped.join('|')})$`, 'i');
  const parts = text.split(splitRegex);
  return parts.map((part, i) =>
    testRegex.test(part) ? (
      <mark key={i} className="bg-yellow-500/20 text-inherit rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ArticleCard({
  article,
  index = 0,
  compact = false,
  onTickerClick,
  onSelect,
  selected,
  highlightTerms,
}: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);
  const sentimentColor = getSentimentColor(article.sentiment, article.sentiment_score);
  const displaySource = getSourceDisplayName(article.source);
  const isPrimary = PRIMARY_SOURCES.has(article.source) || PRIMARY_SOURCES.has(displaySource);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect?.(article)}
      className={cn(
        'group relative rounded-xl border bg-white/[0.02] transition-all flex flex-col',
        selected
          ? 'border-brand-blue/40 bg-brand-blue/5'
          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]',
        onSelect && 'cursor-pointer'
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: sentimentColor }}
    >
      {/* Image (non-compact mode only) */}
      {!compact && article.image_url && !imgError && (
        <div className="w-full h-32 rounded-t-xl overflow-hidden bg-white/5">
          <img
            src={article.image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      <div className={cn('flex flex-col gap-2', compact ? 'p-3' : 'p-4')}>
        {/* Headline */}
        <h3
          className={cn(
            'font-medium text-white leading-snug',
            compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
          )}
        >
          {highlightTerms?.length ? highlightText(article.headline, highlightTerms) : article.headline}
        </h3>

        {/* Summary (non-compact) */}
        {!compact && article.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {highlightTerms?.length ? highlightText(article.summary, highlightTerms) : article.summary}
          </p>
        )}

        {/* Ticker pills */}
        {article.symbols.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.symbols.slice(0, 4).map((sym) => (
              <TickerPill
                key={sym}
                ticker={sym}
                onClick={onTickerClick}
              />
            ))}
            {article.symbols.length > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{article.symbols.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer: source, time, sentiment, link */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-[10px] truncate',
                isPrimary ? 'text-white/70 font-medium' : 'text-muted-foreground'
              )}
            >
              {displaySource}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatTimeAgo(article.published_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SentimentBadge sentiment={article.sentiment} score={article.sentiment_score} />
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
