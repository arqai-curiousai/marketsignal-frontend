'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { colorWithAlpha } from '../pretext/canvasEffects';

type ToolId =
  | 'signals'
  | 'volatility'
  | 'regimes'
  | 'montecarlo'
  | 'portfolio'
  | 'backtesting'
  | 'riskscore'
  | 'scenarios'
  | 'factors';

interface SimGridItemCanvasProps {
  toolId: ToolId;
  isHovered: boolean;
}

const VIOLET = 'rgba(167, 139, 250, 1)';
const VIOLET_DIM = 'rgba(167, 139, 250, 0.5)';
const GREEN = 'rgba(110, 231, 183, 1)';
const RED = 'rgba(248, 113, 113, 1)';
const BLUE = 'rgba(129, 140, 248, 1)';
const AMBER = 'rgba(251, 191, 36, 1)';

const LABEL_FONT = '600 9px Sora, system-ui, sans-serif';
const VALUE_FONT = '700 11px Sora, system-ui, sans-serif';
const TINY_FONT = '400 7px Sora, system-ui, sans-serif';
const BIG_FONT = '700 28px Sora, system-ui, sans-serif';
const MED_FONT = '600 10px Sora, system-ui, sans-serif';

export function SimGridItemCanvas({ toolId, isHovered }: SimGridItemCanvasProps) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const hoverAlpha = isHovered ? 1 : 0.6;
      const pulse = Math.sin(time * 0.003) * 0.1;

      switch (toolId) {
        case 'signals':
          drawSignalsViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
        case 'volatility':
          drawVolatilityViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
        case 'regimes':
          drawRegimesViz(ctx, w, h, time, hoverAlpha, pulse);
          break;
        case 'montecarlo':
          drawMonteCarloViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
        case 'portfolio':
          drawPortfolioViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
        case 'backtesting':
          drawBacktestViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
        case 'riskscore':
          drawRiskScoreViz(ctx, w, h, time, hoverAlpha, pulse);
          break;
        case 'scenarios':
          drawScenariosViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
        case 'factors':
          drawFactorsViz(ctx, w, h, time, hoverAlpha, pulse, mouse);
          break;
      }
    },
    [toolId, isHovered],
  );

  return (
    <div className="relative w-full h-full min-h-[80px]">
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

/* ── 1. AI Patterns: Candlestick bars with pattern label ── */
function drawSignalsViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const cx = w / 2;
  const cy = h / 2;
  const barW = 8;
  const gap = 18;

  // 5 candlesticks
  const candles = [
    { o: 0.6, c: 0.4, hi: 0.3, lo: 0.7, bull: false },
    { o: 0.5, c: 0.3, hi: 0.2, lo: 0.6, bull: true },
    { o: 0.55, c: 0.65, hi: 0.7, lo: 0.45, bull: false },
    { o: 0.4, c: 0.25, hi: 0.15, lo: 0.5, bull: true },
    { o: 0.3, c: 0.2, hi: 0.1, lo: 0.4, bull: true },
  ];

  const baseX = cx - (candles.length * gap) / 2;
  const rangeH = h * 0.5;
  const topY = cy - rangeH / 2;

  candles.forEach((c, i) => {
    const x = baseX + i * gap;
    const oY = topY + c.o * rangeH;
    const cY = topY + c.c * rangeH;
    const hiY = topY + c.hi * rangeH;
    const loY = topY + c.lo * rangeH;
    const bodyTop = Math.min(oY, cY);
    const bodyH = Math.abs(oY - cY);
    const color = c.bull ? GREEN : RED;

    // Wick
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = colorWithAlpha(color, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, hiY);
    ctx.lineTo(x, loY);
    ctx.stroke();

    // Body
    ctx.globalAlpha = alpha * (0.7 + pulse);
    ctx.fillStyle = colorWithAlpha(color, 0.7);
    ctx.fillRect(x - barW / 2, bodyTop, barW, Math.max(bodyH, 1));
    ctx.restore();
  });

  // Pattern label
  const patternAlpha = alpha * (0.8 + pulse * 0.5);
  ctx.save();
  ctx.globalAlpha = patternAlpha;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.9);
  ctx.fillText('Double Bottom', cx, topY - 4);

  // Confidence
  ctx.font = VALUE_FONT;
  ctx.fillStyle = colorWithAlpha(GREEN, 0.9);
  ctx.fillText('87%', cx + 38, topY - 4);
  ctx.restore();

  // Hover tooltip
  if (mouse) {
    const mDist = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
    if (mDist < 50) {
      drawTooltip(ctx, cx, cy + rangeH / 2 + 10, 'Conf: 87% | Vol: 22.1%', VIOLET);
    }
  }
}

/* ── 2. Volatility: Storm gauge ── */
function drawVolatilityViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const cx = w / 2;
  const cy = h * 0.55;
  const radius = Math.min(w, h) * 0.32;

  // Arc background
  const startAngle = Math.PI;

  // Colored zones: green, amber, red
  const zones = [
    { start: 0, end: 0.33, color: GREEN },
    { start: 0.33, end: 0.66, color: AMBER },
    { start: 0.66, end: 1, color: RED },
  ];

  zones.forEach((z) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.2;
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      radius,
      startAngle + z.start * Math.PI,
      startAngle + z.end * Math.PI,
    );
    ctx.lineWidth = 6;
    ctx.strokeStyle = colorWithAlpha(z.color, 0.4);
    ctx.stroke();
    ctx.restore();
  });

  // Needle pointing to MODERATE zone (~40%)
  const needleAngle = startAngle + (0.42 + Math.sin(time * 0.001) * 0.03) * Math.PI;
  const needleLen = radius * 0.75;

  ctx.save();
  ctx.globalAlpha = alpha * (0.9 + pulse);
  ctx.strokeStyle = colorWithAlpha(AMBER, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * needleLen, cy + Math.sin(needleAngle) * needleLen);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.8);
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Value
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = VALUE_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = colorWithAlpha(AMBER, 0.9);
  ctx.fillText('18.4%', cx, cy + 14);

  ctx.font = TINY_FONT;
  ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.4);
  ctx.fillText('MODERATE', cx, cy + 24);
  ctx.restore();

  // Hover
  if (mouse) {
    const mDist = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
    if (mDist < radius) {
      drawTooltip(ctx, cx, cy - radius - 6, 'Ann. Vol: 18.4% | Regime: Choppy', AMBER);
    }
  }
}

/* ── 3. Regimes: 3 stacked labels ── */
function drawRegimesViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
) {
  const cx = w / 2;
  const baseY = h * 0.25;
  const lineH = 22;

  const regimes = [
    { label: 'BULL', color: GREEN, active: false },
    { label: 'SIDEWAYS', color: AMBER, active: true },
    { label: 'BEAR', color: RED, active: false },
  ];

  regimes.forEach((r, i) => {
    const y = baseY + i * lineH;
    const isActive = r.active;
    const glowPhase = Math.sin(time * 0.004 + i) * 0.15;

    ctx.save();
    ctx.font = isActive ? MED_FONT : LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isActive) {
      // Glow background
      ctx.globalAlpha = alpha * (0.15 + glowPhase);
      const grad = ctx.createRadialGradient(cx, y, 0, cx, y, 40);
      grad.addColorStop(0, colorWithAlpha(r.color, 0.2));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 50, y - 10, 100, 20);

      // Active label
      ctx.globalAlpha = alpha * (0.9 + pulse);
      ctx.fillStyle = colorWithAlpha(r.color, 0.95);
      ctx.shadowColor = colorWithAlpha(r.color, 0.4);
      ctx.shadowBlur = 8;
      ctx.fillText(r.label, cx, y);

      // Arrow indicator
      ctx.shadowBlur = 0;
      ctx.font = TINY_FONT;
      ctx.fillText('\u25B6', cx + 38, y);
    } else {
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = colorWithAlpha(r.color, 0.4);
      ctx.fillText(r.label, cx, y);
    }

    ctx.restore();
  });

  // Probability below
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  ctx.font = TINY_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.35);
  ctx.fillText('68% probability', cx, baseY + lineH * 3 + 4);
  ctx.restore();
}

/* ── 4. Monte Carlo: Fan of diverging probability paths ── */
function drawMonteCarloViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const startX = w * 0.12;
  const endX = w * 0.88;
  const cy = h * 0.5;
  const spread = h * 0.35;
  const pathCount = 7;
  const steps = 20;

  // Seed-based pseudo-random for each path
  const paths: number[][] = [];
  for (let p = 0; p < pathCount; p++) {
    const path: number[] = [0];
    let val = 0;
    const drift = (p - (pathCount - 1) / 2) * 0.06;
    for (let s = 1; s <= steps; s++) {
      val += drift + Math.sin(s * 1.7 + p * 3.1) * 0.08 + Math.cos(s * 0.9 + p * 2.7) * 0.05;
      path.push(val);
    }
    paths.push(path);
  }

  // Normalize
  let minV = Infinity;
  let maxV = -Infinity;
  paths.forEach((path) =>
    path.forEach((v) => {
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }),
  );
  const range = maxV - minV || 1;

  // Draw fan paths
  const progressT = ((time * 0.0003) % 1.5);
  const visibleSteps = Math.min(steps, Math.floor(progressT * steps * 1.2));

  paths.forEach((path, pi) => {
    const distFromCenter = Math.abs(pi - (pathCount - 1) / 2) / ((pathCount - 1) / 2);
    const pathAlpha = alpha * (0.3 + (1 - distFromCenter) * 0.5 + pulse);
    const isMedian = pi === Math.floor(pathCount / 2);
    const color = isMedian ? VIOLET : colorWithAlpha(VIOLET_DIM, 0.4 + (1 - distFromCenter) * 0.3);

    ctx.save();
    ctx.globalAlpha = pathAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = isMedian ? 1.5 : 0.8;
    ctx.beginPath();

    const maxI = Math.min(visibleSteps, path.length);
    for (let i = 0; i < maxI; i++) {
      const x = startX + (i / steps) * (endX - startX);
      const normV = (path[i] - minV) / range;
      const y = cy + (normV - 0.5) * spread;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // End dot
    if (maxI > 1) {
      const lastX = startX + ((maxI - 1) / steps) * (endX - startX);
      const lastY = cy + ((path[maxI - 1] - minV) / range - 0.5) * spread;
      ctx.beginPath();
      ctx.arc(lastX, lastY, isMedian ? 2 : 1.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();
  });

  // Origin dot
  ctx.save();
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.8);
  ctx.beginPath();
  ctx.arc(startX, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hover
  if (mouse && mouse.x > startX && mouse.x < endX) {
    const stepIdx = Math.round(((mouse.x - startX) / (endX - startX)) * steps);
    const medianPath = paths[Math.floor(pathCount / 2)];
    if (stepIdx >= 0 && stepIdx < medianPath.length) {
      const val = (medianPath[stepIdx] * 15 + 100).toFixed(1);
      drawTooltip(ctx, mouse.x, mouse.y - 14, `Day ${stepIdx}: \u20B9${val}`, VIOLET);
    }
  }
}

/* ── 5. Portfolio: Donut chart ── */
function drawPortfolioViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) * 0.3;
  const innerR = outerR * 0.55;

  const segments = [
    { label: 'IT', pct: 35, color: VIOLET },
    { label: 'BANK', pct: 25, color: GREEN },
    { label: 'PHARMA', pct: 20, color: BLUE },
    { label: 'OTHER', pct: 20, color: AMBER },
  ];

  let startAngle = -Math.PI / 2;
  const hoveredSegment = getHoveredSegment(mouse, cx, cy, outerR, innerR, segments);

  segments.forEach((seg, i) => {
    const sweep = (seg.pct / 100) * Math.PI * 2;
    const endAngle = startAngle + sweep;
    const isHov = hoveredSegment === i;
    const segAlpha = alpha * (isHov ? 0.95 : 0.6 + pulse);
    const expand = isHov ? 3 : 0;

    // Mid-angle for label positioning and expansion
    const midAngle = startAngle + sweep / 2;
    const dx = Math.cos(midAngle) * expand;
    const dy = Math.sin(midAngle) * expand;

    ctx.save();
    ctx.globalAlpha = segAlpha;
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, outerR, startAngle, endAngle);
    ctx.arc(cx + dx, cy + dy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colorWithAlpha(seg.color, isHov ? 0.8 : 0.5);
    ctx.fill();

    // Label
    const labelR = outerR + 10;
    const lx = cx + Math.cos(midAngle) * labelR;
    const ly = cy + Math.sin(midAngle) * labelR;
    ctx.font = TINY_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorWithAlpha(seg.color, 0.8);
    ctx.fillText(`${seg.label} ${seg.pct}%`, lx, ly);
    ctx.restore();

    startAngle = endAngle;
  });

  // Hover tooltip
  if (hoveredSegment !== null) {
    const seg = segments[hoveredSegment];
    drawTooltip(ctx, cx, cy, `${seg.label}: ${seg.pct}% | Sharpe: 1.47`, seg.color);
  }
}

/* ── 6. Backtesting: Equity curve ── */
function drawBacktestViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const pad = 10;
  const startX = pad;
  const endX = w - pad;
  const topY = h * 0.15;
  const botY = h * 0.75;

  // Equity curve with drawdowns
  const points = [
    0, 0.05, 0.12, 0.18, 0.15, 0.1, 0.17, 0.25, 0.32, 0.38, 0.35, 0.42,
    0.48, 0.45, 0.5, 0.58, 0.62, 0.55, 0.6, 0.68, 0.72, 0.78, 0.82, 0.85,
  ];

  // Draw fill area
  ctx.save();
  ctx.globalAlpha = alpha * 0.1;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = startX + (i / (points.length - 1)) * (endX - startX);
    const y = botY - p * (botY - topY);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(endX, botY);
  ctx.lineTo(startX, botY);
  ctx.closePath();
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.3);
  ctx.fill();
  ctx.restore();

  // Draw line
  const progressFrac = Math.min(1, ((time * 0.0002) % 2));
  const visibleCount = Math.max(2, Math.floor(progressFrac * points.length));

  ctx.save();
  ctx.globalAlpha = alpha * (0.8 + pulse);
  ctx.strokeStyle = colorWithAlpha(VIOLET, 0.8);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < visibleCount && i < points.length; i++) {
    const x = startX + (i / (points.length - 1)) * (endX - startX);
    const y = botY - points[i] * (botY - topY);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // Final value
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.font = VALUE_FONT;
  ctx.textAlign = 'right';
  ctx.fillStyle = colorWithAlpha(GREEN, 0.9);
  ctx.fillText('+47.2%', endX, topY - 2);
  ctx.restore();

  // Hover: show value at position
  if (mouse && mouse.x >= startX && mouse.x <= endX) {
    const idx = Math.round(((mouse.x - startX) / (endX - startX)) * (points.length - 1));
    if (idx >= 0 && idx < points.length) {
      const val = (points[idx] * 55.6).toFixed(1);
      const y = botY - points[idx] * (botY - topY);
      drawTooltip(ctx, mouse.x, y - 12, `+${val}%`, VIOLET);
    }
  }
}

/* ── 7. Risk Score: Large centered number with ring ── */
function drawRiskScoreViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.3;

  // Background ring
  ctx.save();
  ctx.globalAlpha = alpha * 0.15;
  ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.2);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Progress ring (73/99)
  const progress = 73 / 99;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + progress * Math.PI * 2;

  ctx.save();
  ctx.globalAlpha = alpha * (0.7 + pulse);
  ctx.strokeStyle = colorWithAlpha(AMBER, 0.8);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  // Glow on end
  const ex = cx + Math.cos(endAngle) * radius;
  const ey = cy + Math.sin(endAngle) * radius;
  const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 8);
  grad.addColorStop(0, colorWithAlpha(AMBER, 0.4));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ex, ey, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Score number
  ctx.save();
  ctx.globalAlpha = alpha * (0.9 + pulse * 0.3);
  ctx.font = BIG_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colorWithAlpha(AMBER, 0.95);
  ctx.shadowColor = colorWithAlpha(AMBER, 0.3);
  ctx.shadowBlur = 12;
  ctx.fillText('73', cx, cy - 2);
  ctx.shadowBlur = 0;

  ctx.font = TINY_FONT;
  ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.35);
  ctx.fillText('/ 99', cx + 16, cy + 10);
  ctx.restore();
}

/* ── 8. Scenarios: Crash event labels with impact bars ── */
function drawScenariosViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const scenarios = [
    { label: '2008 GFC', impact: -52, color: RED },
    { label: 'COVID', impact: -34, color: AMBER },
    { label: 'TAPER', impact: -15, color: VIOLET },
  ];

  const lineH = 22;
  const startY = h * 0.15;
  const barStartX = w * 0.48;
  const maxBarW = w * 0.38;

  scenarios.forEach((s, i) => {
    const y = startY + i * lineH;
    const barW = (Math.abs(s.impact) / 60) * maxBarW;
    const isHov = mouse && mouse.y > y - 10 && mouse.y < y + 10;
    const rowAlpha = alpha * (isHov ? 0.95 : 0.6 + pulse);

    ctx.save();
    ctx.globalAlpha = rowAlpha;

    // Label
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.6);
    ctx.fillText(s.label, barStartX - 8, y);

    // Bar
    const barAlpha = isHov ? 0.8 : 0.45;
    ctx.fillStyle = colorWithAlpha(s.color, barAlpha);
    const animBarW = barW * Math.min(1, ((time * 0.0004 + i * 0.3) % 2));
    ctx.fillRect(barStartX, y - 5, animBarW, 10);

    // Impact value
    ctx.font = VALUE_FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = colorWithAlpha(s.color, 0.9);
    ctx.fillText(`${s.impact}%`, barStartX + animBarW + 4, y);

    ctx.restore();
  });

  // Hover tooltip
  if (mouse) {
    scenarios.forEach((s, i) => {
      const y = startY + i * lineH;
      if (mouse.y > y - 10 && mouse.y < y + 10) {
        drawTooltip(ctx, w / 2, y + 16, `${s.label}: ${s.impact}% drawdown`, s.color);
      }
    });
  }
}

/* ── 9. Factors: 4 factor bars ── */
function drawFactorsViz(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number,
  pulse: number,
  mouse: { x: number; y: number } | null,
) {
  const factors = [
    { label: 'Momentum', value: 3.2, color: GREEN },
    { label: 'Value', value: -1.1, color: RED },
    { label: 'Quality', value: 2.8, color: GREEN },
    { label: 'Size', value: -0.4, color: RED },
  ];

  const lineH = 18;
  const startY = h * 0.12;
  const centerX = w * 0.52;
  const maxBarW = w * 0.28;

  factors.forEach((f, i) => {
    const y = startY + i * lineH;
    const barW = (Math.abs(f.value) / 4) * maxBarW;
    const isPositive = f.value >= 0;
    const isHov = mouse && mouse.y > y - 8 && mouse.y < y + 8;
    const rowAlpha = alpha * (isHov ? 0.95 : 0.55 + pulse);

    ctx.save();
    ctx.globalAlpha = rowAlpha;

    // Label
    ctx.font = TINY_FONT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.5);
    ctx.fillText(f.label, centerX - 6, y);

    // Bar
    const bx = isPositive ? centerX : centerX - barW;
    ctx.fillStyle = colorWithAlpha(f.color, isHov ? 0.75 : 0.4);
    ctx.fillRect(bx, y - 4, barW, 8);

    // Value
    ctx.font = LABEL_FONT;
    ctx.textAlign = isPositive ? 'left' : 'right';
    ctx.fillStyle = colorWithAlpha(f.color, 0.85);
    const sign = isPositive ? '+' : '';
    const valX = isPositive ? centerX + barW + 4 : centerX - barW - 4;
    ctx.fillText(`${sign}${f.value}%`, valX, y);

    ctx.restore();
  });

  // Center line
  ctx.save();
  ctx.globalAlpha = alpha * 0.15;
  ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.3);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(centerX, startY - 6);
  ctx.lineTo(centerX, startY + factors.length * lineH);
  ctx.stroke();
  ctx.restore();
}

/* ── Helpers ── */

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  accentColor: string,
) {
  ctx.save();
  ctx.font = '500 8px Sora, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const padX = 8;
  const tw = metrics.width + padX * 2;
  const th = 16;

  // Background
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(15, 15, 25, 0.9)';
  ctx.beginPath();
  const bx = x - tw / 2;
  const by = y - th / 2;
  ctx.roundRect(bx, by, tw, th, 4);
  ctx.fill();

  // Border
  ctx.strokeStyle = colorWithAlpha(accentColor, 0.3);
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Text
  ctx.fillStyle = colorWithAlpha(accentColor, 0.9);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function getHoveredSegment(
  mouse: { x: number; y: number } | null,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  segments: { pct: number }[],
): number | null {
  if (!mouse) return null;
  const dx = mouse.x - cx;
  const dy = mouse.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < innerR || dist > outerR) return null;

  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;
  const frac = angle / (Math.PI * 2);

  let cumFrac = 0;
  for (let i = 0; i < segments.length; i++) {
    cumFrac += segments[i].pct / 100;
    if (frac <= cumFrac) return i;
  }
  return null;
}
