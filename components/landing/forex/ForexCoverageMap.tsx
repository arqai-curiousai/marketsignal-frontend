'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FOREX_COVERAGE } from '../constants/forex';
import { fadeUp, staggerContainer, scaleReveal } from '../animations';
import { WorldMap } from '../WorldMap';

export function ForexCoverageMap() {
  return (
    <section className="landing-section relative overflow-hidden">
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
            GLOBAL COVERAGE
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl headline-xl text-white mb-6"
          >
            <span className="font-bold">{FOREX_COVERAGE.headline}</span>{' '}
            <span className="font-serif italic gradient-text-hero">{FOREX_COVERAGE.headlineSerif}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {FOREX_COVERAGE.body}
          </motion.p>
        </motion.div>

        {/* Map + Features */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center">
          {/* World Map */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleReveal}
            className="relative"
          >
            <WorldMap exchanges={FOREX_COVERAGE.exchanges} />

            {/* Session overlay bars */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {FOREX_COVERAGE.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    session.id === 'asia' ? 'bg-amber-400' :
                    session.id === 'london' ? 'bg-white' :
                    'bg-brand-blue'
                  } shadow-[0_0_6px_currentColor]`} />
                  <div>
                    <p className="text-xs font-medium text-white">{session.label}</p>
                    <p className="text-[10px] text-muted-foreground">{session.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature List */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={staggerContainer}
          >
            <ul className="space-y-4">
              {FOREX_COVERAGE.features.map((feature) => (
                <motion.li
                  key={feature}
                  variants={fadeUp}
                  className="flex items-start gap-3 text-sm text-white/70"
                >
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0 shadow-[0_0_6px_rgba(96,165,250,0.4)]" />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
