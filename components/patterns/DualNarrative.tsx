'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Building2, Users } from 'lucide-react';

interface DualNarrativeProps {
  institutionalStance: string;
  retailSentiment: string;
  marketMakerReasoning?: string;
  retailReasoning?: string;
  narrativeType: 'divergence' | 'alignment' | 'quiet';
  conviction: number;
  className?: string;
}

const STANCE_COLORS: Record<string, string> = {
  accumulating: 'text-emerald-400',
  distributing: 'text-red-400',
  neutral: 'text-slate-400',
  bullish: 'text-emerald-400',
  bearish: 'text-red-400',
  confused: 'text-amber-400',
};

export function DualNarrative({
  institutionalStance,
  retailSentiment,
  marketMakerReasoning,
  retailReasoning,
  narrativeType,
  conviction,
  className,
}: DualNarrativeProps) {
  const isDivergence = narrativeType === 'divergence';

  return (
    <div className={cn('space-y-3', className)}>
      {/* Divergence badge */}
      {isDivergence && (
        <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-400">
            Institutional and retail perspectives diverge
          </span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Market Maker perspective */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Institutional Flow</span>
          </div>
          <div className="mb-1.5">
            <span
              className={cn(
                'text-sm font-semibold capitalize',
                STANCE_COLORS[institutionalStance] || 'text-slate-400',
              )}
            >
              {institutionalStance}
            </span>
          </div>
          {marketMakerReasoning && (
            <p className="text-xs leading-relaxed text-slate-500">
              {marketMakerReasoning}
            </p>
          )}
        </div>

        {/* Retail perspective */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Retail Sentiment</span>
          </div>
          <div className="mb-1.5">
            <span
              className={cn(
                'text-sm font-semibold capitalize',
                STANCE_COLORS[retailSentiment] || 'text-slate-400',
              )}
            >
              {retailSentiment}
            </span>
          </div>
          {retailReasoning && (
            <p className="text-xs leading-relaxed text-slate-500">
              {retailReasoning}
            </p>
          )}
        </div>
      </div>

      {/* Conviction bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500">Conviction</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-slate-600 to-slate-400 transition-all duration-700"
            style={{ width: `${Math.round(conviction * 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          {Math.round(conviction * 100)}%
        </span>
      </div>
    </div>
  );
}
