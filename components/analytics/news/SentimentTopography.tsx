'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { INewsArticle } from '@/types/analytics';
import { THEME_COLORS, THEME_LABELS } from './constants';

interface SentimentTopographyProps {
  articles: INewsArticle[];
  /** Hours of data to display (default 168 = 7 days) */
  hours?: number;
}

const THEMES = Object.keys(THEME_COLORS);
const CELL_HEIGHT = 20;
const CELL_MIN_WIDTH = 24;
const LABEL_WIDTH = 100;

/**
 * SentimentTopography — a heatmap showing sentiment intensity across
 * the 15-theme taxonomy over time. Reveals patterns like "regulatory
 * news has been increasingly bearish over 3 days" at a glance.
 *
 * X-axis: time (hourly buckets)
 * Y-axis: themes
 * Color: sentiment (green ↔ red)
 * Opacity: article count (brighter = more articles)
 */
export function SentimentTopography({
  articles,
  hours = 168,
}: SentimentTopographyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    theme: string;
    bucket: string;
    score: number;
    count: number;
  } | null>(null);

  // Build the heatmap data: theme × time-bucket → { avg_sentiment, count }
  const { buckets, matrix, maxCount } = useMemo(() => {
    const now = Date.now();
    const startMs = now - hours * 3600_000;
    // Use 4-hour buckets for 7d, 1-hour for shorter ranges
    const bucketSizeMs = hours > 48 ? 4 * 3600_000 : 3600_000;
    const bucketCount = Math.ceil((hours * 3600_000) / bucketSizeMs);

    // Initialize matrix: theme → bucket → { total_score, count }
    const mat: Record<string, Array<{ total: number; count: number }>> = {};
    for (const theme of THEMES) {
      mat[theme] = Array.from({ length: bucketCount }, () => ({
        total: 0,
        count: 0,
      }));
    }

    // Bucket labels
    const bucketLabels: string[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const t = new Date(startMs + i * bucketSizeMs);
      if (hours > 48) {
        bucketLabels.push(
          `${t.getMonth() + 1}/${t.getDate()} ${t.getHours().toString().padStart(2, '0')}:00`
        );
      } else {
        bucketLabels.push(`${t.getHours().toString().padStart(2, '0')}:00`);
      }
    }

    // Assign articles to buckets
    let maxC = 0;
    for (const article of articles) {
      if (!article.published_at) continue;
      const pubMs = new Date(article.published_at).getTime();
      if (pubMs < startMs) continue;

      const bucketIdx = Math.min(
        Math.floor((pubMs - startMs) / bucketSizeMs),
        bucketCount - 1
      );
      const score = article.sentiment_score ?? 0;

      // Determine article theme from categories or default to 'general'
      const themes = article.categories?.length
        ? article.categories
        : ['general'];

      for (const theme of themes) {
        if (mat[theme]) {
          mat[theme][bucketIdx].total += score;
          mat[theme][bucketIdx].count += 1;
          maxC = Math.max(maxC, mat[theme][bucketIdx].count);
        }
      }
    }

    return { buckets: bucketLabels, matrix: mat, maxCount: maxC };
  }, [articles, hours]);

  // Sentiment score → color
  const scoreToColor = (score: number, count: number): string => {
    if (count === 0) return 'transparent';
    const opacity = Math.min(0.2 + (count / Math.max(maxCount, 1)) * 0.8, 1);
    if (score > 0.15) return `rgba(16, 185, 129, ${opacity})`; // green
    if (score < -0.15) return `rgba(239, 68, 68, ${opacity})`; // red
    return `rgba(100, 116, 139, ${opacity * 0.5})`; // neutral slate
  };

  const cellWidth = Math.max(
    CELL_MIN_WIDTH,
    containerRef.current
      ? (containerRef.current.clientWidth - LABEL_WIDTH) / buckets.length
      : CELL_MIN_WIDTH
  );

  // Filter to themes that actually have data
  const activeThemes = THEMES.filter((theme) =>
    matrix[theme]?.some((cell) => cell.count > 0)
  );

  if (!activeThemes.length) {
    return (
      <div className="text-center py-8 text-xs text-white/20">
        Not enough data for sentiment topography. Try expanding the time range.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      <div className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
        Sentiment Topography
      </div>

      <div className="relative" style={{ minWidth: LABEL_WIDTH + buckets.length * CELL_MIN_WIDTH }}>
        {/* Time axis labels (top) */}
        <div className="flex" style={{ marginLeft: LABEL_WIDTH }}>
          {buckets.map((label, i) => (
            <div
              key={i}
              className="text-[8px] text-white/15 text-center shrink-0 overflow-hidden"
              style={{ width: cellWidth }}
            >
              {/* Show every Nth label to avoid crowding */}
              {i % Math.ceil(buckets.length / 12) === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Heatmap rows */}
        {activeThemes.map((theme) => {
          const cells = matrix[theme];
          return (
            <div key={theme} className="flex items-center" style={{ height: CELL_HEIGHT }}>
              {/* Theme label */}
              <div
                className="shrink-0 text-[10px] text-white/35 truncate pr-2 flex items-center gap-1"
                style={{ width: LABEL_WIDTH }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: THEME_COLORS[theme] }}
                />
                {THEME_LABELS[theme] || theme}
              </div>

              {/* Cells */}
              {cells.map((cell, bucketIdx) => {
                const avgScore =
                  cell.count > 0 ? cell.total / cell.count : 0;
                return (
                  <div
                    key={bucketIdx}
                    className="shrink-0 border border-white/[0.02] cursor-crosshair transition-all hover:border-white/[0.15]"
                    style={{
                      width: cellWidth,
                      height: CELL_HEIGHT,
                      backgroundColor: scoreToColor(avgScore, cell.count),
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        theme: THEME_LABELS[theme] || theme,
                        bucket: buckets[bucketIdx],
                        score: avgScore,
                        count: cell.count,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-md bg-[#0d1117]/95 border border-white/[0.1] text-[10px] text-white/60 pointer-events-none backdrop-blur-sm whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-medium text-white/80">{tooltip.theme}</div>
          <div>{tooltip.bucket}</div>
          <div>
            Sentiment:{' '}
            <span
              className={
                tooltip.score > 0.15
                  ? 'text-emerald-400'
                  : tooltip.score < -0.15
                    ? 'text-red-400'
                    : 'text-white/40'
              }
            >
              {tooltip.score > 0 ? '+' : ''}
              {tooltip.score.toFixed(2)}
            </span>
          </div>
          <div>{tooltip.count} article{tooltip.count !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}
