'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/* ── Single flip digit ── */
function FlipDigit({ digit, delay }: { digit: string; delay: number }) {
  const [current, setCurrent] = useState(digit);
  const [prev, setPrev] = useState(digit);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== current) {
      setPrev(current);
      setCurrent(digit);
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 600);
      return () => clearTimeout(t);
    }
  }, [digit, current]);

  return (
    <span
      className="inline-block relative flip-digit"
      style={{ width: '0.65em', height: '1.1em' }}
    >
      {/* Static current value (visible behind flip) */}
      <span className="absolute inset-0 flex items-center justify-center tabular-nums">
        {current}
      </span>

      {/* Flip animation overlay */}
      <AnimatePresence>
        {flipping && (
          <motion.span
            key={`flip-${prev}-${current}`}
            className="absolute inset-0 flex items-center justify-center tabular-nums"
            initial={{ rotateX: 0, opacity: 1 }}
            animate={{ rotateX: -90, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.35,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformOrigin: 'center bottom',
              backfaceVisibility: 'hidden',
            }}
          >
            {prev}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ── FlipClockNumber — replaces AnimatedNumber ── */
export function FlipClockNumber({
  value,
  suffix = '',
}: {
  value: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const reduced = useReducedMotion();
  const numericValue = parseInt(value, 10);
  const [displayDigits, setDisplayDigits] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  // Flip count-up animation
  useEffect(() => {
    if (!isInView || reduced) {
      setDisplayDigits(value.split(''));
      setDone(true);
      return;
    }

    const duration = 1000;
    const start = performance.now();
    const targetDigits = value.split('');

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic with slight overshoot
      const eased =
        progress < 0.85 ? (1 - Math.pow(1 - progress / 0.85, 3)) * 1.08 : 1;
      const current = Math.round(numericValue * Math.min(eased, 1.08));
      const clamped = Math.min(current, Math.round(numericValue * 1.08));
      setDisplayDigits(clamped.toString().split(''));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayDigits(targetDigits);
        setDone(true);
      }
    };

    requestAnimationFrame(tick);
  }, [isInView, numericValue, value, reduced]);

  if (reduced) {
    return (
      <span ref={ref} className="tabular-nums">
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className="inline-flex items-center tabular-nums"
      style={{ perspective: '400px' }}
    >
      {displayDigits.map((d, i) => (
        <FlipDigit
          key={`pos-${i}`}
          digit={d}
          delay={i * 0.03}
        />
      ))}
      {suffix && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="ml-0.5"
        >
          {suffix}
        </motion.span>
      )}
    </span>
  );
}
