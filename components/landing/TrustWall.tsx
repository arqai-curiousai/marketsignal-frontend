'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TRUST } from './constants';
import { fadeUp, staggerContainer, scaleReveal, clipReveal, clipRevealUp } from './animations';

const ACCENT_CLASSES: Record<string, { border: string; icon: string; glow: string }> = {
  emerald: {
    border: 'card-accent-emerald',
    icon: 'bg-brand-emerald/[0.08] border-brand-emerald/[0.12] text-brand-emerald',
    glow: 'rgba(110,231,183,0.04)',
  },
  blue: {
    border: 'card-accent-blue',
    icon: 'bg-brand-blue/[0.08] border-brand-blue/[0.12] text-brand-blue',
    glow: 'rgba(96,165,250,0.04)',
  },
  violet: {
    border: 'card-accent-violet',
    icon: 'bg-brand-violet/[0.08] border-brand-violet/[0.12] text-brand-violet',
    glow: 'rgba(167,139,250,0.04)',
  },
  amber: {
    border: 'card-accent-amber',
    icon: 'bg-brand-amber/[0.08] border-brand-amber/[0.12] text-brand-amber',
    glow: 'rgba(251,191,36,0.04)',
  },
};

export function TrustWall() {
  return (
    <section className="landing-section relative overflow-hidden">
      <div className="container max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.p variants={clipReveal} className="section-label justify-center">
            {TRUST.label}
          </motion.p>
          <motion.h2
            variants={clipRevealUp}
            className="font-display text-4xl md:text-5xl lg:text-[4.5rem] headline-lg text-white mb-6"
          >
            <span className="font-bold">{TRUST.headline}</span>{' '}
            <span className="font-serif italic gradient-text-hero text-[2.5rem] md:text-[3.5rem] lg:text-[5rem]">
              {TRUST.headlineSerif}
            </span>
          </motion.h2>
        </motion.div>

        {/* 9A: Trust Pillar Cards — 4 columns */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20"
        >
          {TRUST.cards.map((card) => {
            const styles = ACCENT_CLASSES[card.accent] ?? ACCENT_CLASSES.emerald;
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                variants={scaleReveal}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`bento-card flex flex-col ${styles.border}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${styles.icon}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                </div>
                <p className="text-sm text-white/45 leading-relaxed flex-1">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* 9B: Social Proof Block */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          {/* Testimonial */}
          <motion.div
            variants={fadeUp}
            className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-12 mb-10 text-center"
          >
            {/* Quotation mark decoration */}
            <div className="absolute top-4 left-6 text-6xl font-serif text-white/[0.04] leading-none select-none">
              &ldquo;
            </div>
            <blockquote className="font-serif italic text-lg md:text-xl text-white/70 leading-relaxed mb-6 max-w-2xl mx-auto relative">
              {TRUST.testimonial.quote}
            </blockquote>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-white/60">
                {TRUST.testimonial.author}
              </p>
              <p className="text-xs text-white/30">{TRUST.testimonial.role}</p>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {TRUST.badges.map((badge) => (
              <span
                key={badge}
                className="px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 border border-white/[0.08] bg-white/[0.02]"
              >
                {badge}
              </span>
            ))}
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            variants={fadeUp}
            className="text-center text-[10px] text-white/25 uppercase tracking-[0.15em] max-w-3xl mx-auto leading-relaxed"
          >
            {TRUST.disclaimer}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
