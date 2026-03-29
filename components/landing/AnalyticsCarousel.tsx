'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ANALYTICS_SLIDES } from './constants';
import { fadeUp, staggerContainer, slideFromLeft, slideFromRight } from './animations';
import { VideoClip } from './VideoClip';

const GLOW_COLORS: Record<string, string> = {
  emerald: 'rgba(110,231,183,0.06)',
  blue: 'rgba(96,165,250,0.06)',
  amber: 'rgba(251,191,36,0.06)',
  violet: 'rgba(167,139,250,0.06)',
};

function ProgressDots({ progress, count }: { progress: number; count: number }) {
  const activeIdx = Math.min(Math.floor(progress * count), count - 1);

  return (
    <div className="hidden md:flex justify-center gap-2 mt-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${i === activeIdx
            ? 'w-3 h-3 bg-brand-emerald shadow-[0_0_8px_rgba(110,231,183,0.5)]'
            : 'w-2 h-2 bg-white/10'
            }`}
        />
      ))}
    </div>
  );
}

function SlideContent({ slide, index: _index }: { slide: (typeof ANALYTICS_SLIDES)[0]; index: number }) {
  const Icon = slide.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[45%_55%] gap-8 md:gap-12 items-center min-h-[60vh] md:min-h-0">
      {/* Copy */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={staggerContainer}
      >
        <motion.div variants={slideFromLeft} className="flex items-center gap-2 mb-4">
          <Icon className="h-4 w-4 text-brand-emerald" />
          <span className="section-label mb-0">{slide.label}</span>
        </motion.div>
        <motion.h3
          variants={slideFromLeft}
          className="font-display text-3xl md:text-4xl headline-xl text-white mb-4 font-bold"
        >
          {slide.headline}
        </motion.h3>
        <motion.p variants={slideFromLeft} className="text-base text-muted-foreground leading-relaxed mb-6">
          {slide.description}
        </motion.p>
        <motion.ul variants={staggerContainer} className="space-y-2 mb-6">
          {slide.features.map((feature) => (
            <motion.li
              key={feature}
              variants={fadeUp}
              className="text-sm text-muted-foreground flex items-start gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-brand-emerald mt-2 shrink-0" />
              {feature}
            </motion.li>
          ))}
        </motion.ul>
        <motion.div variants={slideFromLeft}>
          <Link
            href={slide.href}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-emerald hover:text-white transition-colors"
          >
            {slide.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Video */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={slideFromRight}
        className="relative rounded-xl overflow-hidden ring-1 ring-white/[0.06] aspect-video"
        style={{ boxShadow: `0 0 60px ${GLOW_COLORS[slide.glowColor]}` }}
      >
        <VideoClip
          webm={slide.video.webm}
          mp4={slide.video.mp4}
          opacity={1}
          blendMode="normal"
          className="w-full h-full"
        />
        {/* Edge fade */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

export function AnalyticsCarousel() {
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stickyRef,
    offset: ['start start', 'end end'],
  });

  const [progressValue, setProgressValue] = React.useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setProgressValue(v));

  const activeSlide = Math.min(Math.floor(progressValue * ANALYTICS_SLIDES.length), ANALYTICS_SLIDES.length - 1);

  return (
    <section className="relative">
      {/* Desktop: scroll-locked carousel */}
      <div ref={stickyRef} className="hidden md:block relative" style={{ height: `${ANALYTICS_SLIDES.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
          <div className="container max-w-6xl mx-auto px-6">
            {ANALYTICS_SLIDES.map((slide, i) => (
              <motion.div
                key={slide.id}
                initial={false}
                animate={{
                  opacity: i === activeSlide ? 1 : 0,
                  y: i === activeSlide ? 0 : 20,
                  pointerEvents: i === activeSlide ? 'auto' as const : 'none' as const,
                }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`${i === activeSlide ? 'block' : 'hidden'}`}
              >
                <SlideContent slide={slide} index={i} />
              </motion.div>
            ))}
            <ProgressDots progress={progressValue} count={ANALYTICS_SLIDES.length} />
          </div>
        </div>
      </div>

      {/* Mobile: stacked vertical sections */}
      <div className="md:hidden">
        {ANALYTICS_SLIDES.map((slide, i) => (
          <div key={slide.id} className="landing-section">
            <div className="container max-w-6xl mx-auto">
              <SlideContent slide={slide} index={i} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
