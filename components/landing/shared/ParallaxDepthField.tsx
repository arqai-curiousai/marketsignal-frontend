'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { GRID_CELLS } from '../pretext/data/gridNumbers';

/* ── Depth layer particle ── */
interface DepthParticle {
  x: number;
  y: number;
  text: string;
  layer: number; // 1=near, 2=mid, 3=far
  speed: number;
  alpha: number;
  fontSize: number;
}

export function ParallaxDepthField() {
  const isMobile = useMobileDetect();
  const particlesRef = useRef<DepthParticle[] | null>(null);

  const getParticles = useCallback((w: number, h: number) => {
    if (particlesRef.current) return particlesRef.current;
    const particles: DepthParticle[] = [];

    if (isMobile) {
      // Mobile: 1 layer, 8 items
      for (let i = 0; i < 8; i++) {
        const cell = GRID_CELLS[Math.floor(Math.random() * GRID_CELLS.length)];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          text: cell.value,
          layer: 2,
          speed: 0.1,
          alpha: 0.04,
          fontSize: 7,
        });
      }
    } else {
      // Far layer: 30 tiny dots
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * (h + 100),
          text: '',
          layer: 3,
          speed: 0.05,
          alpha: 0.03,
          fontSize: 0,
        });
      }
      // Mid layer: 15 small numbers
      for (let i = 0; i < 15; i++) {
        const cell = GRID_CELLS[Math.floor(Math.random() * GRID_CELLS.length)];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * (h + 100),
          text: cell.value,
          layer: 2,
          speed: 0.1,
          alpha: 0.04 + Math.random() * 0.02,
          fontSize: 7,
        });
      }
      // Near layer: 8 ticker labels
      for (let i = 0; i < 8; i++) {
        const cell = GRID_CELLS[Math.floor(Math.random() * GRID_CELLS.length)];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * (h + 100),
          text: cell.label,
          layer: 1,
          speed: 0.15,
          alpha: 0.06 + Math.random() * 0.02,
          fontSize: 9,
        });
      }
    }

    particlesRef.current = particles;
    return particles;
  }, [isMobile]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) => {
      const particles = getParticles(w, h);

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }

        if (p.text) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.font = `400 ${p.fontSize}px Sora, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
        } else {
          // Dot
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    [getParticles],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <PretextCanvas draw={draw} fps={30} />
    </div>
  );
}
