'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Newspaper,
  Clock,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { getNewsImpact, getMarketNews } from '@/src/lib/api/analyticsApi';
import type { INewsImpact, INewsArticle } from '@/types/analytics';
import { cn } from '@/lib/utils';

const TIME_RANGES = [
  { label: '6H', value: 6 },
  { label: '24H', value: 24 },
  { label: '1W', value: 168 },
];

const IMPACT_TYPES = [
  { label: 'All', value: '' },
  { label: 'Macro', value: 'macro' },
  { label: 'Sector', value: 'sector' },
  { label: 'Stock', value: 'stock' },
];

type TabId = 'feed' | 'impact';

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NewsImpact() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');

  // News feed state
  const [articles, setArticles] = useState<INewsArticle[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Impact state
  const [impactItems, setImpactItems] = useState<INewsImpact[]>([]);
  const [impactLoading, setImpactLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [impactType, setImpactType] = useState('');
  const [selectedNews, setSelectedNews] = useState<INewsImpact | null>(null);

  // Fetch news feed
  useEffect(() => {
    async function fetchFeed() {
      setFeedLoading(true);
      const result = await getMarketNews(72, 30);
      if (result.success && result.data?.items) {
        setArticles(result.data.items);
      }
      setFeedLoading(false);
    }
    fetchFeed();
  }, []);

  // Fetch impact data
  useEffect(() => {
    async function fetchImpact() {
      setImpactLoading(true);
      const result = await getNewsImpact(hours, impactType || undefined, 30);
      if (result.success && result.data?.items) {
        setImpactItems(result.data.items);
      }
      setImpactLoading(false);
    }
    fetchImpact();
  }, [hours, impactType]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'feed', label: 'News Feed', icon: <Newspaper className="h-3.5 w-3.5" /> },
    { id: 'impact', label: 'Impact Analysis', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              activeTab === tab.id
                ? 'bg-brand-blue/30 text-white'
                : 'text-muted-foreground hover:text-white',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* News Feed Tab */}
      {activeTab === 'feed' && (
        <div>
          {feedLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent news available. News syncs every 30 minutes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article, idx) => (
                <motion.a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all flex flex-col"
                >
                  {/* Image */}
                  {article.image_url && (
                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Headline */}
                  <h4 className="text-sm font-medium text-white leading-snug line-clamp-2 mb-2 group-hover:text-brand-blue transition-colors">
                    {article.headline}
                  </h4>

                  {/* Summary */}
                  {article.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {article.summary}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{article.source}</span>
                      {article.published_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(article.published_at)}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-brand-blue transition-colors" />
                  </div>

                  {/* Symbols + Sentiment */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {article.symbols?.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 border border-white/5"
                      >
                        {s}
                      </span>
                    ))}
                    {article.sentiment && (
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded capitalize',
                          article.sentiment === 'positive' && 'bg-emerald-500/10 text-emerald-400',
                          article.sentiment === 'negative' && 'bg-red-500/10 text-red-400',
                          article.sentiment === 'neutral' && 'bg-slate-500/10 text-slate-400',
                        )}
                      >
                        {article.sentiment}
                      </span>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Impact Analysis Tab */}
      {activeTab === 'impact' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setHours(r.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    r.value === hours
                      ? 'bg-brand-blue/30 text-white'
                      : 'text-muted-foreground hover:text-white',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              {IMPACT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setImpactType(t.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    t.value === impactType
                      ? 'bg-brand-blue/30 text-white'
                      : 'text-muted-foreground hover:text-white',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {impactLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
          ) : impactItems.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scored news in this timeframe. Impact scoring runs every 30 minutes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* News Feed */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {impactItems.map((item, idx) => (
                  <motion.div
                    key={item.news_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setSelectedNews(item)}
                    className={cn(
                      'p-4 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer transition-all',
                      'hover:border-white/20 hover:bg-white/[0.04]',
                      selectedNews?.news_id === item.news_id && 'border-brand-blue/50 bg-brand-blue/5',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-1 h-2 w-2 rounded-full shrink-0',
                          item.sentiment === 'positive' && 'bg-emerald-400',
                          item.sentiment === 'negative' && 'bg-red-400',
                          (!item.sentiment || item.sentiment === 'neutral') && 'bg-slate-400',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white leading-snug line-clamp-2">
                          {item.news_title || 'Untitled'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">{item.news_source}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(item.published_at)}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full capitalize',
                              item.impact_type === 'macro' && 'bg-red-500/10 text-red-400',
                              item.impact_type === 'sector' && 'bg-yellow-500/10 text-yellow-400',
                              item.impact_type === 'stock' && 'bg-blue-500/10 text-blue-400',
                            )}
                          >
                            {item.impact_type}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Impact</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-violet"
                              style={{ width: `${Math.min(item.overall_impact_magnitude * 10, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-white">
                            {item.overall_impact_magnitude.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Impact Detail Panel */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                {selectedNews ? (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">{selectedNews.news_title}</h3>
                    <div className="space-y-3">
                      <h4 className="text-xs text-muted-foreground uppercase tracking-wider">
                        Affected Stocks
                      </h4>
                      {Object.entries(selectedNews.impact_scores).map(([ticker, scores]) => (
                        <div
                          key={ticker}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
                        >
                          <span className="text-sm font-bold text-white w-24">{ticker}</span>
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            {(['price_change_1h', 'price_change_4h', 'price_change_1d'] as const).map(
                              (key) => {
                                const val = scores[key];
                                const label = key.replace('price_change_', '');
                                return (
                                  <div key={key} className="text-center">
                                    <div className="text-[10px] text-muted-foreground">{label}</div>
                                    <div
                                      className={cn(
                                        'text-xs font-semibold',
                                        val == null
                                          ? 'text-slate-500'
                                          : val >= 0
                                            ? 'text-emerald-400'
                                            : 'text-red-400',
                                      )}
                                    >
                                      {val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : '\u2014'}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Select a news item to see impact details
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
