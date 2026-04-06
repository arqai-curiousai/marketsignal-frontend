'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ScrollParticleField } from './ScrollParticleField';

interface ScrollNarrativeProps {
  children: React.ReactNode;
  /** Accent color theme for background hue shift */
  accent?: 'blue' | 'emerald' | 'violet';
}

/* Background colors at different scroll positions */
const HUE_STOPS: Record<string, [string, string, string, string]> = {
  blue: [
    'rgba(9,20,18,0)',          // 0% — pure dark
    'rgba(96,165,250,0.015)',   // 35% — blue tint
    'rgba(110,231,183,0.012)', // 65% — emerald tint
    'rgba(9,20,18,0)',          // 100% — back to dark
  ],
  emerald: [
    'rgba(9,20,18,0)',
    'rgba(110,231,183,0.015)',
    'rgba(96,165,250,0.012)',
    'rgba(9,20,18,0)',
  ],
  violet: [
    'rgba(9,20,18,0)',
    'rgba(167,139,250,0.015)',
    'rgba(110,231,183,0.012)',
    'rgba(9,20,18,0)',
  ],
};

export function ScrollNarrative({ children, accent = 'blue' }: ScrollNarrativeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const stops = HUE_STOPS[accent] ?? HUE_STOPS.blue;
  const bgColor = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], stops);

  return (
    <div ref={containerRef} className="relative">
      {/* Scroll-linked background hue overlay */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundColor: bgColor }}
      />

      {/* Scroll-linked particle density field (desktop only) */}
      <ScrollParticleField accent={accent} containerRef={containerRef} />

      {/* Vignette overlay */}
      <div className="landing-vignette" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
