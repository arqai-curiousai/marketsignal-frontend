'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawSonarPulse,
} from '../pretext/canvasEffects';

/* ── Colors ── */
const EMERALD = 'rgba(110, 231, 183, 1)';
const RED = 'rgba(248, 113, 113, 1)';
const BLUE = 'rgba(96, 165, 250, 1)';
const AMBER = 'rgba(251, 191, 36, 1)';
const WHITE = 'rgba(255, 255, 255, 1)';

const SORA = (size: number, weight = 600) =>
  `${weight} ${size}px Sora, system-ui, sans-serif`;
const INTER = (size: number, weight = 400) =>
  `${weight} ${size}px Inter, system-ui, sans-serif`;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/* ── Full heatmap data (8x7) ── */
const FULL_PAIRS = [
  ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'NZD/USD', 'USD/CAD', 'USD/CHF', 'EUR/GBP'],
  ['EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF', 'EUR/AUD', 'GBP/AUD', 'AUD/NZD', 'CAD/JPY'],
  ['NZD/JPY', 'CHF/JPY', 'USD/INR', 'EUR/INR', 'USD/SGD', 'USD/CNH', 'USD/MXN', 'USD/ZAR'],
  ['EUR/CAD', 'GBP/CAD', 'EUR/NZD', 'GBP/NZD', 'AUD/CAD', 'NZD/CAD', 'AUD/CHF', 'NZD/CHF'],
  ['USD/NOK', 'USD/SEK', 'EUR/NOK', 'EUR/SEK', 'USD/TRY', 'EUR/TRY', 'GBP/CHF', 'CAD/CHF'],
  ['GBP/ZAR', 'EUR/ZAR', 'GBP/NZD', 'EUR/AUD', 'AUD/CAD', 'NZD/CAD', 'CHF/JPY', 'CAD/CHF'],
];

/* ── Full currencies (17) ── */
const ALL_CURRENCIES = [
  { code: 'USD', rate: '5.25%', trend: 'stable' },
  { code: 'EUR', rate: '4.50%', trend: 'stable' },
  { code: 'GBP', rate: '5.00%', trend: 'up' },
  { code: 'JPY', rate: '0.10%', trend: 'up' },
  { code: 'CHF', rate: '1.75%', trend: 'down' },
  { code: 'AUD', rate: '4.35%', trend: 'stable' },
  { code: 'NZD', rate: '5.50%', trend: 'down' },
  { code: 'CAD', rate: '4.50%', trend: 'down' },
  { code: 'INR', rate: '6.50%', trend: 'stable' },
  { code: 'SGD', rate: '3.50%', trend: 'stable' },
  { code: 'CNH', rate: '3.45%', trend: 'down' },
  { code: 'MXN', rate: '11.0%', trend: 'down' },
  { code: 'ZAR', rate: '8.25%', trend: 'stable' },
  { code: 'TRY', rate: '50.0%', trend: 'up' },
  { code: 'NOK', rate: '4.50%', trend: 'stable' },
  { code: 'SEK', rate: '3.75%', trend: 'down' },
  { code: 'HKD', rate: '5.25%', trend: 'stable' },
];
const BASE_STR = [0.82, 0.62, 0.58, 0.35, 0.64, 0.52, 0.38, 0.48, 0.44, 0.55, 0.40, 0.30, 0.28, 0.15, 0.46, 0.42, 0.50];

/* ── Tooltip state ── */
interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

export type ForexShowcaseType = 'heatmap' | 'strength' | 'technicals';

interface ForexShowcaseCanvasProps {
  type: ForexShowcaseType;
  className?: string;
}

export function ForexShowcaseCanvas({ type, className }: ForexShowcaseCanvasProps) {
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

  /* ── Shared tooltip renderer ── */
  const drawTooltip = useCallback(
    (ctx: CanvasRenderingContext2D, tooltip: TooltipState | null, maxW: number) => {
      if (!tooltip) return;
      ctx.save();
      const padH = 10;
      const padV = 7;
      const lineH = 14;

      ctx.font = SORA(9, 600);
      let boxW = 0;
      tooltip.lines.forEach((line) => {
        const w = ctx.measureText(line).width;
        if (w > boxW) boxW = w;
      });
      boxW += padH * 2;
      const boxH = padV * 2 + tooltip.lines.length * lineH;

      let tx = tooltip.x - boxW / 2;
      let ty = tooltip.y - boxH - 6;
      if (tx < 4) tx = 4;
      if (tx + boxW > maxW - 4) tx = maxW - 4 - boxW;
      if (ty < 4) ty = tooltip.y + 20;

      ctx.fillStyle = 'rgba(10, 12, 18, 0.94)';
      ctx.beginPath();
      ctx.roundRect(tx, ty, boxW, boxH, 6);
      ctx.fill();
      ctx.strokeStyle = colorWithAlpha(BLUE, 0.25);
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      tooltip.lines.forEach((line, i) => {
        ctx.font = i === 0 ? SORA(9, 600) : INTER(8);
        ctx.fillStyle = i === 0 ? colorWithAlpha(WHITE, 0.9) : colorWithAlpha(WHITE, 0.45);
        ctx.fillText(line, tx + boxW / 2, ty + padV + i * lineH);
      });
      ctx.restore();
    },
    [],
  );

  /* ── Draw: Heatmap (large) ── */
  const drawHeatmap = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const cols = isMobile ? 6 : 8;
      const rows = 6;
      const padX = w * 0.04;
      const padY = h * 0.05;
      const cellW = (w - padX * 2) / cols;
      const cellH = (h - padY * 2 - 25) / rows;
      const gap = 2;
      const fontSize = Math.max(7, Math.min(11, cellW * 0.16));

      tooltipRef.current = null;

      // Title bar
      ctx.save();
      ctx.font = SORA(10, 600);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colorWithAlpha(WHITE, 0.35);
      ctx.fillText('FOREX HEATMAP', padX, padY - 2);

      // Live indicator
      const pulseAlpha = 0.4 + Math.sin(time * 0.004) * 0.3;
      ctx.fillStyle = colorWithAlpha(EMERALD, pulseAlpha);
      ctx.beginPath();
      ctx.arc(padX + ctx.measureText('FOREX HEATMAP').width + 12, padY + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = SORA(8);
      ctx.fillStyle = colorWithAlpha(EMERALD, 0.4);
      ctx.fillText('LIVE', padX + ctx.measureText('FOREX HEATMAP').width + 20, padY);

      // Timeframe pills
      const tfs = ['1H', '4H', '1D', '1W'];
      const activeTf = Math.floor((time / 5000) % 4);
      let pillX = w - padX;
      ctx.textAlign = 'right';
      for (let i = tfs.length - 1; i >= 0; i--) {
        ctx.font = SORA(8, 500);
        const tw = ctx.measureText(tfs[i]).width + 12;
        const isActive = i === activeTf;
        if (isActive) {
          ctx.fillStyle = colorWithAlpha(BLUE, 0.15);
          ctx.beginPath();
          ctx.roundRect(pillX - tw, padY - 3, tw, 16, 4);
          ctx.fill();
        }
        ctx.fillStyle = isActive ? colorWithAlpha(BLUE, 0.8) : colorWithAlpha(WHITE, 0.25);
        ctx.textAlign = 'center';
        ctx.fillText(tfs[i], pillX - tw / 2, padY);
        pillX -= tw + 4;
      }
      ctx.restore();

      const gridTop = padY + 20;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pair = FULL_PAIRS[r]?.[c];
          if (!pair) continue;

          const cx = padX + c * cellW + cellW / 2;
          const cy = gridTop + r * cellH + cellH / 2;
          const hw = cellW / 2 - gap;
          const hh = cellH / 2 - gap;

          const seed = r * cols + c;
          const baseChange = (seededRandom(seed + 1) - 0.5) * 4;
          const change = baseChange + Math.sin(time * 0.0008 + seed * 0.7) * 0.6;
          const intensity = Math.min(1, Math.abs(change) / 3);
          const baseColor = change >= 0 ? EMERALD : RED;
          const bgAlpha = 0.05 + intensity * 0.18;
          const pulse = 1 + Math.sin(time * 0.003 + seed * 0.5) * 0.015;

          // Cell background
          ctx.save();
          ctx.fillStyle = colorWithAlpha(baseColor, bgAlpha * pulse);
          ctx.beginPath();
          ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, 4);
          ctx.fill();

          ctx.strokeStyle = colorWithAlpha(baseColor, 0.06 + intensity * 0.08);
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Pair label
          ctx.font = SORA(fontSize, 500);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(WHITE, 0.3 + intensity * 0.3);
          ctx.fillText(pair.replace('/', ''), cx, cy - hh * 0.2);

          // Value
          ctx.font = SORA(fontSize * 0.85);
          ctx.fillStyle = colorWithAlpha(baseColor, 0.5 + intensity * 0.35);
          ctx.fillText(`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`, cx, cy + hh * 0.35);
          ctx.restore();

          // Hover
          if (mouse && Math.abs(mouse.x - cx) < hw && Math.abs(mouse.y - cy) < hh) {
            ctx.save();
            ctx.strokeStyle = colorWithAlpha(baseColor, 0.6);
            ctx.lineWidth = 1.5;
            ctx.shadowColor = colorWithAlpha(baseColor, 0.3);
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, 4);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            const price = 1.0 + seededRandom(seed + 50) * 0.5;
            tooltipRef.current = {
              x: cx,
              y: cy - hh,
              lines: [
                pair,
                `Change: ${change >= 0 ? '+' : ''}${change.toFixed(3)}%`,
                `Price: ${price.toFixed(4)} | Vol: ${(seededRandom(seed + 99) * 3 + 0.5).toFixed(1)}M`,
                `Session: ${seed % 3 === 0 ? 'London' : seed % 3 === 1 ? 'Asia' : 'New York'}`,
              ],
            };
          }
        }
      }

      drawTooltip(ctx, tooltipRef.current, w);
    },
    [isMobile, drawTooltip],
  );

  /* ── Draw: Strength (full 17 currencies + sparklines) ── */
  const drawStrength = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const count = isMobile ? 10 : 17;
      const currencies = ALL_CURRENCIES.slice(0, count);
      const padX = w * 0.04;
      const padY = h * 0.07;
      const barH = Math.min(22, (h - padY * 2) / count - 3);
      const labelW = 42;
      const maxBarW = w - padX * 2 - labelW - 60;
      const sparkW = 40;

      tooltipRef.current = null;

      // Title
      ctx.save();
      ctx.font = SORA(10, 600);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colorWithAlpha(WHITE, 0.35);
      ctx.fillText('CURRENCY STRENGTH INDEX', padX, padY - 16);
      ctx.restore();

      currencies.forEach((cur, i) => {
        const y = padY + i * (barH + 3) + barH / 2;
        const baseStr = BASE_STR[i];
        const animated = baseStr + Math.sin(time * 0.0006 + i * 1.1) * 0.06;
        const strength = Math.max(0, Math.min(1, animated));
        const barW = strength * maxBarW;

        const color = strength > 0.6 ? EMERALD : strength < 0.35 ? RED : AMBER;
        const fontSize = Math.max(8, Math.min(10, barH * 0.6));
        const barX = padX + labelW;

        // Currency label
        ctx.save();
        ctx.font = SORA(fontSize, 700);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(color, 0.6);
        ctx.fillText(cur.code, padX + labelW - 6, y);

        // Bar track
        ctx.fillStyle = colorWithAlpha(WHITE, 0.025);
        ctx.beginPath();
        ctx.roundRect(barX, y - barH / 2, maxBarW, barH, 3);
        ctx.fill();

        // Animated bar with gradient
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, colorWithAlpha(color, 0.08));
        grad.addColorStop(0.7, colorWithAlpha(color, 0.25));
        grad.addColorStop(1, colorWithAlpha(color, 0.4));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, y - barH / 2, barW, barH, 3);
        ctx.fill();

        // Tip glow
        const tipX = barX + barW;
        const tipGrad = ctx.createRadialGradient(tipX, y, 0, tipX, y, barH * 0.8);
        tipGrad.addColorStop(0, colorWithAlpha(color, 0.35));
        tipGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = tipGrad;
        ctx.beginPath();
        ctx.arc(tipX, y, barH * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Score
        ctx.font = SORA(fontSize * 0.85, 700);
        ctx.textAlign = 'left';
        ctx.fillStyle = colorWithAlpha(color, 0.75);
        ctx.fillText((strength * 100).toFixed(0), tipX + 5, y);

        // Mini sparkline (right side)
        const sparkX = w - padX - sparkW;
        ctx.strokeStyle = colorWithAlpha(color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let s = 0; s < 12; s++) {
          const sx = sparkX + (s / 11) * sparkW;
          const sv = baseStr + Math.sin((time * 0.0003) + i * 0.7 + s * 0.5) * 0.1;
          const sy = y - barH * 0.3 + (1 - sv) * barH * 0.6;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();

        // Hover
        if (mouse && mouse.y > y - barH / 2 && mouse.y < y + barH / 2) {
          ctx.save();
          ctx.fillStyle = colorWithAlpha(color, 0.04);
          ctx.fillRect(padX, y - barH / 2, w - padX * 2, barH);
          ctx.restore();

          tooltipRef.current = {
            x: mouse.x,
            y: y - barH / 2,
            lines: [
              `${cur.code} - Strength: ${(strength * 100).toFixed(1)}`,
              `Central Bank Rate: ${cur.rate}`,
              `Trend: ${cur.trend === 'up' ? 'Strengthening' : cur.trend === 'down' ? 'Weakening' : 'Range-bound'}`,
              `Carry: ${cur.rate} (${strength > 0.5 ? 'Attractive' : 'Unattractive'})`,
            ],
          };
        }
      });

      drawTooltip(ctx, tooltipRef.current, w);
    },
    [isMobile, drawTooltip],
  );

  /* ── Draw: Technicals (multi-timeframe chart with indicators) ── */
  const drawTechnicals = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padX = w * 0.04;
      const padY = h * 0.06;
      const tfCount = isMobile ? 2 : 3;
      const tfLabels = ['5M', '1H', 'DAILY'];
      const rowH = (h - padY * 2 - 20) / tfCount;
      const candleCount = isMobile ? 18 : 28;

      tooltipRef.current = null;

      // Title bar
      ctx.save();
      ctx.font = SORA(10, 600);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colorWithAlpha(WHITE, 0.35);
      ctx.fillText('EUR/USD', padX, padY - 2);

      // Live price
      const livePrice = 1.0842 + Math.sin(time * 0.0005) * 0.002;
      ctx.font = SORA(10, 700);
      ctx.fillStyle = colorWithAlpha(EMERALD, 0.7);
      ctx.fillText(livePrice.toFixed(4), padX + 65, padY - 2);
      ctx.restore();

      for (let tf = 0; tf < tfCount; tf++) {
        const rowTop = padY + 18 + tf * rowH;
        const chartH = rowH * 0.6;
        const indicH = rowH * 0.25;
        const indicY = rowTop + chartH + 4;
        const candleW = (w - padX * 2 - 30) / candleCount;

        // Timeframe label
        ctx.save();
        ctx.font = SORA(8, 600);
        ctx.textAlign = 'left';
        ctx.fillStyle = colorWithAlpha(BLUE, 0.4);
        ctx.fillText(tfLabels[tf], padX, rowTop + 2);

        // Separator line
        if (tf > 0) {
          ctx.strokeStyle = colorWithAlpha(WHITE, 0.04);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(padX, rowTop - 2);
          ctx.lineTo(w - padX, rowTop - 2);
          ctx.stroke();
        }
        ctx.restore();

        // Generate candles
        const startX = padX + 28;
        let price = 1.0800 + tf * 0.002;
        const volatility = 0.001 * (tf + 1);
        const candles: { o: number; h: number; l: number; c: number; macd: number; rsi: number }[] = [];

        for (let i = 0; i < candleCount; i++) {
          const change = (seededRandom(tf * 100 + i * 3 + 1) - 0.48) * volatility * 3;
          const vol = volatility + seededRandom(tf * 100 + i * 3 + 2) * volatility * 2;
          const o = price;
          const c = price + change + Math.sin(time * 0.0004 + i * 0.3 + tf) * volatility * 0.3;
          const hi = Math.max(o, c) + vol * seededRandom(tf * 100 + i * 3 + 3);
          const lo = Math.min(o, c) - vol * seededRandom(tf * 100 + i * 3 + 4);
          candles.push({
            o, c, h: hi, l: lo,
            macd: (seededRandom(tf * 100 + i * 7) - 0.5) * 0.002 + Math.sin(time * 0.0006 + i * 0.2) * 0.0005,
            rsi: 40 + seededRandom(tf * 100 + i * 11) * 30 + Math.sin(time * 0.0008 + i * 0.3) * 5,
          });
          price = c;
        }

        const allP = candles.flatMap((c) => [c.h, c.l]);
        const minP = Math.min(...allP);
        const maxP = Math.max(...allP);
        const range = maxP - minP || 0.001;
        const toY = (p: number) => rowTop + 12 + chartH - ((p - minP) / range) * chartH;

        // Bollinger bands (simplified as shaded area)
        ctx.save();
        const maW = 7;
        ctx.fillStyle = colorWithAlpha(BLUE, 0.04);
        ctx.beginPath();
        for (let i = maW - 1; i < candleCount; i++) {
          let sum = 0, sqSum = 0;
          for (let j = 0; j < maW; j++) {
            sum += candles[i - j].c;
            sqSum += candles[i - j].c ** 2;
          }
          const ma = sum / maW;
          const std = Math.sqrt(sqSum / maW - ma ** 2) || volatility;
          const x = startX + i * candleW + candleW / 2;
          if (i === maW - 1) ctx.moveTo(x, toY(ma + std * 2));
          else ctx.lineTo(x, toY(ma + std * 2));
        }
        for (let i = candleCount - 1; i >= maW - 1; i--) {
          let sum = 0, sqSum = 0;
          for (let j = 0; j < maW; j++) {
            sum += candles[i - j].c;
            sqSum += candles[i - j].c ** 2;
          }
          const ma = sum / maW;
          const std = Math.sqrt(sqSum / maW - ma ** 2) || volatility;
          const x = startX + i * candleW + candleW / 2;
          ctx.lineTo(x, toY(ma - std * 2));
        }
        ctx.closePath();
        ctx.fill();

        // MA line
        ctx.strokeStyle = colorWithAlpha(BLUE, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = maW - 1; i < candleCount; i++) {
          let sum = 0;
          for (let j = 0; j < maW; j++) sum += candles[i - j].c;
          const ma = sum / maW;
          const x = startX + i * candleW + candleW / 2;
          if (i === maW - 1) ctx.moveTo(x, toY(ma));
          else ctx.lineTo(x, toY(ma));
        }
        ctx.stroke();
        ctx.restore();

        // Candlesticks
        candles.forEach((candle, i) => {
          const x = startX + i * candleW + candleW / 2;
          const bodyW = candleW * 0.5;
          const isBull = candle.c >= candle.o;
          const color = isBull ? EMERALD : RED;

          ctx.save();
          ctx.strokeStyle = colorWithAlpha(color, 0.3);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x, toY(candle.h));
          ctx.lineTo(x, toY(candle.l));
          ctx.stroke();

          const top = toY(Math.max(candle.o, candle.c));
          const bottom = toY(Math.min(candle.o, candle.c));
          ctx.fillStyle = colorWithAlpha(color, 0.35);
          ctx.fillRect(x - bodyW / 2, top, bodyW, Math.max(1, bottom - top));

          if (i >= candleCount - 2) {
            ctx.shadowColor = colorWithAlpha(color, 0.25);
            ctx.shadowBlur = 5;
            ctx.fillRect(x - bodyW / 2, top, bodyW, Math.max(1, bottom - top));
            ctx.shadowBlur = 0;
          }
          ctx.restore();

          // Hover crosshair
          if (mouse && Math.abs(mouse.x - x) < candleW / 2 && mouse.y > rowTop && mouse.y < rowTop + rowH) {
            ctx.save();
            ctx.strokeStyle = colorWithAlpha(WHITE, 0.08);
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, rowTop);
            ctx.lineTo(x, rowTop + chartH);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            tooltipRef.current = {
              x,
              y: rowTop,
              lines: [
                `${tfLabels[tf]} | O: ${candle.o.toFixed(4)} C: ${candle.c.toFixed(4)}`,
                `H: ${candle.h.toFixed(4)} L: ${candle.l.toFixed(4)}`,
                `RSI(14): ${candle.rsi.toFixed(1)} | MACD: ${candle.macd.toFixed(5)}`,
              ],
            };
          }
        });

        // MACD histogram at bottom of each row
        ctx.save();
        candles.forEach((candle, i) => {
          const x = startX + i * candleW + candleW / 2;
          const barW2 = candleW * 0.4;
          const maxMacd = 0.003;
          const barH2 = (candle.macd / maxMacd) * indicH * 0.8;
          const color = candle.macd >= 0 ? EMERALD : RED;
          const midY = indicY + indicH / 2;
          ctx.fillStyle = colorWithAlpha(color, 0.3);
          ctx.fillRect(x - barW2 / 2, midY - Math.max(0, barH2), barW2, Math.abs(barH2));
        });
        ctx.restore();

        // RSI gauge (right side)
        if (!isMobile) {
          const lastRsi = candles[candleCount - 1].rsi;
          const gaugeX = w - padX - 6;
          const gaugeTop = rowTop + 14;
          const gaugeH = chartH - 4;

          ctx.save();
          // Track
          ctx.fillStyle = colorWithAlpha(WHITE, 0.02);
          ctx.fillRect(gaugeX - 3, gaugeTop, 6, gaugeH);

          // RSI level
          const rsiY = gaugeTop + gaugeH - (lastRsi / 100) * gaugeH;
          const rsiColor = lastRsi > 70 ? RED : lastRsi < 30 ? EMERALD : AMBER;
          ctx.fillStyle = colorWithAlpha(rsiColor, 0.5);
          ctx.beginPath();
          ctx.arc(gaugeX, rsiY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Labels
          ctx.font = SORA(6);
          ctx.textAlign = 'right';
          ctx.fillStyle = colorWithAlpha(RED, 0.2);
          ctx.fillText('70', gaugeX - 6, gaugeTop + gaugeH * 0.3 + 3);
          ctx.fillStyle = colorWithAlpha(EMERALD, 0.2);
          ctx.fillText('30', gaugeX - 6, gaugeTop + gaugeH * 0.7 + 3);
          ctx.restore();
        }
      }

      // Sonar on last candle
      const sonar = (time % 3000) / 3000;
      drawSonarPulse(ctx, w - padX - 30, padY + 30, 15, sonar, BLUE);

      drawTooltip(ctx, tooltipRef.current, w);
    },
    [isMobile, drawTooltip],
  );

  const drawFn = type === 'heatmap' ? drawHeatmap
    : type === 'strength' ? drawStrength
    : drawTechnicals;

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
