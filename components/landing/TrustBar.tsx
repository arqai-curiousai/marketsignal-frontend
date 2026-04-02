'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TRUST_STATS } from './constants';

type TrustStat = { value: string; suffix?: string; label: string; icon: string };

/* ── Animated count-up with overshoot ── */
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState('0');
  const [done, setDone] = useState(false);
  const numericValue = parseInt(value, 10);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1000;
    const overshoot = 1.08;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out with slight overshoot then settle
      const eased = progress < 0.85
        ? (1 - Math.pow(1 - progress / 0.85, 3)) * overshoot
        : 1;
      setDisplay(Math.round(numericValue * Math.min(eased, overshoot)).toString());
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(numericValue.toString());
        setDone(true);
      }
    };

    requestAnimationFrame(tick);
  }, [isInView, numericValue]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {suffix}
        </motion.span>
      )}
    </span>
  );
}

/* ── Monoline SVG icons — cleaner, white/40 ── */
function MonoIcon({ type }: { type: string }) {
  const cls = 'text-white/40 shrink-0';
  const s = 20;

  switch (type) {
    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" className={cls} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="10" cy="10" r="8" />
          <ellipse cx="10" cy="10" rx="3.5" ry="8" />
          <line x1="2" y1="10" x2="18" y2="10" />
        </svg>
      );
    case 'currency':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" className={cls} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="10" cy="10" r="8" />
          <path d="M7 8.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2s-.9 2-2 2H9c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2-.9 2-2" />
          <line x1="10" y1="5" x2="10" y2="6.5" />
          <line x1="10" y1="13.5" x2="10" y2="15" />
        </svg>
      );
    case 'chart':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" className={cls} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3,16 7,10 11,13 17,4" />
          <line x1="3" y1="16" x2="17" y2="16" />
        </svg>
      );
    case 'agents':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" className={cls} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="7" cy="8" r="3" />
          <circle cx="13" cy="8" r="3" />
          <path d="M4 16c0-2.2 1.3-4 3-4s3 1.8 3 4" />
          <path d="M10 16c0-2.2 1.3-4 3-4s3 1.8 3 4" />
        </svg>
      );
    case 'refresh':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" className={cls} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 10a5 5 0 1 1-1.5-3.5" />
          <polyline points="15 3 15 6.5 11.5 6.5" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Sparkle burst on count complete ── */
function Sparkle({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div className="absolute -top-1 -right-1 flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 h-0.5 rounded-full bg-white/50"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: [-2 + i * 4, -4 + i * 6],
            y: [-2 - i * 2, -6 - i * 3],
          }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        />
      ))}
    </motion.div>
  );
}

function StatItem({ stat }: { stat: TrustStat }) {
  const [sparkle, setSparkle] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => setSparkle(true), 1100);
    return () => clearTimeout(timer);
  }, [isInView]);

  return (
    <div ref={ref} className="flex items-center gap-3 min-w-[130px] justify-center">
      <MonoIcon type={stat.icon} />
      <div className="flex flex-col relative">
        <span className="text-xl font-bold text-white font-display leading-none tracking-tight">
          <AnimatedNumber value={stat.value} suffix={stat.suffix} />
        </span>
        <span className="text-[10px] text-white/35 uppercase tracking-[0.15em] mt-1">
          {stat.label}
        </span>
        <Sparkle active={sparkle} />
      </div>
    </div>
  );
}

/* ── Main component ── */
export function TrustBar({ stats }: { stats?: TrustStat[] }) {
  const data = stats ?? TRUST_STATS;
  return (
    <div className="relative">
      {/* Gradient divider above */}
      <div className="gradient-divider" />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8 }}
        className="relative w-full py-8 bg-gradient-to-b from-white/[0.015] to-transparent"
      >
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-5 md:gap-x-0 md:flex-nowrap md:justify-between items-center">
            {data.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && (
                  <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
                )}
                <StatItem stat={stat} />
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Gradient divider below */}
      <div className="gradient-divider" />
    </div>
  );
}
