'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawGlowingNode,
} from '../pretext/canvasEffects';
import { drawTextGlow } from '../pretext/textRenderer';

/* ── Shared constants ── */
const EMERALD = 'rgba(110, 231, 183, 1)';
const RED = 'rgba(248, 113, 113, 1)';
const BLUE = 'rgba(96, 165, 250, 1)';
const AMBER = 'rgba(251, 191, 36, 1)';
const WHITE = 'rgba(255, 255, 255, 1)';
const SORA = (size: number, weight = 600) =>
  `${weight} ${size}px Sora, system-ui, sans-serif`;
const INTER = (size: number, weight = 400) =>
  `${weight} ${size}px Inter, system-ui, sans-serif`;

/* ── Heatmap mini data ── */
const HEATMAP_PAIRS = [
  ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'NZD/USD', 'USD/CAD'],
  ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF', 'USD/CHF'],
  ['EUR/AUD', 'GBP/AUD', 'AUD/NZD', 'CAD/JPY', 'NZD/JPY', 'CHF/JPY'],
  ['USD/INR', 'EUR/INR', 'USD/SGD', 'USD/CNH', 'USD/MXN', 'USD/ZAR'],
  ['EUR/CAD', 'GBP/CAD', 'EUR/NZD', 'GBP/NZD', 'AUD/CAD', 'NZD/CAD'],
  ['USD/NOK', 'USD/SEK', 'EUR/NOK', 'EUR/SEK', 'USD/TRY', 'EUR/TRY'],
  ['GBP/CHF', 'AUD/CHF', 'NZD/CHF', 'CAD/CHF', 'GBP/ZAR', 'EUR/ZAR'],
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/* ── Strength currencies ── */
const STRENGTH_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
const BASE_STRENGTHS = [0.78, 0.65, 0.58, 0.42, 0.55, 0.38, 0.48, 0.62];

/* ── Technicals data (candlestick bars) ── */
const CANDLE_COUNT = 22;

/* ── Sessions data ── */
const SESSIONS_DATA = [
  { label: 'TOKYO', time: '09:30', tz: 'JST', open: true, color: EMERALD },
  { label: 'LONDON', time: '14:30', tz: 'GMT', open: true, color: BLUE },
  { label: 'NEW YORK', time: '09:30', tz: 'EST', open: false, color: AMBER },
];

/* ── Tooltip state ── */
interface TooltipState {
  x: number;
  y: number;
  text: string;
  sub?: string;
}

export type ForexModuleType = 'heatmap' | 'strength' | 'technicals' | 'sessions';

interface ForexModuleCanvasProps {
  type: ForexModuleType;
  className?: string;
}

export function ForexModuleCanvas({ type, className }: ForexModuleCanvasProps) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const tooltipRef = useRef<TooltipState | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    tooltipRef.current = null;
  }, []);

  /* ── Draw: Heatmap ── */
  const drawHeatmap = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const cols = 6;
      const rows = 7;
      const padX = w * 0.06;
      const padY = h * 0.06;
      const cellW = (w - padX * 2) / cols;
      const cellH = (h - padY * 2) / rows;
      const gap = 2;
      const fontSize = Math.max(7, Math.min(10, cellW * 0.18));

      tooltipRef.current = null;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pair = HEATMAP_PAIRS[r]?.[c];
          if (!pair) continue;

          const cx = padX + c * cellW + cellW / 2;
          const cy = padY + r * cellH + cellH / 2;
          const hw = cellW / 2 - gap;
          const hh = cellH / 2 - gap;

          // Animated value based on time
          const seed = r * cols + c;
          const change = (seededRandom(seed + 1) - 0.5) * 4 +
            Math.sin(time * 0.001 + seed * 0.7) * 0.8;
          const pct = change;

          // Color based on change
          const intensity = Math.min(1, Math.abs(pct) / 2.5);
          const baseColor = pct >= 0 ? EMERALD : RED;
          const bgAlpha = 0.06 + intensity * 0.14;

          // Pulse effect
          const pulse = 1 + Math.sin(time * 0.003 + seed * 0.5) * 0.02;

          // Draw cell background
          ctx.save();
          ctx.fillStyle = colorWithAlpha(baseColor, bgAlpha * pulse);
          ctx.beginPath();
          ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, 3);
          ctx.fill();

          // Border
          ctx.strokeStyle = colorWithAlpha(baseColor, 0.08 + intensity * 0.06);
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Pair label
          ctx.font = SORA(fontSize, 500);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(WHITE, 0.35 + intensity * 0.25);
          ctx.fillText(pair.replace('/', ''), cx, cy - hh * 0.2);

          // Change value
          ctx.font = SORA(fontSize * 0.85);
          ctx.fillStyle = colorWithAlpha(baseColor, 0.5 + intensity * 0.3);
          ctx.fillText(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, cx, cy + hh * 0.35);
          ctx.restore();

          // Hover detection
          if (mouse && Math.abs(mouse.x - cx) < hw && Math.abs(mouse.y - cy) < hh) {
            // Highlight border
            ctx.save();
            ctx.strokeStyle = colorWithAlpha(baseColor, 0.5);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, 3);
            ctx.stroke();
            ctx.restore();

            tooltipRef.current = {
              x: cx,
              y: cy - hh - 8,
              text: pair,
              sub: `${pct >= 0 ? '+' : ''}${pct.toFixed(3)}% | Vol: ${(seededRandom(seed + 99) * 2 + 0.5).toFixed(1)}M`,
            };
          }
        }
      }

      // Draw tooltip
      drawTooltip(ctx, tooltipRef.current, w);
    },
    [],
  );

  /* ── Draw: Strength ── */
  const drawStrength = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padX = w * 0.08;
      const padY = h * 0.08;
      const barH = (h - padY * 2) / STRENGTH_CURRENCIES.length - 4;
      const maxBarW = w - padX * 2 - 55;

      tooltipRef.current = null;

      STRENGTH_CURRENCIES.forEach((currency, i) => {
        const y = padY + i * (barH + 4) + barH / 2;
        const baseStrength = BASE_STRENGTHS[i];
        const animated = baseStrength + Math.sin(time * 0.0008 + i * 1.3) * 0.08;
        const strength = Math.max(0, Math.min(1, animated));
        const barW = strength * maxBarW;

        // Determine color
        const color = strength > 0.6 ? EMERALD : strength < 0.4 ? RED : AMBER;
        const fontSize = Math.max(8, Math.min(11, barH * 0.7));

        // Currency label
        ctx.save();
        ctx.font = SORA(fontSize, 600);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(WHITE, 0.5);
        ctx.fillText(currency, padX + 40, y);

        // Bar background
        const barX = padX + 50;
        ctx.fillStyle = colorWithAlpha(WHITE, 0.03);
        ctx.beginPath();
        ctx.roundRect(barX, y - barH / 2, maxBarW, barH, 3);
        ctx.fill();

        // Animated bar
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, colorWithAlpha(color, 0.15));
        grad.addColorStop(1, colorWithAlpha(color, 0.35));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, y - barH / 2, barW, barH, 3);
        ctx.fill();

        // Glow at tip
        const tipX = barX + barW;
        const tipGrad = ctx.createRadialGradient(tipX, y, 0, tipX, y, barH);
        tipGrad.addColorStop(0, colorWithAlpha(color, 0.3));
        tipGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = tipGrad;
        ctx.beginPath();
        ctx.arc(tipX, y, barH, 0, Math.PI * 2);
        ctx.fill();

        // Score label
        ctx.font = SORA(fontSize * 0.85);
        ctx.textAlign = 'left';
        ctx.fillStyle = colorWithAlpha(color, 0.7);
        ctx.fillText((strength * 100).toFixed(0), tipX + 6, y);
        ctx.restore();

        // Hover detection
        if (mouse && mouse.y > y - barH / 2 && mouse.y < y + barH / 2 &&
            mouse.x > barX && mouse.x < barX + maxBarW) {
          ctx.save();
          ctx.strokeStyle = colorWithAlpha(color, 0.4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(barX, y - barH / 2, maxBarW, barH, 3);
          ctx.stroke();
          ctx.restore();

          tooltipRef.current = {
            x: mouse.x,
            y: y - barH / 2 - 8,
            text: `${currency} Strength: ${(strength * 100).toFixed(1)}`,
            sub: `Rank: ${i + 1}/8 | Trend: ${strength > 0.55 ? 'Bullish' : strength < 0.45 ? 'Bearish' : 'Neutral'}`,
          };
        }
      });

      drawTooltip(ctx, tooltipRef.current, w);
    },
    [],
  );

  /* ── Draw: Technicals (candlesticks + indicators) ── */
  const drawTechnicals = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padX = w * 0.06;
      const padY = h * 0.08;
      const chartH = (h - padY * 2) * 0.65;
      const indicatorH = (h - padY * 2) * 0.28;
      const indicatorY = padY + chartH + 12;
      const candleW = (w - padX * 2) / CANDLE_COUNT;

      tooltipRef.current = null;

      // Generate candle data
      let price = 1.0842;
      const candles: { o: number; h: number; l: number; c: number; rsi: number }[] = [];
      for (let i = 0; i < CANDLE_COUNT; i++) {
        const change = (seededRandom(i * 3 + 1) - 0.48) * 0.006;
        const volatility = 0.002 + seededRandom(i * 3 + 2) * 0.004;
        const o = price;
        const c = price + change;
        const highExtra = volatility * seededRandom(i * 3 + 3);
        const lowExtra = volatility * seededRandom(i * 3 + 4);
        const hi = Math.max(o, c) + highExtra;
        const lo = Math.min(o, c) - lowExtra;
        // Animate slight drift
        const drift = Math.sin(time * 0.0005 + i * 0.4) * 0.0005;
        candles.push({
          o: o + drift,
          h: hi + drift,
          l: lo + drift,
          c: c + drift,
          rsi: 30 + seededRandom(i * 7) * 50 + Math.sin(time * 0.001 + i * 0.3) * 5,
        });
        price = c;
      }

      // Price range
      const allPrices = candles.flatMap((c) => [c.h, c.l]);
      const minP = Math.min(...allPrices);
      const maxP = Math.max(...allPrices);
      const range = maxP - minP || 0.01;

      const toY = (p: number) => padY + chartH - ((p - minP) / range) * chartH;

      // Moving average line
      ctx.save();
      ctx.strokeStyle = colorWithAlpha(BLUE, 0.4);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const maWindow = 5;
      for (let i = maWindow - 1; i < CANDLE_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < maWindow; j++) sum += candles[i - j].c;
        const ma = sum / maWindow;
        const x = padX + i * candleW + candleW / 2;
        if (i === maWindow - 1) ctx.moveTo(x, toY(ma));
        else ctx.lineTo(x, toY(ma));
      }
      ctx.stroke();
      ctx.restore();

      // Candlesticks
      candles.forEach((candle, i) => {
        const x = padX + i * candleW + candleW / 2;
        const bodyW = candleW * 0.55;
        const isBull = candle.c >= candle.o;
        const color = isBull ? EMERALD : RED;

        // Wick
        ctx.save();
        ctx.strokeStyle = colorWithAlpha(color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, toY(candle.h));
        ctx.lineTo(x, toY(candle.l));
        ctx.stroke();

        // Body
        const top = toY(Math.max(candle.o, candle.c));
        const bottom = toY(Math.min(candle.o, candle.c));
        const bodyH = Math.max(1, bottom - top);
        ctx.fillStyle = colorWithAlpha(color, 0.4);
        ctx.fillRect(x - bodyW / 2, top, bodyW, bodyH);

        // Glow for recent candles
        if (i >= CANDLE_COUNT - 3) {
          ctx.shadowColor = colorWithAlpha(color, 0.3);
          ctx.shadowBlur = 6;
          ctx.fillRect(x - bodyW / 2, top, bodyW, bodyH);
          ctx.shadowBlur = 0;
        }
        ctx.restore();

        // Hover detection
        if (mouse && Math.abs(mouse.x - x) < candleW / 2 && mouse.y > padY && mouse.y < padY + chartH) {
          // Crosshair
          ctx.save();
          ctx.strokeStyle = colorWithAlpha(WHITE, 0.1);
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, padY);
          ctx.lineTo(x, padY + chartH);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(padX, mouse.y);
          ctx.lineTo(w - padX, mouse.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          tooltipRef.current = {
            x,
            y: padY - 8,
            text: `O: ${candle.o.toFixed(4)}  H: ${candle.h.toFixed(4)}`,
            sub: `L: ${candle.l.toFixed(4)}  C: ${candle.c.toFixed(4)} | RSI: ${candle.rsi.toFixed(1)}`,
          };
        }
      });

      // RSI indicator at bottom
      ctx.save();
      // RSI zone background
      ctx.fillStyle = colorWithAlpha(WHITE, 0.02);
      ctx.fillRect(padX, indicatorY, w - padX * 2, indicatorH);

      // Overbought/oversold lines
      const rsiToY = (rsi: number) => indicatorY + indicatorH - (rsi / 100) * indicatorH;
      ctx.strokeStyle = colorWithAlpha(RED, 0.15);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padX, rsiToY(70));
      ctx.lineTo(w - padX, rsiToY(70));
      ctx.stroke();
      ctx.strokeStyle = colorWithAlpha(EMERALD, 0.15);
      ctx.beginPath();
      ctx.moveTo(padX, rsiToY(30));
      ctx.lineTo(w - padX, rsiToY(30));
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI label
      ctx.font = SORA(7, 500);
      ctx.textAlign = 'left';
      ctx.fillStyle = colorWithAlpha(WHITE, 0.25);
      ctx.fillText('RSI(14)', padX + 4, indicatorY + 10);

      // RSI line
      ctx.strokeStyle = colorWithAlpha(AMBER, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      candles.forEach((candle, i) => {
        const x = padX + i * candleW + candleW / 2;
        const y = rsiToY(candle.rsi);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      drawTooltip(ctx, tooltipRef.current, w);
    },
    [],
  );

  /* ── Draw: Sessions ── */
  const drawSessions = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padX = w * 0.08;
      const padY = h * 0.1;
      const sessionH = (h - padY * 2) / 3;
      const clockRadius = Math.min(sessionH * 0.35, w * 0.08);

      tooltipRef.current = null;

      // Session timeline bar at bottom
      const barY = h - padY * 0.6;
      const barH = 4;
      ctx.save();
      ctx.fillStyle = colorWithAlpha(WHITE, 0.03);
      ctx.beginPath();
      ctx.roundRect(padX, barY - barH / 2, w - padX * 2, barH, 2);
      ctx.fill();

      // Session overlap regions
      const overlaps = [
        { start: 0.29, end: 0.375, color: `${EMERALD}` }, // Asia-London overlap
        { start: 0.5, end: 0.625, color: `${AMBER}` }, // London-NY overlap
      ];
      overlaps.forEach((ov) => {
        const x1 = padX + ov.start * (w - padX * 2);
        const x2 = padX + ov.end * (w - padX * 2);
        ctx.fillStyle = colorWithAlpha(ov.color, 0.15 + Math.sin(time * 0.002) * 0.05);
        ctx.beginPath();
        ctx.roundRect(x1, barY - barH, x2 - x1, barH * 2, 2);
        ctx.fill();
      });
      ctx.restore();

      SESSIONS_DATA.forEach((session, i) => {
        const cx = padX + (i + 0.5) * ((w - padX * 2) / 3);
        const cy = padY + i * sessionH + sessionH * 0.45;

        // Animate open status
        const isOpen = session.open || (Math.sin(time * 0.0003 + i * 2) > 0.3);
        const alpha = isOpen ? 0.8 : 0.25;
        const statusDot = isOpen ? EMERALD : colorWithAlpha(WHITE, 0.2);

        // Glowing circle for clock
        if (isOpen) {
          drawGlowingNode(ctx, cx, cy, clockRadius, session.color, 0.4, time * 0.002 + i);
        } else {
          ctx.save();
          ctx.strokeStyle = colorWithAlpha(session.color, 0.1);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, clockRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Clock hands (animated)
        const minuteAngle = (time * 0.001 + i * 2.1) % (Math.PI * 2);
        const hourAngle = minuteAngle / 12;
        ctx.save();
        ctx.strokeStyle = colorWithAlpha(session.color, alpha * 0.6);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(hourAngle - Math.PI / 2) * clockRadius * 0.5,
          cy + Math.sin(hourAngle - Math.PI / 2) * clockRadius * 0.5,
        );
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(minuteAngle - Math.PI / 2) * clockRadius * 0.75,
          cy + Math.sin(minuteAngle - Math.PI / 2) * clockRadius * 0.75,
        );
        ctx.stroke();
        ctx.restore();

        // Session label
        const fontSize = Math.max(8, Math.min(12, w * 0.035));
        ctx.save();
        ctx.font = SORA(fontSize, 600);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = colorWithAlpha(session.color, alpha);
        drawTextGlow(ctx, session.label, cx, cy + clockRadius + 8, session.color, isOpen ? 8 : 0);
        ctx.font = SORA(fontSize, 600);
        ctx.fillStyle = colorWithAlpha(session.color, alpha);
        ctx.fillText(session.label, cx, cy + clockRadius + 8);

        // Time
        ctx.font = SORA(fontSize * 0.8);
        ctx.fillStyle = colorWithAlpha(WHITE, alpha * 0.5);
        ctx.fillText(`${session.time} ${session.tz}`, cx, cy + clockRadius + 8 + fontSize + 4);

        // Status dot
        ctx.fillStyle = statusDot;
        ctx.beginPath();
        ctx.arc(cx + clockRadius + 8, cy - clockRadius + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        if (isOpen) {
          ctx.fillStyle = colorWithAlpha(EMERALD, 0.2 + Math.sin(time * 0.004) * 0.1);
          ctx.beginPath();
          ctx.arc(cx + clockRadius + 8, cy - clockRadius + 4, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Hover detection
        if (mouse) {
          const d = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
          if (d < clockRadius + 20) {
            tooltipRef.current = {
              x: cx,
              y: cy - clockRadius - 16,
              text: `${session.label} Session`,
              sub: `${isOpen ? 'OPEN' : 'CLOSED'} | ${session.time} ${session.tz} | ${isOpen ? 'Active pairs: 14' : 'Resumes in 4h'}`,
            };
          }
        }
      });

      drawTooltip(ctx, tooltipRef.current, w);
    },
    [],
  );

  /* ── Shared tooltip renderer ── */
  function drawTooltip(
    ctx: CanvasRenderingContext2D,
    tooltip: TooltipState | null,
    maxW: number,
  ) {
    if (!tooltip) return;
    ctx.save();

    const padH = 8;
    const padV = 5;
    ctx.font = SORA(9, 600);
    const textW = ctx.measureText(tooltip.text).width;
    let subW = 0;
    if (tooltip.sub) {
      ctx.font = INTER(8);
      subW = ctx.measureText(tooltip.sub).width;
    }
    const boxW = Math.max(textW, subW) + padH * 2;
    const boxH = tooltip.sub ? 30 : 20;
    let tx = tooltip.x - boxW / 2;
    const ty = tooltip.y - boxH - 4;

    // Clamp to viewport
    if (tx < 4) tx = 4;
    if (tx + boxW > maxW - 4) tx = maxW - 4 - boxW;

    // Background
    ctx.fillStyle = 'rgba(10, 12, 18, 0.92)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, boxW, boxH, 5);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(BLUE, 0.2);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Text
    ctx.font = SORA(9, 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = colorWithAlpha(WHITE, 0.85);
    ctx.fillText(tooltip.text, tx + boxW / 2, ty + padV);

    if (tooltip.sub) {
      ctx.font = INTER(8);
      ctx.fillStyle = colorWithAlpha(WHITE, 0.45);
      ctx.fillText(tooltip.sub, tx + boxW / 2, ty + padV + 13);
    }
    ctx.restore();
  }

  const drawFn = type === 'heatmap' ? drawHeatmap
    : type === 'strength' ? drawStrength
    : type === 'technicals' ? drawTechnicals
    : drawSessions;

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <PretextCanvas
        draw={drawFn}
        fps={isMobile ? 30 : 60}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
            {type}
          </div>
        }
      />
    </div>
  );
}
