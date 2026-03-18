'use client';

import React from 'react';
import { X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  THEME_COLORS,
  THEME_LABELS,
  SENTIMENT_COLORS,
  classifySentiment,
} from './constants';

export interface NetworkInsights {
  /** Ticker mention counts, sorted descending */
  tickerMentions: Array<{ ticker: string; count: number }>;
  /** Theme distribution with article counts */
  themeDistribution: Array<{ theme: string; count: number }>;
  /** Sentiment breakdown across all articles */
  sentiment: { bullish: number; neutral: number; bearish: number; avgScore: number };
  /** Top co-occurring ticker pairs */
  coOccurringPairs: Array<{ pair: [string, string]; weight: number }>;
  /** Network size stats */
  stats: { nodes: number; edges: number };
}

interface NetworkInsightsPanelProps {
  insights: NetworkInsights;
  open: boolean;
  onClose: () => void;
  onFocusTicker: (ticker: string) => void;
  onFocusTheme: (themeId: string) => void;
}

export function NetworkInsightsPanel({
  insights,
  open,
  onClose,
  onFocusTicker,
  onFocusTheme,
}: NetworkInsightsPanelProps) {
  if (!open) return null;

  const maxMentions = insights.tickerMentions[0]?.count || 1;
  const totalSentiment = insights.sentiment.bullish + insights.sentiment.neutral + insights.sentiment.bearish;

  return (
    <div className="absolute top-0 left-0 z-20 h-full w-[280px] bg-[#0b0f19]/95 border-r border-white/10 backdrop-blur-md overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8 sticky top-0 bg-[#0b0f19]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Network Insights</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 py-2 space-y-4">
        {/* Network Stats */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{insights.stats.nodes} nodes</span>
          <span className="text-white/20">|</span>
          <span>{insights.stats.edges} connections</span>
        </div>

        {/* Sentiment Breakdown */}
        <section>
          <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">Sentiment</h4>
          {/* Distribution bar */}
          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            {insights.sentiment.bullish > 0 && (
              <div
                className="h-full"
                style={{
                  width: `${(insights.sentiment.bullish / totalSentiment) * 100}%`,
                  backgroundColor: SENTIMENT_COLORS.bullish,
                }}
              />
            )}
            {insights.sentiment.neutral > 0 && (
              <div
                className="h-full"
                style={{
                  width: `${(insights.sentiment.neutral / totalSentiment) * 100}%`,
                  backgroundColor: SENTIMENT_COLORS.neutral,
                  opacity: 0.4,
                }}
              />
            )}
            {insights.sentiment.bearish > 0 && (
              <div
                className="h-full"
                style={{
                  width: `${(insights.sentiment.bearish / totalSentiment) * 100}%`,
                  backgroundColor: SENTIMENT_COLORS.bearish,
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.bullish }} />
              <span className="text-emerald-400">{insights.sentiment.bullish}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.neutral }} />
              <span className="text-slate-400">{insights.sentiment.neutral}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS.bearish }} />
              <span className="text-red-400">{insights.sentiment.bearish}</span>
            </span>
            <span className="text-white/30">|</span>
            <span className={cn(
              'font-mono text-[10px]',
              insights.sentiment.avgScore > 0 ? 'text-emerald-400' : insights.sentiment.avgScore < 0 ? 'text-red-400' : 'text-slate-400',
            )}>
              avg {insights.sentiment.avgScore >= 0 ? '+' : ''}{insights.sentiment.avgScore.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Ticker Mentions */}
        <section>
          <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">Top Tickers</h4>
          <div className="space-y-1.5">
            {insights.tickerMentions.slice(0, 10).map(({ ticker, count }) => (
              <button
                key={ticker}
                onClick={() => onFocusTicker(ticker)}
                className="w-full group flex items-center gap-2 text-left hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
              >
                <span className="text-[10px] font-mono text-emerald-300 w-[60px] shrink-0 truncate">
                  {ticker.replace('ticker:', '')}
                </span>
                <div className="flex-1 h-[6px] bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500/50 group-hover:bg-emerald-500/70 transition-colors"
                    style={{ width: `${(count / maxMentions) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground w-[18px] text-right">{count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Theme Distribution */}
        <section>
          <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">Themes</h4>
          <div className="flex flex-wrap gap-1">
            {insights.themeDistribution.slice(0, 10).map(({ theme, count }) => {
              const key = theme.replace('theme:', '');
              const color = THEME_COLORS[key] || '#64748B';
              const label = THEME_LABELS[key] || key.replace(/_/g, ' ');
              return (
                <button
                  key={theme}
                  onClick={() => onFocusTheme(theme)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-colors hover:border-opacity-60"
                  style={{
                    backgroundColor: color + '15',
                    borderColor: color + '30',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] capitalize" style={{ color }}>{label}</span>
                  <span className="text-[8px] text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Co-occurring Pairs */}
        {insights.coOccurringPairs.length > 0 && (
          <section>
            <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">Co-occurring Tickers</h4>
            <div className="space-y-1">
              {insights.coOccurringPairs.slice(0, 5).map(({ pair, weight }, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="font-mono text-emerald-300">{pair[0].replace('ticker:', '')}</span>
                  <span className="text-white/20">&harr;</span>
                  <span className="font-mono text-emerald-300">{pair[1].replace('ticker:', '')}</span>
                  <div className="flex-1" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(5, Math.ceil(weight * 5)) }).map((_, j) => (
                      <span key={j} className="w-1 h-2.5 rounded-full bg-orange-400/60" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
