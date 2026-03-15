'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ALGO } from './constants';
import { fadeUp, staggerContainer } from './animations';

const CURVE_POINTS = [
  0, 2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 13, 11, 15, 14, 18, 16, 20, 19, 23, 21, 25, 24, 28, 26, 30,
];
const SVG_W = 400;
const SVG_H = 160;
const maxVal = Math.max(...CURVE_POINTS);
const points = CURVE_POINTS.map((v, i) => ({
  x: (i / (CURVE_POINTS.length - 1)) * SVG_W,
  y: SVG_H - (v / maxVal) * (SVG_H - 20) - 10,
}));
const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
const areaPath = `${linePath} L${SVG_W},${SVG_H} L0,${SVG_H} Z`;

function CodeBlock({ animate }: { animate: boolean }) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= ALGO.codeBlock.length) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [animate]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden font-mono text-sm relative">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/25" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">strategy.config</span>
        {/* Circuit breaker indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" style={{ animation: 'soft-pulse 3s ease-in-out infinite' }} />
          <span className="text-[10px] text-green-400/70">Active</span>
        </div>
      </div>
      <div className="p-5 space-y-1.5">
        {ALGO.codeBlock.map((line, i) => (
          <div
            key={line.key}
            className={`flex gap-3 transition-opacity duration-300 ${i < visibleLines ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="text-brand-emerald/20 w-5 text-right select-none tabular-nums">{i + 1}</span>
            <span className="text-brand-blue/70">{line.key}:</span>
            <span className={line.key === 'Status' ? 'text-brand-emerald' : 'text-white'}>
              {line.value}
            </span>
          </div>
        ))}
        {/* Blinking cursor */}
        {visibleLines >= ALGO.codeBlock.length && (
          <div className="flex gap-3">
            <span className="text-brand-emerald/20 w-5 text-right select-none tabular-nums">{ALGO.codeBlock.length + 1}</span>
            <span className="w-2 h-4 bg-brand-emerald/50" style={{ animation: 'blink-cursor 1s step-end infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function EquityCurve({ animate }: { animate: boolean }) {
  // Grid line positions at 25%, 50%, 75% of SVG_H
  const gridLines = [0.25, 0.5, 0.75].map((pct) => SVG_H * pct);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-5">
      <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-display">Equity Curve</div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="emerald-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {gridLines.map((y) => (
          <line key={y} x1="0" y1={y} x2={SVG_W} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
        ))}

        <motion.path
          d={areaPath}
          fill="url(#emerald-fade)"
          initial={{ opacity: 0 }}
          animate={animate ? { opacity: 0.3 } : {}}
          transition={{ duration: 1.5, delay: 1.2 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="#6EE7B7"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

export function AlgoPlayground() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="landing-section">
      <div className="container max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Code + Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <CodeBlock animate={inView} />
            <EquityCurve animate={inView} />
          </motion.div>

          {/* Right — Copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <motion.span variants={fadeUp} className="section-label">
              {ALGO.label}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="font-display headline-xl text-4xl md:text-5xl lg:text-6xl text-white mb-6"
            >
              <span className="font-bold">{ALGO.headline}</span>
              <br />
              <span className="text-muted-foreground font-light">{ALGO.headlineLine2}</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg"
            >
              {ALGO.body}
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href={ALGO.cta.href}>
                <Button
                  size="lg"
                  className="h-12 px-8 bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] backdrop-blur-sm transition-all"
                >
                  {ALGO.cta.label} &rarr;
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
