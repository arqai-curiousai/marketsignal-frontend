'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SIM_PORTFOLIO_SHOWCASE } from '../constants/simulations';
import { fadeUp, staggerContainer, slideFromLeft, slideFromRight } from '../animations';
import { VideoClip } from '../VideoClip';

export function PortfolioShowcase() {
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
                webm={SIM_PORTFOLIO_SHOWCASE.video.webm}
                mp4={SIM_PORTFOLIO_SHOWCASE.video.mp4}
                overlay={false}
                opacity={1}
              />
            </div>
            <div
              className="absolute inset-0 pointer-events-none rounded-xl"
              style={{ boxShadow: 'inset 0 0 80px rgba(167,139,250,0.06)' }}
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
              {SIM_PORTFOLIO_SHOWCASE.label}
            </motion.p>
            <motion.h3
              variants={slideFromRight}
              className="font-display text-3xl md:text-4xl headline-xl text-white mb-4 font-bold"
            >
              {SIM_PORTFOLIO_SHOWCASE.headline}
            </motion.h3>
            <motion.p variants={slideFromRight} className="text-base text-muted-foreground leading-relaxed mb-6">
              {SIM_PORTFOLIO_SHOWCASE.sub}
            </motion.p>

            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIM_PORTFOLIO_SHOWCASE.features.map((f) => (
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
