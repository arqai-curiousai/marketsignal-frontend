'use client';

import React, { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FOREX_MODULES } from '../constants/forex';
import { staggerContainer, clipRevealUp } from '../animations';
import { ForexModuleCanvas, type ForexModuleType } from './ForexModuleCanvas';

/* ── Number badge data ── */
const STAT_BADGES: Record<string, string> = {
  heatmap: '42',
  strength: '17',
  technicals: '6',
  sessions: '3',
};

const STAT_LABELS: Record<string, string> = {
  heatmap: 'pairs',
  strength: 'currencies',
  technicals: 'timeframes',
  sessions: 'sessions',
};

/* ── Magnetic tilt card ── */
function MagneticCard({
  children,
  className,
  glowColor,
  isHero,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor: string;
  isHero?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 2;
    const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 2;
    setTilt({ x: rotateX, y: rotateY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        y: isHovered ? -8 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bento-card flex flex-col group relative ${isHero ? 'sm:col-span-2' : ''} ${className ?? ''}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Radial glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at 50% 50%, ${glowColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10 flex flex-col h-full">{children}</div>
    </motion.div>
  );
}

export function ForexModules() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <section id="showcase" className="landing-section relative overflow-hidden">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.p
            variants={clipRevealUp}
            className="section-label justify-center"
          >
            FOUR MODULES
          </motion.p>
          <motion.h2
            variants={clipRevealUp}
            className="font-display text-4xl md:text-5xl lg:text-[4.5rem] headline-lg text-white mb-6"
          >
            <span className="font-bold">Heatmaps, Strength,</span>{' '}
            <span className="font-serif italic gradient-text-hero text-[2.5rem] md:text-[3.5rem] lg:text-[5rem]">
              Technicals, Sessions
            </span>
          </motion.h2>
          <motion.p
            variants={clipRevealUp}
            className="text-xl text-white/60 max-w-2xl mx-auto"
          >
            Four analytical lenses on 42 forex pairs — from macro overview to granular technicals
          </motion.p>
        </motion.div>

        {/* 2x2 Bento Grid — first card spans 2 cols */}
        <div ref={containerRef}>
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10"
          >
            {FOREX_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              const glowColor =
                mod.glowColor === 'blue'
                  ? 'rgba(96,165,250,0.04)'
                  : mod.glowColor === 'emerald'
                    ? 'rgba(110,231,183,0.04)'
                    : 'rgba(251,191,36,0.04)';
              const textColor =
                mod.glowColor === 'blue'
                  ? 'text-brand-blue'
                  : mod.glowColor === 'emerald'
                    ? 'text-brand-emerald'
                    : 'text-brand-amber';
              const dotColor =
                mod.glowColor === 'blue'
                  ? 'bg-brand-blue shadow-[0_0_6px_rgba(96,165,250,0.4)]'
                  : mod.glowColor === 'emerald'
                    ? 'bg-brand-emerald shadow-[0_0_6px_rgba(110,231,183,0.4)]'
                    : 'bg-brand-amber shadow-[0_0_6px_rgba(251,191,36,0.4)]';

              const badge = STAT_BADGES[mod.id];
              const badgeLabel = STAT_LABELS[mod.id];

              return (
                <motion.div key={mod.id} variants={clipRevealUp}>
                  <MagneticCard glowColor={glowColor} isHero={i === 0}>
                    {/* Canvas preview */}
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-5 bg-white/[0.02] border border-white/[0.04]">
                      <ForexModuleCanvas type={mod.id as ForexModuleType} />
                      {/* Number badge */}
                      {badge && (
                        <div className="absolute top-3 right-3 flex items-baseline gap-1 bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/[0.06] pointer-events-none">
                          <span className="font-display text-2xl font-bold text-white tabular-nums leading-none">
                            {badge}
                          </span>
                          <span className="text-[9px] text-white/40 uppercase tracking-wider">
                            {badgeLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Icon + Label */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <Icon className={`h-4 w-4 ${textColor}`} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        {mod.label}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-lg font-bold text-white mb-2 font-display tracking-tight">
                      {mod.headline}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-white/50 leading-relaxed mb-5 flex-1">
                      {mod.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-5">
                      {mod.features.slice(0, 3).map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-[11px] text-white/55"
                        >
                          <div
                            className={`mt-1 w-1 h-1 rounded-full shrink-0 ${dotColor}`}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href="/login"
                      className={`inline-flex items-center gap-2 text-xs font-medium ${textColor} hover:opacity-80 transition-all group/link`}
                    >
                      {mod.cta}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </MagneticCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
