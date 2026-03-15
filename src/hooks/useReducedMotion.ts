import { useState, useEffect } from 'react';

/**
 * Returns `true` when the user's OS has requested reduced motion.
 * All framer-motion animations should conditionally disable when this
 * returns true (e.g. `animate={prefersReduced ? {} : { opacity: 1 }}`).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
