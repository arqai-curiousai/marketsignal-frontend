/**
 * Shared canvas drawing primitives for the cosmic thought-map visual language.
 * All functions are pure Canvas 2D calls with zero allocations in the hot path.
 */

/* ── Node rendering ── */

export function drawGlowingNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  intensity: number,
  breathePhase: number,
): void {
  const br = Math.max(0.1, radius + Math.sin(breathePhase) * Math.min(3, radius * 0.4));
  const alpha = 0.03 + intensity * 0.05;

  // Outer radial gradient glow
  const grad = ctx.createRadialGradient(x, y, br * 0.3, x, y, br * 2.5);
  grad.addColorStop(0, colorWithAlpha(color, alpha * 1.5));
  grad.addColorStop(0.5, colorWithAlpha(color, alpha * 0.5));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, br * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner fill
  ctx.fillStyle = colorWithAlpha(color, 0.03 + intensity * 0.05);
  ctx.beginPath();
  ctx.arc(x, y, br, 0, Math.PI * 2);
  ctx.fill();

  // Ring stroke
  ctx.strokeStyle = colorWithAlpha(color, 0.12 + intensity * 0.13);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, br, 0, Math.PI * 2);
  ctx.stroke();
}

/* ── Connection lines ── */

export function drawConnection(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha: number,
  curveOffset?: number,
): void {
  ctx.save();
  ctx.strokeStyle = colorWithAlpha(color, alpha);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  if (curveOffset) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const nx = -dy;
    const ny = dx;
    const len = Math.sqrt(nx * nx + ny * ny) || 1;
    ctx.quadraticCurveTo(
      mx + (nx / len) * curveOffset,
      my + (ny / len) * curveOffset,
      x2,
      y2,
    );
  } else {
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.restore();
}

/* ── Data pulse (glowing dot traveling a path) ── */

export function drawDataPulse(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number,
  color: string,
  size: number,
  curveOffset?: number,
): void {
  let px: number, py: number;
  if (curveOffset) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const nx = -dy;
    const ny = dx;
    const len = Math.sqrt(nx * nx + ny * ny) || 1;
    const cx = mx + (nx / len) * curveOffset;
    const cy = my + (ny / len) * curveOffset;
    const t = progress;
    const t1 = 1 - t;
    px = t1 * t1 * x1 + 2 * t1 * t * cx + t * t * x2;
    py = t1 * t1 * y1 + 2 * t1 * t * cy + t * t * y2;
  } else {
    px = x1 + (x2 - x1) * progress;
    py = y1 + (y2 - y1) * progress;
  }

  // Diffuse glow
  const grad = ctx.createRadialGradient(px, py, 0, px, py, size * 3);
  grad.addColorStop(0, colorWithAlpha(color, 0.4));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, size * 3, 0, Math.PI * 2);
  ctx.fill();

  // Bright core
  ctx.fillStyle = colorWithAlpha(color, 0.9);
  ctx.beginPath();
  ctx.arc(px, py, size, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Text rendered as a luminous data point ── */

export function drawTextStar(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  glowColor: string,
  twinklePhase: number,
): void {
  const alpha = 0.4 + Math.sin(twinklePhase) * 0.15;
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Glow layer
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.fillStyle = colorWithAlpha(color, alpha);
  ctx.fillText(text, x, y);
  // Crisp overlay
  ctx.shadowBlur = 0;
  ctx.fillStyle = colorWithAlpha(color, alpha + 0.1);
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ── Gravitational lens (returns adjusted positions) ── */

export interface GravNode {
  x: number;
  y: number;
  renderX: number;
  renderY: number;
}

export function applyGravitationalLens(
  mouseX: number,
  mouseY: number,
  nodes: GravNode[],
  strength: number,
  radius: number,
): void {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const dx = mouseX - n.x;
    const dy = mouseY - n.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius && dist > 1) {
      const force = ((radius - dist) / radius) * strength;
      n.renderX = n.x + (dx / dist) * force;
      n.renderY = n.y + (dy / dist) * force;
    } else {
      n.renderX = n.x;
      n.renderY = n.y;
    }
  }
}

/* ── Orbital ring ── */

export function drawOrbitalRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  color: string,
  alpha: number,
  dashPattern?: number[],
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.strokeStyle = colorWithAlpha(color, alpha);
  ctx.lineWidth = 1;
  if (dashPattern) ctx.setLineDash(dashPattern);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* ── Particle stream batch renderer ── */

export interface StreamParticle {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

export function drawParticleStream(
  ctx: CanvasRenderingContext2D,
  particles: StreamParticle[],
  color: string,
): void {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.alpha <= 0) continue;
    // Diffuse glow
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    grad.addColorStop(0, colorWithAlpha(color, p.alpha * 0.6));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.fillStyle = colorWithAlpha(color, p.alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── Sonar pulse ring ── */

export function drawSonarPulse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxRadius: number,
  progress: number,
  color: string,
): void {
  const r = maxRadius * progress;
  const alpha = (1 - progress) * 0.15;
  ctx.strokeStyle = colorWithAlpha(color, alpha);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/* ── Breaking news pulse (red sonar variant) ── */

export function drawBreakingPulse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxRadius: number,
  progress: number,
): void {
  const r = maxRadius * progress;
  const alpha = (1 - progress) * 0.2;
  ctx.strokeStyle = `rgba(239, 68, 68, ${clamp01(alpha)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/* ── Arc glow trail ── */

export function drawArcTrail(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number; visible: boolean }[],
  currentT: number,
  color: string,
): void {
  const trailSteps = [0.015, 0.03, 0.05, 0.075];
  for (let i = 0; i < trailSteps.length; i++) {
    const t = currentT - trailSteps[i];
    if (t < 0) continue;
    const idx = Math.floor(t * (points.length - 1));
    const pt = points[Math.min(idx, points.length - 1)];
    if (!pt.visible) continue;
    const fade = 1 - (i + 1) / (trailSteps.length + 1);
    ctx.fillStyle = colorWithAlpha(color, 0.2 * fade);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── Info card (hover panel for city) ── */

export function drawInfoCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cityName: string,
  headline: string,
  sentimentScore: number,
  articleCount: number,
  breakingCount: number,
  labelSide: 1 | -1,
  time: number,
): void {
  const cardW = 160;
  const cardH = 52;
  const gap = 14;
  const cardX = labelSide > 0 ? x + gap : x - gap - cardW;
  const cardY = y - cardH / 2;

  // Card background
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(8, 10, 20, 0.88)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 6);
  ctx.fill();

  // Border
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = 'rgba(110, 231, 183, 1)';
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const px = cardX + 8;
  const py = cardY + 14;

  // City name
  ctx.font = '600 9px Sora, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(cityName, px, py);

  // Sentiment dot
  const nameW = ctx.measureText(cityName).width;
  const dotColor =
    sentimentScore > 0.15
      ? 'rgba(16, 185, 129, 1)'
      : sentimentScore < -0.15
        ? 'rgba(239, 68, 68, 1)'
        : 'rgba(148, 163, 184, 1)';
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(px + nameW + 7, py, 3, 0, Math.PI * 2);
  ctx.fill();

  // Headline
  ctx.font = '400 8px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  const truncated = truncateText(ctx, headline, cardW - 16);
  ctx.fillText(truncated, px, py + 12);

  // Article count + sentiment bar
  ctx.font = '400 7px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(`${articleCount} stories`, px, py + 24);

  // Mini sentiment bar
  const barX = px + 45;
  const barY = py + 21;
  const barW = 24;
  const barH = 3;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(barX, barY, barW, barH);
  const fillW = barW * clamp01((sentimentScore + 1) / 2);
  const barColor =
    sentimentScore > 0.15
      ? 'rgba(16, 185, 129, 0.7)'
      : sentimentScore < -0.15
        ? 'rgba(239, 68, 68, 0.7)'
        : 'rgba(148, 163, 184, 0.5)';
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, fillW, barH);

  // Breaking badge
  if (breakingCount > 0) {
    const bx = cardX + cardW - 30;
    const by = cardY + 6;
    // Pulsing red dot
    const pulse = 0.6 + Math.sin(time * 0.005) * 0.4;
    ctx.fillStyle = `rgba(239, 68, 68, ${clamp01(pulse)})`;
    ctx.beginPath();
    ctx.arc(bx, by + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 6px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillText('LIVE', bx + 5, by + 5.5);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
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

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/* ── Helpers ── */

export function colorWithAlpha(color: string, alpha: number): string {
  // Handle rgba(r, g, b, a) format — replace the alpha
  const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${clamp01(alpha)})`;
  }
  // Handle hex
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
  }
  return color;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
