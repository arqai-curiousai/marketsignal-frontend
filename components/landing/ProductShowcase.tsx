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
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [6, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const [imgError, setImgError] = useState(false);

  const imageSrc = imgError ? SHOWCASE.fallbackImage : SHOWCASE.image;

  return (
    <section id="product-showcase" ref={ref} className="landing-section overflow-hidden">
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
          {/* Ambient glow — emerald + blue aurora beneath the image */}
          <div className="absolute -bottom-20 left-[10%] right-[10%] h-40 bg-brand-emerald/[0.07] blur-[100px] rounded-full" />
          <div className="absolute -bottom-14 left-[20%] right-[20%] h-28 bg-brand-blue/[0.04] blur-[80px] rounded-full" />
          <div className="absolute -top-10 left-[30%] right-[30%] h-20 bg-brand-emerald/[0.03] blur-[60px] rounded-full" />

          {/* Image container — no browser chrome, zen presentation */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* The image */}
            <div className="aspect-[16/9] bg-brand-slate overflow-hidden rounded-2xl">
              <img
                src={imageSrc}
                alt="MarketSignal Platform — AI-Powered Indian Market Intelligence"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            </div>

            {/* Edge fade — all four sides dissolve into the background */}
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background: `
                  linear-gradient(to bottom, hsl(150 40% 4.5%) 0%, transparent 15%),
                  linear-gradient(to top, hsl(150 40% 4.5%) 0%, transparent 20%),
                  linear-gradient(to right, hsl(150 40% 4.5%) 0%, transparent 10%),
                  linear-gradient(to left, hsl(150 40% 4.5%) 0%, transparent 10%)
                `,
              }}
            />

            {/* Subtle inner border glow */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
