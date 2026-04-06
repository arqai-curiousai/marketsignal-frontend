import { prepare, layout, type PreparedText, type LayoutResult } from '@chenglou/pretext';

/* ── Measurement cache ── */
const handleCache = new Map<string, PreparedText>();
const layoutCache = new Map<string, LayoutResult>();

export function measureText(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
): LayoutResult {
  const layoutKey = `${text}|${font}|${maxWidth}|${lineHeight}`;
  const cached = layoutCache.get(layoutKey);
  if (cached) return cached;

  const handleKey = `${text}|${font}`;
  let handle = handleCache.get(handleKey);
  if (!handle) {
    handle = prepare(text, font);
    handleCache.set(handleKey, handle);
  }
  const result = layout(handle, maxWidth, lineHeight);
  layoutCache.set(layoutKey, result);
  return result;
}

export function measureWidth(text: string, font: string): number {
  return measureText(text, font, Infinity, 20).height > 0
    ? layout(handleCache.get(`${text}|${font}`)!, Infinity, 0).height === 0
      ? 0
      : measureText(text, font, Infinity, 20).height
    : 0;
}

/** Get exact single-line width by using Infinity maxWidth */
export function getTextWidth(text: string, font: string): number {
  const handleKey = `${text}|${font}`;
  let handle = handleCache.get(handleKey);
  if (!handle) {
    handle = prepare(text, font);
    handleCache.set(handleKey, handle);
  }
  // With infinite width, layout returns a single line — height = lineHeight
  // We need width, so we use a trick: binary search for min width that keeps lineCount=1
  const test = layout(handle, Infinity, 1);
  if (test.lineCount <= 1) {
    // Binary search for the tightest single-line width
    let lo = 0;
    let hi = 2000;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const r = layout(handle, mid, 1);
      if (r.lineCount <= 1) hi = mid;
      else lo = mid;
    }
    return Math.ceil(hi);
  }
  return 2000;
}

/* ── Canvas drawing helpers ── */
export function drawTextGlow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  glowRadius: number,
): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glowRadius;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawTextWithOpacity(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ── Easing — matches EASE_OUT_EXPO from animations.ts ── */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function clearCaches(): void {
  handleCache.clear();
  layoutCache.clear();
}
