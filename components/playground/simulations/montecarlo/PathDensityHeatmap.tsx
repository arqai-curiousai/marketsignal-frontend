'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPathDensity } from '@/types/simulation';
import { fmtPrice } from './mc-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

// ─── Props ──────────────────────────────────────────────────────────

interface Props {
  density: IPathDensity;
  currentPrice: number;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────

export function PathDensityHeatmap({ density, currentPrice, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine whether density data is available
  const hasData = useMemo(() => {
    if (!density) return false;
    const { timeSteps, priceBins, density: matrix } = density;
    return (
      Array.isArray(timeSteps) &&
      timeSteps.length > 0 &&
      Array.isArray(priceBins) &&
      priceBins.length > 1 &&
      Array.isArray(matrix) &&
      matrix.length > 0
    );
  }, [density]);

  // Memoize axis labels
  const yLabels = useMemo(() => {
    if (!hasData) return [];
    const labels: Array<{ index: number; price: number }> = [];
    for (let i = 0; i < density.priceBins.length; i += 8) {
      labels.push({ index: i, price: density.priceBins[i] });
    }
    return labels;
  }, [density, hasData]);

  const xLabels = useMemo(() => {
    if (!hasData) return [];
    const labels: Array<{ index: number; day: number }> = [];
    for (let i = 0; i < density.timeSteps.length; i += 10) {
      labels.push({ index: i, day: density.timeSteps[i] });
    }
    return labels;
  }, [density, hasData]);

  // ─── Canvas Rendering ─────────────────────────────────────────────

  useEffect(() => {
    if (!hasData) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { timeSteps, priceBins, density: matrix, maxDensity } = density;
    const nCols = timeSteps.length;
    const nRows = priceBins.length;

    // Responsive sizing
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Clear
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const cellW = cssWidth / nCols;
    const cellH = cssHeight / Math.max(nRows - 1, 1);
    const maxD = maxDensity > 0 ? maxDensity : 1;

    // Draw heatmap cells — bottom-to-top (low prices at bottom)
    for (let col = 0; col < nCols; col++) {
      for (let row = 0; row < nRows; row++) {
        const value = matrix[col]?.[row] ?? 0;
        if (value <= 0) continue;

        const opacity = (value / maxD) * 0.8;
        ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;

        // Invert row so that row 0 (lowest price) is at the bottom
        const yPos = cssHeight - (row + 1) * cellH;
        ctx.fillRect(col * cellW, yPos, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    // Overlay current price line
    if (priceBins.length > 1) {
      const minPrice = priceBins[0];
      const maxPrice = priceBins[priceBins.length - 1];
      const priceRange = maxPrice - minPrice;

      if (priceRange > 0 && currentPrice >= minPrice && currentPrice <= maxPrice) {
        const fraction = (currentPrice - minPrice) / priceRange;
        const yLine = cssHeight - fraction * cssHeight;

        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yLine);
        ctx.lineTo(cssWidth, yLine);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [density, currentPrice, hasData]);

  // ─── ResizeObserver ───────────────────────────────────────────────

  useEffect(() => {
    if (!hasData) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Re-trigger canvas render via dependency array is not possible here,
        // so we dispatch a custom resize to force the canvas effect.
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.dispatchEvent(new Event('resize'));
        }
      });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [hasData]);

  // ─── Empty State ──────────────────────────────────────────────────

  if (!hasData) {
    return (
      <motion.div
        className={cn(S.card, 'p-4', className)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
          <h4 className={cn(T.heading, 'text-white/80')}>Path Density</h4>
        </div>
        <div className="flex items-center justify-center h-40 text-[11px] text-white/30">
          No density data available
        </div>
      </motion.div>
    );
  }

  // ─── Axis Label Helpers ───────────────────────────────────────────

  const nCols = density.timeSteps.length;
  const nRows = density.priceBins.length;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Path Density</h4>
      </div>

      {/* Chart Area */}
      <div className="relative">
        {/* Canvas container */}
        <div
          ref={containerRef}
          className="relative w-full h-[280px] md:h-[360px]"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 rounded-lg"
          />

          {/* Y-axis labels (right-aligned, absolute over canvas) */}
          <div className="absolute top-0 right-0 h-full pointer-events-none flex flex-col justify-between pr-1">
            {yLabels
              .slice()
              .reverse()
              .map(({ index, price }) => {
                const fraction = index / Math.max(nRows - 1, 1);
                const topPct = (1 - fraction) * 100;
                return (
                  <span
                    key={index}
                    className="text-[9px] font-mono text-white/35 text-right absolute right-1"
                    style={{ top: `${topPct}%`, transform: 'translateY(-50%)' }}
                  >
                    {fmtPrice(price)}
                  </span>
                );
              })}
          </div>
        </div>

        {/* X-axis labels (below canvas) */}
        <div className="relative w-full h-5 mt-1">
          {xLabels.map(({ index, day }) => {
            const leftPct = (index / Math.max(nCols - 1, 1)) * 100;
            return (
              <span
                key={index}
                className="absolute text-[9px] font-mono text-white/35"
                style={{
                  left: `${leftPct}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                D{day}
              </span>
            );
          })}
        </div>
      </div>

      {/* Current Price Legend */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <span className="inline-block w-5 h-px border-t border-dashed border-amber-400" />
        <span className="text-[9px] text-white/35 font-mono">
          Current {fmtPrice(currentPrice)}
        </span>
      </div>

      {/* Color Legend */}
      <div className="space-y-1">
        <div
          className="h-2 rounded-full w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.8))',
          }}
        />
        <div className="flex items-center justify-between">
          <span className={cn(T.legend)}>Low</span>
          <span className={cn(T.legend)}>High</span>
        </div>
      </div>
    </motion.div>
  );
}
