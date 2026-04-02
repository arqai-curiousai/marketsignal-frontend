import type { Variants } from 'framer-motion';

/* ── Easing constants ── */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_CIRC: [number, number, number, number] = [0.77, 0, 0.175, 1];

/* ── Stagger containers ── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

/* ── Core reveal variants ── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: 'blur(12px)', y: 24 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 1, ease: EASE_OUT_EXPO },
  },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE_OUT_EXPO },
  },
};

/* ── Directional slides ── */
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

/* ── NEW: Clip-path reveal (Railway-style text unmasking) ── */
export const clipReveal: Variants = {
  hidden: {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: { duration: 1.2, ease: EASE_CIRC },
  },
};

export const clipRevealUp: Variants = {
  hidden: {
    clipPath: 'inset(100% 0 0 0)',
    opacity: 0,
  },
  visible: {
    clipPath: 'inset(0% 0 0 0)',
    opacity: 1,
    transition: { duration: 1, ease: EASE_CIRC },
  },
};

/* ── NEW: Scale-on-scroll (grows as it enters viewport center) ── */
export const scaleOnScroll: Variants = {
  hidden: { opacity: 0, scale: 0.85, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: EASE_OUT_EXPO },
  },
};

/* ── NEW: Perspective reveal (video frame with 3D tilt) ── */
export const perspectiveRevealLeft: Variants = {
  hidden: {
    opacity: 0.6,
    scale: 0.88,
    y: 40,
    rotateY: 4,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.4, ease: EASE_OUT_EXPO },
  },
};

export const perspectiveRevealRight: Variants = {
  hidden: {
    opacity: 0.6,
    scale: 0.88,
    y: 40,
    rotateY: -4,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.4, ease: EASE_OUT_EXPO },
  },
};

/* ── NEW: Horizontal reveal for grids ── */
export const horizontalReveal: Variants = {
  hidden: { opacity: 0, x: 80, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: EASE_OUT_EXPO },
  },
};

/* ── NEW: Split-from-edges (for dual agent panels) ── */
export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 1, ease: EASE_OUT_EXPO },
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 1, ease: EASE_OUT_EXPO },
  },
};

export const dropIn: Variants = {
  hidden: { opacity: 0, y: -30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, delay: 0.6, ease: EASE_OUT_EXPO },
  },
};

/* ── NEW: Number count-up with overshoot ── */
export const countReveal: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};
