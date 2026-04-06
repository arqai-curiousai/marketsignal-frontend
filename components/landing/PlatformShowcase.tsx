'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PLATFORM } from './constants';
import { fadeUp, staggerContainer } from './animations';
import { VideoClip } from './VideoClip';

export function PlatformShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section id="platform" className="landing-section relative overflow-hidden">
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
            {PLATFORM.label}
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl headline-xl text-white mb-6"
          >
            {PLATFORM.headline}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {PLATFORM.sub}
          </motion.p>
        </motion.div>

        {/* Video Container with 3D perspective */}
        <div ref={containerRef} className="relative" style={{ perspective: '1200px' }}>
          <motion.div
            style={{ rotateX, scale, opacity }}
            className="relative rounded-2xl overflow-hidden ring-1 ring-white/[0.06]"
          >
            {/* Video or fallback image */}
            <div className="relative aspect-video bg-brand-slate">
              <VideoClip
                webm={PLATFORM.video.webm}
                mp4={PLATFORM.video.mp4}
                poster={PLATFORM.video.poster}
                opacity={1}
                blendMode="normal"
                className="w-full h-full"
              />
              {/* Fallback static image shown if video hasn't loaded */}
              <Image
                src={PLATFORM.video.poster}
                alt="Meridian platform dashboard"
                fill
                className="object-cover -z-10"
                priority={false}
              />
            </div>

            {/* Edge fades */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
            </div>

            {/* Inner glow accent */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-white/[0.04]" />
          </motion.div>

          {/* Ambient glows beneath */}
          <div className="absolute -bottom-10 left-1/4 w-1/3 h-20 bg-brand-emerald/[0.08] blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 right-1/4 w-1/4 h-16 bg-brand-blue/[0.06] blur-[60px] rounded-full pointer-events-none" />
        </div>

        {/* Tab Pills */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex justify-center gap-3 mt-10 overflow-x-auto pb-2"
        >
          {PLATFORM.tabs.map((tab) => (
            <motion.div key={tab.label} variants={fadeUp}>
              <Link
                href={tab.href}
                className="inline-block text-sm px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-white hover:border-brand-emerald/20 hover:bg-white/[0.06] transition-all whitespace-nowrap"
              >
                {tab.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
