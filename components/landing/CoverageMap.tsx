'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { COVERAGE } from './constants';
import { fadeUp, staggerContainer } from './animations';
import { WorldMap } from './WorldMap';

export function CoverageMap() {
  return (
    <section className="landing-section relative overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} className="section-label">
              {COVERAGE.label}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl headline-xl text-white mb-4"
            >
              <span className="font-bold">{COVERAGE.headline}</span>{' '}
              <span className="font-serif italic gradient-text-hero">{COVERAGE.headlineSerif}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-8">
              {COVERAGE.body}
            </motion.p>

            <motion.ul variants={staggerContainer} className="space-y-3">
              {COVERAGE.features.map((feature) => (
                <motion.li
                  key={feature}
                  variants={fadeUp}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-brand-emerald mt-0.5 shrink-0" />
                  {feature}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right — SVG World Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <WorldMap />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
