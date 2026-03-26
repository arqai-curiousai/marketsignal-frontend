'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FINAL_CTA } from './constants';

const starPositions = [
  { left: '12%', top: '18%', delay: 0 },
  { left: '85%', top: '22%', delay: 0.8 },
  { left: '25%', top: '75%', delay: 1.2 },
  { left: '72%', top: '80%', delay: 0.4 },
  { left: '8%', top: '50%', delay: 1.6 },
  { left: '92%', top: '55%', delay: 0.6 },
  { left: '45%', top: '12%', delay: 1.0 },
  { left: '55%', top: '88%', delay: 1.4 },
  { left: '35%', top: '30%', delay: 0.2 },
  { left: '65%', top: '65%', delay: 1.8 },
];

export function FinalCTA() {
  return (
    <section className="relative w-full py-32 md:py-40 px-6 overflow-hidden">
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]" style={{ perspective: '600px' }}>
        <div className="absolute inset-x-0 bottom-0 h-[60%]" style={{ transform: 'rotateX(55deg)', transformOrigin: 'bottom center' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute h-px w-full bg-white" style={{ bottom: `${i * 9}%` }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute w-px h-full bg-white" style={{ left: `${10 + i * 9}%` }} />
          ))}
        </div>
      </div>

      {/* Star dots */}
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

      <div className="container max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-5">
            <span className="font-bold">{FINAL_CTA.headline}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-lg mx-auto">
            {FINAL_CTA.sub}
          </p>
          <Link href={FINAL_CTA.cta.href}>
            <Button
              size="lg"
              className="h-16 px-12 text-lg bg-brand-emerald text-brand-slate font-semibold hover:bg-brand-emerald/90 transition-all shadow-[0_0_30px_rgba(110,231,183,0.2),0_0_60px_rgba(110,231,183,0.1)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3),0_0_80px_rgba(110,231,183,0.15)] rounded-xl"
            >
              {FINAL_CTA.cta.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
