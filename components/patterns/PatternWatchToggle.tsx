'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { ConfluenceIndicator } from './ConfluenceIndicator';
import { watchInstrument, unwatchInstrument } from '@/lib/api/insightApi';
import type { IPatternInsight } from '@/types/stock';

interface PatternWatchToggleProps {
  ticker: string;
  exchange: string;
  instrumentType?: string;
  isActive: boolean;
  insight: IPatternInsight | null;
  onToggle?: (active: boolean, insight: IPatternInsight | null) => void;
  className?: string;
}

export function PatternWatchToggle({
  ticker,
  exchange,
  instrumentType = 'equity',
  isActive,
  insight,
  onToggle,
  className,
}: PatternWatchToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    try {
      if (isActive) {
        await unwatchInstrument(ticker, exchange);
        onToggle?.(false, null);
      } else {
        const result = await watchInstrument(ticker, exchange, instrumentType);
        onToggle?.(true, result.data?.insight ?? null);
      }
    } catch {
      console.error('Failed to toggle watch');
    } finally {
      setLoading(false);
    }
  }, [ticker, exchange, instrumentType, isActive, onToggle]);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Insight display */}
      {isActive && insight && (
        <ConfluenceIndicator
          grade={insight.overallQualityGrade || 'C'}
          narrativeType={insight.narrativeType}
          patternCount={insight.activePatternCount}
        />
      )}

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
          isActive
            ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
            : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300',
        )}
        title={isActive ? 'Stop watching' : 'Watch for patterns'}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isActive ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
