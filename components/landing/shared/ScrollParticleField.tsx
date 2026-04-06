'use client';

import React, { useRef, useCallback } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { colorWithAlpha } from '../pretext/canvasEffects';

interface ScrollParticle {
  x: number;
  y: number;
  speed: number;
  alpha: number;
  targetAlpha: number;
  size: number;
}

const MAX_PARTICLES = 80;
const MIN_PARTICLES = 15;

export function ScrollParticleField({
  accent = 'emerald',
  containerRef,
}: {
  accent?: 'blue' | 'emerald' | 'violet';
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const particlesRef = useRef<ScrollParticle[]>([]);
  const activeCountRef = useRef(MIN_PARTICLES);
  const initializedRef = useRef(false);

  const accentColor =
    accent === 'blue' ? 'rgba(96, 165, 250, 0.5)'
    : accent === 'violet' ? 'rgba(167, 139, 250, 0.5)'
    : 'rgba(110, 231, 183, 0.5)';

  // Track scroll progress
  const { scrollYProgress } = useScroll({ target: containerRef });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    activeCountRef.current = Math.floor(MIN_PARTICLES + (MAX_PARTICLES - MIN_PARTICLES) * v);
  });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) => {
      // Lazy init
      if (!initializedRef.current) {
        const particles: ScrollParticle[] = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 0.1 + Math.random() * 0.2,
            alpha: 0,
            targetAlpha: 0.04 + Math.random() * 0.04,
            size: 0.8 + Math.random() * 0.8,
          });
        }
        particlesRef.current = particles;
        initializedRef.current = true;
      }

      const particles = particlesRef.current;
      const active = activeCountRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fade in/out based on active count
        if (i < active) {
          p.alpha += (p.targetAlpha - p.alpha) * 0.03;
        } else {
          p.alpha += (0 - p.alpha) * 0.05;
        }

        if (p.alpha < 0.002) continue;

        // Move upward
        p.y -= p.speed;
        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }

        // Draw
        ctx.fillStyle = colorWithAlpha(accentColor, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [accentColor],
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 hidden lg:block">
      <PretextCanvas draw={draw} fps={30} />
    </div>
  );
}
