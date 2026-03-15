'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HERO } from './constants';
import { fadeUp, blurIn } from './animations';

function MarketPulse() {
  const waves = [
    { d: 'M0,80 Q40,30 80,60 T160,45 T240,65 T320,35 T400,55', color: '#6EE7B7', opacity: 0.6, delay: 0 },
    { d: 'M0,90 Q50,50 100,70 T200,55 T300,75 T400,45', color: '#4ADE80', opacity: 0.3, delay: 0.3 },
    { d: 'M0,70 Q60,100 120,60 T240,80 T360,50 T400,70', color: '#22C55E', opacity: 0.2, delay: 0.6 },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-40 h-40 bg-brand-emerald/[0.08] blur-[80px] rounded-full"
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-brand-blue/[0.06] blur-[60px] rounded-full"
        animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Waves */}
      <svg viewBox="0 0 400 140" className="w-full h-auto relative z-10" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[30, 55, 80, 105].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
        ))}

        {waves.map((wave, i) => (
          <motion.path
            key={i}
            d={wave.d}
            fill="none"
            stroke={wave.color}
            strokeWidth={i === 0 ? 2 : 1.5}
            strokeLinecap="round"
            opacity={wave.opacity}
            filter={i === 0 ? 'url(#glow)' : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: wave.opacity }}
            transition={{ duration: 2, delay: wave.delay, ease: 'easeOut' }}
          />
        ))}

        {/* Animated dot on main wave */}
        <motion.circle
          cx="0"
          cy="80"
          r="3"
          fill="#6EE7B7"
          opacity={0.8}
          initial={{ cx: 0 }}
          animate={{ cx: 400 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <animate attributeName="cy" values="80;60;45;65;35;55" dur="4s" repeatCount="indefinite" />
        </motion.circle>

        {/* Glow trail for dot */}
        <motion.circle
          cx="0"
          cy="80"
          r="8"
          fill="#6EE7B7"
          opacity={0.15}
          filter="url(#glow)"
          initial={{ cx: 0 }}
          animate={{ cx: 400 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <animate attributeName="cy" values="80;60;45;65;35;55" dur="4s" repeatCount="indefinite" />
        </motion.circle>
      </svg>

      {/* Floating stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute top-4 right-4 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
      >
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">NIFTY 50</div>
        <div className="text-sm font-bold text-white tabular-nums font-display">22,147.50</div>
        <div className="text-[10px] text-green-400 font-medium">+1.28%</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-6 left-4 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
      >
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Signal</div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
          <span className="text-xs font-bold text-green-400">BUY</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">0.82</span>
        </div>
      </motion.div>
    </div>
  );
}

function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <motion.div
        className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-white/5"
        animate={{ scaleY: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-white/20"
        animate={{ y: [0, 4, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="grain-overlay relative w-full min-h-[100vh] flex items-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Aurora gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-brand-emerald/[0.04] blur-[150px] rounded-full"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-brand-violet/[0.04] blur-[130px] rounded-full"
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-brand-blue/[0.03] blur-[120px] rounded-full"
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.span
              variants={fadeUp}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-emerald rounded-full px-5 py-2 mb-8 gradient-border-animated"
            >
              {HERO.badge}
            </motion.span>

            <motion.h1
              variants={blurIn}
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] headline-xl text-white mb-8"
            >
              <span className="font-bold">{HERO.headline[0]}</span>
              <br />
              <span className="font-light bg-gradient-to-r from-brand-emerald via-brand-blue to-brand-emerald bg-[length:200%_auto] bg-clip-text text-transparent">
                {HERO.headline[1]}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
            >
              {HERO.sub}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href={HERO.primaryCta.href}>
                <Button
                  size="lg"
                  className="h-14 px-8 text-base bg-brand-emerald text-brand-slate font-semibold hover:bg-brand-emerald/90 transition-all shadow-[0_0_20px_rgba(110,231,183,0.15)] hover:shadow-[0_0_40px_rgba(110,231,183,0.25)]"
                >
                  {HERO.primaryCta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href={HERO.secondaryCta.href}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] text-white transition-all"
                >
                  {HERO.secondaryCta.label}
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Market Pulse Visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="hidden lg:block relative h-[340px]"
          >
            <MarketPulse />
          </motion.div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
