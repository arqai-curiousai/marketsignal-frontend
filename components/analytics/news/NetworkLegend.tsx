'use client';

import React from 'react';
import { NODE_TYPE_COLORS, EDGE_STYLES } from './constants';
import { cn } from '@/lib/utils';

export function NetworkLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-20 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm px-3 py-2 text-[10px] text-muted-foreground space-y-1.5">
      {/* Node types */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_TYPE_COLORS.article }} />
          <span>Article</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: NODE_TYPE_COLORS.ticker }} />
          <span>Ticker</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rotate-45 rounded-[1px]" style={{ backgroundColor: NODE_TYPE_COLORS.theme }} />
          <span>Theme</span>
        </span>
      </div>
      {/* Edge types */}
      <div className="flex items-center gap-3 border-t border-white/5 pt-1.5">
        {Object.entries(EDGE_STYLES).map(([key, style]) => (
          <span key={key} className="flex items-center gap-1">
            <svg width="16" height="6" className="shrink-0">
              <line
                x1="0" y1="3" x2="16" y2="3"
                stroke={style.color}
                strokeWidth={key === 'co_occurrence' ? 2.5 : 1.5}
                strokeDasharray={style.dash}
                strokeOpacity={0.8}
              />
            </svg>
            <span className="text-white/50">{style.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
