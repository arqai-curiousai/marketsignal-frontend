'use client';

/**
 * Data Constellation Field — subtle animated background for the Footer.
 *
 * Sparse dots drifting slowly, connected by faint lines when close.
 * Occasional data pulses travel along connections.
 * Hidden on mobile for battery savings.
 */

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../landing/pretext/PretextCanvas';
import { useMobileDetect } from '../landing/pretext/useMobileDetect';
import {
  colorWithAlpha,
  dist,
} from '../landing/pretext/canvasEffects';

/* ── Tuning ── */
const PARTICLE_COUNT = 35;
const CONNECT_DIST = 85;
const DRIFT_SPEED = 0.12;
const DOT_ALPHA_MIN = 0.04;
const DOT_ALPHA_MAX = 0.08;
const LINE_ALPHA = 0.025;
const EMERALD = 'rgba(110, 231, 183, 1)';
const DOT_RADIUS = 1.5;

/* ── Types ── */
interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
}

interface Pulse {
  fromIdx: number;
  toIdx: number;
  t: number;
  speed: number;
}

export function FooterCanvas() {
  const isMobile = useMobileDetect();
  const dotsRef = useRef<Dot[] | null>(null);
  const pulsesRef = useRef<Pulse[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      /* Lazy init / reinit on resize */
      if (
        !dotsRef.current ||
        sizeRef.current.w !== w ||
        sizeRef.current.h !== h
      ) {
        sizeRef.current = { w, h };
        const dots: Dot[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const angle = Math.random() * Math.PI * 2;
          dots.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: Math.cos(angle) * DRIFT_SPEED * (0.5 + Math.random()),
            vy: Math.sin(angle) * DRIFT_SPEED * (0.5 + Math.random()),
            alpha:
              DOT_ALPHA_MIN + Math.random() * (DOT_ALPHA_MAX - DOT_ALPHA_MIN),
            phase: Math.random() * Math.PI * 2,
          });
        }
        dotsRef.current = dots;
      }

      const dots = dotsRef.current;

      /* Move dots, wrap at edges */
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -10) d.x = w + 10;
        if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10;
        if (d.y > h + 10) d.y = -10;
      });

      /* Draw connections between nearby dots */
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const d = dist(dots[i].x, dots[i].y, dots[j].x, dots[j].y);
          if (d < CONNECT_DIST) {
            const fade = 1 - d / CONNECT_DIST;
            ctx.save();
            ctx.globalAlpha = LINE_ALPHA * fade;
            ctx.strokeStyle = EMERALD;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      /* Draw dots */
      dots.forEach((d) => {
        const breathe = Math.sin(time * 0.001 + d.phase) * 0.02;
        ctx.save();
        ctx.globalAlpha = d.alpha + breathe;
        ctx.fillStyle = EMERALD;
        ctx.beginPath();
        ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        /* Tiny glow */
        const g = ctx.createRadialGradient(
          d.x,
          d.y,
          0,
          d.x,
          d.y,
          DOT_RADIUS * 4,
        );
        g.addColorStop(0, colorWithAlpha(EMERALD, (d.alpha + breathe) * 0.5));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, DOT_RADIUS * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      /* Spawn pulses occasionally */
      if (Math.random() < 0.008 && pulsesRef.current.length < 3) {
        /* Pick two nearby dots */
        const i = Math.floor(Math.random() * dots.length);
        let closest = -1;
        let closestD = Infinity;
        for (let j = 0; j < dots.length; j++) {
          if (j === i) continue;
          const d = dist(dots[i].x, dots[i].y, dots[j].x, dots[j].y);
          if (d < CONNECT_DIST && d < closestD) {
            closestD = d;
            closest = j;
          }
        }
        if (closest >= 0) {
          pulsesRef.current.push({
            fromIdx: i,
            toIdx: closest,
            t: 0,
            speed: 0.008 + Math.random() * 0.006,
          });
        }
      }

      /* Draw pulses */
      const alive: Pulse[] = [];
      pulsesRef.current.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) return;

        const from = dots[p.fromIdx];
        const to = dots[p.toIdx];
        if (!from || !to) return;

        const px = from.x + (to.x - from.x) * p.t;
        const py = from.y + (to.y - from.y) * p.t;
        const fade = p.t < 0.15 ? p.t / 0.15 : p.t > 0.85 ? (1 - p.t) / 0.15 : 1;

        /* Glow */
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 5);
        pg.addColorStop(0, colorWithAlpha(EMERALD, 0.2 * fade));
        pg.addColorStop(1, 'transparent');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();

        /* Core */
        ctx.save();
        ctx.globalAlpha = 0.5 * fade;
        ctx.fillStyle = EMERALD;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        alive.push(p);
      });
      pulsesRef.current = alive;
    },
    [],
  );

  /* Hidden on mobile */
  if (isMobile) return null;

  return <PretextCanvas draw={draw} fps={30} />;
}
