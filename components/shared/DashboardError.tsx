'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardError({
  message = 'Something went wrong loading this section.',
  onRetry,
  className,
}: DashboardErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-sm text-slate-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
