'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { GRID_CELLS } from '../pretext/data/gridNumbers';
import { colorWithAlpha } from '../pretext/canvasEffects';

/* ── Floating number echo ── */
interface FloatingEcho {
  value: string;
  x: number;
  y: number;
  speed: number;
  alpha: number;
  phase: number;
}

const ECHO_COUNT = 20;

export function TrustBarCanvas({ accentColor = 'emerald' }: { accentColor?: string }) {
  const isMobile = useMobileDetect();
  const echoesRef = useRef<FloatingEcho[] | null>(null);

  // Accent color for glows
  const accent =
    accentColor === 'blue' ? 'rgba(96, 165, 250, 0.5)'
    : accentColor === 'violet' ? 'rgba(167, 139, 250, 0.5)'
    : 'rgba(110, 231, 183, 0.5)';

  // Initialize echoes lazily
  const getEchoes = useCallback((w: number, h: number) => {
    if (echoesRef.current) return echoesRef.current;
    const echoes: FloatingEcho[] = [];
    for (let i = 0; i < ECHO_COUNT; i++) {
      const cell = GRID_CELLS[Math.floor(Math.random() * GRID_CELLS.length)];
      echoes.push({
        value: cell.value,
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.1 + Math.random() * 0.2,
        alpha: 0.03 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
      });
    }
    echoesRef.current = echoes;
    return echoes;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const echoes = getEchoes(w, h);

      // Floating number echoes drifting upward
      ctx.font = '400 9px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      echoes.forEach((e) => {
        e.y -= e.speed;
        if (e.y < -20) {
          e.y = h + 20;
          e.x = Math.random() * w;
        }

        const twinkle = Math.sin(time * 0.002 + e.phase) * 0.01;
        ctx.fillStyle = colorWithAlpha(accent, e.alpha + twinkle);
        ctx.fillText(e.value, e.x, e.y);
      });

      // Subtle glow connections arc across the stat positions
      // Draw a gentle arc from left to right through the center
      const arcY = h * 0.5;
      const curveHeight = h * 0.3;
      ctx.save();
      ctx.strokeStyle = colorWithAlpha(accent, 0.04);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, arcY);
      ctx.quadraticCurveTo(w * 0.5, arcY - curveHeight, w * 0.9, arcY);
      ctx.stroke();

      // Traveling pulse dot along the arc
      const pulseProgress = (time * 0.0002) % 1;
      const t = pulseProgress;
      const px = (1 - t) * (1 - t) * w * 0.1 + 2 * (1 - t) * t * w * 0.5 + t * t * w * 0.9;
      const py = (1 - t) * (1 - t) * arcY + 2 * (1 - t) * t * (arcY - curveHeight) + t * t * arcY;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
      grad.addColorStop(0, colorWithAlpha(accent, 0.2));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colorWithAlpha(accent, 0.5);
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    [accent, getEchoes],
  );

  if (isMobile) return null;

  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block">
      <PretextCanvas draw={draw} fps={30} />
    </div>
  );
}
