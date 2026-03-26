'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock } from 'lucide-react';
import type { INewsArticle } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { sanitizeUrl } from '@/lib/security/xss';
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { formatTimeAgo, getSentimentColor, getSourceDisplayName, PRIMARY_SOURCES, getTimeGroup } from './constants';

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
      <mark key={i} className="bg-amber-500/20 text-inherit rounded-sm px-0.5">
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
  const isBreaking = getTimeGroup(article.published_at) === 'breaking';

  return (
    <motion.div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect?.(article)}
      onKeyDown={onSelect ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(article); } } : undefined}
      className={cn(
        'group relative rounded-xl border transition-all flex flex-col overflow-hidden',
        selected
          ? 'border-brand-blue/40 bg-brand-blue/[0.05]'
          : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04]',
        onSelect && 'cursor-pointer'
      )}
      style={{
        boxShadow: selected
          ? '0 0 20px rgba(59, 130, 246, 0.08)'
          : undefined,
      }}
    >
      {/* Sentiment accent line at top */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${sentimentColor}50, ${sentimentColor}15, transparent)`,
        }}
      />

      {/* Image (non-compact mode only) */}
      {!compact && article.image_url && !imgError && (
        <div className="w-full h-32 overflow-hidden bg-white/[0.03] relative">
          <img
            src={article.image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent" />
        </div>
      )}

      <div className={cn('flex flex-col gap-2 flex-1', compact ? 'p-3' : 'p-4')}>
        {/* Top meta row: time + breaking indicator */}
        <div className="flex items-center gap-1.5">
          {isBreaking && (
            <span className="relative flex h-1.5 w-1.5 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
          )}
          <Clock className="h-2.5 w-2.5 text-white/25" />
          <span className="text-[10px] text-white/40">
            {formatTimeAgo(article.published_at)}
          </span>
        </div>

        {/* Headline */}
        <h3
          className={cn(
            'font-medium text-white/90 leading-snug',
            compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
          )}
        >
          {highlightTerms?.length ? highlightText(article.headline, highlightTerms) : article.headline}
        </h3>

        {/* Summary (non-compact) */}
        {!compact && article.summary && (
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
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
              <span className="text-[10px] text-white/30 self-center">
                +{article.symbols.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer: source, sentiment, link */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-[10px] truncate',
                isPrimary ? 'text-white/60 font-medium' : 'text-white/35'
              )}
            >
              {displaySource}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SentimentBadge sentiment={article.sentiment} score={article.sentiment_score} />
            <a
              href={sanitizeUrl(article.url) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-white/25 hover:text-white/60 transition-colors"
              aria-label="Open article"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
