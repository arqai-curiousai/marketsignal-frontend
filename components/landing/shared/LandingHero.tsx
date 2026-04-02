'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { EASE_OUT_EXPO } from '../animations';
import { VideoClip } from '../VideoClip';
import { ParticleField } from './ParticleField';

/* ── Scroll indicator ── */
function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.8, duration: 1 }}
    >
      <motion.div
        className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-white/5"
        animate={{ scaleY: [1, 0.5, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-white/20"
        animate={{ y: [0, 6, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/* ── Types ── */
export interface LandingHeroProps {
  badge?: string;
  headlineBold: string;
  headlineSerif: string;
  sub: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  video: { webm: string; mp4: string; poster?: string };
  blobColors?: [string, string, string];
  accentColor?: 'emerald' | 'blue' | 'violet';
  socialProof?: string;
}

const BUTTON_STYLES: Record<string, string> = {
  emerald:
    'bg-brand-emerald text-brand-slate shadow-[0_0_30px_rgba(110,231,183,0.2)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3)]',
  blue: 'bg-brand-blue text-white shadow-[0_0_30px_rgba(96,165,250,0.2)] hover:shadow-[0_0_50px_rgba(96,165,250,0.3)]',
  violet:
    'bg-brand-violet text-white shadow-[0_0_30px_rgba(167,139,250,0.2)] hover:shadow-[0_0_50px_rgba(167,139,250,0.3)]',
};

const BADGE_COLORS: Record<string, string> = {
  emerald: 'text-brand-emerald',
  blue: 'text-brand-blue',
  violet: 'text-brand-violet',
};

export function LandingHero({
  badge,
  headlineBold,
  headlineSerif,
  sub,
  primaryCta,
  secondaryCta,
  video,
  blobColors,
  accentColor = 'emerald',
  socialProof,
}: LandingHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const videoY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const perspectiveRotate = useTransform(scrollYProgress, [0, 0.3], [2, 0]);

  const blob1 = blobColors?.[0] ?? 'bg-brand-emerald/[0.04]';
  const blob2 = blobColors?.[1] ?? 'bg-brand-blue/[0.04]';
  const blob3 = blobColors?.[2] ?? 'bg-brand-amber/[0.03]';
  const btnClass = BUTTON_STYLES[accentColor] ?? BUTTON_STYLES.emerald;
  const badgeColor = BADGE_COLORS[accentColor] ?? BADGE_COLORS.emerald;

  return (
    <section
      ref={sectionRef}
      className="grain-overlay relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      {/* Layer 1: Video background — fades in at 200ms */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: videoY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 2, ease: 'easeOut' }}
      >
        <VideoClip
          webm={video.webm}
          mp4={video.mp4}
          poster={video.poster}
          overlay
          opacity={0.3}
          blendMode="screen"
        />
      </motion.div>

      {/* Layer 2: Particle field — data particles drifting upward */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 2 }}
      >
        <ParticleField count={50} />
      </motion.div>

      {/* Layer 3: Atmospheric gradient blobs — larger, slower */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className={`absolute top-[-15%] right-[-8%] w-[70%] h-[70%] ${blob1} blur-[220px] rounded-full`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{
            opacity: { delay: 0.4, duration: 1.5 },
            x: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
        <motion.div
          className={`absolute bottom-[-15%] left-[-8%] w-[55%] h-[55%] ${blob2} blur-[200px] rounded-full`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{
            opacity: { delay: 0.4, duration: 1.5 },
            x: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
        <motion.div
          className={`absolute top-[25%] left-[15%] w-[35%] h-[35%] ${blob3} blur-[180px] rounded-full`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.4, duration: 1.5 },
            x: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      </div>

      {/* Layer 4: Horizon line — subtle ground plane */}
      <div className="absolute inset-x-0 top-[60%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Content — perspective container */}
      <motion.div
        className="relative z-10 w-full"
        style={{
          y: textY,
          opacity: textOpacity,
          perspective: '1400px',
        }}
      >
        <motion.div
          className="max-w-[1000px] mx-auto text-center px-6 pt-24 pb-16"
          style={{ rotateX: perspectiveRotate }}
        >
          {/* Orchestrated stagger — each element has its own delay */}

          {/* Badge — clip-reveals at 800ms */}
          {badge && (
            <motion.span
              initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
              className={`inline-block text-xs font-semibold uppercase tracking-[0.3em] ${badgeColor} rounded-full px-5 py-2 mb-10 gradient-border-animated`}
            >
              {badge}
            </motion.span>
          )}

          {/* Headline Bold — blur-in at 1000ms */}
          <motion.h1 className="font-display headline-xl text-white mb-2">
            <motion.span
              className="font-bold block text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[6.5rem]"
              initial={{ opacity: 0, filter: 'blur(14px)', y: 40 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ delay: 1, duration: 1.2, ease: EASE_OUT_EXPO }}
            >
              {headlineBold}
            </motion.span>

            {/* Headline Serif — blur-in at 1200ms, LARGER than bold */}
            <motion.span
              className="font-serif italic block gradient-text-hero text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[7rem] headline-xl"
              initial={{ opacity: 0, filter: 'blur(14px)', y: 40 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ delay: 1.2, duration: 1.2, ease: EASE_OUT_EXPO }}
            >
              {headlineSerif}
            </motion.span>
          </motion.h1>

          {/* Subheadline — fades in at 1600ms */}
          <motion.p
            className="text-lg md:text-xl text-white/60 max-w-xl mx-auto leading-relaxed mb-12 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            {sub}
          </motion.p>

          {/* CTAs — scale up at 2000ms */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ delay: 2, duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            <Link href={primaryCta.href}>
              <Button
                size="lg"
                className={`h-14 px-10 text-base font-semibold hover:opacity-90 transition-all btn-shimmer rounded-xl ${btnClass}`}
              >
                {primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href={secondaryCta.href}>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 text-base border-white/10 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07] hover:border-white/20 text-white transition-all rounded-xl"
              >
                {secondaryCta.label}
              </Button>
            </a>
          </motion.div>

          {/* Social proof snippet — fades in at 2400ms */}
          {socialProof && (
            <motion.p
              className="text-[11px] text-white/35 mt-8 uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 1 }}
            >
              {socialProof}
            </motion.p>
          )}
        </motion.div>
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}
