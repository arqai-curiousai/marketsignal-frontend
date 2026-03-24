'use client';

import React, { useState } from 'react';
import { X, Shield, TrendingDown, AlertTriangle, ArrowUpDown, Globe, Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CorrelationInsight, InsightType } from '@/src/lib/correlation/insights';

interface InsightsPanelProps {
  insights: CorrelationInsight[];
  onPairSelect: (pair: [string, string]) => void;
  onAddAsset: (ticker: string) => void;
  /** Externally-managed dismissed IDs (optional — falls back to local state). */
  dismissed?: Set<string>;
  onDismiss?: (id: string) => void;
}

const INSIGHT_CONFIG: Record<InsightType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  hedge: { icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  regime: { icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  concentration: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  pairs_trade: { icon: ArrowUpDown, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  cross_asset: { icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  divergence: { icon: TrendingDown, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
};

export function InsightsPanel({ insights, onPairSelect, onAddAsset, dismissed: externalDismissed, onDismiss }: InsightsPanelProps) {
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const dismissedSet = externalDismissed ?? localDismissed;
  const handleDismiss = (id: string) => {
    if (onDismiss) {
      onDismiss(id);
    } else {
      setLocalDismissed((prev) => new Set(prev).add(id));
    }
  };

  const visible = insights.filter((i) => !dismissedSet.has(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors"
      >
        <Lightbulb className="h-3 w-3 text-amber-400" />
        <span className="uppercase tracking-wider font-medium">Insights</span>
        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-bold">
          {visible.length}
        </span>
        <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-2">
          {visible.map((insight) => {
            const config = INSIGHT_CONFIG[insight.type];
            const Icon = config.icon;

            return (
              <div
                key={insight.id}
                className={cn(
                  'group relative flex items-start gap-2 px-3 py-2 rounded-xl border transition-all max-w-sm',
                  config.bgColor, config.borderColor,
                  'hover:shadow-lg',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white leading-snug">{insight.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{insight.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {insight.pair && (
                      <button
                        onClick={() => onPairSelect(insight.pair!)}
                        className={cn('text-[9px] font-medium px-2 py-0.5 rounded-full transition-colors', config.color, 'bg-white/5 hover:bg-white/10')}
                      >
                        View Pair
                      </button>
                    )}
                    {insight.suggestedAsset && (
                      <button
                        onClick={() => onAddAsset(insight.suggestedAsset!)}
                        className="text-[9px] font-medium text-brand-blue px-2 py-0.5 rounded-full bg-brand-blue/10 hover:bg-brand-blue/20 transition-colors"
                      >
                        + Add {insight.suggestedAsset}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="absolute top-1.5 right-1.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
                  aria-label="Dismiss insight"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
