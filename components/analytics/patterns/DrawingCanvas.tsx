'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

// ─── Types ──────────────────────────────────────────────────

export type DrawingTool = 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle' | 'eraser';

export interface DrawingPoint {
  time: string;
  price: number;
}

export interface Drawing {
  id: string;
  type: DrawingTool;
  points: DrawingPoint[];
  createdAt: number;
}

interface DrawingCanvasProps {
  chartApi: IChartApi | null;
  candleSeries: ISeriesApi<'Candlestick'> | null;
  width: number;
  height: number;
  activeTool: DrawingTool | null;
  drawings: Drawing[];
  onDrawingComplete: (drawing: Drawing) => void;
  onDrawingDelete: (id: string) => void;
}

// ─── Constants ──────────────────────────────────────────────

const DRAWING_COLOR = 'rgba(74, 222, 128, 0.7)';
const FILL_COLOR = 'rgba(74, 222, 128, 0.08)';
const LABEL_COLOR = 'rgba(74, 222, 128, 0.6)';
const LABEL_FONT = '10px Inter, system-ui, sans-serif';
const ERASER_RADIUS = 10;
const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 1];
const LINE_EXTEND = 50;

// Wabi-sabi: subtle line width variation for organic feel
function wabiLineWidth(position: number): number {
  return 1.5 + 0.3 * Math.sin(position * 0.1);
}

// ─── Component ──────────────────────────────────────────────

export function DrawingCanvas({
  chartApi,
  candleSeries,
  width,
  height,
  activeTool,
  drawings,
  onDrawingComplete,
  onDrawingDelete,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingPointRef = useRef<DrawingPoint | null>(null);
  const dragStartRef = useRef<DrawingPoint | null>(null);
  const mousePixelRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);

  // HiDPI/Retina: scale canvas buffer while keeping CSS size
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // ── Coordinate conversion helpers ──

  const pixelToPoint = useCallback(
    (x: number, y: number): DrawingPoint | null => {
      if (!chartApi || !candleSeries) return null;
      const time = chartApi.timeScale().coordinateToTime(x);
      const price = candleSeries.coordinateToPrice(y);
      if (time == null || price == null) return null;
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum)) return null;
      return { time: String(time), price: priceNum };
    },
    [chartApi, candleSeries]
  );

  const pointToPixel = useCallback(
    (point: DrawingPoint): { x: number; y: number } | null => {
      if (!chartApi || !candleSeries) return null;
      const x = chartApi.timeScale().timeToCoordinate(point.time as never);
      const y = candleSeries.priceToCoordinate(point.price);
      if (x == null || y == null) return null;
      return { x: Number(x), y: Number(y) };
    },
    [chartApi, candleSeries]
  );

  // ── Render all drawings onto canvas ──

  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const allDrawings = [...drawings];

    // Include in-progress drawing preview
    const pending = pendingPointRef.current;
    const mouse = mousePixelRef.current;
    if (activeTool && pending && mouse && activeTool !== 'eraser') {
      const mousePoint = pixelToPoint(mouse.x, mouse.y);
      if (mousePoint) {
        const preview: Drawing = {
          id: '__preview__',
          type: activeTool,
          points:
            activeTool === 'horizontal'
              ? [mousePoint]
              : [pending, mousePoint],
          createdAt: 0,
        };
        allDrawings.push(preview);
      }
    }

    for (const drawing of allDrawings) {
      const isPreview = drawing.id === '__preview__';
      const alpha = isPreview ? 0.5 : 1;

      if (drawing.type === 'trendline') {
        renderTrendline(ctx, drawing, alpha);
      } else if (drawing.type === 'horizontal') {
        renderHorizontal(ctx, drawing, alpha);
      } else if (drawing.type === 'fibonacci') {
        renderFibonacci(ctx, drawing, alpha);
      } else if (drawing.type === 'rectangle') {
        renderRectangle(ctx, drawing, alpha);
      }
    }

    // Eraser cursor — brighter on dark backgrounds for visibility
    if (activeTool === 'eraser' && mouse) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, ERASER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 113, 133, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, activeTool, pointToPixel, pixelToPoint, dpr]);

  // ── Drawing renderers ──

  function renderTrendline(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    alpha: number
  ) {
    if (drawing.points.length < 2) return;
    const p1 = pointToPixel(drawing.points[0]);
    const p2 = pointToPixel(drawing.points[1]);
    if (!p1 || !p2) return;

    // Extend line beyond endpoints
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const ux = dx / len;
    const uy = dy / len;

    const startX = p1.x - ux * LINE_EXTEND;
    const startY = p1.y - uy * LINE_EXTEND;
    const endX = p2.x + ux * LINE_EXTEND;
    const endY = p2.y + uy * LINE_EXTEND;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = DRAWING_COLOR;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = wabiLineWidth(p1.x + p1.y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Draw endpoint dots
    for (const p of [p1, p2]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = DRAWING_COLOR;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function renderHorizontal(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    alpha: number
  ) {
    if (drawing.points.length < 1) return;
    const p = pointToPixel(drawing.points[0]);
    if (!p) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(canvas.width, p.y);
    ctx.strokeStyle = DRAWING_COLOR;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = wabiLineWidth(p.y);
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Price label
    const label = drawing.points[0].price.toFixed(2);
    ctx.font = LABEL_FONT;
    ctx.fillStyle = LABEL_COLOR;
    ctx.globalAlpha = alpha;
    ctx.fillText(label, canvas.width - ctx.measureText(label).width - 8, p.y - 4);
    ctx.globalAlpha = 1;
  }

  function renderFibonacci(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    alpha: number
  ) {
    if (drawing.points.length < 2) return;
    const p1 = pointToPixel(drawing.points[0]);
    const p2 = pointToPixel(drawing.points[1]);
    if (!p1 || !p2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const highPrice = Math.max(drawing.points[0].price, drawing.points[1].price);
    const lowPrice = Math.min(drawing.points[0].price, drawing.points[1].price);
    const range = highPrice - lowPrice;

    ctx.font = LABEL_FONT;

    for (let i = 0; i < FIBONACCI_LEVELS.length; i++) {
      const level = FIBONACCI_LEVELS[i];
      const price = highPrice - range * level;
      const fakePoint: DrawingPoint = { time: drawing.points[0].time, price };
      const pixel = pointToPixel(fakePoint);
      if (!pixel) continue;

      // Draw level line
      ctx.beginPath();
      ctx.moveTo(0, pixel.y);
      ctx.lineTo(canvas.width, pixel.y);
      ctx.strokeStyle = DRAWING_COLOR;
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = wabiLineWidth(pixel.y + i);
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Fill zone between levels
      if (i < FIBONACCI_LEVELS.length - 1) {
        const nextLevel = FIBONACCI_LEVELS[i + 1];
        const nextPrice = highPrice - range * nextLevel;
        const nextFakePoint: DrawingPoint = { time: drawing.points[0].time, price: nextPrice };
        const nextPixel = pointToPixel(nextFakePoint);
        if (nextPixel) {
          ctx.fillStyle = FILL_COLOR;
          ctx.globalAlpha = alpha;
          ctx.fillRect(0, pixel.y, canvas.width, nextPixel.y - pixel.y);
          ctx.globalAlpha = 1;
        }
      }

      // Label
      const label = `${(level * 100).toFixed(1)}% (${price.toFixed(2)})`;
      ctx.fillStyle = LABEL_COLOR;
      ctx.globalAlpha = alpha;
      ctx.fillText(label, 8, pixel.y - 4);
      ctx.globalAlpha = 1;
    }
  }

  function renderRectangle(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    alpha: number
  ) {
    if (drawing.points.length < 2) return;
    const p1 = pointToPixel(drawing.points[0]);
    const p2 = pointToPixel(drawing.points[1]);
    if (!p1 || !p2) return;

    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    // Fill
    ctx.fillStyle = FILL_COLOR;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    // Stroke
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.strokeStyle = DRAWING_COLOR;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = wabiLineWidth(x + y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Find drawing nearest to a pixel coordinate ──

  const findNearestDrawing = useCallback(
    (mx: number, my: number): string | null => {
      let closestId: string | null = null;
      let closestDist = ERASER_RADIUS;

      for (const drawing of drawings) {
        if (drawing.type === 'horizontal' && drawing.points.length >= 1) {
          const p = pointToPixel(drawing.points[0]);
          if (p && Math.abs(p.y - my) < closestDist) {
            closestDist = Math.abs(p.y - my);
            closestId = drawing.id;
          }
        } else if (drawing.type === 'trendline' && drawing.points.length >= 2) {
          const p1 = pointToPixel(drawing.points[0]);
          const p2 = pointToPixel(drawing.points[1]);
          if (p1 && p2) {
            const dist = pointToLineDistance(mx, my, p1.x, p1.y, p2.x, p2.y);
            if (dist < closestDist) {
              closestDist = dist;
              closestId = drawing.id;
            }
          }
        } else if (drawing.type === 'fibonacci' && drawing.points.length >= 2) {
          const highPrice = Math.max(drawing.points[0].price, drawing.points[1].price);
          const lowPrice = Math.min(drawing.points[0].price, drawing.points[1].price);
          const range = highPrice - lowPrice;
          for (const level of FIBONACCI_LEVELS) {
            const price = highPrice - range * level;
            const fakePoint: DrawingPoint = { time: drawing.points[0].time, price };
            const p = pointToPixel(fakePoint);
            if (p && Math.abs(p.y - my) < closestDist) {
              closestDist = Math.abs(p.y - my);
              closestId = drawing.id;
            }
          }
        } else if (drawing.type === 'rectangle' && drawing.points.length >= 2) {
          const p1 = pointToPixel(drawing.points[0]);
          const p2 = pointToPixel(drawing.points[1]);
          if (p1 && p2) {
            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);
            // Check if click is near any edge
            const edges = [
              pointToLineDistance(mx, my, x, y, x + w, y),
              pointToLineDistance(mx, my, x + w, y, x + w, y + h),
              pointToLineDistance(mx, my, x + w, y + h, x, y + h),
              pointToLineDistance(mx, my, x, y + h, x, y),
            ];
            const minEdge = Math.min(...edges);
            // Also allow clicking inside the rectangle
            const inside = mx >= x && mx <= x + w && my >= y && my <= y + h;
            if ((minEdge < closestDist) || (inside && closestDist > ERASER_RADIUS * 0.5)) {
              closestDist = inside ? ERASER_RADIUS * 0.5 : minEdge;
              closestId = drawing.id;
            }
          }
        }
      }

      return closestId;
    },
    [drawings, pointToPixel]
  );

  // ── Shared pointer logic ──

  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      if (!activeTool || !chartApi || !candleSeries) return;

      if (activeTool === 'eraser') {
        const id = findNearestDrawing(x, y);
        if (id) onDrawingDelete(id);
        return;
      }

      if (activeTool === 'horizontal') {
        const point = pixelToPoint(x, y);
        if (point) {
          onDrawingComplete({
            id: crypto.randomUUID(),
            type: 'horizontal',
            points: [point],
            createdAt: Date.now(),
          });
        }
        return;
      }

      // Two-click tools: trendline, fibonacci
      if (activeTool === 'trendline' || activeTool === 'fibonacci') {
        const point = pixelToPoint(x, y);
        if (!point) return;

        if (!pendingPointRef.current) {
          pendingPointRef.current = point;
        } else {
          onDrawingComplete({
            id: crypto.randomUUID(),
            type: activeTool,
            points: [pendingPointRef.current, point],
            createdAt: Date.now(),
          });
          pendingPointRef.current = null;
          mousePixelRef.current = null;
        }
        return;
      }

      // Rectangle: drag
      if (activeTool === 'rectangle') {
        const point = pixelToPoint(x, y);
        if (point) {
          dragStartRef.current = point;
          pendingPointRef.current = point;
        }
      }
    },
    [activeTool, chartApi, candleSeries, pixelToPoint, findNearestDrawing, onDrawingComplete, onDrawingDelete]
  );

  const handlePointerMove = useCallback(
    (x: number, y: number) => {
      if (!activeTool) return;
      mousePixelRef.current = { x, y };

      // Request re-render for preview
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderDrawings);
    },
    [activeTool, renderDrawings]
  );

  const handlePointerUp = useCallback(
    (x: number, y: number) => {
      if (activeTool !== 'rectangle' || !dragStartRef.current) return;
      const endPoint = pixelToPoint(x, y);

      if (endPoint) {
        onDrawingComplete({
          id: crypto.randomUUID(),
          type: 'rectangle',
          points: [dragStartRef.current, endPoint],
          createdAt: Date.now(),
        });
      }
      dragStartRef.current = null;
      pendingPointRef.current = null;
      mousePixelRef.current = null;
    },
    [activeTool, pixelToPoint, onDrawingComplete]
  );

  // ── Mouse event handlers ──

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      handlePointerDown(e.clientX - rect.left, e.clientY - rect.top);
    },
    [handlePointerDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      handlePointerMove(e.clientX - rect.left, e.clientY - rect.top);
    },
    [handlePointerMove]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      handlePointerUp(e.clientX - rect.left, e.clientY - rect.top);
    },
    [handlePointerUp]
  );

  // ── Touch event handlers ──

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!activeTool) return;
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || e.touches.length === 0) return;
      const touch = e.touches[0];
      handlePointerDown(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    [activeTool, handlePointerDown]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!activeTool) return;
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || e.touches.length === 0) return;
      const touch = e.touches[0];
      handlePointerMove(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    [activeTool, handlePointerMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!activeTool) return;
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      handlePointerUp(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    [activeTool, handlePointerUp]
  );

  // ── Re-render on drawings change ──

  useEffect(() => {
    renderDrawings();
  }, [renderDrawings]);

  // ── Re-render on chart scroll/zoom ──

  useEffect(() => {
    if (!chartApi) return;

    const handler = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderDrawings);
    };

    chartApi.timeScale().subscribeVisibleTimeRangeChange(handler);
    return () => {
      chartApi.timeScale().unsubscribeVisibleTimeRangeChange(handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [chartApi, renderDrawings]);

  // ── Clear pending state when tool changes ──

  useEffect(() => {
    pendingPointRef.current = null;
    dragStartRef.current = null;
    mousePixelRef.current = null;
  }, [activeTool]);

  // ── Cursor style ──
  const cursor = !activeTool
    ? 'default'
    : activeTool === 'eraser'
      ? 'pointer'
      : 'crosshair';

  // Hide canvas entirely when no tool active and no drawings to render
  const shouldHide = !activeTool && drawings.length === 0;

  return (
    <canvas
      ref={canvasRef}
      width={shouldHide ? 0 : width * dpr}
      height={shouldHide ? 0 : height * dpr}
      className={`absolute inset-0 z-[5]${shouldHide ? ' hidden' : ''}`}
      style={{
        width: shouldHide ? 0 : width,
        height: shouldHide ? 0 : height,
        pointerEvents: activeTool ? 'auto' : 'none',
        touchAction: activeTool ? 'none' : 'auto',
        cursor,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

// ── Geometry util ──

function pointToLineDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}
