'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { INewsArticle } from '@/types/analytics';
import { SENTIMENT_COLORS, SENTIMENT_THRESHOLDS, sentimentScoreToColor } from './constants';

interface SentimentPulseProps {
  articles: INewsArticle[];
}

interface TickerSentiment {
  ticker: string;
  avgScore: number;
}

export function SentimentPulse({ articles }: SentimentPulseProps) {
  const stats = useMemo(() => {
    if (articles.length === 0) return null;

    let bullish = 0;
    let neutral = 0;
    let bearish = 0;
    let totalScore = 0;
    let scoredCount = 0;
    const tickerScores: Record<string, { sum: number; count: number }> = {};

    for (const a of articles) {
      const score = a.sentiment_score;
      if (score != null) {
        totalScore += score;
        scoredCount++;
        if (score > SENTIMENT_THRESHOLDS.BULLISH) bullish++;
        else if (score < SENTIMENT_THRESHOLDS.BEARISH) bearish++;
        else neutral++;

        for (const sym of a.symbols) {
          if (!tickerScores[sym]) tickerScores[sym] = { sum: 0, count: 0 };
          tickerScores[sym].sum += score;
          tickerScores[sym].count++;
        }
      } else {
        neutral++;
      }
    }

    const total = bullish + neutral + bearish;
    const netScore = scoredCount > 0 ? totalScore / scoredCount : 0;

    // Find most bullish and bearish tickers
    const tickers: TickerSentiment[] = Object.entries(tickerScores)
      .filter(([, v]) => v.count >= 1)
      .map(([ticker, v]) => ({ ticker, avgScore: v.sum / v.count }));

    tickers.sort((a, b) => b.avgScore - a.avgScore);
    const mostBullish = tickers[0] ?? null;
    const mostBearish = tickers[tickers.length - 1] ?? null;

    return {
      total: articles.length,
      bullishPct: total > 0 ? (bullish / total) * 100 : 0,
      neutralPct: total > 0 ? (neutral / total) * 100 : 0,
      bearishPct: total > 0 ? (bearish / total) * 100 : 0,
      netScore,
      mostBullish: mostBullish && mostBullish.avgScore > SENTIMENT_THRESHOLDS.BULLISH ? mostBullish : null,
      mostBearish: mostBearish && mostBearish.avgScore < SENTIMENT_THRESHOLDS.BEARISH ? mostBearish : null,
    };
  }, [articles]);

  if (!stats) return null;

  const netColor = sentimentScoreToColor(stats.netScore);
  const netSign = stats.netScore > 0 ? '+' : '';
  const netArrow = stats.netScore > 0.05 ? ' \u25B2' : stats.netScore < -0.05 ? ' \u25BC' : '';

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 mb-3">
      {/* KPI badges */}
      <div className="flex items-center gap-3 text-[10px] flex-wrap mb-1.5">
        <span className="text-muted-foreground tabular-nums">
          <span className="text-white font-medium">{stats.total}</span> articles
        </span>

        <span className="text-muted-foreground">
          Net:{' '}
          <span className="font-mono font-medium tabular-nums" style={{ color: netColor }}>
            {netSign}{stats.netScore.toFixed(2)}{netArrow}
          </span>
        </span>

        {stats.mostBullish && (
          <span className="text-muted-foreground">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-0.5"
              style={{ backgroundColor: SENTIMENT_COLORS.bullish }}
            />
            <span className="text-white font-medium">{stats.mostBullish.ticker}</span>{' '}
            <span className="font-mono tabular-nums" style={{ color: SENTIMENT_COLORS.bullish }}>
              +{stats.mostBullish.avgScore.toFixed(2)}
            </span>
          </span>
        )}

        {stats.mostBearish && (
          <span className="text-muted-foreground">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-0.5"
              style={{ backgroundColor: SENTIMENT_COLORS.bearish }}
            />
            <span className="text-white font-medium">{stats.mostBearish.ticker}</span>{' '}
            <span className="font-mono tabular-nums" style={{ color: SENTIMENT_COLORS.bearish }}>
              {stats.mostBearish.avgScore.toFixed(2)}
            </span>
          </span>
        )}
      </div>

      {/* Gradient distribution bar with percentage labels */}
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-0.5">
        {stats.bullishPct > 0 && (
          <span style={{ color: SENTIMENT_COLORS.bullish }}>{Math.round(stats.bullishPct)}% bullish</span>
        )}
        {stats.neutralPct > 0 && (
          <span>{Math.round(stats.neutralPct)}% neutral</span>
        )}
        {stats.bearishPct > 0 && (
          <span style={{ color: SENTIMENT_COLORS.bearish }}>{Math.round(stats.bearishPct)}% bearish</span>
        )}
      </div>
      <div className="h-2 rounded-full overflow-hidden flex bg-white/5">
        {stats.bullishPct > 0 && (
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full rounded-l-full"
            style={{
              width: `${stats.bullishPct}%`,
              background: `linear-gradient(90deg, ${SENTIMENT_COLORS.very_bullish}, ${SENTIMENT_COLORS.bullish})`,
            }}
          />
        )}
        {stats.neutralPct > 0 && (
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full"
            style={{
              width: `${stats.neutralPct}%`,
              backgroundColor: SENTIMENT_COLORS.neutral,
              opacity: 0.4,
            }}
          />
        )}
        {stats.bearishPct > 0 && (
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full rounded-r-full"
            style={{
              width: `${stats.bearishPct}%`,
              background: `linear-gradient(90deg, ${SENTIMENT_COLORS.bearish}, ${SENTIMENT_COLORS.very_bearish})`,
            }}
          />
        )}
      </div>
    </div>
  );
}
