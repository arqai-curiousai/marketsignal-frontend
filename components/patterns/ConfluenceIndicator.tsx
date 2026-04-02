'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ConfluenceIndicatorProps {
  grade: string; // A+, A, B, C
  narrativeType: 'divergence' | 'alignment' | 'quiet';
  patternCount?: number;
  className?: string;
}

const GRADE_STYLES: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  'A+': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    ring: 'ring-violet-500/30',
    glow: 'shadow-violet-500/20',
  },
  A: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    ring: 'ring-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  B: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    ring: 'ring-slate-500/30',
    glow: 'shadow-slate-500/20',
  },
  C: {
    bg: 'bg-slate-600/10',
    text: 'text-slate-500',
    ring: 'ring-slate-600/30',
    glow: '',
  },
};

const NARRATIVE_LABELS: Record<string, { label: string; color: string }> = {
  divergence: { label: 'Smart Money Divergence', color: 'text-amber-400' },
  alignment: { label: 'Trend Alignment', color: 'text-emerald-400' },
  quiet: { label: 'Quiet Structure', color: 'text-slate-500' },
};

export function ConfluenceIndicator({
  grade,
  narrativeType,
  patternCount,
  className,
}: ConfluenceIndicatorProps) {
  const gradeStyle = GRADE_STYLES[grade] || GRADE_STYLES.C;
  const narrative = NARRATIVE_LABELS[narrativeType] || NARRATIVE_LABELS.quiet;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Quality Grade Badge */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg ring-1',
          gradeStyle.bg,
          gradeStyle.ring,
          gradeStyle.glow && `shadow-lg ${gradeStyle.glow}`,
        )}
      >
        <span className={cn('text-sm font-bold', gradeStyle.text)}>{grade}</span>
      </div>

      {/* Narrative Info */}
      <div className="flex flex-col">
        <span className={cn('text-xs font-medium', narrative.color)}>
          {narrative.label}
        </span>
        {patternCount !== undefined && patternCount > 0 && (
          <span className="text-[10px] text-slate-500">
            {patternCount} active pattern{patternCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
