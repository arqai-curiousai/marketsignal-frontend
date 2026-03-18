'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, GitBranch, X, TrendingUp, TrendingDown, Clock, Layers } from 'lucide-react';
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
            className="p-5 space-y-5"
          >
            {/* Header with sentiment accent */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-white leading-snug flex-1">
                  {selectedArticle.headline}
                </h3>
                <button
                  onClick={onClose}
                  className="text-white/25 hover:text-white/60 transition-colors shrink-0 p-1 rounded-md hover:bg-white/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
                <span className="text-white/50 font-medium">{getSourceDisplayName(selectedArticle.source)}</span>
                <div className="flex items-center gap-1 text-white/30">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(selectedArticle.published_at)}
                </div>
                <SentimentBadge sentiment={selectedArticle.sentiment} score={selectedArticle.sentiment_score} size="md" />
              </div>
            </div>

            {/* Summary */}
            {selectedArticle.summary && (
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-xs text-white/50 leading-relaxed">{selectedArticle.summary}</p>
              </div>
            )}

            {/* Two-column layout for Tickers + Themes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tickers */}
              {selectedArticle.symbols.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Related Stocks</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticle.symbols.map((sym) => (
                      <TickerPill key={sym} ticker={sym} onClick={onTickerClick} />
                    ))}
                  </div>
                </div>
              )}

              {/* Themes */}
              {entityLoading && !entityData && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Themes</h4>
                  <div className="flex gap-1.5">
                    <div className="h-5 w-20 bg-white/[0.06] rounded-md animate-pulse" />
                    <div className="h-5 w-16 bg-white/[0.06] rounded-md animate-pulse" />
                    <div className="h-5 w-24 bg-white/[0.06] rounded-md animate-pulse" />
                  </div>
                </div>
              )}
              {entityData && entityData.themes.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Themes</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {entityData.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
                        style={{
                          backgroundColor: `${THEME_COLORS[theme] || '#94A3B8'}12`,
                          color: THEME_COLORS[theme] || '#94A3B8',
                          borderColor: `${THEME_COLORS[theme] || '#94A3B8'}20`,
                        }}
                      >
                        {THEME_LABELS[theme] || theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Facts */}
            {entityLoading && !entityData && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Key Facts</h4>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-white/[0.06] rounded-md animate-pulse" />
                  <div className="h-3 w-3/4 bg-white/[0.06] rounded-md animate-pulse" />
                </div>
              </div>
            )}
            {entityData && entityData.key_facts.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Key Facts</h4>
                <div className="space-y-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
                  {entityData.key_facts.map((fact, i) => (
                    <div key={i} className="flex gap-2 text-xs text-white/60">
                      <span className="text-brand-blue/60 shrink-0 mt-0.5">
                        <Layers className="h-3 w-3" />
                      </span>
                      <span className="leading-relaxed">{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Impact — visual bars */}
            {impactData && Object.keys(impactData).length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-white/25 font-semibold mb-2">Price Impact</h4>
                <div className="space-y-2 rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
                  {Object.entries(impactData).map(([impactTicker, scores]) => (
                    <div key={impactTicker} className="space-y-1.5">
                      <span className="text-[10px] font-mono font-semibold text-white/60">{impactTicker}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['price_change_1h', 'price_change_4h', 'price_change_1d'] as const).map((k) => {
                          const val = scores[k];
                          const label = k === 'price_change_1h' ? '1H' : k === 'price_change_4h' ? '4H' : '1D';
                          const isPositive = val != null && val >= 0;
                          const barWidth = val != null ? Math.min(100, Math.abs(val) * 15) : 0;
                          return (
                            <div key={k} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-white/25">{label}</span>
                                {val != null ? (
                                  <div className="flex items-center gap-0.5">
                                    {isPositive ? (
                                      <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                                    ) : (
                                      <TrendingDown className="h-2.5 w-2.5 text-red-400" />
                                    )}
                                    <span className={`text-[10px] font-mono font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-white/20">--</span>
                                )}
                              </div>
                              {/* Visual bar */}
                              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                                {val != null && (
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barWidth}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="h-full rounded-full"
                                    style={{
                                      backgroundColor: isPositive ? '#10B981' : '#EF4444',
                                      boxShadow: `0 0 6px ${isPositive ? '#10B98130' : '#EF444430'}`,
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/80 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                <ExternalLink className="h-3 w-3" />
                Read Article
              </a>
              {selectedArticle.symbols.length > 0 && selectedArticle.symbols.slice(0, 3).map((sym) => (
                <button
                  key={sym}
                  onClick={() => onViewMindMap(sym)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-brand-blue/[0.08] border border-brand-blue/[0.15] text-brand-blue hover:bg-brand-blue/[0.15] transition-all"
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
