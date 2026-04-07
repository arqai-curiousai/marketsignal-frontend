'use client';

import { useRef, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import { colorWithAlpha } from '@/components/landing/pretext/canvasEffects';
import { useForexData } from '../ForexDataProvider';
import { FONT_TICKER, FONT_VALUE_SM, POSITIVE_COLOR, NEGATIVE_COLOR } from './canvasConstants';

interface Props {
  onSelectPair: (pair: string) => void;
}

interface TickerEntry {
  pair: string;
  price: number;
  changePct: number;
  sparkline: number[];
  labelWidth: number;
  priceStr: string;
  pctStr: string;
  totalWidth: number;
}

export function CanvasTickerStrip({ onSelectPair }: Props) {
  const isMobile = useMobileDetect();
  const { overview } = useForexData();
  const entriesRef = useRef<TickerEntry[]>([]);
  const scrollRef = useRef(0);
  const totalWidthRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef(-1);
  const builtForRef = useRef('');

  const buildEntries = useCallback(() => {
    const pairs = overview?.pairs ?? [];
    const key = pairs.map(p => `${p.ticker}:${p.price}`).join(',');
    if (key === builtForRef.current) return;
    builtForRef.current = key;

    const entries: TickerEntry[] = [];
    let total = 0;
    const gap = 32;
    const sparkW = 40;
    const padding = 16;

    for (const p of pairs) {
      const priceStr = p.price?.toFixed(p.price >= 100 ? 2 : 4) ?? '—';
      const pctStr = `${p.change_pct >= 0 ? '+' : ''}${p.change_pct.toFixed(2)}%`;

      // Measure text widths
      const pairHandle = prepare(p.ticker, FONT_TICKER);
      let pLo = 0, pHi = 200;
      for (let j = 0; j < 12; j++) {
        const mid = (pLo + pHi) / 2;
        if (layout(pairHandle, mid, 1).lineCount <= 1) pHi = mid;
        else pLo = mid;
      }
      const labelW = Math.ceil(pHi) + 2;

      const priceHandle = prepare(priceStr, FONT_VALUE_SM);
      let prLo = 0, prHi = 200;
      for (let j = 0; j < 12; j++) {
        const mid = (prLo + prHi) / 2;
        if (layout(priceHandle, mid, 1).lineCount <= 1) prHi = mid;
        else prLo = mid;
      }
      const priceW = Math.ceil(prHi) + 2;

      const pctHandle = prepare(pctStr, FONT_VALUE_SM);
      let pcLo = 0, pcHi = 200;
      for (let j = 0; j < 12; j++) {
        const mid = (pcLo + pcHi) / 2;
        if (layout(pctHandle, mid, 1).lineCount <= 1) pcHi = mid;
        else pcLo = mid;
      }
      const pctW = Math.ceil(pcHi) + 2;

      const entryW = labelW + 8 + priceW + 6 + pctW + 10 + sparkW + gap;
      entries.push({
        pair: p.ticker,
        price: p.price,
        changePct: p.change_pct,
        sparkline: p.sparkline ?? [],
        labelWidth: labelW,
        priceStr,
        pctStr,
        totalWidth: entryW,
      });
      total += entryW;
    }

    entriesRef.current = entries;
    totalWidthRef.current = total;
  }, [overview]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      buildEntries();
      const entries = entriesRef.current;
      if (entries.length === 0) return;

      const totalW = totalWidthRef.current;
      if (totalW === 0) return;

      // Scroll speed — slow on hover
      const isHovering = mouseRef.current !== null;
      const speed = isHovering ? 0.15 : 0.5;
      scrollRef.current = (scrollRef.current + speed) % totalW;

      const cy = h / 2;
      const sparkH = 14;

      // Determine hovered entry
      hoveredRef.current = -1;
      const mouse = mouseRef.current;

      // Draw entries (wrapping)
      let x = -scrollRef.current;
      // We need to draw enough to fill the viewport plus one full cycle
      const drawCycles = Math.ceil(w / totalW) + 2;

      for (let cycle = 0; cycle < drawCycles; cycle++) {
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          const ex = x;

          // Check if visible
          if (ex + e.totalWidth > 0 && ex < w) {
            // Check hover
            if (mouse && mouse.x >= ex && mouse.x < ex + e.totalWidth) {
              hoveredRef.current = i;
            }

            const isHovered = hoveredRef.current === i;
            let drawX = ex;

            // Pair code
            ctx.font = FONT_TICKER;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(e.pair, drawX, cy);
            drawX += e.labelWidth + 8;

            // Price
            ctx.font = FONT_VALUE_SM;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillText(e.priceStr, drawX, cy);
            drawX += ctx.measureText(e.priceStr).width + 6;

            // Change %
            const pctColor = e.changePct >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;
            ctx.fillStyle = colorWithAlpha(pctColor, isHovered ? 0.9 : 0.6);
            ctx.fillText(e.pctStr, drawX, cy);
            drawX += ctx.measureText(e.pctStr).width + 10;

            // Sparkline
            if (e.sparkline.length > 1) {
              const sparkW = 40;
              const points = e.sparkline;
              const min = Math.min(...points);
              const max = Math.max(...points);
              const range = max - min || 1;

              ctx.beginPath();
              for (let j = 0; j < points.length; j++) {
                const sx = drawX + (j / (points.length - 1)) * sparkW;
                const sy = cy + sparkH / 2 - ((points[j] - min) / range) * sparkH;
                if (j === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
              }
              ctx.strokeStyle = colorWithAlpha(pctColor, isHovered ? 0.6 : 0.25);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          x += e.totalWidth;
        }
      }
    },
    [buildEntries],
  );

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = -1;
  }, []);

  const handleMouseUp = useCallback((x: number, y: number) => {
    const idx = hoveredRef.current;
    if (idx >= 0 && idx < entriesRef.current.length) {
      onSelectPair(entriesRef.current[idx].pair);
    }
  }, [onSelectPair]);

  return (
    <div className="h-10 rounded-lg border border-white/[0.04] bg-white/[0.02] overflow-hidden relative">
      <PretextCanvas
        draw={draw}
        fallback={null}
        fps={isMobile ? 30 : 60}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        cursor="pointer"
      />
    </div>
  );
}
