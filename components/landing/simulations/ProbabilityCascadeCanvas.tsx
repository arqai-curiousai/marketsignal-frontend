'use client';

/**
 * Simulation Showreel — cycles through 4 mini-demos showing what each tool does.
 *
 * Scene 1 – Monte Carlo:  Price line → nexus → probability fan → stats
 * Scene 2 – Volatility:   Arc gauge → needle sweep → regime label
 * Scene 3 – Portfolio:     Donut chart → segment labels → Sharpe ratio
 * Scene 4 – Risk Score:    Big number counting up → risk bar → verdict
 *
 * Each scene has a tool label, one-line subtitle, key metric, and progress dots.
 * A "9 free tools" badge reminds users there is more to explore.
 */

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { colorWithAlpha } from '../pretext/canvasEffects';

/* ═══════════════ Helpers ═══════════════ */

function cl01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function lp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ═══════════════ Colours ═══════════════ */

const VIOLET = 'rgba(167, 139, 250, 1)';
const EMERALD = 'rgba(110, 231, 183, 1)';
const AMBER = 'rgba(251, 191, 36, 1)';
const ROSE = 'rgba(248, 113, 113, 1)';
const BLUE = 'rgba(96, 165, 250, 1)';
const WHITE = 'rgba(255, 255, 255, 1)';
const GRAY = 'rgba(160, 160, 160, 1)';

/* ═══════════════ Scene definitions ═══════════════ */

interface SceneDef {
  tool: string;
  subtitle: string;
  metric: string;
  metricColor: string;
}

const SCENES: SceneDef[] = [
  {
    tool: 'MONTE CARLO',
    subtitle: 'Simulate 1,000 futures for any stock',
    metric: 'Median Return: +12.3%',
    metricColor: EMERALD,
  },
  {
    tool: 'VOLATILITY',
    subtitle: 'Know the risk before it hits',
    metric: 'Regime: Elevated',
    metricColor: AMBER,
  },
  {
    tool: 'PORTFOLIO',
    subtitle: 'Find your optimal allocation',
    metric: 'Sharpe Ratio: 1.42',
    metricColor: VIOLET,
  },
  {
    tool: 'RISK SCORE',
    subtitle: 'How exposed are you?',
    metric: 'Score: 73 / 99',
    metricColor: AMBER,
  },
];

const SCENE_MS = 5500;
const FADE_MS = 400;
const ACTIVE_MS = SCENE_MS - FADE_MS * 2;

/* ═══════════════ Pre-computed scene data ═══════════════ */

interface MCData {
  histYs: number[]; // normalised -1..1
  simPaths: { ys: number[]; drift: number }[];
}

function buildMCData(): MCData {
  const rng = seededRng(101);
  const histN = 30;
  const simN = 25;
  const numPaths = 24;

  // History path (normalised)
  const histYs: number[] = [0];
  let y = 0;
  let v = 0;
  for (let i = 1; i < histN; i++) {
    v += (rng() - 0.5) * 0.12;
    v *= 0.9;
    y += v;
    y = Math.max(-1, Math.min(1, y));
    histYs.push(y);
  }

  // Sim paths (normalised)
  const simPaths: { ys: number[]; drift: number }[] = [];
  const lastHist = histYs[histN - 1];
  for (let p = 0; p < numPaths; p++) {
    const drift = (rng() - 0.45) * 0.04;
    const vol = 0.25 + rng() * 0.75;
    const ys: number[] = [lastHist];
    let sy = lastHist;
    for (let i = 1; i < simN; i++) {
      sy += drift + (rng() - 0.5) * 0.06 * vol;
      ys.push(sy);
    }
    simPaths.push({ ys, drift: sy - lastHist });
  }

  return { histYs, simPaths };
}

/* ═══════════════ Scene renderers ═══════════════ */

/**
 * Each renderer receives:
 *   ctx, cx, cy, r  — drawing area (centred, radius = available space)
 *   t               — scene-local progress 0→1
 *   time            — raw RAF time (for breathing/pulsing)
 *   mob             — is mobile
 *   data            — pre-computed MC data (only used by scene 0)
 */

type SceneRenderer = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  time: number,
  mob: boolean,
  mcData: MCData,
) => void;

/* ── Scene 0: Monte Carlo ── */
const renderMonteCarlo: SceneRenderer = (ctx, cx, cy, r, t, time, mob, mc) => {
  const spread = r * 0.35;
  const histLen = r * 0.6;
  const simLen = r * 0.8;
  const startX = cx - histLen;
  const nexX = cx - histLen * 0.15;
  const endX = cx + simLen;
  const histN = mc.histYs.length;
  const simN = mc.simPaths[0]?.ys.length ?? 25;

  // History line (0→25%)
  const histT = cl01(t / 0.25);
  if (histT > 0) {
    const pts = Math.ceil(histT * histN);
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const px = startX + (nexX - startX) * (i / (histN - 1));
      const py = cy + mc.histYs[i] * spread;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const px = startX + (nexX - startX) * (i / (histN - 1));
      const py = cy + mc.histYs[i] * spread;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Nexus glow (20→35%)
  const nexT = cl01((t - 0.2) / 0.15);
  if (nexT > 0) {
    const nexY = cy + mc.histYs[histN - 1] * spread;
    const gr = ctx.createRadialGradient(nexX, nexY, 0, nexX, nexY, 25);
    gr.addColorStop(0, colorWithAlpha(VIOLET, 0.3 * nexT));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(nexX, nexY, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorWithAlpha(VIOLET, 0.9 * nexT);
    ctx.beginPath();
    ctx.arc(nexX, nexY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sim paths (25→80%)
  const simT = cl01((t - 0.25) / 0.55);
  if (simT > 0) {
    const simPts = Math.ceil(simT * simN);
    const maxDrift = Math.max(
      ...mc.simPaths.map((p) => Math.abs(p.drift)),
      0.01,
    );

    // Confidence band
    ctx.save();
    ctx.globalAlpha = 0.04 * cl01(simT * 2);
    ctx.fillStyle = VIOLET;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < simPts; i++) {
      const sorted = mc.simPaths
        .map((p) => p.ys[i])
        .sort((a, b) => a - b);
      const x = nexX + (endX - nexX) * (i / (simN - 1));
      const yLo = cy + sorted[Math.floor(sorted.length * 0.1)] * spread;
      if (!started) {
        ctx.moveTo(x, yLo);
        started = true;
      } else ctx.lineTo(x, yLo);
    }
    for (let i = simPts - 1; i >= 0; i--) {
      const sorted = mc.simPaths
        .map((p) => p.ys[i])
        .sort((a, b) => a - b);
      const x = nexX + (endX - nexX) * (i / (simN - 1));
      ctx.lineTo(
        x,
        cy + sorted[Math.floor(sorted.length * 0.9)] * spread,
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Individual paths
    mc.simPaths.forEach((sp, pIdx) => {
      const norm = sp.drift / maxDrift;
      const absN = Math.abs(norm);
      const alpha = (0.12 + (1 - absN * 0.5) * 0.28) * cl01(simT * 2);

      let pr: number, pg: number, pb: number;
      if (norm >= 0) {
        const tc = cl01(norm * 2);
        pr = Math.round(lp(167, 110, tc));
        pg = Math.round(lp(139, 231, tc));
        pb = Math.round(lp(250, 183, tc));
      } else {
        const tc = cl01(-norm * 2);
        pr = Math.round(lp(167, 248, tc));
        pg = Math.round(lp(139, 113, tc));
        pb = Math.round(lp(250, 113, tc));
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${pr},${pg},${pb})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < simPts; i++) {
        const x = nexX + (endX - nexX) * (i / (simN - 1));
        const breathe =
          Math.sin(time * 0.0004 + i * 0.2 + pIdx * 1.3) * 1.5;
        const py = cy + sp.ys[i] * spread + breathe;
        if (i === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Path count label near nexus
    if (!mob && simT > 0.3) {
      const countProgress = cl01((simT - 0.3) / 0.4);
      const count = Math.floor(easeOut(countProgress) * 1000);
      ctx.save();
      ctx.globalAlpha = 0.4 * cl01(simT * 2);
      ctx.font = '600 9px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = colorWithAlpha(VIOLET, 0.7);
      ctx.fillText(
        `${count.toLocaleString()} paths`,
        nexX,
        cy + mc.histYs[histN - 1] * spread - 22,
      );
      ctx.restore();
    }
  }
};

/* ── Scene 1: Volatility Gauge ── */
const renderGauge: SceneRenderer = (ctx, cx, cy, r, t, _time, mob) => {
  const gaugeR = r * (mob ? 0.45 : 0.5);
  const arcW = gaugeR * 0.18;
  const midR = gaugeR - arcW / 2;
  const startAngle = Math.PI * 0.75; // 135 deg
  const totalArc = Math.PI * 1.5; // 270 deg
  const targetVal = 0.62;
  const currentVal = easeOut(cl01(t / 0.55)) * targetVal;

  // Zone arcs (0→30%)
  const arcT = cl01(t / 0.3);
  if (arcT > 0) {
    const zones = [
      { from: 0, to: 0.33, color: EMERALD },
      { from: 0.33, to: 0.66, color: AMBER },
      { from: 0.66, to: 1, color: ROSE },
    ];

    zones.forEach((zone) => {
      const drawTo = cl01(arcT * 3 - zone.from * 3);
      if (drawTo <= 0) return;
      const zStart = startAngle + zone.from * totalArc;
      const zEnd =
        startAngle +
        (zone.from + (zone.to - zone.from) * drawTo) * totalArc;

      // Filled zone band
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = arcW;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.arc(cx, cy, midR, zStart, zEnd);
      ctx.stroke();
      ctx.restore();
    });

    // Outer ring
    ctx.save();
    ctx.globalAlpha = 0.15 * arcT;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, startAngle, startAngle + totalArc);
    ctx.stroke();
    ctx.restore();

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * totalArc;
      const isMajor = i % 5 === 0;
      const inner = gaugeR * (isMajor ? 1.02 : 1.01);
      const outer = gaugeR * (isMajor ? 1.1 : 1.06);
      ctx.save();
      ctx.globalAlpha = (isMajor ? 0.35 : 0.12) * arcT;
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(angle) * inner,
        cy + Math.sin(angle) * inner,
      );
      ctx.lineTo(
        cx + Math.cos(angle) * outer,
        cy + Math.sin(angle) * outer,
      );
      ctx.stroke();
      ctx.restore();
    }

    // Zone labels
    if (!mob && arcT > 0.8) {
      const la = (arcT - 0.8) * 5;
      const labels = ['Low', 'Medium', 'High'];
      const positions = [0.165, 0.5, 0.83];
      ctx.save();
      ctx.font = '400 8px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      labels.forEach((lbl, i) => {
        const angle = startAngle + positions[i] * totalArc;
        const labelR = gaugeR * 1.18;
        ctx.globalAlpha = 0.3 * la;
        ctx.fillStyle = zones[i].color;
        ctx.fillText(
          lbl,
          cx + Math.cos(angle) * labelR,
          cy + Math.sin(angle) * labelR,
        );
      });
      ctx.restore();
    }
  }

  // Needle (15→65%)
  const needleT = cl01((t - 0.15) / 0.5);
  if (needleT > 0) {
    const needleAngle = startAngle + currentVal * totalArc;
    const needleLen = gaugeR * 0.72;
    const tipX = cx + Math.cos(needleAngle) * needleLen;
    const tipY = cy + Math.sin(needleAngle) * needleLen;

    // Tip glow
    const gr = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 10);
    gr.addColorStop(0, colorWithAlpha(AMBER, 0.4 * needleT));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Needle
    ctx.save();
    ctx.globalAlpha = 0.8 * needleT;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();

    // Hub dot
    ctx.fillStyle = colorWithAlpha(VIOLET, 0.8 * needleT);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Value display (35→100%)
  const textT = cl01((t - 0.35) / 0.25);
  if (textT > 0) {
    const displayVal = Math.round(currentVal * 100);
    ctx.save();
    ctx.globalAlpha = textT;
    ctx.font = mob
      ? '700 28px Sora, system-ui, sans-serif'
      : '700 38px Sora, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorWithAlpha(AMBER, 0.8);
    ctx.fillText(`${displayVal}`, cx, cy + gaugeR * 0.28);

    ctx.font = mob
      ? '400 8px Sora, system-ui, sans-serif'
      : '400 9px Sora, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(
      'VOLATILITY INDEX',
      cx,
      cy + gaugeR * 0.28 + (mob ? 18 : 24),
    );
    ctx.restore();
  }
};

/* ── Scene 2: Portfolio Donut ── */
const renderPortfolio: SceneRenderer = (ctx, cx, cy, r, t, _time, mob) => {
  const donutR = r * (mob ? 0.38 : 0.4);
  const arcW = donutR * 0.4;
  const midR = donutR - arcW / 2;
  const pieX = cx - (mob ? 0 : r * 0.15);
  const pieY = cy;

  const segments = [
    { label: 'NIFTY 50', pct: 0.35, color: VIOLET },
    { label: 'GOLD', pct: 0.2, color: AMBER },
    { label: 'HDFC Bank', pct: 0.18, color: BLUE },
    { label: 'Reliance', pct: 0.15, color: EMERALD },
    { label: 'Cash', pct: 0.12, color: GRAY },
  ];

  // Donut (0→45%)
  const pieT = easeOut(cl01(t / 0.45));
  if (pieT > 0) {
    let angle = -Math.PI / 2;
    const totalSweep = pieT * Math.PI * 2;
    let swept = 0;

    segments.forEach((seg) => {
      const segSweep = Math.min(
        seg.pct * Math.PI * 2,
        totalSweep - swept,
      );
      if (segSweep <= 0) return;

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = arcW;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.arc(pieX, pieY, midR, angle, angle + segSweep);
      ctx.stroke();
      ctx.restore();

      // Thin separator
      if (swept > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(
          pieX + Math.cos(angle) * (midR - arcW / 2),
          pieY + Math.sin(angle) * (midR - arcW / 2),
        );
        ctx.lineTo(
          pieX + Math.cos(angle) * (midR + arcW / 2),
          pieY + Math.sin(angle) * (midR + arcW / 2),
        );
        ctx.stroke();
        ctx.restore();
      }

      swept += segSweep;
      angle += segSweep;
    });
  }

  // Segment labels (35→70%)
  const labelT = cl01((t - 0.35) / 0.35);
  if (labelT > 0 && !mob) {
    let angle = -Math.PI / 2;
    const labelR = donutR + 16;

    segments.forEach((seg, i) => {
      const segAngle = angle + (seg.pct * Math.PI * 2) / 2;
      const labelAlpha = cl01((labelT - i * 0.15) / 0.3);
      if (labelAlpha <= 0) {
        angle += seg.pct * Math.PI * 2;
        return;
      }

      const lx = pieX + Math.cos(segAngle) * labelR;
      const ly = pieY + Math.sin(segAngle) * labelR;
      const align = lx > pieX ? 'left' : 'right';
      const textX = lx + (align === 'left' ? 6 : -6);

      ctx.save();
      ctx.globalAlpha = 0.5 * labelAlpha;
      ctx.font = '500 8px Sora, system-ui, sans-serif';
      ctx.textAlign = align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = seg.color;
      ctx.fillText(
        `${seg.label}  ${Math.round(seg.pct * 100)}%`,
        textX,
        ly,
      );
      ctx.restore();

      // Connecting line
      ctx.save();
      ctx.globalAlpha = 0.15 * labelAlpha;
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(
        pieX + Math.cos(segAngle) * (midR + arcW / 2 + 2),
        pieY + Math.sin(segAngle) * (midR + arcW / 2 + 2),
      );
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.restore();

      angle += seg.pct * Math.PI * 2;
    });
  }

  // Center text
  const centerT = cl01((t - 0.3) / 0.2);
  if (centerT > 0) {
    ctx.save();
    ctx.globalAlpha = centerT * 0.6;
    ctx.font = mob
      ? '600 11px Sora, system-ui, sans-serif'
      : '600 13px Sora, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = WHITE;
    ctx.fillText('Optimal', pieX, pieY - 6);
    ctx.font = mob
      ? '400 8px Sora, system-ui, sans-serif'
      : '400 9px Sora, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Mix', pieX, pieY + 8);
    ctx.restore();
  }
};

/* ── Scene 3: Risk Score ── */
const renderRiskScore: SceneRenderer = (ctx, cx, cy, r, t, _time, mob) => {
  const targetScore = 73;
  const currentScore = Math.round(easeOut(cl01(t / 0.5)) * targetScore);

  // Score colour (green → yellow → amber → red)
  function scoreColor(score: number): string {
    if (score < 33) return EMERALD;
    if (score < 55) return AMBER;
    if (score < 80) return 'rgba(251, 146, 60, 1)'; // orange
    return ROSE;
  }

  // Big number (0→55%)
  const numT = cl01(t / 0.55);
  if (numT > 0) {
    const col = scoreColor(currentScore);
    ctx.save();
    ctx.globalAlpha = numT;
    ctx.font = mob
      ? '700 56px Sora, system-ui, sans-serif'
      : '700 72px Sora, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = col;
    ctx.shadowBlur = 16;
    ctx.fillStyle = colorWithAlpha(col, 0.9);
    ctx.fillText(`${currentScore}`, cx, cy - r * 0.1);
    ctx.shadowBlur = 0;
    ctx.fillText(`${currentScore}`, cx, cy - r * 0.1);
    ctx.restore();

    // "/99" suffix
    ctx.save();
    ctx.globalAlpha = numT * 0.3;
    ctx.font = mob
      ? '400 18px Sora, system-ui, sans-serif'
      : '400 22px Sora, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = WHITE;
    const mainW = mob ? 38 : 48;
    ctx.fillText('/ 99', cx + mainW, cy - r * 0.1);
    ctx.restore();
  }

  // Risk bar (10→65%)
  const barT = cl01((t - 0.1) / 0.55);
  if (barT > 0) {
    const barW = r * (mob ? 1.1 : 1.2);
    const barH = mob ? 6 : 8;
    const barX = cx - barW / 2;
    const barY = cy + r * 0.15;
    const fillW = barW * (currentScore / 99);

    // Background track
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = WHITE;
    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fill();
    ctx.restore();

    // Filled portion with gradient
    if (fillW > 2) {
      ctx.save();
      ctx.globalAlpha = 0.5 * barT;
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, EMERALD);
      grad.addColorStop(0.33, AMBER);
      grad.addColorStop(0.66, 'rgba(251, 146, 60, 1)');
      grad.addColorStop(1, ROSE);
      ctx.fillStyle = grad;
      roundRect(ctx, barX, barY, fillW, barH, barH / 2);
      ctx.fill();
      ctx.restore();
    }

    // Zone labels below bar
    if (!mob && barT > 0.5) {
      const za = (barT - 0.5) * 2;
      const zones = [
        { label: 'Low', x: barX + barW * 0.165, color: EMERALD },
        { label: 'Medium', x: barX + barW * 0.5, color: AMBER },
        { label: 'High', x: barX + barW * 0.83, color: ROSE },
      ];
      ctx.save();
      ctx.font = '400 8px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      zones.forEach((z) => {
        ctx.globalAlpha = 0.3 * za;
        ctx.fillStyle = z.color;
        ctx.fillText(z.label, z.x, barY + barH + 14);
      });
      ctx.restore();
    }
  }

  // Verdict label (45→75%)
  const verdictT = cl01((t - 0.45) / 0.3);
  if (verdictT > 0) {
    ctx.save();
    ctx.globalAlpha = verdictT * 0.5;
    ctx.font = mob
      ? '500 10px Sora, system-ui, sans-serif'
      : '500 12px Sora, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Moderate-High Risk', cx, cy + r * 0.35);
    ctx.restore();
  }
};

const RENDERERS: SceneRenderer[] = [
  renderMonteCarlo,
  renderGauge,
  renderPortfolio,
  renderRiskScore,
];

/* ═══════════════ Component ═══════════════ */

export function ProbabilityCascadeCanvas() {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const startRef = useRef(0);
  const mcRef = useRef<MCData | null>(null);

  const TOOL_FONT = isMobile
    ? '600 9px Sora, system-ui, sans-serif'
    : '600 10px Sora, system-ui, sans-serif';
  const SUB_FONT = isMobile
    ? '400 8px Sora, system-ui, sans-serif'
    : '400 9px Sora, system-ui, sans-serif';
  const METRIC_FONT = isMobile
    ? '600 9px Sora, system-ui, sans-serif'
    : '600 10px Sora, system-ui, sans-serif';
  const BADGE_FONT = '500 8px Sora, system-ui, sans-serif';

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!startRef.current) startRef.current = time;
      if (!mcRef.current) mcRef.current = buildMCData();

      const elapsed = time - startRef.current;
      const sceneIdx = Math.floor(elapsed / SCENE_MS) % SCENES.length;
      const sceneElapsed = elapsed % SCENE_MS;
      const scene = SCENES[sceneIdx];
      const renderer = RENDERERS[sceneIdx];

      // Scene-local animation progress (within active window)
      const t = cl01((sceneElapsed - FADE_MS) / ACTIVE_MS);

      // Fade envelope
      const fade =
        sceneElapsed < FADE_MS
          ? sceneElapsed / FADE_MS
          : sceneElapsed > SCENE_MS - FADE_MS
            ? (SCENE_MS - sceneElapsed) / FADE_MS
            : 1;

      // Drawing area (leave room for labels at top + dots at bottom)
      const topPad = isMobile ? 36 : 44;
      const botPad = isMobile ? 32 : 38;
      const areaH = h - topPad - botPad;
      const cx = w / 2;
      const cy = topPad + areaH * 0.48;
      const radius = Math.min(w * 0.46, areaH * 0.46);

      /* ── Background: dot grid ── */
      const gs = isMobile ? 40 : 50;
      ctx.fillStyle = 'rgba(167, 139, 250, 0.012)';
      for (let gx = gs; gx < w; gx += gs) {
        for (let gy = gs; gy < h; gy += gs) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── Horizontal guides ── */
      const gLines = isMobile ? 4 : 6;
      for (let i = 1; i <= gLines; i++) {
        const gy = topPad + (areaH / (gLines + 1)) * i;
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.018)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      /* ── Scene content (faded) ── */
      ctx.save();
      ctx.globalAlpha = fade;

      // Render the scene visualization
      renderer(ctx, cx, cy, radius, t, time, isMobile, mcRef.current);

      /* ── Tool label (top-left) ── */
      const labelX = isMobile ? 12 : 16;
      const labelY = isMobile ? 14 : 18;

      // Label pill background
      const charReveal = cl01((sceneElapsed - 100) / 300);
      const visibleToolChars = Math.ceil(charReveal * scene.tool.length);
      const toolText = scene.tool.slice(0, visibleToolChars);

      if (toolText.length > 0) {
        ctx.save();
        ctx.font = TOOL_FONT;
        const toolW = ctx.measureText(scene.tool).width;

        // Background
        ctx.globalAlpha = fade * 0.35;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        roundRect(
          ctx,
          labelX - 6,
          labelY - 8,
          toolW + 12,
          isMobile ? 28 : 32,
          6,
        );
        ctx.fill();

        // Border
        ctx.strokeStyle = colorWithAlpha(VIOLET, 0.12);
        ctx.lineWidth = 0.5;
        roundRect(
          ctx,
          labelX - 6,
          labelY - 8,
          toolW + 12,
          isMobile ? 28 : 32,
          6,
        );
        ctx.stroke();

        // Tool name
        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = colorWithAlpha(VIOLET, 0.9);
        ctx.textBaseline = 'top';
        ctx.fillText(toolText, labelX, labelY - 2);

        // Subtitle
        ctx.globalAlpha = fade * cl01((sceneElapsed - 300) / 400) * 0.5;
        ctx.font = SUB_FONT;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(scene.subtitle, labelX, labelY + (isMobile ? 11 : 13));

        ctx.restore();
      }

      /* ── Metric (bottom-right) ── */
      const metricT = cl01((t - 0.65) / 0.25);
      if (metricT > 0) {
        const mx = w - (isMobile ? 12 : 16);
        const my = h - botPad - (isMobile ? 6 : 8);

        ctx.save();
        ctx.font = METRIC_FONT;
        const metricW = ctx.measureText(scene.metric).width;

        // Background pill
        ctx.globalAlpha = fade * metricT * 0.35;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        roundRect(ctx, mx - metricW - 16, my - 8, metricW + 20, 22, 6);
        ctx.fill();
        ctx.strokeStyle = colorWithAlpha(scene.metricColor, 0.15);
        ctx.lineWidth = 0.5;
        roundRect(ctx, mx - metricW - 16, my - 8, metricW + 20, 22, 6);
        ctx.stroke();

        // Text
        ctx.globalAlpha = fade * metricT * 0.75;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = scene.metricColor;
        ctx.shadowBlur = 6;
        ctx.fillStyle = colorWithAlpha(scene.metricColor, 0.85);
        ctx.fillText(scene.metric, mx - 4, my + 3);
        ctx.shadowBlur = 0;
        ctx.fillText(scene.metric, mx - 4, my + 3);

        ctx.restore();
      }

      ctx.restore(); // end fade group

      /* ── Progress dots (always visible) ── */
      const dotR = isMobile ? 2.5 : 3;
      const dotGap = isMobile ? 10 : 12;
      const dotsW = (SCENES.length - 1) * dotGap;
      const dotsX = cx - dotsW / 2;
      const dotsY = h - (isMobile ? 12 : 14);

      for (let i = 0; i < SCENES.length; i++) {
        const isActive = i === sceneIdx;
        ctx.save();
        ctx.globalAlpha = isActive ? 0.8 : 0.18;
        ctx.fillStyle = isActive ? VIOLET : WHITE;
        ctx.beginPath();
        ctx.arc(
          dotsX + i * dotGap,
          dotsY,
          isActive ? dotR + 0.5 : dotR,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }

      /* ── "9 free tools" badge ── */
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.font = BADGE_FONT;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = WHITE;
      ctx.fillText('9 free tools', w - (isMobile ? 10 : 14), dotsY);
      ctx.restore();

      /* ── Mouse glow ── */
      const mouse = mouseRef.current;
      if (mouse) {
        const mg = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          80,
        );
        mg.addColorStop(0, 'rgba(167,139,250,0.025)');
        mg.addColorStop(1, 'transparent');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [isMobile, TOOL_FONT, SUB_FONT, METRIC_FONT],
  );

  return (
    <PretextCanvas
      draw={draw}
      fallback={<ParticleField count={50} />}
      fps={isMobile ? 30 : 60}
      onMouseMove={(x: number, y: number) => {
        mouseRef.current = { x, y };
      }}
      onMouseLeave={() => {
        mouseRef.current = null;
      }}
    />
  );
}
