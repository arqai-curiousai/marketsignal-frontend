'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawSonarPulse,
  colorWithAlpha,
} from '@/components/landing/pretext/canvasEffects';
import type { INewsArticle } from '@/types/analytics';
import { getSentimentColor, REGION_METADATA, formatTimeAgo } from '../constants';
import { BreakingWire } from '../BreakingWire';

/* ── Constants ── */

const WIRE_FONT = '500 11px Inter, system-ui, sans-serif';
const SOURCE_FONT = '600 9px Sora, system-ui, sans-serif';
const TIME_FONT = '400 9px Inter, system-ui, sans-serif';
const SEPARATOR = '  \u2022  ';
const SCROLL_SPEED = 0.6; // px per frame
const SONAR_DURATION = 1500; // ms
const GRADIENT_FADE = 0.06; // 6% width for edge fade

interface WireTile {
  article: INewsArticle;
  headline: string;
  headlineWidth: number;
  source: string;
  sourceWidth: number;
  timeAgo: string;
  timeWidth: number;
  separatorWidth: number;
  totalWidth: number;
  sentimentColor: string;
  regionFlag: string;
  flagWidth: number;
  x: number;
  sonarStart: number; // timestamp when tile first appeared
}

interface BreakingWireCanvasProps {
  articles: INewsArticle[];
  onSelect: (article: INewsArticle) => void;
  onDismiss: (id: string) => void;
}

export function BreakingWireCanvas({ articles, onSelect, onDismiss }: BreakingWireCanvasProps) {
  const isMobile = useMobileDetect();
  const tilesRef = useRef<WireTile[]>([]);
  const scrollRef = useRef(0);
  const canvasWidthRef = useRef(0);
  const hoveredTileRef = useRef<number>(-1);
  const prevArticleIdsRef = useRef<Set<string>>(new Set());
  const readyRef = useRef(false);

  // Initialize tiles when articles change
  useEffect(() => {
    if (articles.length === 0) {
      tilesRef.current = [];
      readyRef.current = false;
      return;
    }

    document.fonts.ready.then(() => {
      const prevIds = prevArticleIdsRef.current;
      const now = Date.now();
      const newTiles: WireTile[] = [];
      let xOffset = 0;

      for (const article of articles) {
        const headline = article.headline || '';
        const source = article.source || '';
        const timeAgo = formatTimeAgo(article.published_at);
        const primaryRegion = article.regions?.[0];
        const regionMeta = primaryRegion ? REGION_METADATA[primaryRegion] : undefined;
        const flag = regionMeta?.flag || '';

        // Measure with pretext
        const headlineHandle = prepare(headline, WIRE_FONT);
        let hLo = 0, hHi = 2000;
        for (let i = 0; i < 18; i++) {
          const mid = (hLo + hHi) / 2;
          if (layout(headlineHandle, mid, 12).lineCount <= 1) hHi = mid;
          else hLo = mid;
        }
        const headlineWidth = Math.ceil(hHi);

        // Source width
        const sourceHandle = prepare(source, SOURCE_FONT);
        let sLo = 0, sHi = 200;
        for (let i = 0; i < 14; i++) {
          const mid = (sLo + sHi) / 2;
          if (layout(sourceHandle, mid, 10).lineCount <= 1) sHi = mid;
          else sLo = mid;
        }
        const sourceWidth = Math.ceil(sHi);

        // Time width
        const timeHandle = prepare(timeAgo, TIME_FONT);
        let tLo = 0, tHi = 100;
        for (let i = 0; i < 14; i++) {
          const mid = (tLo + tHi) / 2;
          if (layout(timeHandle, mid, 10).lineCount <= 1) tHi = mid;
          else tLo = mid;
        }
        const timeWidth = Math.ceil(tHi);

        // Separator width
        const sepHandle = prepare(SEPARATOR, WIRE_FONT);
        let sepLo = 0, sepHi = 60;
        for (let i = 0; i < 10; i++) {
          const mid = (sepLo + sepHi) / 2;
          if (layout(sepHandle, mid, 12).lineCount <= 1) sepHi = mid;
          else sepLo = mid;
        }
        const separatorWidth = Math.ceil(sepHi);

        const flagWidth = flag ? 16 : 0;
        const totalWidth = flagWidth + 4 + headlineWidth + 8 + sourceWidth + 6 + timeWidth + separatorWidth;

        const isNew = !prevIds.has(article.id);
        newTiles.push({
          article,
          headline,
          headlineWidth,
          source,
          sourceWidth,
          timeAgo,
          timeWidth,
          separatorWidth,
          totalWidth,
          sentimentColor: getSentimentColor(article.sentiment, article.sentiment_score),
          regionFlag: flag,
          flagWidth,
          x: xOffset,
          sonarStart: isNew ? now : 0,
        });
        xOffset += totalWidth;
      }

      tilesRef.current = newTiles;
      prevArticleIdsRef.current = new Set(articles.map(a => a.id));
      readyRef.current = true;
    });
  }, [articles]);

  // Mouse handlers
  const handleMouseMove = useCallback((mx: number) => {
    const tiles = tilesRef.current;
    const scroll = scrollRef.current;
    const cw = canvasWidthRef.current;
    if (!tiles.length || !cw) return;

    const totalWidth = tiles.reduce((s, t) => s + t.totalWidth, 0);
    let found = -1;

    for (let i = 0; i < tiles.length; i++) {
      let tileX = (tiles[i].x - scroll) % totalWidth;
      if (tileX < 0) tileX += totalWidth;
      // Wraparound: tile can appear at multiple positions
      for (let offset = -totalWidth; offset <= cw + totalWidth; offset += totalWidth) {
        const screenX = tileX + offset;
        if (mx >= screenX && mx < screenX + tiles[i].totalWidth) {
          found = i;
          break;
        }
      }
      if (found >= 0) break;
    }
    hoveredTileRef.current = found;
  }, []);

  const handleMouseDown = useCallback((_mx: number) => {
    const idx = hoveredTileRef.current;
    if (idx >= 0 && idx < tilesRef.current.length) {
      onSelect(tilesRef.current[idx].article);
    }
  }, [onSelect]);

  const handleMouseLeave = useCallback(() => {
    hoveredTileRef.current = -1;
  }, []);

  // Draw callback
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const tiles = tilesRef.current;
    if (!readyRef.current || tiles.length === 0) return;

    canvasWidthRef.current = width;

    const totalWidth = tiles.reduce((s, t) => s + t.totalWidth, 0);
    if (totalWidth === 0) return;

    // Advance scroll
    scrollRef.current = (scrollRef.current + SCROLL_SPEED) % totalWidth;

    const midY = height / 2;
    const now = Date.now();

    // Draw tiles in a continuous loop
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      let tileX = (tile.x - scrollRef.current) % totalWidth;
      if (tileX < 0) tileX += totalWidth;

      // Draw at potentially multiple positions for seamless wrapping
      for (let offset = -totalWidth; offset <= width + totalWidth; offset += totalWidth) {
        const sx = tileX + offset;
        if (sx + tile.totalWidth < -20 || sx > width + 20) continue;

        let cx = sx;
        const isHovered = hoveredTileRef.current === i;

        // Sonar pulse for new arrivals
        if (tile.sonarStart > 0) {
          const elapsed = now - tile.sonarStart;
          if (elapsed < SONAR_DURATION) {
            const progress = elapsed / SONAR_DURATION;
            drawSonarPulse(ctx, cx + tile.totalWidth / 2, midY, 30, progress, '#FBBF24');
          }
        }

        // Region flag
        if (tile.regionFlag) {
          ctx.font = '11px sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          ctx.fillText(tile.regionFlag, cx, midY);
          cx += tile.flagWidth + 4;
        }

        // Headline
        ctx.font = WIRE_FONT;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
        ctx.fillText(tile.headline, cx, midY);

        // Sentiment underline
        ctx.fillStyle = colorWithAlpha(tile.sentimentColor, isHovered ? 0.7 : 0.4);
        ctx.fillRect(cx, midY + 8, tile.headlineWidth, 1.5);
        cx += tile.headlineWidth + 8;

        // Source badge
        ctx.font = SOURCE_FONT;
        ctx.fillStyle = colorWithAlpha(tile.sentimentColor, 0.6);
        ctx.fillText(tile.source, cx, midY);
        cx += tile.sourceWidth + 6;

        // Time
        ctx.font = TIME_FONT;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(tile.timeAgo, cx, midY);
        cx += tile.timeWidth;

        // Separator
        ctx.font = WIRE_FONT;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillText(SEPARATOR, cx, midY);
      }
    }

    // Edge gradient fades
    const fadeW = width * GRADIENT_FADE;

    // Left fade
    const leftGrad = ctx.createLinearGradient(0, 0, fadeW, 0);
    leftGrad.addColorStop(0, 'rgba(13, 17, 23, 1)');
    leftGrad.addColorStop(1, 'rgba(13, 17, 23, 0)');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, fadeW, height);

    // Right fade
    const rightGrad = ctx.createLinearGradient(width - fadeW, 0, width, 0);
    rightGrad.addColorStop(0, 'rgba(13, 17, 23, 0)');
    rightGrad.addColorStop(1, 'rgba(13, 17, 23, 1)');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(width - fadeW, 0, fadeW, height);
  }, []);

  if (articles.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-semibold">
          Wire
        </span>
        <span className="text-[10px] text-white/20">{articles.length} breaking</span>
      </div>
      {/* Canvas ticker */}
      <div className="relative" style={{ height: isMobile ? 32 : 36 }}>
        <PretextCanvas
          draw={draw}
          fps={60}
          cursor={hoveredTileRef.current >= 0 ? 'pointer' : 'default'}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          fallback={
            <BreakingWire articles={articles} onSelect={onSelect} onDismiss={onDismiss} />
          }
        />
      </div>
    </div>
  );
}
