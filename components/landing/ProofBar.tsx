'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PROOF_STATS } from './constants';

function AnimatedNumber({ value, suffix, inView }: { value: string; suffix: string; inView: boolean }) {
  const [display, setDisplay] = useState('0');
  const num = parseInt(value, 10);

  useEffect(() => {
    if (!inView || isNaN(num)) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const totalFrames = 40;
    const id = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(String(Math.round(num * eased)));
      if (frame >= totalFrames) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView, num, value]);

  return (
    <span>
      {display}
      {suffix && <span className="text-brand-emerald/80 ml-0.5">{suffix}</span>}
    </span>
  );
}

export function ProofBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="w-full py-10 px-6 relative"
    >
      {/* Gradient top/bottom lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-y-6">
          {PROOF_STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-center px-6 md:px-10 cursor-default"
              >
                <div className="text-2xl md:text-3xl font-bold text-white mb-1 tabular-nums font-display">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={inView} />
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.15em]">
                  {stat.label}
                </div>
              </motion.div>
              {i < PROOF_STATS.length - 1 && (
                <div className="hidden md:block w-1.5 h-1.5 rotate-45 bg-white/15 rounded-[1px]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
