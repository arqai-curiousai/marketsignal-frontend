'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HERO } from './constants';
import { fadeUp, blurIn } from './animations';
import { VideoClip } from './VideoClip';

function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <motion.div
        className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-white/5"
        animate={{ scaleY: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-white/20"
        animate={{ y: [0, 4, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const videoY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={sectionRef}
      className="grain-overlay relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      {/* Layer 1: Video background */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: videoY }}>
        <VideoClip
          webm={HERO.video.webm}
          mp4={HERO.video.mp4}
          poster={HERO.video.poster}
          overlay
          opacity={0.35}
          blendMode="screen"
        />
      </motion.div>

      {/* Layer 2: Atmospheric gradient blobs (tricolor) */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-brand-emerald/[0.04] blur-[150px] rounded-full"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-brand-blue/[0.04] blur-[130px] rounded-full"
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-brand-amber/[0.03] blur-[120px] rounded-full"
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content — centered single column */}
      <motion.div
        className="relative z-10 max-w-[900px] mx-auto text-center px-6 pt-20 pb-16"
        style={{ y: textY, opacity: textOpacity }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.span
            variants={fadeUp}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-emerald rounded-full px-5 py-2 mb-8 gradient-border-animated"
          >
            {HERO.badge}
          </motion.span>

          {/* Headline */}
          <motion.h1
            variants={blurIn}
            className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] headline-xl text-white mb-8"
          >
            <span className="font-bold block">{HERO.headlineBold}</span>
            <span className="font-serif italic block gradient-text-hero">
              {HERO.headlineSerif}
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
          >
            {HERO.sub}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
            <Link href={HERO.primaryCta.href}>
              <Button
                size="lg"
                className="h-14 px-8 text-base bg-brand-emerald text-brand-slate font-semibold hover:bg-brand-emerald/90 transition-all shadow-[0_0_30px_rgba(110,231,183,0.2)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3)]"
              >
                {HERO.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href={HERO.secondaryCta.href}>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] text-white transition-all"
              >
                {HERO.secondaryCta.label}
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}
