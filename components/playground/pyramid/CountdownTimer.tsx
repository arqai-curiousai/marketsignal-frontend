'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { T } from './tokens';

interface CountdownTimerProps {
  intervalMs?: number; // default 300000 (5 min)
  lastRefreshAt?: Date | null; // sync with actual pipeline refresh
  className?: string;
}

export function CountdownTimer({
  intervalMs = 300_000,
  lastRefreshAt,
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(intervalMs);
  const [flash, setFlash] = useState(false);
  const startRef = useRef(Date.now());
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with lastRefreshAt when it changes
  useEffect(() => {
    if (lastRefreshAt) {
      startRef.current = lastRefreshAt.getTime();
      setFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlash(false), 400);
    }
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [lastRefreshAt]);

  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(intervalMs - elapsed, 0);
      setRemaining(left);
      if (left <= 0) {
        // Reset countdown — pipeline should trigger refresh
        startRef.current = Date.now();
        setRemaining(intervalMs);
        setFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setFlash(false), 400);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [intervalMs]);

  const totalSec = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors duration-300',
        flash ? 'text-emerald-400' : 'text-white/40',
        className,
      )}
    >
      <Timer className="h-3 w-3" />
      <span className={cn(T.monoSm, flash && 'text-emerald-400')}>
        {mm}:{ss}
      </span>
    </div>
  );
}
