'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, motion } from 'framer-motion';

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

interface AnimatedValueProps {
  /** Target numeric value to count up to */
  value: number | string | null | undefined;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix (e.g. "$", "+") */
  prefix?: string;
  /** Suffix (e.g. "%", "x") */
  suffix?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Additional className for the value */
  className?: string;
}

export function AnimatedValue({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 600,
  className = '',
}: AnimatedValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState<string>('');
  const animatedRef = useRef(false);

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  const isNumeric = !isNaN(numericValue) && isFinite(numericValue);

  useEffect(() => {
    if (!isInView || animatedRef.current) return;
    animatedRef.current = true;

    if (!isNumeric) {
      // Non-numeric: just set the display directly (blur-in handles animation)
      setDisplay(String(value ?? '—'));
      return;
    }

    const start = performance.now();
    const from = 0;
    const to = numericValue;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = EASE_OUT_EXPO(progress);
      const current = from + (to - from) * eased;

      setDisplay(current.toFixed(decimals));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, numericValue, isNumeric, decimals, duration, value]);

  // Before in-view, show a placeholder dash
  if (!isInView && !animatedRef.current) {
    return (
      <span ref={ref} className={className}>
        {prefix}—{suffix}
      </span>
    );
  }

  // Non-numeric values get a blur-in reveal
  if (!isNumeric) {
    return (
      <motion.span
        ref={ref}
        className={className}
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {prefix}{display || String(value ?? '—')}{suffix}
      </motion.span>
    );
  }

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{display}{suffix}
    </span>
  );
}
