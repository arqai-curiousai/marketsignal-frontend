'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface PretextCanvasProps {
  className?: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;
  fallback?: React.ReactNode;
  fps?: number;
  cursor?: string;
  onMouseMove?: (x: number, y: number) => void;
  onMouseLeave?: () => void;
  onMouseDown?: (x: number, y: number) => void;
  onMouseUp?: (x: number, y: number) => void;
  onWheel?: (deltaY: number) => void;
}

export function PretextCanvas({
  className = '',
  draw,
  fallback = null,
  fps = 60,
  cursor,
  onMouseMove,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onWheel,
}: PretextCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const isVisibleRef = useRef(true);
  const reduced = useReducedMotion();

  const drawRef = useRef(draw);
  drawRef.current = draw;

  // DPR-aware resize
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize();

    // ResizeObserver for responsive canvas
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    // IntersectionObserver — pause when off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    // Animation loop
    const interval = 1000 / fps;
    let lastTime = 0;

    const loop = (time: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (!isVisibleRef.current) return;
      if (time - lastTime < interval) return;
      lastTime = time;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      drawRef.current(ctx, w, h, time);
    };

    animRef.current = requestAnimationFrame(loop);

    // Wheel handler (non-passive to allow preventDefault)
    const wheelHandler = onWheel
      ? (e: WheelEvent) => {
          e.preventDefault();
          onWheel(e.deltaY);
        }
      : null;
    if (wheelHandler) {
      canvas.addEventListener('wheel', wheelHandler, { passive: false });
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      io.disconnect();
      if (wheelHandler) {
        canvas.removeEventListener('wheel', wheelHandler);
      }
    };
  }, [reduced, fps, resize, onWheel]);

  if (reduced) return <>{fallback}</>;

  const getCanvasPos = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleMouseMove = onMouseMove
    ? (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e.clientX, e.clientY);
        if (pos) onMouseMove(pos.x, pos.y);
      }
    : undefined;

  const handleMouseDown = onMouseDown
    ? (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e.clientX, e.clientY);
        if (pos) onMouseDown(pos.x, pos.y);
      }
    : undefined;

  const handleMouseUp = onMouseUp
    ? (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e.clientX, e.clientY);
        if (pos) onMouseUp(pos.x, pos.y);
      }
    : undefined;

  const handleTouchMove = onMouseMove
    ? (e: React.TouchEvent<HTMLCanvasElement>) => {
        const touch = e.touches[0];
        if (!touch) return;
        const pos = getCanvasPos(touch.clientX, touch.clientY);
        if (pos) onMouseMove(pos.x, pos.y);
      }
    : undefined;

  const handleTouchStart = onMouseDown
    ? (e: React.TouchEvent<HTMLCanvasElement>) => {
        const touch = e.touches[0];
        if (!touch) return;
        const pos = getCanvasPos(touch.clientX, touch.clientY);
        if (pos) onMouseDown(pos.x, pos.y);
      }
    : undefined;

  const handleTouchEnd = () => {
    if (onMouseUp) onMouseUp(0, 0);
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ width: '100%', height: '100%', touchAction: 'none', cursor: cursor ?? undefined }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  );
}
