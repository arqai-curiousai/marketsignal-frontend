/**
 * Dashboard-specific canvas drawing primitives for News Intelligence.
 * Extends the shared canvasEffects.ts with news-domain visualizations.
 * All functions are pure Canvas 2D calls — zero allocations in the hot path.
 */

import { colorWithAlpha } from '@/components/landing/pretext/canvasEffects';

/* ── EKG Waveform ── */

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  points: number[],
  color: string,
  channelY: number,
  channelHeight: number,
  alpha: number = 0.6,
): void {
  if (points.length < 2) return;
  const mid = channelY + channelHeight / 2;
  const amp = channelHeight * 0.4;

  ctx.save();
  ctx.strokeStyle = colorWithAlpha(color, alpha);
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();

  const step = 1;
  for (let i = 0; i < points.length; i++) {
    const x = i * step;
    const y = mid - points[i] * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Faint glow under the line
  ctx.globalAlpha = 0.08;
  ctx.lineTo((points.length - 1) * step, mid + channelHeight / 2);
  ctx.lineTo(0, mid + channelHeight / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/* ── Stream Band (story arc rivers) ── */

export interface StreamPoint {
  x: number;
  y: number;
  thickness: number;
  sentiment: number;
}

export function drawStreamBand(
  ctx: CanvasRenderingContext2D,
  points: StreamPoint[],
  baseColor: string,
  alpha: number = 0.25,
): void {
  if (points.length < 2) return;
  ctx.save();

  // Top edge
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y - points[0].thickness / 2);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.quadraticCurveTo(cpx, prev.y - prev.thickness / 2, curr.x, curr.y - curr.thickness / 2);
  }

  // Bottom edge (reversed)
  for (let i = points.length - 1; i >= 0; i--) {
    const curr = points[i];
    if (i === points.length - 1) {
      ctx.lineTo(curr.x, curr.y + curr.thickness / 2);
    } else {
      const next = points[i + 1];
      const cpx = (next.x + curr.x) / 2;
      ctx.quadraticCurveTo(cpx, next.y + next.thickness / 2, curr.x, curr.y + curr.thickness / 2);
    }
  }
  ctx.closePath();

  // Gradient fill based on sentiment
  const grad = ctx.createLinearGradient(points[0].x, 0, points[points.length - 1].x, 0);
  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    const s = points[i].sentiment;
    const c = s > 0.15 ? '#10B981' : s < -0.15 ? '#EF4444' : baseColor;
    grad.addColorStop(t, colorWithAlpha(c, alpha));
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // Top edge stroke
  ctx.strokeStyle = colorWithAlpha(baseColor, alpha + 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y - points[0].thickness / 2);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.quadraticCurveTo(cpx, prev.y - prev.thickness / 2, curr.x, curr.y - curr.thickness / 2);
  }
  ctx.stroke();

  ctx.restore();
}

/* ── Time Axis ── */

export function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  labels: { x: number; text: string }[],
  y: number,
  width: number,
  color: string,
  font: string,
): void {
  ctx.save();
  // Axis line
  ctx.strokeStyle = colorWithAlpha(color, 0.08);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  // Tick marks and labels
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colorWithAlpha(color, 0.3);
  for (const label of labels) {
    // Tick
    ctx.beginPath();
    ctx.moveTo(label.x, y);
    ctx.lineTo(label.x, y + 4);
    ctx.stroke();
    // Label
    ctx.fillText(label.text, label.x, y + 6);
  }
  ctx.restore();
}

/* ── Phase Dot ── */

const PHASE_DOT_COLORS: Record<string, string> = {
  breaking: '#EF4444',
  developing: '#F59E0B',
  analysis: '#818CF8',
  reaction: '#3B82F6',
  concluded: '#64748B',
};

export function drawPhaseDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: string,
  size: number = 4,
): void {
  const color = PHASE_DOT_COLORS[phase] || '#64748B';

  // Glow
  const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
  grad.addColorStop(0, colorWithAlpha(color, 0.3));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Sentiment Dot ── */

export function drawSentimentDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sentiment: number,
  size: number = 3,
): void {
  const color =
    sentiment > 0.15 ? '#10B981' :
    sentiment < -0.15 ? '#EF4444' :
    '#64748B';

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Info Card (dashboard variant) ── */

export function drawDashInfoCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lines: { label: string; value: string; color?: string }[],
  width: number = 150,
  font: string = '400 9px Inter, system-ui, sans-serif',
  labelFont: string = '600 9px Sora, system-ui, sans-serif',
): void {
  const lineH = 14;
  const padX = 8;
  const padY = 6;
  const height = padY * 2 + lines.length * lineH;

  // Keep card in viewport
  const cardX = x + width + 16 > ctx.canvas.width / (window.devicePixelRatio || 1)
    ? x - width - 12
    : x + 12;
  const cardY = Math.max(4, Math.min(y - height / 2, ctx.canvas.height / (window.devicePixelRatio || 1) - height - 4));

  ctx.save();
  // Background
  ctx.fillStyle = 'rgba(8, 10, 20, 0.92)';
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, width, height, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, width, height, 6);
  ctx.stroke();

  // Lines
  ctx.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i++) {
    const ly = cardY + padY + i * lineH + lineH / 2;
    // Label
    ctx.font = labelFont;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(lines[i].label, cardX + padX, ly);
    // Value
    ctx.font = font;
    ctx.textAlign = 'right';
    ctx.fillStyle = lines[i].color || 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(lines[i].value, cardX + width - padX, ly);
  }
  ctx.restore();
}

/* ── Grid Lines (background pattern) ── */

export function drawGridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number = 40,
  color: string = 'rgba(255, 255, 255, 0.025)',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  // Horizontal
  for (let y = spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Vertical
  for (let x = spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();
}

/* ── Rounded rect helper ── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}
