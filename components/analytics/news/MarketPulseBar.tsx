'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  BarChart3,
  Zap,
} from 'lucide-react';
import type { INewsArticle, INewsCluster } from '@/types/analytics';
import {
  SENTIMENT_THRESHOLDS,
  SENTIMENT_COLORS,
  THEME_LABELS,
  THEME_COLORS,
} from './constants';

interface MarketPulseBarProps {
  articles: INewsArticle[];
  clusters: INewsCluster[];
  onTickerClick?: (ticker: string) => void;
}

interface PulseKPI {
  label: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

/**
 * MarketPulseBar — 4 actionable KPI cards replacing the old gauge barometer.
 *
 * All computed client-side from the already-fetched article and cluster data.
 * No new API calls required.
 */
export function MarketPulseBar({ articles, clusters, onTickerClick }: MarketPulseBarProps) {
  const kpis = useMemo((): PulseKPI[] => {
    // 1. Market Mood — aggregate sentiment
    const scored = articles.filter((a) => a.sentiment_score != null);
    const avgSentiment = scored.length > 0
      ? scored.reduce((sum, a) => sum + (a.sentiment_score ?? 0), 0) / scored.length
      : 0;
    const moodLabel = avgSentiment > 0.3
      ? 'Strong Bullish'
      : avgSentiment > SENTIMENT_THRESHOLDS.BULLISH
        ? 'Bullish'
        : avgSentiment < -0.3
          ? 'Strong Bearish'
          : avgSentiment < SENTIMENT_THRESHOLDS.BEARISH
            ? 'Bearish'
            : 'Neutral';
    const moodColor = avgSentiment > SENTIMENT_THRESHOLDS.BULLISH
      ? SENTIMENT_COLORS.bullish
      : avgSentiment < SENTIMENT_THRESHOLDS.BEARISH
        ? SENTIMENT_COLORS.bearish
        : SENTIMENT_COLORS.neutral;
    const MoodIcon = avgSentiment > SENTIMENT_THRESHOLDS.BULLISH
      ? TrendingUp
      : avgSentiment < SENTIMENT_THRESHOLDS.BEARISH
        ? TrendingDown
        : Minus;

    // 2. Most Active Ticker — highest mention count
    const tickerCounts = new Map<string, number>();
    for (const a of articles) {
      for (const sym of a.symbols ?? []) {
        tickerCounts.set(sym, (tickerCounts.get(sym) ?? 0) + 1);
      }
    }
    let topTicker = '';
    let topTickerCount = 0;
    tickerCounts.forEach((count, ticker) => {
      if (count > topTickerCount) {
        topTicker = ticker;
        topTickerCount = count;
      }
    });

    // 3. Hottest Theme — from cluster primary_theme
    const themeCounts = new Map<string, number>();
    for (const c of clusters) {
      const theme = c.primary_theme || 'general';
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + c.article_count);
    }
    let topTheme = 'general';
    let topThemeCount = 0;
    themeCounts.forEach((count, theme) => {
      if (count > topThemeCount && theme !== 'general') {
        topTheme = theme;
        topThemeCount = count;
      }
    });
    // Fallback if only general
    if (topThemeCount === 0 && themeCounts.has('general')) {
      topThemeCount = themeCounts.get('general') ?? 0;
    }

    // 4. Breaking Count — articles published < 1 hour ago or priority=breaking
    const oneHourAgo = Date.now() - 3_600_000;
    const breakingCount = articles.filter((a) => {
      if (a.priority === 'breaking') return true;
      if (a.published_at && new Date(a.published_at).getTime() > oneHourAgo) return true;
      return false;
    }).length;

    return [
      {
        label: 'Market Mood',
        value: moodLabel,
        subtitle: `${scored.length} articles scored`,
        color: moodColor,
        icon: <MoodIcon className="h-3.5 w-3.5" />,
      },
      {
        label: 'Most Active',
        value: topTicker || '—',
        subtitle: topTickerCount > 0 ? `${topTickerCount} mentions` : 'No data',
        color: '#6EE7B7',
        icon: <Flame className="h-3.5 w-3.5" />,
        onClick: topTicker && onTickerClick ? () => onTickerClick(topTicker) : undefined,
      },
      {
        label: 'Hottest Theme',
        value: THEME_LABELS[topTheme] || topTheme,
        subtitle: topThemeCount > 0 ? `${topThemeCount} articles` : 'No data',
        color: THEME_COLORS[topTheme] || '#94A3B8',
        icon: <BarChart3 className="h-3.5 w-3.5" />,
      },
      {
        label: 'Breaking',
        value: breakingCount > 0 ? `${breakingCount}` : '0',
        subtitle: breakingCount > 0 ? 'active stories' : 'all clear',
        color: breakingCount > 0 ? '#EF4444' : '#64748B',
        icon: <Zap className="h-3.5 w-3.5" />,
      },
    ];
  }, [articles, clusters, onTickerClick]);

  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {kpis.map((kpi) => (
        <button
          key={kpi.label}
          type="button"
          disabled={!kpi.onClick}
          onClick={kpi.onClick}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04] disabled:cursor-default disabled:hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ color: kpi.color }}>{kpi.icon}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/30 leading-none">
              {kpi.label}
            </span>
            {kpi.label === 'Breaking' && kpi.value !== '0' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
              </span>
            )}
          </div>
          <div
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: kpi.color }}
          >
            {kpi.value}
          </div>
          <div className="text-[10px] text-white/25 mt-0.5 leading-none">{kpi.subtitle}</div>
        </button>
      ))}
    </div>
  );
}
