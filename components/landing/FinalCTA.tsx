'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FINAL_CTA } from './constants';
import { scaleReveal } from './animations';
import { VideoClip } from './VideoClip';
import { GravityHeadline } from './pretext/GravityHeadline';
import { ConvergenceCanvas } from './shared/ConvergenceCanvas';

type CTAContent = {
  headline: string;
  sub: string;
  cta: { label: string; href: string };
  video: { webm: string; mp4: string };
};

/* ── Drifting star dots ── */
const starPositions = [
  { left: '8%', top: '15%', delay: 0, dur: 7 },
  { left: '88%', top: '18%', delay: 0.8, dur: 6 },
  { left: '18%', top: '78%', delay: 1.2, dur: 8 },
  { left: '75%', top: '82%', delay: 0.4, dur: 5 },
  { left: '42%', top: '8%', delay: 1.0, dur: 7 },
  { left: '92%', top: '50%', delay: 0.6, dur: 6 },
  { left: '5%', top: '45%', delay: 1.4, dur: 8 },
  { left: '55%', top: '90%', delay: 0.2, dur: 5 },
  { left: '30%', top: '25%', delay: 1.6, dur: 7 },
  { left: '65%', top: '35%', delay: 0.9, dur: 6 },
  { left: '80%', top: '65%', delay: 1.1, dur: 8 },
  { left: '15%', top: '60%', delay: 0.3, dur: 5 },
];

const BTN_COLORS: Record<string, string> = {
  blue: 'bg-brand-blue text-white shadow-[0_0_30px_rgba(96,165,250,0.25),0_0_80px_rgba(96,165,250,0.1)]',
  violet: 'bg-brand-violet text-white shadow-[0_0_30px_rgba(167,139,250,0.25),0_0_80px_rgba(167,139,250,0.1)]',
  emerald: 'bg-brand-emerald text-brand-slate shadow-[0_0_30px_rgba(110,231,183,0.25),0_0_80px_rgba(110,231,183,0.1)]',
};

export function FinalCTA({ content, accentColor }: { content?: CTAContent; accentColor?: string }) {
  const data = content ?? FINAL_CTA;
  const btnClass = BTN_COLORS[accentColor ?? 'emerald'] ?? BTN_COLORS.emerald;

  return (
    <section className="relative w-full py-48 md:py-56 lg:py-64 px-6 overflow-hidden">
      {/* Video underlay */}
      <VideoClip
        webm={data.video.webm}
        mp4={data.video.mp4}
        overlay
        opacity={0.12}
        blendMode="screen"
      />

      {/* Aurora blobs */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-emerald/[0.05] blur-[220px] rounded-full pointer-events-none"
        animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-brand-blue/[0.04] blur-[200px] rounded-full pointer-events-none"
        animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Radial burst — rotating rays */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[800px] h-[800px] opacity-[0.02] animate-radial-burst"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.3) 2deg, transparent 4deg, transparent 30deg, rgba(255,255,255,0.2) 32deg, transparent 34deg, transparent 60deg, rgba(255,255,255,0.3) 62deg, transparent 64deg, transparent 90deg, rgba(255,255,255,0.2) 92deg, transparent 94deg, transparent 120deg, rgba(255,255,255,0.3) 122deg, transparent 124deg, transparent 150deg, rgba(255,255,255,0.2) 152deg, transparent 154deg, transparent 180deg, rgba(255,255,255,0.3) 182deg, transparent 184deg, transparent 210deg, rgba(255,255,255,0.2) 212deg, transparent 214deg, transparent 240deg, rgba(255,255,255,0.3) 242deg, transparent 244deg, transparent 270deg, rgba(255,255,255,0.2) 272deg, transparent 274deg, transparent 300deg, rgba(255,255,255,0.3) 302deg, transparent 304deg, transparent 330deg, rgba(255,255,255,0.2) 332deg, transparent 334deg, transparent 360deg)`,
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Gravitational convergence canvas */}
      <ConvergenceCanvas accentColor={accentColor} />

      {/* Drifting star dots */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="absolute w-[2px] h-[2px] rounded-full bg-white/25"
          style={{ left: star.left, top: star.top }}
          animate={{
            x: [0, 8 * (i % 2 === 0 ? 1 : -1), -4, 0],
            y: [0, -12, -6, 0],
            opacity: [0.1, 0.4, 0.2, 0.1],
          }}
          transition={{
            duration: star.dur,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Content */}
      <div className="container max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleReveal}
        >
          <GravityHeadline
            text={data.headline}
            className="mb-6"
            accentColor={
              accentColor === 'blue'
                ? 'rgba(96,165,250,0.12)'
                : accentColor === 'violet'
                  ? 'rgba(167,139,250,0.12)'
                  : 'rgba(110,231,183,0.12)'
            }
          />
          <p className="text-lg md:text-xl text-white/50 mb-14 max-w-md mx-auto">
            {data.sub}
          </p>
          <Link href={data.cta.href}>
            <Button
              size="lg"
              className={`h-[4.5rem] px-14 text-lg font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5 rounded-2xl btn-shimmer ${btnClass}`}
            >
              {data.cta.label}
              <ArrowRight className="ml-2.5 h-5 w-5" />
            </Button>
          </Link>

          {/* Urgency line */}
          <motion.p
            className="text-[11px] text-white/25 mt-8 uppercase tracking-[0.2em]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Open Beta — Free to start
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
