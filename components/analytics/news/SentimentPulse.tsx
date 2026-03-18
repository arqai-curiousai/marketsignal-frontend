'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
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
      bullish,
      neutral,
      bearish,
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
  const moodLabel = stats.netScore > 0.4 ? 'Strong Bullish' :
    stats.netScore > 0.15 ? 'Bullish' :
    stats.netScore > -0.15 ? 'Neutral' :
    stats.netScore > -0.4 ? 'Bearish' : 'Strong Bearish';
  const MoodIcon = stats.netScore > 0.15 ? TrendingUp :
    stats.netScore < -0.15 ? TrendingDown : Minus;

  // Gauge needle position: map score from [-1, 1] to [0, 100]
  const gaugePosition = ((stats.netScore + 1) / 2) * 100;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-gradient-to-r from-white/[0.02] via-white/[0.03] to-white/[0.02] overflow-hidden">
      <div className="px-4 py-3">
        {/* Top row: Market Mood label + Net score + Ticker highlights */}
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Left: Mood indicator */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: `${netColor}15`,
                boxShadow: `0 0 20px ${netColor}10`,
              }}
            >
              <MoodIcon className="h-4 w-4" style={{ color: netColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide" style={{ color: netColor }}>
                  {moodLabel}
                </span>
                <span
                  className="text-sm font-mono font-bold tabular-nums"
                  style={{ color: netColor }}
                >
                  {netSign}{stats.netScore.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Activity className="h-2.5 w-2.5 text-white/30" />
                <span className="text-[10px] text-white/40 tabular-nums">
                  {stats.total} articles analyzed
                </span>
              </div>
            </div>
          </div>

          {/* Right: Bull/Bear counters + top movers */}
          <div className="flex items-center gap-3">
            {/* Bull count */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/[0.08] border border-emerald-500/[0.12]">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">{stats.bullish}</span>
            </div>

            {/* Bear count */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/[0.08] border border-red-500/[0.12]">
              <TrendingDown className="h-3 w-3 text-red-400" />
              <span className="text-[11px] font-semibold text-red-400 tabular-nums">{stats.bearish}</span>
            </div>

            {/* Top bullish ticker */}
            {stats.mostBullish && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS.bullish }}
                />
                <span className="text-[10px] font-mono font-semibold text-white/80">{stats.mostBullish.ticker}</span>
                <span className="text-[10px] font-mono tabular-nums" style={{ color: SENTIMENT_COLORS.bullish }}>
                  +{stats.mostBullish.avgScore.toFixed(2)}
                </span>
              </div>
            )}

            {/* Top bearish ticker */}
            {stats.mostBearish && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS.bearish }}
                />
                <span className="text-[10px] font-mono font-semibold text-white/80">{stats.mostBearish.ticker}</span>
                <span className="text-[10px] font-mono tabular-nums" style={{ color: SENTIMENT_COLORS.bearish }}>
                  {stats.mostBearish.avgScore.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sentiment gauge bar — the main visual */}
        <div className="relative">
          {/* Background track */}
          <div className="h-2.5 rounded-full overflow-hidden flex bg-white/[0.04]">
            {stats.bullishPct > 0 && (
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full"
                style={{
                  width: `${stats.bullishPct}%`,
                  background: `linear-gradient(90deg, ${SENTIMENT_COLORS.very_bullish}, ${SENTIMENT_COLORS.bullish})`,
                  boxShadow: stats.bullishPct > 30 ? `0 0 12px ${SENTIMENT_COLORS.bullish}40` : undefined,
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
                  opacity: 0.25,
                }}
              />
            )}
            {stats.bearishPct > 0 && (
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full"
                style={{
                  width: `${stats.bearishPct}%`,
                  background: `linear-gradient(90deg, ${SENTIMENT_COLORS.bearish}, ${SENTIMENT_COLORS.very_bearish})`,
                  boxShadow: stats.bearishPct > 30 ? `0 0 12px ${SENTIMENT_COLORS.bearish}40` : undefined,
                }}
              />
            )}
          </div>

          {/* Gauge needle — shows net sentiment position */}
          <motion.div
            initial={{ left: '50%' }}
            animate={{ left: `${gaugePosition}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="absolute -top-0.5 -translate-x-1/2"
            style={{ filter: `drop-shadow(0 0 4px ${netColor}60)` }}
          >
            <div
              className="w-1 h-3.5 rounded-full"
              style={{ backgroundColor: netColor }}
            />
          </motion.div>
        </div>

        {/* Bottom labels */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] tabular-nums" style={{ color: SENTIMENT_COLORS.bullish, opacity: 0.7 }}>
            {Math.round(stats.bullishPct)}% bullish
          </span>
          <span className="text-[9px] text-white/30 tabular-nums">
            {Math.round(stats.neutralPct)}% neutral
          </span>
          <span className="text-[9px] tabular-nums" style={{ color: SENTIMENT_COLORS.bearish, opacity: 0.7 }}>
            {Math.round(stats.bearishPct)}% bearish
          </span>
        </div>
      </div>
    </div>
  );
}
