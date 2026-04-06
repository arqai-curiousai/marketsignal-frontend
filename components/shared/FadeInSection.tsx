'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Unique key to re-trigger animation (e.g. active tab ID) */
  triggerKey?: string;
}

export function FadeInSection({ children, className, triggerKey }: FadeInSectionProps) {
  return (
    <motion.div
      key={triggerKey}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div variants={itemVariants}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
