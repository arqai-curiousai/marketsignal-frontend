'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

/* ── Particle type ── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  phase: number;
}

/* ── Floating line connection ── */
interface Connection {
  from: number;
  to: number;
}

const PARTICLE_COUNT = 45;
const MAX_CONNECT_DIST = 160;
const ACCENT = { r: 96, g: 165, b: 250 }; // brand-blue

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: 0.06 + Math.random() * 0.12,
    size: 1 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
  };
}

/**
 * Login background canvas — network constellation with subtle gravitational drift.
 * Particles drift gently, form connection lines when close, and pulse softly.
 */
export function LoginCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const animRef = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      spawnParticle(w(), h())
    );

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize);

    const draw = (time: number) => {
      const cw = w();
      const ch = h();
      ctx.clearRect(0, 0, cw, ch);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const connections: Connection[] = [];

      // Update + draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gentle drift
        p.x += p.vx;
        p.y += p.vy;

        // Soft mouse attraction
        if (mouse) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < 250) {
            const force = 0.015 * (1 - d / 250);
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Wrap edges
        if (p.x < -20) p.x = cw + 20;
        if (p.x > cw + 20) p.x = -20;
        if (p.y < -20) p.y = ch + 20;
        if (p.y > ch + 20) p.y = -20;

        // Breathing alpha
        const breathe = Math.sin(time * 0.001 + p.phase) * 0.03;
        const drawAlpha = p.alpha + breathe;

        // Glow dot
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grad.addColorStop(0, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${drawAlpha * 0.8})`);
        grad.addColorStop(0.5, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${drawAlpha * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${drawAlpha * 1.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Find connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_CONNECT_DIST) {
            connections.push({ from: i, to: j });
          }
        }
      }

      // Draw connections
      for (const conn of connections) {
        const a = particles[conn.from];
        const b = particles[conn.to];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = (1 - dist / MAX_CONNECT_DIST) * 0.08;

        ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReducedMotion, handleMouseMove, handleMouseLeave]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
