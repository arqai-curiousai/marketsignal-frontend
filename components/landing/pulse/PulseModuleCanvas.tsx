'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { colorWithAlpha } from '../pretext/canvasEffects';
import {
  SAMPLE_HEADLINES,
  SENTIMENT_COLORS,
  type Sentiment,
} from '../pretext/data/pulseHeadlines';

/* ── Shared types ── */
type ModuleType = 'news' | 'sectors' | 'correlation';

interface PulseModuleCanvasProps {
  type: ModuleType;
}

/* ────────────────────────────────────────────
 * NEWS MODULE — Scrolling headline ticker
 * ──────────────────────────────────────────── */

interface NewsItem {
  text: string;
  sentiment: Sentiment;
  impact: string;
  width: number;
  y: number;
  targetY: number;
  opacity: number;
}

const IMPACT_LABELS = ['HIGH', 'MED', 'LOW', 'HIGH', 'MED', 'LOW', 'HIGH', 'MED'];
const IMPACT_COLORS: Record<string, string> = {
  HIGH: 'rgba(248, 113, 113, 0.9)',
  MED: 'rgba(251, 191, 36, 0.9)',
  LOW: 'rgba(255, 255, 255, 0.5)',
};

function useNewsCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const itemsRef = useRef<NewsItem[]>([]);
  const scrollOffsetRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef(-1);

  const headlineFont = isMobile
    ? '400 9px Inter, system-ui, sans-serif'
    : '400 10px Inter, system-ui, sans-serif';
  const badgeFont = isMobile
    ? '700 7px Sora, system-ui, sans-serif'
    : '700 8px Sora, system-ui, sans-serif';
  const dotSize = 4;
  const itemHeight = isMobile ? 28 : 32;

  useEffect(() => {
    document.fonts.ready.then(() => {
      const items: NewsItem[] = [];
      const count = 6;
      for (let i = 0; i < count; i++) {
        const def = SAMPLE_HEADLINES[i % SAMPLE_HEADLINES.length];
        const handle = prepare(def.text, headlineFont);
        let lo = 0;
        let hi = 400;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 14).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        items.push({
          text: def.text,
          sentiment: def.sentiment,
          impact: IMPACT_LABELS[i % IMPACT_LABELS.length],
          width: Math.ceil(hi) + 8,
          y: i * itemHeight,
          targetY: i * itemHeight,
          opacity: 0.7,
        });
      }
      itemsRef.current = items;
      readyRef.current = true;
    });
  }, [headlineFont, itemHeight]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = -1;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current) return;
      const items = itemsRef.current;
      const mouse = mouseRef.current;

      // Auto-scroll (slow crawl upward)
      scrollOffsetRef.current += 0.3;
      if (scrollOffsetRef.current > itemHeight) {
        scrollOffsetRef.current -= itemHeight;
        // Rotate first item to the end
        const first = items.shift();
        if (first) items.push(first);
      }

      // Determine hovered item
      hoveredRef.current = -1;
      if (mouse) {
        for (let i = 0; i < items.length; i++) {
          const iy = i * itemHeight - scrollOffsetRef.current + itemHeight * 0.5;
          if (Math.abs(mouse.y - iy) < itemHeight * 0.5) {
            hoveredRef.current = i;
            break;
          }
        }
      }

      // Edge fade gradients
      const topFade = ctx.createLinearGradient(0, 0, 0, 24);
      topFade.addColorStop(0, 'rgba(10,10,12,1)');
      topFade.addColorStop(1, 'rgba(10,10,12,0)');

      const bottomFade = ctx.createLinearGradient(0, h - 24, 0, h);
      bottomFade.addColorStop(0, 'rgba(10,10,12,0)');
      bottomFade.addColorStop(1, 'rgba(10,10,12,1)');

      // Draw items
      items.forEach((item, i) => {
        const baseY = i * itemHeight - scrollOffsetRef.current + itemHeight * 0.5;
        if (baseY < -itemHeight || baseY > h + itemHeight) return;

        const isHovered = hoveredRef.current === i;

        // Edge fade
        const edgeFade = baseY < 20
          ? baseY / 20
          : baseY > h - 20
            ? (h - baseY) / 20
            : 1;
        const alpha = Math.max(edgeFade, 0) * (isHovered ? 1 : 0.65);
        if (alpha < 0.01) return;

        const x = 8;

        // Hover highlight bar
        if (isHovered) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.beginPath();
          ctx.roundRect(4, baseY - itemHeight * 0.45, w - 8, itemHeight * 0.9, 4);
          ctx.fill();
        }

        // Sentiment dot
        const sentColor = SENTIMENT_COLORS[item.sentiment];
        ctx.fillStyle = colorWithAlpha(sentColor, alpha);
        ctx.beginPath();
        ctx.arc(x + dotSize, baseY, dotSize, 0, Math.PI * 2);
        ctx.fill();

        // Dot glow
        if (isHovered) {
          ctx.shadowColor = sentColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(x + dotSize, baseY, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Headline text
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = headlineFont;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)';
        const textX = x + dotSize * 2 + 8;
        const maxTextW = w - textX - 44;
        // Truncate if needed
        let displayText = item.text;
        if (!isHovered) {
          const handle = prepare(displayText, headlineFont);
          const result = layout(handle, maxTextW, 14);
          if (result.lineCount > 1) {
            // Rough truncation
            const charW = maxTextW / displayText.length;
            const maxChars = Math.floor(maxTextW / (charW > 0 ? charW : 6));
            displayText = item.text.slice(0, Math.max(maxChars - 3, 10)) + '...';
          }
        }
        ctx.fillText(displayText, textX, baseY);
        ctx.restore();

        // Impact badge
        const badgeText = item.impact;
        const badgeColor = IMPACT_COLORS[badgeText] ?? IMPACT_COLORS.LOW;
        const badgeX = w - 36;
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        // Badge background
        ctx.fillStyle = colorWithAlpha(badgeColor, 0.12);
        ctx.beginPath();
        ctx.roundRect(badgeX - 2, baseY - 7, 30, 14, 3);
        ctx.fill();
        // Badge text
        ctx.font = badgeFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = badgeColor;
        ctx.fillText(badgeText, badgeX + 13, baseY);
        ctx.restore();
      });

      // Top/bottom edge overlays
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, w, 24);
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, h - 24, w, 24);

      // Pulse bar at top (live indicator)
      const pulseW = 30 + Math.sin(time * 0.003) * 10;
      ctx.fillStyle = colorWithAlpha('rgba(110, 231, 183, 0.8)', 0.3 + Math.sin(time * 0.004) * 0.15);
      ctx.beginPath();
      ctx.roundRect(8, 2, pulseW, 2, 1);
      ctx.fill();
    },
    [headlineFont, badgeFont, dotSize, itemHeight],
  );

  return { draw, handleMouseMove, handleMouseLeave, isMobile };
}

/* ────────────────────────────────────────────
 * SECTORS MODULE — Mini heatmap grid
 * ──────────────────────────────────────────── */

interface SectorCell {
  label: string;
  change: number;
  color: string;
}

const SECTOR_DATA: SectorCell[] = [
  { label: 'IT', change: 1.8, color: '' },
  { label: 'BANK', change: -0.4, color: '' },
  { label: 'PHARMA', change: 0.9, color: '' },
  { label: 'ENERGY', change: -1.2, color: '' },
  { label: 'AUTO', change: 2.1, color: '' },
  { label: 'FMCG', change: -0.3, color: '' },
  { label: 'METAL', change: 1.4, color: '' },
  { label: 'REALTY', change: -2.1, color: '' },
  { label: 'MEDIA', change: 0.2, color: '' },
  { label: 'INFRA', change: 0.7, color: '' },
  { label: 'POWER', change: 1.6, color: '' },
  { label: 'PSU', change: -0.8, color: '' },
].map((s) => ({
  ...s,
  color: s.change > 0
    ? `rgba(110, 231, 183, ${Math.min(0.15 + Math.abs(s.change) * 0.12, 0.5)})`
    : s.change < 0
      ? `rgba(248, 113, 113, ${Math.min(0.15 + Math.abs(s.change) * 0.12, 0.5)})`
      : 'rgba(255, 255, 255, 0.08)',
}));

function useSectorsCanvas() {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef(-1);

  const labelFont = isMobile
    ? '600 9px Sora, system-ui, sans-serif'
    : '600 10px Sora, system-ui, sans-serif';
  const changeFont = isMobile
    ? '500 7px Sora, system-ui, sans-serif'
    : '500 8px Sora, system-ui, sans-serif';

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = -1;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const cols = 4;
      const rows = 3;
      const padding = 6;
      const cellW = (w - padding * (cols + 1)) / cols;
      const cellH = (h - padding * (rows + 1)) / rows;
      const mouse = mouseRef.current;

      hoveredRef.current = -1;

      SECTOR_DATA.forEach((sector, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (cellW + padding);
        const y = padding + row * (cellH + padding);

        // Check hover
        if (mouse && mouse.x >= x && mouse.x <= x + cellW && mouse.y >= y && mouse.y <= y + cellH) {
          hoveredRef.current = i;
        }
        const isHovered = hoveredRef.current === i;

        // Breathe effect on color intensity
        const breathe = Math.sin(time * 0.002 + i * 0.5) * 0.03;
        const baseAlpha = sector.change > 0
          ? Math.min(0.12 + Math.abs(sector.change) * 0.08 + breathe, 0.4)
          : sector.change < 0
            ? Math.min(0.12 + Math.abs(sector.change) * 0.08 + breathe, 0.4)
            : 0.06 + breathe;

        const fillColor = sector.change > 0
          ? colorWithAlpha('rgba(110, 231, 183, 0.8)', baseAlpha * (isHovered ? 1.8 : 1))
          : sector.change < 0
            ? colorWithAlpha('rgba(248, 113, 113, 0.8)', baseAlpha * (isHovered ? 1.8 : 1))
            : colorWithAlpha('rgba(255, 255, 255, 0.5)', baseAlpha * (isHovered ? 1.8 : 1));

        // Cell background
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, cellW, cellH, 4);
        ctx.fill();

        // Border
        const borderAlpha = isHovered ? 0.25 : 0.06;
        const borderColor = sector.change > 0
          ? colorWithAlpha('rgba(110, 231, 183, 0.8)', borderAlpha)
          : sector.change < 0
            ? colorWithAlpha('rgba(248, 113, 113, 0.8)', borderAlpha)
            : colorWithAlpha('rgba(255, 255, 255, 0.5)', borderAlpha);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, cellW, cellH, 4);
        ctx.stroke();

        // Label
        ctx.save();
        ctx.font = labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(sector.label, x + cellW / 2, y + cellH / 2 - 6);
        ctx.restore();

        // Change value
        const changeText = `${sector.change > 0 ? '+' : ''}${sector.change.toFixed(1)}%`;
        ctx.save();
        ctx.font = changeFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = sector.change > 0
          ? colorWithAlpha('rgba(110, 231, 183, 0.8)', isHovered ? 0.9 : 0.6)
          : sector.change < 0
            ? colorWithAlpha('rgba(248, 113, 113, 0.8)', isHovered ? 0.9 : 0.6)
            : 'rgba(255, 255, 255, 0.35)';
        ctx.fillText(changeText, x + cellW / 2, y + cellH / 2 + 8);
        ctx.restore();

        // Hover tooltip overlay
        if (isHovered) {
          // Glow
          ctx.shadowColor = sector.change > 0
            ? 'rgba(110, 231, 183, 0.3)'
            : sector.change < 0
              ? 'rgba(248, 113, 113, 0.3)'
              : 'rgba(255, 255, 255, 0.1)';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = 'transparent';
          ctx.beginPath();
          ctx.roundRect(x, y, cellW, cellH, 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
    },
    [labelFont, changeFont],
  );

  return { draw, handleMouseMove, handleMouseLeave, isMobile };
}

/* ────────────────────────────────────────────
 * CORRELATION MODULE — Mini correlation matrix
 * ──────────────────────────────────────────── */

const CORR_TICKERS = ['NIFTY', 'SPX', 'GOLD', 'CRUDE', 'DXY', 'JPY'];
const CORR_MATRIX = [
  [1.0, 0.72, 0.15, 0.38, -0.45, -0.22],
  [0.72, 1.0, 0.08, 0.31, -0.52, -0.18],
  [0.15, 0.08, 1.0, -0.32, -0.65, 0.42],
  [0.38, 0.31, -0.32, 1.0, 0.28, -0.15],
  [-0.45, -0.52, -0.65, 0.28, 1.0, 0.55],
  [-0.22, -0.18, 0.42, -0.15, 0.55, 1.0],
];

function useCorrelationCanvas() {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef<{ row: number; col: number } | null>(null);

  const labelFont = isMobile
    ? '600 7px Sora, system-ui, sans-serif'
    : '600 8px Sora, system-ui, sans-serif';
  const valueFont = isMobile
    ? '500 7px Sora, system-ui, sans-serif'
    : '500 8px Sora, system-ui, sans-serif';

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const n = CORR_TICKERS.length;
      const labelSpace = isMobile ? 32 : 38;
      const matrixW = w - labelSpace - 6;
      const matrixH = h - labelSpace - 6;
      const cellW = matrixW / n;
      const cellH = matrixH / n;
      const ox = labelSpace;
      const oy = labelSpace;
      const mouse = mouseRef.current;

      hoveredRef.current = null;

      // Column headers
      ctx.save();
      ctx.font = labelFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      CORR_TICKERS.forEach((t, i) => {
        ctx.fillText(t, ox + i * cellW + cellW / 2, oy - 4);
      });
      ctx.restore();

      // Row headers
      ctx.save();
      ctx.font = labelFont;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      CORR_TICKERS.forEach((t, i) => {
        ctx.fillText(t, ox - 5, oy + i * cellH + cellH / 2);
      });
      ctx.restore();

      // Matrix cells
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const x = ox + col * cellW;
          const y = oy + row * cellH;
          const val = CORR_MATRIX[row][col];

          // Check hover
          if (
            mouse &&
            mouse.x >= x &&
            mouse.x <= x + cellW &&
            mouse.y >= y &&
            mouse.y <= y + cellH
          ) {
            hoveredRef.current = { row, col };
          }
          const isHovered =
            hoveredRef.current?.row === row && hoveredRef.current?.col === col;

          // Animated shimmer on values
          const shimmer = Math.sin(time * 0.001 + row * 0.7 + col * 0.3) * 0.03;

          // Color: blue for positive, orange for negative (colorblind-safe)
          let fillAlpha: number;
          let fillColor: string;
          if (row === col) {
            fillColor = 'rgba(255, 255, 255, 0.06)';
            fillAlpha = 0.06;
          } else if (val > 0) {
            fillAlpha = Math.min(Math.abs(val) * 0.5 + shimmer, 0.5);
            fillColor = colorWithAlpha('rgba(96, 165, 250, 0.8)', fillAlpha * (isHovered ? 1.5 : 1));
          } else {
            fillAlpha = Math.min(Math.abs(val) * 0.5 + shimmer, 0.5);
            fillColor = colorWithAlpha('rgba(251, 191, 36, 0.8)', fillAlpha * (isHovered ? 1.5 : 1));
          }

          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 2);
          ctx.fill();

          // Hover: show value
          if (isHovered && row !== col) {
            ctx.save();
            ctx.font = valueFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.shadowColor = val > 0
              ? 'rgba(96, 165, 250, 0.4)'
              : 'rgba(251, 191, 36, 0.4)';
            ctx.shadowBlur = 6;
            ctx.fillText(val.toFixed(2), x + cellW / 2, y + cellH / 2);
            ctx.shadowBlur = 0;
            ctx.restore();

            // Highlight row/col headers
            ctx.save();
            ctx.font = labelFont;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(CORR_TICKERS[row], ox - 5, oy + row * cellH + cellH / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(CORR_TICKERS[col], ox + col * cellW + cellW / 2, oy - 4);
            ctx.restore();
          }
        }
      }

      // Tooltip overlay on hover
      if (hoveredRef.current && hoveredRef.current.row !== hoveredRef.current.col) {
        const { row, col } = hoveredRef.current;
        const val = CORR_MATRIX[row][col];
        const tooltipText = `${CORR_TICKERS[row]} / ${CORR_TICKERS[col]}: ${val.toFixed(2)}`;
        const tx = Math.min(Math.max(mouse!.x, 60), w - 60);
        const ty = Math.max(mouse!.y - 20, 10);

        ctx.save();
        ctx.font = valueFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Tooltip background
        const tw = ctx.measureText(tooltipText).width + 12;
        ctx.fillStyle = 'rgba(20, 20, 24, 0.9)';
        ctx.beginPath();
        ctx.roundRect(tx - tw / 2, ty - 16, tw, 16, 4);
        ctx.fill();
        ctx.strokeStyle = val > 0
          ? 'rgba(96, 165, 250, 0.3)'
          : 'rgba(251, 191, 36, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(tx - tw / 2, ty - 16, tw, 16, 4);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(tooltipText, tx, ty - 3);
        ctx.restore();
      }
    },
    [labelFont, valueFont, isMobile],
  );

  return { draw, handleMouseMove, handleMouseLeave, isMobile };
}

/* ────────────────────────────────────────────
 * Main component
 * ──────────────────────────────────────────── */

export function PulseModuleCanvas({ type }: PulseModuleCanvasProps) {
  const news = useNewsCanvas();
  const sectors = useSectorsCanvas();
  const correlation = useCorrelationCanvas();

  const active = type === 'news' ? news : type === 'sectors' ? sectors : correlation;

  return (
    <PretextCanvas
      draw={active.draw}
      fps={active.isMobile ? 30 : 60}
      onMouseMove={active.handleMouseMove}
      onMouseLeave={active.handleMouseLeave}
    />
  );
}
