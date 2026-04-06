'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { GRID_CELLS } from '../pretext/data/gridNumbers';
import { colorWithAlpha } from '../pretext/canvasEffects';

/* ── Convergence particle ── */
interface ConvParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  alpha: number;
  size: number;
}

export function ConvergenceCanvas({ accentColor = 'emerald' }: { accentColor?: string }) {
  const isMobile = useMobileDetect();
  const particlesRef = useRef<ConvParticle[] | null>(null);
  const count = isMobile ? 25 : 60;

  const accent =
    accentColor === 'blue' ? 'rgba(96, 165, 250, 0.5)'
    : accentColor === 'violet' ? 'rgba(167, 139, 250, 0.5)'
    : 'rgba(110, 231, 183, 0.5)';

  const spawnParticle = useCallback((w: number, h: number): ConvParticle => {
    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;
    switch (edge) {
      case 0: x = Math.random() * w; y = -10; break;
      case 1: x = w + 10; y = Math.random() * h; break;
      case 2: x = Math.random() * w; y = h + 10; break;
      default: x = -10; y = Math.random() * h; break;
    }
    const cell = GRID_CELLS[Math.floor(Math.random() * GRID_CELLS.length)];
    return {
      x, y,
      vx: 0, vy: 0,
      text: isMobile ? '' : cell.value,
      alpha: 0.05 + Math.random() * 0.1,
      size: 7 + Math.random() * 2,
    };
  }, [isMobile]);

  const getParticles = useCallback((w: number, h: number) => {
    if (particlesRef.current) return particlesRef.current;
    const particles: ConvParticle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push(spawnParticle(w, h));
    }
    particlesRef.current = particles;
    return particles;
  }, [count, spawnParticle]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) => {
      const particles = getParticles(w, h);
      const cx = w / 2;
      const cy = h / 2;

      particles.forEach((p) => {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;

        // Gravitational force: F = 0.5 / d^0.8
        const force = 0.5 / Math.pow(d, 0.8);
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;

        // Slight angular drift for spiral effect
        p.vx += (-dy / d) * force * 0.3;
        p.vy += (dx / d) * force * 0.3;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        // Absorption ring — fade and respawn at 80px from center
        if (d < 80) {
          p.alpha -= 0.02;
          if (p.alpha <= 0) {
            Object.assign(p, spawnParticle(w, h));
          }
        }

        if (p.alpha <= 0) return;

        // Brightness increases closer to center
        const brightness = Math.min(1, 200 / d);
        const drawAlpha = p.alpha * brightness;

        if (p.text) {
          ctx.save();
          ctx.globalAlpha = drawAlpha;
          ctx.font = `400 ${p.size}px Sora, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(accent, 0.8);
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
        }

        // Dot behind text (or standalone on mobile)
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4 + brightness * 3);
        grad.addColorStop(0, colorWithAlpha(accent, drawAlpha * 0.6));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + brightness * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [accent, getParticles, spawnParticle],
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      <PretextCanvas draw={draw} fps={isMobile ? 30 : 60} />
    </div>
  );
}
