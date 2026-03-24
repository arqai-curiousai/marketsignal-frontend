'use client';

import React, { useMemo } from 'react';
import type { INewsArticle } from '@/types/analytics';
import { THEME_COLORS, getSentimentColor } from './constants';

interface NewsFingerprintProps {
  article: INewsArticle;
  themes?: string[];
  /** SVG size in pixels (default 24) */
  size?: number;
}

/**
 * NewsFingerprint — a tiny SVG glyph that gives each article a unique visual DNA.
 *
 * - Outer ring segments = themes (colored by taxonomy)
 * - Inner ring = sentiment gradient
 * - Center dot = quality score (size)
 * - Radiating lines = number of tickers mentioned
 *
 * Traders learn to read these at a glance — "high-quality earnings story about 3 stocks"
 * is visually distinct from "low-quality general market commentary."
 */
export function NewsFingerprint({ article, themes = [], size = 24 }: NewsFingerprintProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR * 0.6;
  const centerR = Math.max(1.5, (article.quality_score ?? 0.5) * outerR * 0.3);

  const sentimentColor = getSentimentColor(article.sentiment, article.sentiment_score);

  // Theme segments (outer ring)
  const themeSegments = useMemo(() => {
    const activeThemes = themes.length > 0 ? themes : (article.categories ?? ['general']);
    if (activeThemes.length === 0) return [];

    const segAngle = (2 * Math.PI) / Math.max(activeThemes.length, 1);
    return activeThemes.map((theme, i) => {
      const startAngle = i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;
      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const largeArc = segAngle > Math.PI ? 1 : 0;
      const color = THEME_COLORS[theme] || '#94A3B8';

      const d = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return { d, color, theme };
    });
  }, [themes, article.categories, cx, cy, outerR, innerR]);

  // Ticker radiating lines
  const tickerLines = useMemo(() => {
    const count = Math.min(article.symbols.length, 8);
    if (count === 0) return [];

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + (innerR * 0.3) * Math.cos(angle);
      const y1 = cy + (innerR * 0.3) * Math.sin(angle);
      const x2 = cx + (innerR * 0.85) * Math.cos(angle);
      const y2 = cy + (innerR * 0.85) * Math.sin(angle);
      return { x1, y1, x2, y2 };
    });
  }, [article.symbols.length, cx, cy, innerR]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-label={`Fingerprint: ${article.sentiment ?? 'neutral'}, quality ${((article.quality_score ?? 0.5) * 100).toFixed(0)}%`}
    >
      {/* Outer theme ring segments */}
      {themeSegments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill={seg.color}
          opacity={0.6}
        />
      ))}

      {/* Inner sentiment ring */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill={sentimentColor}
        opacity={0.25}
      />

      {/* Ticker radiating lines */}
      {tickerLines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={sentimentColor}
          strokeWidth={0.8}
          opacity={0.5}
        />
      ))}

      {/* Quality center dot */}
      <circle
        cx={cx}
        cy={cy}
        r={centerR}
        fill={sentimentColor}
        opacity={0.8}
      />
    </svg>
  );
}
