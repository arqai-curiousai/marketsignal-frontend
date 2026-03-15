'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, GitBranch, X } from 'lucide-react';
import type { INewsArticle } from '@/types/analytics';
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { formatTimeAgo, getSourceDisplayName, THEME_LABELS, THEME_COLORS } from './constants';

interface NewsDetailPanelProps {
  selectedArticle: INewsArticle | null;
  onClose: () => void;
  onTickerClick: (ticker: string) => void;
  onViewMindMap: (ticker: string) => void;
  entityData?: {
    entities: Array<{ name: string; type: string; ticker: string | null }>;
    themes: string[];
    key_facts: string[];
  } | null;
  /** null = still loading, undefined = not fetching */
  entityLoading?: boolean;
  impactData?: Record<string, { price_change_1h: number | null; price_change_4h: number | null; price_change_1d: number | null }> | null;
}

export function NewsDetailPanel({
  selectedArticle,
  onClose,
  onTickerClick,
  onViewMindMap,
  entityData,
  entityLoading,
  impactData,
}: NewsDetailPanelProps) {
  return (
    <div className="overflow-y-auto">
      <AnimatePresence mode="wait">
        {selectedArticle ? (
          <motion.div
            key={selectedArticle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white leading-snug">
                {selectedArticle.headline}
              </h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-white shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-white/70">{getSourceDisplayName(selectedArticle.source)}</span>
              <span className="text-muted-foreground">{formatTimeAgo(selectedArticle.published_at)}</span>
              <SentimentBadge sentiment={selectedArticle.sentiment} score={selectedArticle.sentiment_score} size="md" />
            </div>

            {/* Summary */}
            {selectedArticle.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed">{selectedArticle.summary}</p>
            )}

            {/* Tickers */}
            {selectedArticle.symbols.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Related Stocks</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedArticle.symbols.map((sym) => (
                    <TickerPill key={sym} ticker={sym} onClick={onTickerClick} />
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {entityLoading && !entityData && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Themes</h4>
                <div className="flex gap-1">
                  <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            )}
            {entityData && entityData.themes.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Themes</h4>
                <div className="flex flex-wrap gap-1">
                  {entityData.themes.map((theme) => (
                    <span
                      key={theme}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: `${THEME_COLORS[theme] || '#94A3B8'}20`,
                        color: THEME_COLORS[theme] || '#94A3B8',
                      }}
                    >
                      {THEME_LABELS[theme] || theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Facts */}
            {entityLoading && !entityData && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Key Facts</h4>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            )}
            {entityData && entityData.key_facts.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Key Facts</h4>
                <ul className="space-y-1">
                  {entityData.key_facts.map((fact, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-white/80">
                      <span className="text-brand-blue shrink-0">-</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price Impact */}
            {impactData && Object.keys(impactData).length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Price Impact</h4>
                <div className="space-y-1">
                  {Object.entries(impactData).map(([ticker, scores]) => (
                    <div key={ticker} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-white/70 w-16">{ticker}</span>
                      {(['price_change_1h', 'price_change_4h', 'price_change_1d'] as const).map((k) => {
                        const val = scores[k];
                        const label = k === 'price_change_1h' ? '1H' : k === 'price_change_4h' ? '4H' : '1D';
                        return (
                          <span
                            key={k}
                            className="flex items-center gap-0.5"
                          >
                            <span className="text-muted-foreground">{label}:</span>
                            {val != null ? (
                              <span className={val >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Read Article
              </a>
              {selectedArticle.symbols.length > 0 && selectedArticle.symbols.slice(0, 3).map((sym) => (
                <button
                  key={sym}
                  onClick={() => onViewMindMap(sym)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-blue/10 border border-brand-blue/20 text-brand-blue hover:bg-brand-blue/20 transition-colors"
                >
                  <GitBranch className="h-3 w-3" />
                  {selectedArticle.symbols.length > 1 ? sym : 'Mind Map'}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

