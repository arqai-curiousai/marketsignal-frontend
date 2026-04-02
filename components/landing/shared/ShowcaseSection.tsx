'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  staggerContainer,
  slideFromLeft,
  slideFromRight,
  perspectiveRevealLeft,
  perspectiveRevealRight,
  fadeUp,
  clipReveal,
  EASE_OUT_EXPO,
} from '../animations';
import { VideoClip } from '../VideoClip';

interface Feature {
  title: string;
  description: string;
}

interface ShowcaseSectionProps {
  label: string;
  headline: string;
  sub: string;
  features: Feature[];
  video: { webm: string; mp4: string };
  /** Even sections mirror (copy right, visual left) */
  mirror?: boolean;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'violet';
}

/* ── Accordion feature list ── */
function FeatureAccordion({ features, accentColor }: { features: Feature[]; accentColor: string }) {
  const [open, setOpen] = useState(0);

  const dotColor =
    accentColor === 'blue'
      ? 'bg-brand-blue'
      : accentColor === 'emerald'
        ? 'bg-brand-emerald'
        : accentColor === 'violet'
          ? 'bg-brand-violet'
          : 'bg-brand-amber';

  return (
    <div className="space-y-1">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          variants={fadeUp}
          className="group cursor-pointer"
          onClick={() => setOpen(i)}
        >
          <div className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-300 ${open === i ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${open === i ? `${dotColor} shadow-[0_0_8px_currentColor]` : 'bg-white/20'}`} />
            <span className={`text-sm font-medium transition-colors duration-300 ${open === i ? 'text-white' : 'text-white/50'}`}>
              {f.title}
            </span>
          </div>
          <motion.div
            initial={false}
            animate={{
              height: open === i ? 'auto' : 0,
              opacity: open === i ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <p className="text-xs text-white/45 leading-relaxed pl-7 pr-4 pb-3">
              {f.description}
            </p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Video frame with reflection ── */
function VideoFrame({ video, mirror }: { video: { webm: string; mp4: string }; mirror?: boolean }) {
  const variant = mirror ? perspectiveRevealRight : perspectiveRevealLeft;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={variant}
      className="relative"
      style={{ perspective: '1200px' }}
    >
      {/* Main frame */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
        <div className="aspect-[16/10]">
          <VideoClip webm={video.webm} mp4={video.mp4} overlay={false} opacity={1} />
        </div>
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ boxShadow: 'inset 0 0 80px rgba(96,165,250,0.04)' }}
        />
      </div>

      {/* Reflection — flipped, faded duplicate */}
      <div
        className="hidden md:block mt-1 rounded-2xl overflow-hidden opacity-[0.04]"
        style={{ transform: 'scaleY(-1)', filter: 'blur(8px)', height: '60px' }}
      >
        <div className="aspect-[16/10]">
          <VideoClip webm={video.webm} mp4={video.mp4} overlay={false} opacity={1} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main showcase section ── */
export function ShowcaseSection({
  label,
  headline,
  sub,
  features,
  video,
  mirror = false,
  accentColor = 'blue',
}: ShowcaseSectionProps) {
  const copyVariant = mirror ? slideFromRight : slideFromLeft;

  const copyContent = (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={staggerContainer}
    >
      <motion.p variants={clipReveal} className="section-label">
        {label}
      </motion.p>
      <motion.h3
        variants={copyVariant}
        className="font-display text-3xl md:text-4xl lg:text-[3rem] headline-lg text-white mb-5 font-bold"
      >
        {headline}
      </motion.h3>
      <motion.p
        variants={copyVariant}
        className="text-base text-white/55 leading-relaxed mb-8"
      >
        {sub}
      </motion.p>

      <motion.div variants={staggerContainer}>
        <FeatureAccordion features={features} accentColor={accentColor} />
      </motion.div>
    </motion.div>
  );

  const videoContent = <VideoFrame video={video} mirror={mirror} />;

  return (
    <section className="landing-section relative overflow-hidden">
      <div className="container max-w-7xl mx-auto">
        <div
          className={`grid grid-cols-1 md:grid-cols-[40%_60%] gap-10 md:gap-16 items-center ${mirror ? 'md:grid-cols-[60%_40%]' : ''}`}
        >
          {mirror ? (
            <>
              {videoContent}
              {copyContent}
            </>
          ) : (
            <>
              {copyContent}
              {videoContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
