'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  FOREX_PAIRS,
  SESSION_COLORS,
  SESSION_GLOW,
  type ForexSession,
} from '../pretext/data/forexPairs';
import { FOREX_COVERAGE } from '../constants/forex';
import {
  staggerContainer,
  clipReveal,
  clipRevealUp,
  fadeUp,
} from '../animations';

/* ── Orbiting pair ── */
interface OrbitPair {
  pair: string;
  session: ForexSession;
  width: number;
  angle: number;
  angularSpeed: number;
  orbitIndex: number; // 0=inner(asia), 1=mid(london), 2=outer(ny)
}

/* ── Price stream particle along orbit ── */
interface OrbitParticle {
  orbitIndex: number;
  angle: number;
  speed: number;
  brightness: number;
}

const SESSION_ORDER: ForexSession[] = ['asia', 'london', 'newyork'];
const SESSION_LABELS = ['Asia-Pacific', 'London', 'New York'];

export function SessionOrbitSection() {
  const isMobile = useMobileDetect();
  const pairsRef = useRef<OrbitPair[]>([]);
  const orbitParticlesRef = useRef<OrbitParticle[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const readyRef = useRef(false);
  const timeIndicatorRef = useRef(0);

  const font = isMobile
    ? '600 9px Sora, system-ui, sans-serif'
    : '600 11px Sora, system-ui, sans-serif';

  // Initialize
  useEffect(() => {
    document.fonts.ready.then(() => {
      const orbits: OrbitPair[] = [];
      const sessionIndices: Record<ForexSession, number> = {
        asia: 0,
        london: 0,
        newyork: 0,
      };

      FOREX_PAIRS.forEach((p) => {
        const handle = prepare(p.pair, font);
        let lo = 0;
        let hi = 150;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 12).lineCount <= 1) hi = mid;
          else lo = mid;
        }

        const idx = sessionIndices[p.session]++;
        const orbitIndex = SESSION_ORDER.indexOf(p.session);

        orbits.push({
          pair: p.pair,
          session: p.session,
          width: Math.ceil(hi) + 2,
          angle: (idx / 14) * Math.PI * 2 + Math.random() * 0.3,
          angularSpeed:
            (0.0002 + Math.random() * 0.00015) *
            (orbitIndex === 0 ? 1.2 : orbitIndex === 1 ? 1 : 0.8),
          orbitIndex,
        });
      });

      // Price stream particles (5-8 per orbit)
      const orbitParticles: OrbitParticle[] = [];
      for (let oi = 0; oi < 3; oi++) {
        const count = 5 + Math.floor(Math.random() * 3);
        for (let j = 0; j < count; j++) {
          orbitParticles.push({
            orbitIndex: oi,
            angle: Math.random() * Math.PI * 2,
            speed: 0.003 + Math.random() * 0.004,
            brightness: 0.3 + Math.random() * 0.5,
          });
        }
      }

      pairsRef.current = orbits;
      orbitParticlesRef.current = orbitParticles;
      readyRef.current = true;
    });
  }, [font]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) => {
      if (!readyRef.current) return;

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.18;
      const radiusStep = Math.min(w, h) * 0.13;
      const mouse = mouseRef.current;

      // Advance time indicator
      timeIndicatorRef.current += 0.0005;

      // Draw orbit ellipses
      SESSION_ORDER.forEach((session, i) => {
        const r = baseRadius + radiusStep * i;
        const color = SESSION_COLORS[session];

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.65);

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = color.replace('0.7', '0.08');
        ctx.lineWidth = 1;
        ctx.stroke();

        // Time indicator — brighter arc segment
        const tiAngle = timeIndicatorRef.current * (i === 0 ? 1.2 : i === 1 ? 1 : 0.8);
        ctx.beginPath();
        ctx.arc(0, 0, r, tiAngle - 0.3, tiAngle + 0.3);
        ctx.strokeStyle = color.replace('0.7', '0.25');
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Session label
        const labelY = cy + r * 0.65 + 20;
        ctx.save();
        ctx.font = '600 10px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = color.replace('0.7', '0.5');
        ctx.fillText(SESSION_LABELS[i], cx, labelY);
        ctx.restore();
      });

      // Price stream particles along orbits
      orbitParticlesRef.current.forEach((op) => {
        op.angle += op.speed;
        const r = baseRadius + radiusStep * op.orbitIndex;
        const px = cx + Math.cos(op.angle) * r;
        const py = cy + Math.sin(op.angle) * r * 0.65;
        const session = SESSION_ORDER[op.orbitIndex];
        const color = SESSION_COLORS[session];
        const depthFactor = (Math.sin(op.angle) + 1) / 2;
        const alpha = op.brightness * depthFactor;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, 5);
        grad.addColorStop(0, color.replace('0.7', String(alpha * 0.6)));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color.replace('0.7', String(alpha));
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw orbiting pairs
      pairsRef.current.forEach((p) => {
        const r = baseRadius + radiusStep * p.orbitIndex;
        const projX = cx + Math.cos(p.angle) * r;
        const projY = cy + Math.sin(p.angle) * r * 0.65;

        // Check mouse hover → pause + glow
        let paused = false;
        if (mouse) {
          const d = Math.sqrt((mouse.x - projX) ** 2 + (mouse.y - projY) ** 2);
          if (d < 30) paused = true;
        }

        if (!paused) p.angle += p.angularSpeed;

        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r * 0.65;
        const depthFactor = (Math.sin(p.angle) + 1) / 2;
        const opacity = paused ? 0.85 : 0.15 + depthFactor * 0.55;

        const color = SESSION_COLORS[p.session];
        const glow = SESSION_GLOW[p.session];

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = glow;
        ctx.shadowBlur = paused ? 14 : 8;
        ctx.fillStyle = color;
        ctx.fillText(p.pair, x, y);

        ctx.shadowBlur = 0;
        ctx.fillText(p.pair, x, y);
        ctx.restore();
      });

      // Center label
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 12px Sora, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('42 PAIRS', cx, cy - 8);
      ctx.font = '600 14px Sora, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('3 SESSIONS', cx, cy + 10);
      ctx.restore();
    },
    [font],
  );

  // Mobile: simple static layout
  if (isMobile) {
    return (
      <section className="landing-section-tight relative overflow-hidden px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.p variants={clipReveal} className="section-label justify-center">
              GLOBAL COVERAGE
            </motion.p>
            <motion.h2
              variants={clipRevealUp}
              className="font-display text-3xl md:text-4xl headline-lg text-white mb-4"
            >
              <span className="font-bold">{FOREX_COVERAGE.headline} </span>
              <span className="font-serif italic gradient-text-hero text-[2rem] md:text-[2.5rem]">
                {FOREX_COVERAGE.headlineSerif}
              </span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {SESSION_ORDER.map((s, i) => (
              <motion.div
                key={s}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bento-card text-center py-4"
              >
                <div
                  className="w-2 h-2 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: SESSION_COLORS[s] }}
                />
                <p className="text-xs font-semibold text-white">{SESSION_LABELS[i]}</p>
                <p className="text-[10px] text-white/40 mt-1">
                  {FOREX_PAIRS.filter((p) => p.session === s).length} pairs
                </p>
              </motion.div>
            ))}
          </div>

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {FOREX_COVERAGE.features.map((f) => (
              <motion.li
                key={f}
                variants={fadeUp}
                className="text-sm text-white/50 flex items-start gap-2"
              >
                <span className="text-brand-blue mt-0.5">•</span>
                {f}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>
    );
  }

  return (
    <section className="landing-section relative overflow-hidden px-6">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.p variants={clipReveal} className="section-label justify-center">
            GLOBAL COVERAGE
          </motion.p>
          <motion.h2
            variants={clipRevealUp}
            className="font-display text-4xl md:text-5xl lg:text-[4.5rem] headline-lg text-white mb-6"
          >
            <span className="font-bold">{FOREX_COVERAGE.headline} </span>
            <span className="font-serif italic gradient-text-hero text-[2.5rem] md:text-[3.5rem] lg:text-[5rem]">
              {FOREX_COVERAGE.headlineSerif}
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xl text-white/55 max-w-3xl mx-auto">
            {FOREX_COVERAGE.body}
          </motion.p>
        </motion.div>

        {/* Orbit canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full aspect-[16/9] max-w-4xl mx-auto mb-16"
        >
          <PretextCanvas
            draw={draw}
            fps={60}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </motion.div>

        {/* Features */}
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto"
        >
          {FOREX_COVERAGE.features.map((f) => (
            <motion.li
              key={f}
              variants={fadeUp}
              className="text-sm text-white/50 flex items-start gap-2"
            >
              <span className="text-brand-blue mt-0.5">•</span>
              {f}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
