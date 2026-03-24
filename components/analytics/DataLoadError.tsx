'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface DataLoadErrorProps {
  /** Error message to display. If null, renders nothing. */
  error: string | null;
  /** Callback to retry the failed operation. */
  onRetry?: () => void;
  /** If true, show a timeout warning instead of error. */
  isLoading?: boolean;
  /** Milliseconds after which a loading state becomes a timeout error. */
  timeoutMs?: number;
  className?: string;
}

/**
 * Unified error + timeout state for data panels.
 *
 * - Shows error message with optional Retry button.
 * - When `isLoading` is true and `timeoutMs` elapses, auto-transitions to a timeout error.
 */
export function DataLoadError({
  error,
  onRetry,
  isLoading = false,
  timeoutMs = 15_000,
  className,
}: DataLoadErrorProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const id = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(id);
  }, [isLoading, timeoutMs]);

  const message = error || (timedOut ? 'Request timed out' : null);
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-4 text-center',
        className,
      )}
    >
      <p className="text-[10px] text-red-400/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}
