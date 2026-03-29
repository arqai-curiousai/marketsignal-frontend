'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VideoClipProps {
  webm?: string;
  mp4?: string;
  poster?: string;
  className?: string;
  overlay?: boolean;
  opacity?: number;
  blendMode?: 'screen' | 'normal' | 'overlay' | 'multiply';
}

export function VideoClip({
  webm,
  mp4,
  poster,
  className = '',
  overlay = false,
  opacity = 0.35,
  blendMode = 'screen',
}: VideoClipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion && poster) {
    return (
      <div
        ref={containerRef}
        className={`${className} ${overlay ? 'absolute inset-0' : ''}`}
        style={{
          backgroundImage: `url(${poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity,
        }}
      />
    );
  }

  return (
    <div ref={containerRef} className={`${overlay ? 'absolute inset-0' : ''} ${className}`}>
      <motion.video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        onLoadedData={() => setIsLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? opacity : 0 }}
        transition={{ duration: 1.5 }}
        className="h-full w-full object-cover"
        style={{ mixBlendMode: blendMode }}
      >
        {webm && <source src={webm} type="video/webm" />}
        {mp4 && <source src={mp4} type="video/mp4" />}
      </motion.video>
    </div>
  );
}
