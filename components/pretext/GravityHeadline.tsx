'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { prepare, layout } from '@chenglou/pretext';
import { useReducedMotion } from './useReducedMotion';

interface GravityHeadlineProps {
  text: string;
  className?: string;
  accentColor?: string;
}

interface WordMeasure {
  word: string;
  width: number;
  left: number;
}

export function GravityHeadline({
  text,
  className = '',
  accentColor = 'rgba(255,255,255,0.08)',
}: GravityHeadlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [words, setWords] = useState<WordMeasure[]>([]);
  const [totalWidth, setTotalWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [fontSize, setFontSize] = useState(80);

  // Responsive font size
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setFontSize(36);
      else if (w < 768) setFontSize(48);
      else if (w < 1024) setFontSize(64);
      else setFontSize(80);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Measure words with Pretext
  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.fonts.ready.then(() => {
      const parts = text.split(/\s+/).filter(Boolean);
      const font = `700 ${fontSize}px Playfair Display`;
      // Approximate space width
      const spaceWidth = fontSize * 0.25;

      const measured: WordMeasure[] = [];
      let xOffset = 0;

      parts.forEach((word, i) => {
        const handle = prepare(word, font);
        // Binary search for tight single-line width
        let lo = 0;
        let hi = fontSize * word.length;
        for (let j = 0; j < 20; j++) {
          const mid = (lo + hi) / 2;
          const r = layout(handle, mid, fontSize);
          if (r.lineCount <= 1) hi = mid;
          else lo = mid;
        }
        const width = Math.ceil(hi) + 2; // small padding

        measured.push({ word, width, left: xOffset });
        xOffset += width + (i < parts.length - 1 ? spaceWidth : 0);
      });

      setTotalWidth(xOffset);
      setWords(measured);
      setReady(true);
    });
  }, [text, fontSize]);

  // Reduced motion: static headline
  if (reduced) {
    return (
      <h2
        className={`font-serif headline-xl text-white font-bold text-center ${className}`}
        style={{ fontSize }}
      >
        {text}
      </h2>
    );
  }

  // Not ready yet: invisible placeholder to prevent layout shift
  if (!ready) {
    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: fontSize * 1.2, minHeight: fontSize * 1.2 }}
      >
        <h2
          className={`font-serif headline-xl text-white font-bold text-center opacity-0 ${className}`}
          style={{ fontSize }}
        >
          {text}
        </h2>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-visible"
      style={{ height: fontSize * 1.15, minHeight: fontSize * 1.15 }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          transform: `translateX(-${totalWidth / 2}px)`,
          width: totalWidth,
          height: fontSize * 1.15,
        }}
      >
        {words.map((w, i) => {
          // Random start height above
          const startY = -180 - Math.random() * 120;
          const startRotate = (Math.random() - 0.5) * 8;

          return (
            <motion.span
              key={`${w.word}-${i}`}
              className="gravity-word font-serif text-white"
              style={{
                fontSize,
                left: w.left,
                top: 0,
                lineHeight: 1.15,
              }}
              initial={{
                y: startY,
                rotate: startRotate,
                opacity: 0,
                filter: 'blur(4px)',
              }}
              animate={
                isInView
                  ? {
                      y: 0,
                      rotate: 0,
                      opacity: 1,
                      filter: 'blur(0px)',
                    }
                  : undefined
              }
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 1.2,
                delay: i * 0.1,
              }}
            >
              {/* Impact glow flash */}
              <motion.span
                className="absolute inset-0 rounded-lg pointer-events-none"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: [0, 0.6, 0] } : undefined}
                transition={{
                  delay: i * 0.1 + 0.4,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                style={{
                  background: `radial-gradient(ellipse at center, ${accentColor}, transparent 70%)`,
                  transform: 'scale(1.5)',
                }}
              />
              {/* Expanding ring ripple on impact */}
              <motion.span
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: [0, 0.3, 0], scale: [0.8, 1.8, 2.5] } : undefined}
                transition={{
                  delay: i * 0.1 + 0.45,
                  duration: 0.7,
                  ease: 'easeOut',
                }}
                style={{
                  borderRadius: '50%',
                  boxShadow: `0 0 0 1px ${accentColor}`,
                }}
              />
              {/* Post-landing particle dots (2-3 per word) */}
              {isInView && [0, 1, 2].map((pi) => (
                <motion.span
                  key={pi}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    width: 3,
                    height: 3,
                    backgroundColor: accentColor.replace(/[\d.]+\)$/, '0.5)'),
                    left: `${30 + pi * 20}%`,
                    bottom: '100%',
                  }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    y: [-5, -30 - pi * 10],
                    x: [(pi - 1) * 3, (pi - 1) * 8],
                  }}
                  transition={{
                    delay: i * 0.1 + 0.6 + pi * 0.08,
                    duration: 1.5,
                    ease: 'easeOut',
                  }}
                />
              ))}
              {w.word}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
