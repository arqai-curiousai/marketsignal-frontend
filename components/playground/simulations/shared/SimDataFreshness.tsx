'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  computedAt: string;
  staleAfterMs?: number;
  className?: string;
}

function getRelativeTime(isoString: string): { text: string; stale: boolean; expired: boolean } {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) return { text: 'just now', stale: false, expired: false };
  if (minutes < 5) return { text: `${minutes}m ago`, stale: false, expired: false };
  if (minutes < 15) return { text: `${minutes}m ago`, stale: true, expired: false };
  return { text: `${minutes}m ago`, stale: true, expired: true };
}

export function SimDataFreshness({ computedAt, staleAfterMs = 300_000, className }: Props) {
  const [info, setInfo] = useState(() => getRelativeTime(computedAt));

  useEffect(() => {
    setInfo(getRelativeTime(computedAt));
    const interval = setInterval(() => setInfo(getRelativeTime(computedAt)), 15_000);
    return () => clearInterval(interval);
  }, [computedAt, staleAfterMs]);

  const dotColor = info.expired
    ? 'bg-red-400'
    : info.stale
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <div className={cn('flex items-center gap-1.5 text-[10px] text-white/35', className)}>
      <div className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      <span>{info.text}</span>
    </div>
  );
}
