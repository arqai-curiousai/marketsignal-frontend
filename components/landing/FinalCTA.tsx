'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FINAL_CTA } from './constants';
import { scaleReveal } from './animations';
import { VideoClip } from './VideoClip';

type CTAContent = {
  headline: string;
  sub: string;
  cta: { label: string; href: string };
  video: { webm: string; mp4: string };
};

const starPositions = [
  { left: '12%', top: '18%', delay: 0 },
  { left: '85%', top: '22%', delay: 0.8 },
  { left: '25%', top: '75%', delay: 1.2 },
  { left: '72%', top: '80%', delay: 0.4 },
  { left: '45%', top: '12%', delay: 1.0 },
  { left: '92%', top: '55%', delay: 0.6 },
];

export function FinalCTA({ content, accentColor }: { content?: CTAContent; accentColor?: string }) {
  const data = content ?? FINAL_CTA;
  const btnColorClass = accentColor === 'blue'
    ? 'bg-brand-blue text-white shadow-[0_0_30px_rgba(96,165,250,0.2),0_0_60px_rgba(96,165,250,0.1)] hover:shadow-[0_0_50px_rgba(96,165,250,0.3),0_0_80px_rgba(96,165,250,0.15)]'
    : accentColor === 'violet'
    ? 'bg-brand-violet text-white shadow-[0_0_30px_rgba(167,139,250,0.2),0_0_60px_rgba(167,139,250,0.1)] hover:shadow-[0_0_50px_rgba(167,139,250,0.3),0_0_80px_rgba(167,139,250,0.15)]'
    : 'bg-brand-emerald text-brand-slate shadow-[0_0_30px_rgba(110,231,183,0.2),0_0_60px_rgba(110,231,183,0.1)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3),0_0_80px_rgba(110,231,183,0.15)]';
  return (
    <section className="relative w-full py-32 md:py-40 lg:py-48 px-6 overflow-hidden">
      {/* Video underlay */}
      <VideoClip
        webm={data.video.webm}
        mp4={data.video.mp4}
        overlay
        opacity={0.15}
        blendMode="screen"
      />

      {/* Aurora gradient blobs */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-emerald/[0.07] blur-[180px] rounded-full pointer-events-none"
        animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] left-[35%] w-[400px] h-[400px] bg-brand-blue/[0.05] blur-[150px] rounded-full pointer-events-none"
        animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[55%] left-[60%] w-[350px] h-[350px] bg-brand-violet/[0.04] blur-[140px] rounded-full pointer-events-none"
        animate={{ x: [0, 15, -30, 0], y: [0, -20, 25, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Perspective grid floor */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]"
        style={{ perspective: '600px' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-[60%]"
          style={{ transform: 'rotateX(55deg)', transformOrigin: 'bottom center' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute h-px w-full bg-white"
              style={{ bottom: `${i * 9}%` }}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute w-px h-full bg-white"
              style={{ left: `${10 + i * 9}%` }}
            />
          ))}
        </div>
      </div>

      {/* Star dots (reduced to 6) */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{ left: star.left, top: star.top }}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Content */}
      <div className="container max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleReveal}
        >
          {/* Serif headline — tonal shift per plan */}
          <h2 className="font-serif headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] text-white mb-5 font-bold">
            {data.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-lg mx-auto">
            {data.sub}
          </p>
          <Link href={data.cta.href}>
            <Button
              size="lg"
              className={`h-16 px-12 text-lg font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5 rounded-xl animate-glow-pulse ${btnColorClass}`}
            >
              {data.cta.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
