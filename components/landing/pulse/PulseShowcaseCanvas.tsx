'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { colorWithAlpha, dist } from '../pretext/canvasEffects';
import {
  SAMPLE_HEADLINES,
  SENTIMENT_COLORS,
  type Sentiment,
} from '../pretext/data/pulseHeadlines';

type ShowcaseType = 'news' | 'sectors' | 'correlation';

interface PulseShowcaseCanvasProps {
  type: ShowcaseType;
}

/* ────────────────────────────────────────────────────────
 * NEWS SHOWCASE — Full news feed simulation
 * ──────────────────────────────────────────────────────── */

interface FeedArticle {
  headline: string;
  source: string;
  sentiment: Sentiment;
  impact: number; // 0-1
  timestamp: string;
  width: number;
  y: number;
  targetY: number;
}

const NEWS_SOURCES = [
  'Reuters', 'Bloomberg', 'ET', 'CNBC', 'Livemint',
  'Moneycontrol', 'Hindu BL', 'BBC', 'Nikkei', 'FXStreet',
];
const TIMESTAMPS = [
  '2m ago', '5m ago', '8m ago', '12m ago', '18m ago',
  '24m ago', '31m ago', '45m ago', '1h ago', '2h ago',
];

function useNewsFeedCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const articlesRef = useRef<FeedArticle[]>([]);
  const scrollRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef(-1);

  const headlineFont = isMobile
    ? '500 10px Inter, system-ui, sans-serif'
    : '500 12px Inter, system-ui, sans-serif';
  const sourceFont = isMobile
    ? '600 7px Sora, system-ui, sans-serif'
    : '600 8px Sora, system-ui, sans-serif';
  const metaFont = isMobile
    ? '400 7px Inter, system-ui, sans-serif'
    : '400 8px Inter, system-ui, sans-serif';
  const impactFont = isMobile
    ? '700 7px Sora, system-ui, sans-serif'
    : '700 8px Sora, system-ui, sans-serif';

  const articleHeight = isMobile ? 52 : 58;

  useEffect(() => {
    document.fonts.ready.then(() => {
      const articles: FeedArticle[] = [];
      const count = 10;
      for (let i = 0; i < count; i++) {
        const def = SAMPLE_HEADLINES[i % SAMPLE_HEADLINES.length];
        const handle = prepare(def.text, headlineFont);
        let lo = 0;
        let hi = 500;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 16).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        articles.push({
          headline: def.text,
          source: NEWS_SOURCES[i % NEWS_SOURCES.length],
          sentiment: def.sentiment,
          impact: 0.3 + Math.random() * 0.7,
          timestamp: TIMESTAMPS[i % TIMESTAMPS.length],
          width: Math.ceil(hi) + 8,
          y: i * articleHeight,
          targetY: i * articleHeight,
        });
      }
      articlesRef.current = articles;
      readyRef.current = true;
    });
  }, [headlineFont, articleHeight]);

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
      const articles = articlesRef.current;
      const mouse = mouseRef.current;

      // Auto-scroll (slow crawl)
      const isHovering = hoveredRef.current >= 0;
      if (!isHovering) {
        scrollRef.current += 0.25;
        if (scrollRef.current > articleHeight) {
          scrollRef.current -= articleHeight;
          const first = articles.shift();
          if (first) articles.push(first);
        }
      }

      // Determine hovered
      hoveredRef.current = -1;
      if (mouse) {
        for (let i = 0; i < articles.length; i++) {
          const ay = i * articleHeight - scrollRef.current + articleHeight / 2;
          if (Math.abs(mouse.y - ay) < articleHeight / 2) {
            hoveredRef.current = i;
            break;
          }
        }
      }

      // Live wire indicator
      const pulseW = w * 0.6;
      const pulseX = (w - pulseW) / 2;
      const pulseAlpha = 0.15 + Math.sin(time * 0.005) * 0.1;
      ctx.fillStyle = colorWithAlpha('rgba(110, 231, 183, 0.8)', pulseAlpha);
      ctx.beginPath();
      ctx.roundRect(pulseX, 1, pulseW, 1.5, 1);
      ctx.fill();

      // Draw articles
      articles.forEach((article, i) => {
        const baseY = i * articleHeight - scrollRef.current;
        if (baseY < -articleHeight - 10 || baseY > h + 10) return;

        const isHovered = hoveredRef.current === i;

        // Edge fade
        const edgeFade = baseY < 30
          ? Math.max(baseY / 30, 0)
          : baseY + articleHeight > h - 30
            ? Math.max((h - baseY - articleHeight + 30) / 30, 0)
            : 1;
        if (edgeFade < 0.01) return;

        const alpha = edgeFade * (isHovered ? 1 : 0.7);
        const px = 14;

        // Active article highlight
        if (isHovered) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          ctx.beginPath();
          ctx.roundRect(6, baseY + 3, w - 12, articleHeight - 6, 6);
          ctx.fill();

          // Left accent bar
          const sentColor = SENTIMENT_COLORS[article.sentiment];
          ctx.fillStyle = colorWithAlpha(sentColor, 0.6);
          ctx.beginPath();
          ctx.roundRect(6, baseY + 6, 2.5, articleHeight - 12, 2);
          ctx.fill();
        }

        // Sentiment bar (thin left stripe)
        if (!isHovered) {
          const sentColor = SENTIMENT_COLORS[article.sentiment];
          ctx.fillStyle = colorWithAlpha(sentColor, alpha * 0.35);
          ctx.beginPath();
          ctx.roundRect(6, baseY + 8, 2, articleHeight - 16, 1);
          ctx.fill();
        }

        // Source label
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.font = sourceFont;
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(article.source.toUpperCase(), px, baseY + 8);
        ctx.restore();

        // Timestamp (right side)
        ctx.save();
        ctx.globalAlpha = alpha * 0.35;
        ctx.font = metaFont;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(article.timestamp, w - 14, baseY + 8);
        ctx.restore();

        // Headline text
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = headlineFont;
        ctx.textBaseline = 'top';
        ctx.fillStyle = isHovered
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(255, 255, 255, 0.65)';
        const maxTextW = w - px - 60;
        let displayText = article.headline;
        if (!isHovered) {
          const handle = prepare(displayText, headlineFont);
          const result = layout(handle, maxTextW, 16);
          if (result.lineCount > 1) {
            const approxChars = Math.floor(maxTextW / 6.5);
            displayText = article.headline.slice(0, Math.max(approxChars - 3, 15)) + '...';
          }
        }
        ctx.fillText(displayText, px, baseY + 22);
        ctx.restore();

        // Impact score bar
        const impactBarW = isMobile ? 40 : 50;
        const impactX = w - 14 - impactBarW;
        const impactY = baseY + 24;
        const barH = 4;
        const filledW = article.impact * impactBarW;

        // Background
        ctx.fillStyle = colorWithAlpha('rgba(255, 255, 255, 0.5)', alpha * 0.06);
        ctx.beginPath();
        ctx.roundRect(impactX, impactY, impactBarW, barH, 2);
        ctx.fill();

        // Filled bar
        const impactColor = article.impact > 0.7
          ? 'rgba(248, 113, 113, 0.8)'
          : article.impact > 0.4
            ? 'rgba(251, 191, 36, 0.8)'
            : 'rgba(255, 255, 255, 0.5)';
        ctx.fillStyle = colorWithAlpha(impactColor, alpha * 0.6);
        ctx.beginPath();
        ctx.roundRect(impactX, impactY, filledW, barH, 2);
        ctx.fill();

        // Separator line
        if (!isHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px, baseY + articleHeight - 2);
          ctx.lineTo(w - 14, baseY + articleHeight - 2);
          ctx.stroke();
        }

        // Hover detail overlay: full text + sentiment badge
        if (isHovered) {
          const sentLabel = article.sentiment.toUpperCase();
          const sentColor = SENTIMENT_COLORS[article.sentiment];
          // Sentiment badge
          ctx.save();
          ctx.font = impactFont;
          ctx.textBaseline = 'top';
          const badgeW = ctx.measureText(sentLabel).width + 10;
          const badgeX = px + ctx.measureText(article.source.toUpperCase()).width + 12;
          ctx.fillStyle = colorWithAlpha(sentColor, 0.15);
          ctx.beginPath();
          ctx.roundRect(badgeX, baseY + 6, badgeW, 13, 3);
          ctx.fill();
          ctx.fillStyle = sentColor;
          ctx.fillText(sentLabel, badgeX + 5, baseY + 8);
          ctx.restore();

          // Impact label
          const impactLabel = article.impact > 0.7 ? 'HIGH' : article.impact > 0.4 ? 'MED' : 'LOW';
          ctx.save();
          ctx.font = impactFont;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillStyle = impactColor;
          ctx.fillText(impactLabel, impactX - 4, impactY - 1);
          ctx.restore();
        }
      });

      // Top/bottom fade overlays
      const topFade = ctx.createLinearGradient(0, 0, 0, 30);
      topFade.addColorStop(0, 'rgba(10, 10, 12, 1)');
      topFade.addColorStop(1, 'rgba(10, 10, 12, 0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, w, 30);

      const btmFade = ctx.createLinearGradient(0, h - 30, 0, h);
      btmFade.addColorStop(0, 'rgba(10, 10, 12, 0)');
      btmFade.addColorStop(1, 'rgba(10, 10, 12, 1)');
      ctx.fillStyle = btmFade;
      ctx.fillRect(0, h - 30, w, 30);
    },
    [headlineFont, sourceFont, metaFont, impactFont, articleHeight, isMobile],
  );

  return { draw, handleMouseMove, handleMouseLeave, isMobile };
}

/* ────────────────────────────────────────────────────────
 * SECTORS SHOWCASE — RRG Quadrant Visualization
 * ──────────────────────────────────────────────────────── */

interface RRGNode {
  label: string;
  x: number; // relative momentum (-1 to 1)
  y: number; // relative strength (-1 to 1)
  trailX: number[];
  trailY: number[];
  color: string;
  breathePhase: number;
  driftPhaseX: number;
  driftPhaseY: number;
}

const RRG_SECTORS: RRGNode[] = [
  { label: 'IT', x: 0.6, y: 0.5, trailX: [], trailY: [], color: 'rgba(110, 231, 183, 0.8)', breathePhase: 0, driftPhaseX: 0, driftPhaseY: 0 },
  { label: 'BANK', x: -0.3, y: 0.4, trailX: [], trailY: [], color: 'rgba(110, 231, 183, 0.8)', breathePhase: 0.5, driftPhaseX: 1, driftPhaseY: 0.5 },
  { label: 'PHARMA', x: 0.4, y: -0.2, trailX: [], trailY: [], color: 'rgba(251, 191, 36, 0.8)', breathePhase: 1.0, driftPhaseX: 2, driftPhaseY: 1 },
  { label: 'ENERGY', x: -0.5, y: -0.6, trailX: [], trailY: [], color: 'rgba(248, 113, 113, 0.8)', breathePhase: 1.5, driftPhaseX: 3, driftPhaseY: 1.5 },
  { label: 'AUTO', x: 0.7, y: 0.3, trailX: [], trailY: [], color: 'rgba(110, 231, 183, 0.8)', breathePhase: 2.0, driftPhaseX: 0.5, driftPhaseY: 2 },
  { label: 'FMCG', x: -0.1, y: -0.3, trailX: [], trailY: [], color: 'rgba(251, 191, 36, 0.8)', breathePhase: 2.5, driftPhaseX: 1.5, driftPhaseY: 2.5 },
  { label: 'METAL', x: 0.2, y: 0.7, trailX: [], trailY: [], color: 'rgba(110, 231, 183, 0.8)', breathePhase: 3.0, driftPhaseX: 2.5, driftPhaseY: 3 },
  { label: 'REALTY', x: -0.7, y: -0.4, trailX: [], trailY: [], color: 'rgba(248, 113, 113, 0.8)', breathePhase: 3.5, driftPhaseX: 3.5, driftPhaseY: 0.3 },
  { label: 'MEDIA', x: -0.4, y: 0.5, trailX: [], trailY: [], color: 'rgba(96, 165, 250, 0.8)', breathePhase: 4.0, driftPhaseX: 0.8, driftPhaseY: 3.5 },
  { label: 'INFRA', x: 0.5, y: -0.5, trailX: [], trailY: [], color: 'rgba(251, 191, 36, 0.8)', breathePhase: 4.5, driftPhaseX: 2.8, driftPhaseY: 1.8 },
  { label: 'POWER', x: 0.3, y: 0.6, trailX: [], trailY: [], color: 'rgba(110, 231, 183, 0.8)', breathePhase: 5.0, driftPhaseX: 1.3, driftPhaseY: 4 },
  { label: 'PSU', x: -0.6, y: 0.1, trailX: [], trailY: [], color: 'rgba(96, 165, 250, 0.8)', breathePhase: 5.5, driftPhaseX: 4, driftPhaseY: 0.7 },
];

function useSectorRRGCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const nodesRef = useRef<RRGNode[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef(-1);
  const trailCounterRef = useRef(0);

  const labelFont = isMobile
    ? '600 8px Sora, system-ui, sans-serif'
    : '600 10px Sora, system-ui, sans-serif';
  const quadrantFont = isMobile
    ? '500 7px Sora, system-ui, sans-serif'
    : '500 8px Sora, system-ui, sans-serif';
  const tooltipFont = isMobile
    ? '400 8px Inter, system-ui, sans-serif'
    : '400 9px Inter, system-ui, sans-serif';

  useEffect(() => {
    nodesRef.current = RRG_SECTORS.map((s) => ({
      ...s,
      trailX: [],
      trailY: [],
    }));
    readyRef.current = true;
  }, []);

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
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      const cx = w / 2;
      const cy = h / 2;
      const halfW = (w - 40) / 2;
      const halfH = (h - 40) / 2;

      // Quadrant grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.5;
      // Horizontal center
      ctx.beginPath();
      ctx.moveTo(20, cy);
      ctx.lineTo(w - 20, cy);
      ctx.stroke();
      // Vertical center
      ctx.beginPath();
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, h - 20);
      ctx.stroke();

      // Quadrant labels
      ctx.save();
      ctx.font = quadrantFont;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('LEADING', cx + halfW * 0.5, 24);
      ctx.fillText('IMPROVING', cx - halfW * 0.5, 24);
      ctx.textBaseline = 'bottom';
      ctx.fillText('WEAKENING', cx + halfW * 0.5, h - 24);
      ctx.fillText('LAGGING', cx - halfW * 0.5, h - 24);
      ctx.restore();

      // Axis labels
      ctx.save();
      ctx.font = quadrantFont;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('RS-Momentum \u2192', cx, h - 8);
      ctx.restore();

      ctx.save();
      ctx.font = quadrantFont;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.translate(10, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('RS-Ratio \u2192', 0, 0);
      ctx.restore();

      // Record trails every 60 frames
      trailCounterRef.current++;
      const recordTrail = trailCounterRef.current % 8 === 0;

      hoveredRef.current = -1;

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Animated drift (slow orbital movement)
        const driftX = Math.sin(time * 0.0003 + node.driftPhaseX) * 0.08;
        const driftY = Math.cos(time * 0.00025 + node.driftPhaseY) * 0.06;
        const currentX = node.x + driftX;
        const currentY = node.y + driftY;

        const px = cx + currentX * halfW;
        const py = cy - currentY * halfH; // Y inverted (positive = up)

        // Record trail
        if (recordTrail) {
          node.trailX.push(px);
          node.trailY.push(py);
          if (node.trailX.length > 20) {
            node.trailX.shift();
            node.trailY.shift();
          }
        }

        // Check hover
        if (mouse && dist(mouse.x, mouse.y, px, py) < 24) {
          hoveredRef.current = i;
        }
        const isHovered = hoveredRef.current === i;

        // Draw trail
        if (node.trailX.length > 2) {
          ctx.beginPath();
          ctx.moveTo(node.trailX[0], node.trailY[0]);
          for (let t = 1; t < node.trailX.length; t++) {
            ctx.lineTo(node.trailX[t], node.trailY[t]);
          }
          ctx.lineTo(px, py);
          ctx.strokeStyle = colorWithAlpha(node.color, isHovered ? 0.25 : 0.08);
          ctx.lineWidth = isHovered ? 1.5 : 1;
          ctx.stroke();

          // Trail arrow head
          const lastIdx = node.trailX.length - 1;
          const dx = px - node.trailX[lastIdx];
          const dy = py - node.trailY[lastIdx];
          const angle = Math.atan2(dy, dx);
          const arrowSize = isHovered ? 5 : 3;
          ctx.fillStyle = colorWithAlpha(node.color, isHovered ? 0.4 : 0.15);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(
            px - arrowSize * Math.cos(angle - 0.4),
            py - arrowSize * Math.sin(angle - 0.4),
          );
          ctx.lineTo(
            px - arrowSize * Math.cos(angle + 0.4),
            py - arrowSize * Math.sin(angle + 0.4),
          );
          ctx.closePath();
          ctx.fill();
        }

        // Breathe radius
        const breathe = Math.sin(time * 0.003 + node.breathePhase) * 2;
        const radius = (isHovered ? 14 : 8) + breathe;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(px, py, radius * 0.3, px, py, radius * 2.5);
        glowGrad.addColorStop(0, colorWithAlpha(node.color, isHovered ? 0.15 : 0.05));
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner node
        ctx.fillStyle = colorWithAlpha(node.color, isHovered ? 0.3 : 0.12);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colorWithAlpha(node.color, isHovered ? 0.5 : 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.save();
        ctx.font = labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(node.color, isHovered ? 0.95 : 0.6);
        if (isHovered) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 6;
        }
        ctx.fillText(node.label, px, py);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Hover tooltip
        if (isHovered && mouse) {
          const quadrant = currentX > 0 && currentY > 0 ? 'Leading'
            : currentX < 0 && currentY > 0 ? 'Improving'
              : currentX > 0 && currentY < 0 ? 'Weakening'
                : 'Lagging';
          const pe = (12 + Math.random() * 15).toFixed(1);
          const mom = (currentX * 8).toFixed(1);
          const tooltipLines = [
            `${node.label} - ${quadrant}`,
            `PE: ${pe}x  Mom: ${mom}%`,
          ];

          const tx = Math.min(Math.max(mouse.x, 70), w - 70);
          const ty = Math.max(py - radius - 28, 14);

          ctx.save();
          ctx.font = tooltipFont;
          const maxW = Math.max(
            ctx.measureText(tooltipLines[0]).width,
            ctx.measureText(tooltipLines[1]).width,
          ) + 16;

          // Background
          ctx.fillStyle = 'rgba(15, 15, 20, 0.92)';
          ctx.beginPath();
          ctx.roundRect(tx - maxW / 2, ty - 4, maxW, 30, 4);
          ctx.fill();
          ctx.strokeStyle = colorWithAlpha(node.color, 0.3);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.roundRect(tx - maxW / 2, ty - 4, maxW, 30, 4);
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(tooltipLines[0], tx, ty);
          ctx.fillStyle = colorWithAlpha(node.color, 0.7);
          ctx.fillText(tooltipLines[1], tx, ty + 13);
          ctx.restore();
        }
      });
    },
    [labelFont, quadrantFont, tooltipFont],
  );

  return { draw, handleMouseMove, handleMouseLeave, isMobile };
}

/* ────────────────────────────────────────────────────────
 * CORRELATION SHOWCASE — Full correlation heatmap + DCC line
 * ──────────────────────────────────────────────────────── */

const FULL_TICKERS = ['NIFTY', 'SENSEX', 'SPX', 'NASDAQ', 'GOLD', 'CRUDE', 'DXY', 'USDJPY', 'EURUSD', 'USDINR'];

// Generate a symmetric correlation matrix
function generateCorrMatrix(n: number): number[][] {
  const base = [
    [1.00, 0.97, 0.68, 0.62, 0.12, 0.35, -0.42, -0.18, 0.28, -0.55],
    [0.97, 1.00, 0.65, 0.60, 0.14, 0.33, -0.40, -0.16, 0.26, -0.53],
    [0.68, 0.65, 1.00, 0.92, 0.05, 0.28, -0.55, -0.22, 0.38, -0.30],
    [0.62, 0.60, 0.92, 1.00, 0.02, 0.25, -0.50, -0.20, 0.35, -0.28],
    [0.12, 0.14, 0.05, 0.02, 1.00, -0.30, -0.62, 0.40, 0.15, 0.08],
    [0.35, 0.33, 0.28, 0.25, -0.30, 1.00, 0.32, -0.12, -0.18, 0.42],
    [-0.42, -0.40, -0.55, -0.50, -0.62, 0.32, 1.00, 0.52, -0.48, 0.35],
    [-0.18, -0.16, -0.22, -0.20, 0.40, -0.12, 0.52, 1.00, -0.32, 0.15],
    [0.28, 0.26, 0.38, 0.35, 0.15, -0.18, -0.48, -0.32, 1.00, -0.20],
    [-0.55, -0.53, -0.30, -0.28, 0.08, 0.42, 0.35, 0.15, -0.20, 1.00],
  ];
  return base.slice(0, n).map((r) => r.slice(0, n));
}

// Pre-generate DCC-GARCH time series (two pairs)
function generateDCCLine(length: number): number[] {
  const points: number[] = [];
  let val = 0.5;
  for (let i = 0; i < length; i++) {
    val += (Math.random() - 0.5) * 0.06;
    val = Math.max(-0.2, Math.min(1.0, val));
    points.push(val);
  }
  return points;
}

const FULL_CORR = generateCorrMatrix(10);
const DCC_LINE_1 = generateDCCLine(80);
const DCC_LINE_2 = generateDCCLine(80);

function useCorrelationHeatmapCanvas() {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef<{ row: number; col: number } | null>(null);

  const labelFont = isMobile
    ? '600 6px Sora, system-ui, sans-serif'
    : '600 7px Sora, system-ui, sans-serif';
  const valueFont = isMobile
    ? '600 7px Sora, system-ui, sans-serif'
    : '600 8px Sora, system-ui, sans-serif';
  const tooltipFont = isMobile
    ? '400 8px Inter, system-ui, sans-serif'
    : '400 9px Inter, system-ui, sans-serif';
  const dccLabelFont = isMobile
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
      const n = FULL_TICKERS.length;
      const mouse = mouseRef.current;

      // Layout: heatmap on top ~70%, DCC line chart below ~30%
      const heatmapH = h * 0.68;
      const dccH = h * 0.28;
      const dccTop = heatmapH + h * 0.04;

      // Heatmap
      const labelSpace = isMobile ? 38 : 46;
      const matrixW = w - labelSpace - 10;
      const matrixH = heatmapH - labelSpace - 4;
      const cellW = matrixW / n;
      const cellH = matrixH / n;
      const ox = labelSpace;
      const oy = labelSpace;

      hoveredRef.current = null;

      // Column headers (rotated for space)
      ctx.save();
      ctx.font = labelFont;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      FULL_TICKERS.forEach((t, i) => {
        const tx = ox + i * cellW + cellW / 2;
        ctx.save();
        ctx.translate(tx, oy - 4);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // Row headers
      ctx.save();
      ctx.font = labelFont;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      FULL_TICKERS.forEach((t, i) => {
        ctx.fillText(t, ox - 4, oy + i * cellH + cellH / 2);
      });
      ctx.restore();

      // Matrix cells
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const x = ox + col * cellW;
          const y = oy + row * cellH;
          const val = FULL_CORR[row][col];

          if (
            mouse &&
            mouse.x >= x && mouse.x <= x + cellW &&
            mouse.y >= y && mouse.y <= y + cellH
          ) {
            hoveredRef.current = { row, col };
          }
          const isHovered =
            hoveredRef.current?.row === row && hoveredRef.current?.col === col;

          // Animated value shimmer
          const shimmer = Math.sin(time * 0.0008 + row * 0.5 + col * 0.3) * 0.02;

          let fillColor: string;
          if (row === col) {
            fillColor = 'rgba(255, 255, 255, 0.05)';
          } else if (val > 0) {
            const alpha = Math.min(Math.abs(val) * 0.45 + shimmer, 0.45) * (isHovered ? 1.6 : 1);
            fillColor = colorWithAlpha('rgba(96, 165, 250, 0.8)', alpha);
          } else {
            const alpha = Math.min(Math.abs(val) * 0.45 + shimmer, 0.45) * (isHovered ? 1.6 : 1);
            fillColor = colorWithAlpha('rgba(251, 191, 36, 0.8)', alpha);
          }

          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1, 1);
          ctx.fill();

          // Hover: show value in cell
          if (isHovered && row !== col) {
            ctx.save();
            ctx.font = valueFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.shadowColor = val > 0 ? 'rgba(96, 165, 250, 0.5)' : 'rgba(251, 191, 36, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(val.toFixed(2), x + cellW / 2, y + cellH / 2);
            ctx.shadowBlur = 0;
            ctx.restore();
          }

          // Highlight cross-hair on hover
          if (hoveredRef.current && (hoveredRef.current.row === row || hoveredRef.current.col === col) && !(hoveredRef.current.row === row && hoveredRef.current.col === col)) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
            ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
          }
        }
      }

      // DCC-GARCH mini chart
      const dccX = 30;
      const dccW = w - 60;

      // Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.beginPath();
      ctx.roundRect(dccX - 10, dccTop, dccW + 20, dccH, 6);
      ctx.fill();

      // Label
      ctx.save();
      ctx.font = dccLabelFont;
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('DCC-GARCH', dccX, dccTop + 4);
      ctx.restore();

      // Zero line
      const zeroY = dccTop + dccH * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(dccX, zeroY);
      ctx.lineTo(dccX + dccW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated time offset (scrolling)
      const timeOffset = Math.floor(time * 0.01) % DCC_LINE_1.length;

      // Draw line 1 (NIFTY-SPX)
      ctx.beginPath();
      const chartTop = dccTop + 14;
      const chartH = dccH - 18;
      for (let i = 0; i < DCC_LINE_1.length; i++) {
        const idx = (i + timeOffset) % DCC_LINE_1.length;
        const px = dccX + (i / (DCC_LINE_1.length - 1)) * dccW;
        const py = chartTop + (1 - DCC_LINE_1[idx]) * chartH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = colorWithAlpha('rgba(96, 165, 250, 0.8)', 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw line 2 (GOLD-DXY)
      ctx.beginPath();
      for (let i = 0; i < DCC_LINE_2.length; i++) {
        const idx = (i + timeOffset) % DCC_LINE_2.length;
        const px = dccX + (i / (DCC_LINE_2.length - 1)) * dccW;
        const py = chartTop + (1 - DCC_LINE_2[idx]) * chartH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = colorWithAlpha('rgba(251, 191, 36, 0.8)', 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Legend
      ctx.save();
      ctx.font = dccLabelFont;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.fillText('NIFTY-SPX', dccX + dccW, dccTop + 4);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.fillText('GOLD-DXY', dccX + dccW - 64, dccTop + 4);
      ctx.restore();

      // Hover tooltip for heatmap
      if (hoveredRef.current && hoveredRef.current.row !== hoveredRef.current.col && mouse) {
        const { row, col } = hoveredRef.current;
        const val = FULL_CORR[row][col];
        const regime = Math.abs(val) > 0.6 ? 'High' : Math.abs(val) > 0.3 ? 'Moderate' : 'Low';
        const tooltipLines = [
          `${FULL_TICKERS[row]} / ${FULL_TICKERS[col]}`,
          `Corr: ${val.toFixed(2)} | Regime: ${regime}`,
        ];

        const tx = Math.min(Math.max(mouse.x, 80), w - 80);
        const ty = Math.max(mouse.y - 34, 12);

        ctx.save();
        ctx.font = tooltipFont;
        const maxTW = Math.max(
          ctx.measureText(tooltipLines[0]).width,
          ctx.measureText(tooltipLines[1]).width,
        ) + 16;

        ctx.fillStyle = 'rgba(15, 15, 20, 0.94)';
        ctx.beginPath();
        ctx.roundRect(tx - maxTW / 2, ty - 4, maxTW, 32, 5);
        ctx.fill();
        const borderColor = val > 0
          ? 'rgba(96, 165, 250, 0.3)'
          : 'rgba(251, 191, 36, 0.3)';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(tx - maxTW / 2, ty - 4, maxTW, 32, 5);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(tooltipLines[0], tx, ty);
        ctx.fillStyle = val > 0
          ? 'rgba(96, 165, 250, 0.75)'
          : 'rgba(251, 191, 36, 0.75)';
        ctx.fillText(tooltipLines[1], tx, ty + 14);
        ctx.restore();
      }
    },
    [labelFont, valueFont, tooltipFont, dccLabelFont, isMobile],
  );

  return { draw, handleMouseMove, handleMouseLeave, isMobile };
}

/* ────────────────────────────────────────────────────────
 * Main component
 * ──────────────────────────────────────────────────────── */

export function PulseShowcaseCanvas({ type }: PulseShowcaseCanvasProps) {
  const news = useNewsFeedCanvas();
  const sectors = useSectorRRGCanvas();
  const correlation = useCorrelationHeatmapCanvas();

  const active = type === 'news' ? news : type === 'sectors' ? sectors : correlation;

  return (
    <div className="relative w-full h-full min-h-[280px]">
      <PretextCanvas
        draw={active.draw}
        fps={active.isMobile ? 30 : 60}
        onMouseMove={active.handleMouseMove}
        onMouseLeave={active.handleMouseLeave}
      />
    </div>
  );
}
