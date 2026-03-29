'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TRUST_STATS } from './constants';

type TrustStat = { value: string; suffix?: string; label: string; icon: string };

function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState('0');
  const numericValue = parseInt(value, 10);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(numericValue * eased).toString());
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, numericValue]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

function MicroIcon({ type }: { type: string }) {
  const size = 18;
  const common = 'text-brand-emerald/60';

  switch (type) {
    case 'globe':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" className={`${common} animate-spin-slow`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="9" cy="9" r="7" />
          <ellipse cx="9" cy="9" rx="3" ry="7" />
          <line x1="2" y1="9" x2="16" y2="9" />
        </svg>
      );
    case 'currency':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" className={common} fill="none" stroke="currentColor" strokeWidth="1.2">
          <text x="3" y="13" fontSize="10" fill="currentColor" className="opacity-80">$</text>
          <text x="10" y="13" fontSize="10" fill="currentColor" className="opacity-40">€</text>
        </svg>
      );
    case 'chart':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" className={common} fill="none">
          <rect x="2" y="10" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.4" />
          <rect x="7" y="6" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
          <rect x="12" y="3" width="3" height="13" rx="0.5" fill="currentColor" opacity="0.8" />
        </svg>
      );
    case 'agents':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" className={common} fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="7" cy="9" r="4" className="opacity-60" />
          <circle cx="11" cy="9" r="4" className="opacity-40" />
        </svg>
      );
    case 'refresh':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" className={`${common} animate-spin-slow`} fill="none" stroke="currentColor" strokeWidth="1.2" style={{ animationDuration: '5s' }}>
          <path d="M14 9a5 5 0 1 1-1.5-3.5" />
          <polyline points="14 3 14 6 11 6" />
        </svg>
      );
    default:
      return null;
  }
}

export function TrustBar({ stats }: { stats?: TrustStat[] }) {
  const data = stats ?? TRUST_STATS;
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
      className="relative w-full py-6 border-y border-white/[0.06] backdrop-blur-xl bg-white/[0.01]"
    >
      <div className="container max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-0 md:flex-nowrap md:justify-between items-center">
          {data.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && (
                <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
              )}
              <div className="flex items-center gap-2.5 min-w-[120px] justify-center">
                <MicroIcon type={stat.icon} />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white font-display leading-none">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
