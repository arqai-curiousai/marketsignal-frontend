'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PULSE_CORRELATION_SHOWCASE } from '../constants/pulse';
import { fadeUp, staggerContainer, slideFromLeft, slideFromRight } from '../animations';
import { VideoClip } from '../VideoClip';

export function CorrelationShowcase() {
  return (
    <section className="landing-section relative overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-8 md:gap-12 items-center">
          {/* Video (left on desktop) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={slideFromLeft}
            className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] order-2 md:order-1"
          >
            <div className="aspect-[16/10]">
              <VideoClip
                webm={PULSE_CORRELATION_SHOWCASE.video.webm}
                mp4={PULSE_CORRELATION_SHOWCASE.video.mp4}
                overlay={false}
                opacity={1}
              />
            </div>
            <div
              className="absolute inset-0 pointer-events-none rounded-xl"
              style={{ boxShadow: 'inset 0 0 80px rgba(251,191,36,0.06)' }}
            />
          </motion.div>

          {/* Copy (right on desktop) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={staggerContainer}
            className="order-1 md:order-2"
          >
            <motion.p variants={slideFromRight} className="section-label">
              {PULSE_CORRELATION_SHOWCASE.label}
            </motion.p>
            <motion.h3
              variants={slideFromRight}
              className="font-display text-3xl md:text-4xl headline-xl text-white mb-4 font-bold"
            >
              {PULSE_CORRELATION_SHOWCASE.headline}
            </motion.h3>
            <motion.p variants={slideFromRight} className="text-base text-muted-foreground leading-relaxed mb-6">
              {PULSE_CORRELATION_SHOWCASE.sub}
            </motion.p>

            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PULSE_CORRELATION_SHOWCASE.features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                >
                  <p className="text-xs font-semibold text-white mb-1">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground">{f.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
