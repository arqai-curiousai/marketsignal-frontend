'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { INewsImpact } from '@/types/analytics';

interface ImpactReplayProps {
  impact: INewsImpact | null;
  ticker: string;
  /** Optional intraday price series: [{timestamp, close}] */
  priceSeries?: Array<{ timestamp: string; close: number }>;
}

/**
 * ImpactReplay — animated mini-chart that "replays" price action
 * from an article's publication to +24h. The line draws in real-time
 * over 3 seconds, with the impact score appearing at the end.
 */
export function ImpactReplay({ impact, ticker, priceSeries }: ImpactReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build the price path from series data
  const { path, changeLabel, changeColor } = useMemo(() => {
    if (!priceSeries || priceSeries.length < 2) {
      // Fallback: create synthetic path from impact data
      if (!impact?.impact_scores?.[ticker]) {
        return { path: '', changeLabel: '', changeColor: '' };
      }

      const scores = impact.impact_scores[ticker];
      const points = [
        { x: 0, y: 0 },
        { x: 33, y: scores.price_change_1h ?? 0 },
        { x: 66, y: scores.price_change_4h ?? scores.price_change_1h ?? 0 },
        { x: 100, y: scores.price_change_1d ?? scores.price_change_4h ?? 0 },
      ];

      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));
      const range = Math.max(maxY - minY, 0.01);

      const svgWidth = 200;
      const svgHeight = 60;
      const padding = 4;

      const scaledPoints = points.map((p) => ({
        x: (p.x / 100) * (svgWidth - padding * 2) + padding,
        y: svgHeight - padding - ((p.y - minY) / range) * (svgHeight - padding * 2),
      }));

      const d = scaledPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');

      const finalChange = points[points.length - 1].y;
      return {
        path: d,
        changeLabel: `${finalChange > 0 ? '+' : ''}${finalChange.toFixed(2)}%`,
        changeColor: finalChange > 0 ? '#10B981' : finalChange < 0 ? '#EF4444' : '#64748B',
      };
    }

    // Use real price series
    const prices = priceSeries.map((p) => p.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = Math.max(maxP - minP, 0.001);

    const svgWidth = 200;
    const svgHeight = 60;
    const padding = 4;

    const d = priceSeries
      .map((p, i) => {
        const x = (i / (priceSeries.length - 1)) * (svgWidth - padding * 2) + padding;
        const y =
          svgHeight - padding - ((p.close - minP) / range) * (svgHeight - padding * 2);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const changePct = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

    return {
      path: d,
      changeLabel: `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`,
      changeColor: changePct > 0 ? '#10B981' : changePct < 0 ? '#EF4444' : '#64748B',
    };
  }, [impact, ticker, priceSeries]);

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsPlaying(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!path) return null;

  return (
    <div className="relative">
      <div className="text-[10px] uppercase tracking-wider text-white/25 mb-1.5">
        Impact Replay
      </div>
      <div
        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 cursor-pointer"
        onClick={() => setIsPlaying(true)}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 200 60"
          className="w-full"
          style={{ height: 60 }}
        >
          {/* Grid lines */}
          <line x1="4" y1="30" x2="196" y2="30" stroke="white" strokeOpacity={0.04} />

          {/* Price path — animated draw */}
          <motion.path
            d={path}
            fill="none"
            stroke={changeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={
              isPlaying
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0.3 }
            }
            transition={{ duration: 3, ease: 'easeInOut' }}
          />

          {/* Time labels */}
          <text x="4" y="58" className="text-[7px]" fill="white" fillOpacity={0.15}>
            0h
          </text>
          <text x="62" y="58" className="text-[7px]" fill="white" fillOpacity={0.15}>
            1h
          </text>
          <text x="128" y="58" className="text-[7px]" fill="white" fillOpacity={0.15}>
            4h
          </text>
          <text x="186" y="58" className="text-[7px]" fill="white" fillOpacity={0.15}>
            1d
          </text>
        </svg>

        {/* Result label (appears after animation) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isPlaying ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 3, duration: 0.3 }}
          className="text-right mt-1"
        >
          <span className="text-xs font-medium" style={{ color: changeColor }}>
            {changeLabel}
          </span>
          <span className="text-[10px] text-white/20 ml-1">after 24h</span>
        </motion.div>
      </div>
    </div>
  );
}
