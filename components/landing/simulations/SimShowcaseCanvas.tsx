'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { colorWithAlpha, drawSonarPulse } from '../pretext/canvasEffects';

type ShowcaseType = 'portfolio' | 'risk';

interface SimShowcaseCanvasProps {
  type: ShowcaseType;
}

const VIOLET = 'rgba(167, 139, 250, 1)';
const GREEN = 'rgba(110, 231, 183, 1)';
const RED = 'rgba(248, 113, 113, 1)';
const BLUE = 'rgba(129, 140, 248, 1)';
const AMBER = 'rgba(251, 191, 36, 1)';

const LABEL_FONT_SM = '500 9px Sora, system-ui, sans-serif';
const VALUE_FONT = '700 12px Sora, system-ui, sans-serif';
const TINY_FONT = '400 8px Sora, system-ui, sans-serif';
const SCORE_FONT = '700 48px Sora, system-ui, sans-serif';
const SCORE_FONT_MOBILE = '700 36px Sora, system-ui, sans-serif';
const SECTION_FONT = '600 8px Sora, system-ui, sans-serif';
const BAR_LABEL_FONT = '500 8px Sora, system-ui, sans-serif';

export function SimShowcaseCanvas({ type }: SimShowcaseCanvasProps) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;

      if (type === 'portfolio') {
        drawPortfolioShowcase(ctx, w, h, time, mouse, isMobile);
      } else {
        drawRiskShowcase(ctx, w, h, time, mouse, isMobile);
      }
    },
    [type, isMobile],
  );

  return (
    <PretextCanvas
      draw={draw}
      fallback={<ParticleField count={30} />}
      fps={isMobile ? 30 : 60}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl"
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PORTFOLIO SHOWCASE — Efficient frontier + allocation bars
   ══════════════════════════════════════════════════════════════════════ */
function drawPortfolioShowcase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  mouse: { x: number; y: number } | null,
  isMobile: boolean,
) {
  const pulse = Math.sin(time * 0.002) * 0.08;

  /* ── Section 1: Efficient Frontier (top 55%) ── */
  const frontierTop = h * 0.06;
  const frontierBottom = h * 0.52;
  const frontierLeft = w * 0.1;
  const frontierRight = w * 0.9;
  const frontierH = frontierBottom - frontierTop;
  const frontierW = frontierRight - frontierLeft;

  // Section label
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = SECTION_FONT;
  ctx.textAlign = 'left';
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.7);
  ctx.fillText('EFFICIENT FRONTIER', frontierLeft, frontierTop - 2);
  ctx.restore();

  // Axes
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.3);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(frontierLeft, frontierBottom);
  ctx.lineTo(frontierRight, frontierBottom);
  ctx.moveTo(frontierLeft, frontierBottom);
  ctx.lineTo(frontierLeft, frontierTop);
  ctx.stroke();
  ctx.restore();

  // Axis labels
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.font = TINY_FONT;
  ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.5);
  ctx.textAlign = 'center';
  ctx.fillText('Risk (Volatility %)', frontierLeft + frontierW / 2, frontierBottom + 14);
  ctx.textAlign = 'left';
  ctx.save();
  ctx.translate(frontierLeft - 10, frontierTop + frontierH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Return %', 0, 0);
  ctx.restore();
  ctx.restore();

  // Generate parabolic efficient frontier points
  const portfolioDots: { x: number; y: number; risk: number; ret: number; sharpe: number; isOptimal: boolean }[] = [];
  const numDots = isMobile ? 25 : 45;

  for (let i = 0; i < numDots; i++) {
    const t = i / (numDots - 1);
    // Parabolic frontier: return = -a*risk^2 + b*risk + noise
    const risk = 5 + t * 30;
    const baseRet = -0.01 * (risk - 18) ** 2 + 18;
    const scatter = (Math.sin(i * 7.3) * 2 + Math.cos(i * 4.1) * 1.5) * (1 + t * 0.5);
    const ret = baseRet + scatter;
    const sharpe = ret / (risk || 1);
    const isOptimal = Math.abs(scatter) < 1.2 && risk > 8 && risk < 28;

    const plotX = frontierLeft + ((risk - 5) / 30) * frontierW;
    const plotY = frontierBottom - ((ret + 5) / 30) * frontierH;

    portfolioDots.push({ x: plotX, y: plotY, risk, ret, sharpe, isOptimal });
  }

  // Draw cloud of portfolio dots
  let hoveredDotIdx: number | null = null;
  portfolioDots.forEach((dot, i) => {
    const isHov =
      mouse && Math.sqrt((mouse.x - dot.x) ** 2 + (mouse.y - dot.y) ** 2) < 10;
    if (isHov) hoveredDotIdx = i;

    const dotAlpha = dot.isOptimal ? 0.7 + pulse : 0.25;
    const dotColor = dot.isOptimal ? VIOLET : colorWithAlpha(VIOLET, 0.3);
    const dotR = dot.isOptimal ? 3 : 1.8;

    ctx.save();
    ctx.globalAlpha = isHov ? 0.95 : dotAlpha;
    ctx.fillStyle = isHov ? colorWithAlpha(VIOLET, 0.95) : dotColor;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, isHov ? 4 : dotR, 0, Math.PI * 2);
    ctx.fill();

    if (dot.isOptimal && !isHov) {
      // Glow for optimal frontier dots
      const grad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 8);
      grad.addColorStop(0, colorWithAlpha(VIOLET, 0.15));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Draw the frontier curve connecting optimal dots
  const optimal = portfolioDots.filter((d) => d.isOptimal).sort((a, b) => a.risk - b.risk);
  if (optimal.length > 2) {
    ctx.save();
    ctx.globalAlpha = 0.4 + pulse;
    ctx.strokeStyle = colorWithAlpha(VIOLET, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    optimal.forEach((dot, i) => {
      if (i === 0) ctx.moveTo(dot.x, dot.y);
      else ctx.lineTo(dot.x, dot.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Highlight the "current portfolio" marker
  const currentDot = portfolioDots[Math.floor(numDots * 0.4)];
  if (currentDot) {
    const markerPulse = Math.sin(time * 0.003) * 3;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = colorWithAlpha(GREEN, 0.8);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(currentDot.x, currentDot.y, 6 + markerPulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = TINY_FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = colorWithAlpha(GREEN, 0.8);
    ctx.fillText('Your Portfolio', currentDot.x + 10, currentDot.y - 2);
    ctx.restore();
  }

  // Tooltip for hovered dot
  if (hoveredDotIdx !== null) {
    const dot = portfolioDots[hoveredDotIdx];
    drawShowcaseTooltip(
      ctx,
      dot.x,
      dot.y - 16,
      `Risk: ${dot.risk.toFixed(1)}% | Return: ${dot.ret.toFixed(1)}% | Sharpe: ${dot.sharpe.toFixed(2)}`,
      VIOLET,
    );
  }

  /* ── Section 2: Allocation Bars (bottom 40%) ── */
  const allocTop = h * 0.58;
  const allocBottom = h * 0.92;
  const barLeft = w * 0.1;
  const barRight = w * 0.9;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = SECTION_FONT;
  ctx.textAlign = 'left';
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.7);
  ctx.fillText('OPTIMAL ALLOCATION', barLeft, allocTop - 2);
  ctx.restore();

  const allocations = [
    { label: 'IT', pct: 35, color: VIOLET },
    { label: 'Banking', pct: 25, color: GREEN },
    { label: 'Pharma', pct: 20, color: BLUE },
    { label: 'Energy', pct: 12, color: AMBER },
    { label: 'FMCG', pct: 8, color: RED },
  ];

  const allocH = allocBottom - allocTop;
  const barH = Math.min(12, allocH / allocations.length - 4);
  const barArea = barRight - barLeft;

  allocations.forEach((alloc, i) => {
    const y = allocTop + 8 + i * (barH + 8);
    const barW = (alloc.pct / 40) * barArea * 0.7;
    const isHov = mouse && mouse.y > y - 4 && mouse.y < y + barH + 4;
    const rowAlpha = isHov ? 0.9 : 0.6 + pulse;

    ctx.save();
    ctx.globalAlpha = rowAlpha;

    // Label
    ctx.font = BAR_LABEL_FONT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.5);
    ctx.fillText(alloc.label, barLeft + barArea * 0.15, y + barH / 2);

    // Bar
    const bx = barLeft + barArea * 0.18;
    ctx.fillStyle = colorWithAlpha(alloc.color, isHov ? 0.7 : 0.35);
    ctx.beginPath();
    ctx.roundRect(bx, y, barW, barH, 3);
    ctx.fill();

    // Percentage
    ctx.font = VALUE_FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = colorWithAlpha(alloc.color, 0.9);
    ctx.fillText(`${alloc.pct}%`, bx + barW + 8, y + barH / 2);

    ctx.restore();
  });
}

/* ══════════════════════════════════════════════════════════════════════
   RISK SHOWCASE — Score + crash scenarios + risk profile
   ══════════════════════════════════════════════════════════════════════ */
function drawRiskShowcase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  mouse: { x: number; y: number } | null,
  isMobile: boolean,
) {
  const pulse = Math.sin(time * 0.002) * 0.08;
  const cx = w / 2;

  /* ── Section 1: Large Risk Score (top 40%) ── */
  const scoreY = h * 0.22;
  const scoreR = Math.min(w, h) * 0.14;
  const scoreFontUsed = isMobile ? SCORE_FONT_MOBILE : SCORE_FONT;

  // Score section label
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = SECTION_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.7);
  ctx.fillText('YOUR RISK SCORE', cx, h * 0.04);
  ctx.restore();

  // Background ring
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.2);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, scoreY, scoreR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Progress ring (73/99)
  const progress = 73 / 99;
  const ringStart = -Math.PI / 2;
  const ringEnd = ringStart + progress * Math.PI * 2;

  // Gradient ring
  ctx.save();
  ctx.globalAlpha = 0.8 + pulse;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  // Draw segmented color ring: green -> amber -> red
  const segments = 60;
  for (let s = 0; s < segments; s++) {
    const t = s / segments;
    if (t > progress) break;
    const a1 = ringStart + t * Math.PI * 2;
    const a2 = ringStart + ((s + 1) / segments) * Math.PI * 2;
    const segColor = t < 0.33 ? GREEN : t < 0.66 ? AMBER : RED;
    ctx.strokeStyle = colorWithAlpha(segColor, 0.7);
    ctx.beginPath();
    ctx.arc(cx, scoreY, scoreR, a1, a2);
    ctx.stroke();
  }

  // End glow
  const ex = cx + Math.cos(ringEnd) * scoreR;
  const ey = scoreY + Math.sin(ringEnd) * scoreR;
  const endGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 12);
  endGrad.addColorStop(0, colorWithAlpha(AMBER, 0.5));
  endGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = endGrad;
  ctx.beginPath();
  ctx.arc(ex, ey, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sonar pulse
  const sonarT = (time % 4000) / 4000;
  drawSonarPulse(ctx, cx, scoreY, scoreR + 20, sonarT, AMBER);

  // Score number
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.font = scoreFontUsed;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colorWithAlpha(AMBER, 0.95);
  ctx.shadowColor = colorWithAlpha(AMBER, 0.3);
  ctx.shadowBlur = 16;
  ctx.fillText('73', cx, scoreY);
  ctx.shadowBlur = 0;

  ctx.font = TINY_FONT;
  ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.35);
  ctx.fillText('MODERATE RISK', cx, scoreY + scoreR * 0.5 + 8);
  ctx.restore();

  // Hover on score
  if (mouse) {
    const scoreDist = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - scoreY) ** 2);
    if (scoreDist < scoreR + 10) {
      drawShowcaseTooltip(
        ctx,
        cx,
        scoreY - scoreR - 14,
        'Percentile: 73rd | Profile: Moderate Growth',
        AMBER,
      );
    }
  }

  /* ── Section 2: Crash Scenario Mini-Bars (middle band) ── */
  const scenarioTop = h * 0.42;
  const scenarioBottom = h * 0.72;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = SECTION_FONT;
  ctx.textAlign = 'left';
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.7);
  ctx.fillText('STRESS TEST RESULTS', w * 0.08, scenarioTop - 4);
  ctx.restore();

  const scenarios = [
    { label: '2008 GFC', impact: -52, color: RED, detail: 'Global Financial Crisis' },
    { label: 'COVID-19', impact: -34, color: AMBER, detail: 'Pandemic Crash Mar 2020' },
    { label: 'Taper', impact: -15, color: VIOLET, detail: 'Fed Taper Tantrum 2013' },
    { label: 'Debt Crisis', impact: -28, color: BLUE, detail: 'European Debt Crisis 2011' },
  ];

  const scBarLeft = w * 0.08;
  const scBarRight = w * 0.92;
  const scBarArea = scBarRight - scBarLeft;
  const scBarH = 10;
  const scLineH = (scenarioBottom - scenarioTop) / scenarios.length;

  scenarios.forEach((sc, i) => {
    const y = scenarioTop + 6 + i * scLineH;
    const barW = (Math.abs(sc.impact) / 60) * scBarArea * 0.5;
    const isHov = mouse && mouse.y > y - 6 && mouse.y < y + scBarH + 6;
    const rowAlpha = isHov ? 0.95 : 0.55 + pulse;

    // Animated bar fill
    const fillProgress = Math.min(1, ((time * 0.0003 + i * 0.5) % 3));
    const animW = barW * fillProgress;

    ctx.save();
    ctx.globalAlpha = rowAlpha;

    // Label
    ctx.font = LABEL_FONT_SM;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.6);
    ctx.fillText(sc.label, scBarLeft + scBarArea * 0.22, y + scBarH / 2);

    // Bar background
    ctx.fillStyle = colorWithAlpha(sc.color, 0.08);
    ctx.beginPath();
    ctx.roundRect(scBarLeft + scBarArea * 0.25, y, barW, scBarH, 3);
    ctx.fill();

    // Bar fill
    ctx.fillStyle = colorWithAlpha(sc.color, isHov ? 0.7 : 0.4);
    ctx.beginPath();
    ctx.roundRect(scBarLeft + scBarArea * 0.25, y, animW, scBarH, 3);
    ctx.fill();

    // Impact value
    ctx.font = VALUE_FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = colorWithAlpha(sc.color, 0.9);
    ctx.fillText(`${sc.impact}%`, scBarLeft + scBarArea * 0.25 + barW + 8, y + scBarH / 2);

    ctx.restore();

    // Hover detail
    if (isHov) {
      drawShowcaseTooltip(
        ctx,
        w / 2,
        y + scBarH + 12,
        `${sc.detail} | Portfolio Impact: ${sc.impact}%`,
        sc.color,
      );
    }
  });

  /* ── Section 3: Risk Profile Bar (bottom) ── */
  const profileY = h * 0.78;
  const profileH = 8;
  const profileLeft = w * 0.1;
  const profileRight = w * 0.9;
  const profileW = profileRight - profileLeft;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = SECTION_FONT;
  ctx.textAlign = 'left';
  ctx.fillStyle = colorWithAlpha(VIOLET, 0.7);
  ctx.fillText('RISK PROFILE', profileLeft, profileY - 10);
  ctx.restore();

  // Gradient bar background
  const barGrad = ctx.createLinearGradient(profileLeft, 0, profileRight, 0);
  barGrad.addColorStop(0, colorWithAlpha(GREEN, 0.25));
  barGrad.addColorStop(0.5, colorWithAlpha(AMBER, 0.25));
  barGrad.addColorStop(1, colorWithAlpha(RED, 0.25));
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(profileLeft, profileY, profileW, profileH, 4);
  ctx.fill();
  ctx.restore();

  // Position marker (73/99)
  const markerX = profileLeft + (73 / 99) * profileW;
  const markerPulse = Math.sin(time * 0.004) * 2;

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = colorWithAlpha(AMBER, 0.9);
  ctx.beginPath();
  ctx.moveTo(markerX, profileY - 4);
  ctx.lineTo(markerX - 4, profileY - 10);
  ctx.lineTo(markerX + 4, profileY - 10);
  ctx.closePath();
  ctx.fill();

  // Marker glow
  const mGrad = ctx.createRadialGradient(markerX, profileY, 0, markerX, profileY, 15 + markerPulse);
  mGrad.addColorStop(0, colorWithAlpha(AMBER, 0.3));
  mGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = mGrad;
  ctx.beginPath();
  ctx.arc(markerX, profileY + profileH / 2, 15 + markerPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Zone labels
  const zoneLabels = [
    { label: 'Conservative', x: profileLeft + profileW * 0.15 },
    { label: 'Moderate', x: profileLeft + profileW * 0.5 },
    { label: 'Aggressive', x: profileLeft + profileW * 0.85 },
  ];

  zoneLabels.forEach((z) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.font = TINY_FONT;
    ctx.textAlign = 'center';
    ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.5);
    ctx.fillText(z.label, z.x, profileY + profileH + 14);
    ctx.restore();
  });
}

/* ── Tooltip helper ── */
function drawShowcaseTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  accentColor: string,
) {
  ctx.save();
  ctx.font = '500 9px Sora, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const padX = 10;
  const tw = metrics.width + padX * 2;
  const th = 18;

  // Clamp to canvas
  const bx = Math.max(2, Math.min(x - tw / 2, ctx.canvas.offsetWidth - tw - 2));
  const by = y - th / 2;

  // Background
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(12, 12, 22, 0.92)';
  ctx.beginPath();
  ctx.roundRect(bx, by, tw, th, 5);
  ctx.fill();

  // Border
  ctx.strokeStyle = colorWithAlpha(accentColor, 0.35);
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Text
  ctx.globalAlpha = 1;
  ctx.fillStyle = colorWithAlpha(accentColor, 0.9);
  ctx.fillText(text, bx + tw / 2, y);
  ctx.restore();
}
