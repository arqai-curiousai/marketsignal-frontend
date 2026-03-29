'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SIMULATION } from './constants';
import { fadeUp, staggerContainer } from './animations';

// Equity curve data points (realistic upward trend with drawdowns)
const CURVE_POINTS = [
  0, 2, 5, 3, 7, 12, 10, 15, 18, 14, 19, 22, 25, 21, 28, 32, 30, 35, 38, 42,
  39, 44, 48, 45, 50, 53, 56, 52, 58, 62, 60, 65, 68, 72, 70, 75, 78, 82, 80, 85,
];

function EquityCurve() {
  const w = 400;
  const h = 160;
  const padX = 0;
  const padY = 10;
  const maxVal = Math.max(...CURVE_POINTS);
  const points = CURVE_POINTS.map((v, i) => {
    const x = padX + (i / (CURVE_POINTS.length - 1)) * (w - 2 * padX);
    const y = h - padY - (v / maxVal) * (h - 2 * padY);
    return `${x},${y}`;
  }).join(' ');

  const linePath = `M${points.replace(/,/g, ' ').split(' ').reduce((acc, _, i, arr) => {
    if (i % 2 === 0) acc.push(`${arr[i]},${arr[i + 1]}`);
    return acc;
  }, [] as string[]).join(' L')}`;

  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1="0"
          y1={h * frac}
          x2={w}
          y2={h * frac}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="0.5"
        />
      ))}
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill="url(#equityFill)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 1 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function FanChart() {
  const w = 400;
  const h = 80;
  const startX = w * 0.4;
  const bands = [
    { spread: 35, opacity: 0.04, delay: 0.3 },
    { spread: 25, opacity: 0.06, delay: 0.2 },
    { spread: 15, opacity: 0.08, delay: 0.1 },
    { spread: 8, opacity: 0.12, delay: 0 },
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {bands.map((band, i) => (
        <motion.path
          key={i}
          d={`M${startX},${h / 2} Q${(startX + w) / 2},${h / 2 - band.spread} ${w},${h / 2 - band.spread} L${w},${h / 2 + band.spread} Q${(startX + w) / 2},${h / 2 + band.spread} ${startX},${h / 2} Z`}
          fill="#6EE7B7"
          opacity={0}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: band.opacity }}
          viewport={{ once: true }}
          transition={{ delay: 1.5 + band.delay, duration: 0.8 }}
        />
      ))}
      {/* Center line */}
      <motion.line
        x1={startX}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke="#6EE7B7"
        strokeWidth="1"
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2, duration: 1 }}
      />
      {/* Historical line */}
      <motion.path
        d={`M0,${h * 0.6} Q${startX * 0.3},${h * 0.5} ${startX * 0.5},${h * 0.55} T${startX},${h / 2}`}
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.8 }}
      />
    </svg>
  );
}

export function SimulationLab() {
  return (
    <section className="landing-section relative overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-center">
          {/* Left — Visual */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="order-2 lg:order-1"
          >
            {/* Strategy selector card */}
            <motion.div variants={fadeUp} className="bento-card mb-4 flex items-center gap-3 py-3 px-4">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse" />
              <span className="text-sm font-medium text-white font-display">{SIMULATION.strategy.name}</span>
              <span className="text-[10px] text-green-400 uppercase tracking-wider ml-auto">Active</span>
            </motion.div>

            {/* Params */}
            <motion.div variants={fadeUp} className="flex gap-2 mb-4">
              {SIMULATION.strategy.params.map((p) => (
                <div
                  key={p.key}
                  className="text-[10px] text-muted-foreground px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]"
                >
                  <span className="text-white/50">{p.key}:</span>{' '}
                  <span className="text-white tabular-nums">{p.value}</span>
                </div>
              ))}
            </motion.div>

            {/* Equity Curve */}
            <motion.div variants={fadeUp} className="bento-card p-4 mb-4">
              <EquityCurve />
            </motion.div>

            {/* Fan Chart */}
            <motion.div variants={fadeUp} className="bento-card p-4 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                GARCH Forecast Fan
              </p>
              <FanChart />
            </motion.div>

            {/* Floating Metrics */}
            <motion.div variants={staggerContainer} className="flex gap-2">
              {SIMULATION.metrics.map((m) => (
                <motion.div
                  key={m.label}
                  variants={fadeUp}
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <p className="text-sm font-bold text-white tabular-nums font-display">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Copy */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="order-1 lg:order-2"
          >
            <motion.p variants={fadeUp} className="section-label">
              {SIMULATION.label}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl headline-xl text-white mb-4"
            >
              <span className="font-bold">{SIMULATION.headline}</span>{' '}
              <span className="font-serif italic gradient-text-hero">{SIMULATION.headlineSerif}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-8">
              {SIMULATION.body}
            </motion.p>

            <motion.ul variants={staggerContainer} className="space-y-3 mb-8">
              {SIMULATION.features.map((feature) => (
                <motion.li
                  key={feature}
                  variants={fadeUp}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-emerald mt-2 shrink-0" />
                  {feature}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div variants={fadeUp}>
              <Link href={SIMULATION.cta.href}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white"
                >
                  {SIMULATION.cta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
