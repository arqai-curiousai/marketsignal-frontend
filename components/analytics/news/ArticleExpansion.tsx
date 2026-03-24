'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Clock, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { INewsArticle } from '@/types/analytics';
import type { EntityData } from './hooks/useNewsData';
import { getSentimentColor, THEME_COLORS, THEME_LABELS, formatTimeAgo } from './constants';
import { NewsFingerprint } from './NewsFingerprint';
import { ImpactReplay } from './ImpactReplay';

interface ArticleExpansionProps {
  article: INewsArticle | null;
  onClose: () => void;
  onTickerClick: (ticker: string) => void;
  entityData: EntityData | null;
  entityLoading: boolean;
  impactData: Record<string, { price_change_1h: number | null; price_change_4h: number | null; price_change_1d: number | null }> | null;
}

/**
 * Inline article expansion — replaces the bottom sheet pattern.
 * When active, dims the background and shows an expanded card overlay
 * with entity chips, theme badges, impact sparklines, and key facts.
 */
export function ArticleExpansion({
  article,
  onClose,
  onTickerClick,
  entityData,
  entityLoading,
  impactData,
}: ArticleExpansionProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (article) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [article, onClose]);

  // Close on 'o' — open original article
  const handleKeyActions = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'o' && article?.url) {
        window.open(article.url, '_blank', 'noopener');
      }
    },
    [article]
  );

  useEffect(() => {
    if (article) window.addEventListener('keydown', handleKeyActions);
    return () => window.removeEventListener('keydown', handleKeyActions);
  }, [article, handleKeyActions]);

  if (!article) return null;

  const sentimentColor = getSentimentColor(article.sentiment, article.sentiment_score);

  return (
    <AnimatePresence>
      {article && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Expanded card */}
          <motion.div
            layoutId={`article-${article.id}`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] top-[10vh] max-h-[80vh] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0d1117] z-50 shadow-2xl"
            style={{ borderLeftWidth: 3, borderLeftColor: sentimentColor }}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/[0.06] z-10">
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <NewsFingerprint article={article} size={20} />
                <Clock className="w-3 h-3" />
                {formatTimeAgo(article.published_at)}
                <span className="text-white/20">|</span>
                <span>{article.source}</span>
                {article.sentiment_source === 'llm' && (
                  <>
                    <span className="text-white/20">|</span>
                    <span className="text-purple-400/60">AI verified</span>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/60 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Headline */}
              <h2 className="text-base font-semibold text-white/90 leading-snug">
                {article.headline}
              </h2>

              {/* Summary */}
              {article.summary && (
                <p className="text-sm text-white/50 leading-relaxed">
                  {article.summary}
                </p>
              )}

              {/* Sentiment rationale (from LLM) */}
              {article.sentiment_rationale && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div
                    className="w-1 h-full rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: sentimentColor, minHeight: 16 }}
                  />
                  <p className="text-[11px] text-white/40 italic leading-relaxed">
                    {article.sentiment_rationale}
                  </p>
                </div>
              )}

              {/* Ticker pills */}
              {article.symbols.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {article.symbols.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={() => onTickerClick(ticker)}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-teal-400/70 hover:bg-white/[0.06] hover:text-teal-400 transition-colors"
                    >
                      {ticker}
                    </button>
                  ))}
                </div>
              )}

              {/* Entities (from NLP/LLM extraction) */}
              {entityLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-20 rounded-md bg-white/[0.04] animate-pulse"
                    />
                  ))}
                </div>
              ) : entityData && entityData.entities.length > 0 ? (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
                    Entities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entityData.entities.map((e, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/50"
                      >
                        {e.name}
                        <span className="ml-1 text-white/20">{e.type}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Themes */}
              {entityData && entityData.themes.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
                    Themes
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entityData.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${THEME_COLORS[theme] || '#94A3B8'}15`,
                          color: `${THEME_COLORS[theme] || '#94A3B8'}CC`,
                          border: `1px solid ${THEME_COLORS[theme] || '#94A3B8'}25`,
                        }}
                      >
                        {THEME_LABELS[theme] || theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key facts */}
              {entityData && entityData.key_facts.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
                    Key Facts
                  </div>
                  <ul className="space-y-1">
                    {entityData.key_facts.map((fact, i) => (
                      <li
                        key={i}
                        className="text-xs text-white/40 leading-relaxed flex items-start gap-1.5"
                      >
                        <span className="text-white/15 mt-0.5 shrink-0">-</span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Impact scores */}
              {impactData && Object.keys(impactData).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
                    Price Impact
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(impactData).map(([ticker, scores]) => (
                      <div
                        key={ticker}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                      >
                        <span className="text-xs text-teal-400/70 font-medium">{ticker}</span>
                        <div className="flex gap-3 text-[10px]">
                          {[
                            { label: '1h', value: scores.price_change_1h },
                            { label: '4h', value: scores.price_change_4h },
                            { label: '1d', value: scores.price_change_1d },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex items-center gap-0.5">
                              <span className="text-white/25">{label}:</span>
                              {value == null ? (
                                <Minus className="w-2.5 h-2.5 text-white/15" />
                              ) : value > 0 ? (
                                <span className="text-emerald-400 flex items-center gap-0.5">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  +{value.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-0.5">
                                  <TrendingDown className="w-2.5 h-2.5" />
                                  {value.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact Replay — animated price path post-article */}
              {impactData && article.symbols.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
                    Impact Replay
                  </div>
                  <ImpactReplay
                    impact={impactData ? {
                      news_id: article.id,
                      news_title: article.headline,
                      news_source: article.source,
                      sentiment: article.sentiment,
                      impact_scores: impactData,
                      impact_type: 'stock' as const,
                      overall_impact_magnitude: 0.5,
                      published_at: article.published_at || '',
                      computed_at: '',
                    } : null}
                    ticker={article.symbols[0]}
                  />
                </div>
              )}

              {/* Read full article link */}
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400/60 hover:text-blue-400 transition-colors"
                >
                  Read full article
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
