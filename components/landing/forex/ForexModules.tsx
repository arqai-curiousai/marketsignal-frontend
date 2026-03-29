'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FOREX_MODULES } from '../constants/forex';
import { fadeUp, staggerContainer, scaleReveal } from '../animations';
import { VideoClip } from '../VideoClip';

const GLOW_MAP: Record<string, string> = {
  blue: 'rgba(96,165,250,0.06)',
  emerald: 'rgba(110,231,183,0.06)',
  amber: 'rgba(251,191,36,0.06)',
};

const TEXT_MAP: Record<string, string> = {
  blue: 'text-brand-blue',
  emerald: 'text-brand-emerald',
  amber: 'text-brand-amber',
};

const DOT_MAP: Record<string, string> = {
  blue: 'bg-brand-blue shadow-[0_0_6px_rgba(96,165,250,0.4)]',
  emerald: 'bg-brand-emerald shadow-[0_0_6px_rgba(110,231,183,0.4)]',
  amber: 'bg-brand-amber shadow-[0_0_6px_rgba(251,191,36,0.4)]',
};

export function ForexModules() {
  return (
    <section id="showcase" className="landing-section relative overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.p variants={fadeUp} className="section-label justify-center">
            FOUR MODULES
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl headline-xl text-white mb-6"
          >
            <span className="font-bold">Heatmaps, Strength,</span>{' '}
            <span className="font-serif italic gradient-text-hero">Technicals, Sessions</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four analytical lenses on 28 forex pairs — from macro overview to granular technicals, every session covered
          </motion.p>
        </motion.div>

        {/* Module Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {FOREX_MODULES.map((mod) => {
            const Icon = mod.icon;
            const glowColor = GLOW_MAP[mod.glowColor] ?? GLOW_MAP.blue;
            const textColor = TEXT_MAP[mod.glowColor] ?? TEXT_MAP.blue;
            const dotColor = DOT_MAP[mod.glowColor] ?? DOT_MAP.blue;

            return (
              <motion.div
                key={mod.id}
                variants={scaleReveal}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bento-card flex flex-col group"
              >
                {/* Video preview */}
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-4 bg-white/[0.02] border border-white/[0.06]">
                  <VideoClip
                    webm={mod.video.webm}
                    mp4={mod.video.mp4}
                    overlay={false}
                    opacity={1}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: `inset 0 0 60px ${glowColor}` }}
                  />
                </div>

                {/* Icon + Label */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 ${textColor}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {mod.label}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="text-lg font-bold text-white mb-2">{mod.headline}</h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                  {mod.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {mod.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-white/60">
                      <div className={`mt-1 w-1 h-1 rounded-full shrink-0 ${dotColor}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/login"
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} hover:opacity-80 transition-opacity`}
                >
                  {mod.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
