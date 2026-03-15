'use client';

import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { SHOWCASE } from './constants';

export function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const [imgError, setImgError] = useState(false);

  const imageSrc = imgError ? SHOWCASE.fallbackImage : SHOWCASE.image;

  return (
    <section id="product-showcase" ref={ref} className="landing-section">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-label">{SHOWCASE.label}</span>
          <h2 className="font-display headline-xl text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            <span className="font-light">{SHOWCASE.headline.split('.')[0]}.</span>{' '}
            <span className="font-bold">{SHOWCASE.headline.split('.').slice(1).join('.').trim()}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {SHOWCASE.sub}
          </p>
        </motion.div>

        <motion.div
          style={{ rotateX, scale, opacity, perspective: 1200 }}
          className="relative"
        >
          {/* Dual-color glow underneath */}
          <div className="absolute -bottom-16 left-1/4 right-1/4 h-32 bg-brand-emerald/[0.08] blur-[80px] rounded-full" />
          <div className="absolute -bottom-12 left-1/3 right-1/3 h-24 bg-brand-blue/[0.05] blur-[60px] rounded-full" />

          <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/40 bg-white/[0.02] gradient-border-animated">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/30" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/30" />
                <div className="w-3 h-3 rounded-full bg-green-400/30" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-muted-foreground font-mono">
                  marketsignal.ai/signals
                </div>
              </div>
              <div className="w-12" />
            </div>

            {/* Screenshot */}
            <div className="aspect-[16/9] bg-brand-slate overflow-hidden">
              <img
                src={imageSrc}
                alt="MarketSignal Platform — Analytics Dashboard"
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
