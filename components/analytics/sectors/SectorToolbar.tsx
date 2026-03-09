'use client';

import React from 'react';
import { Grid3X3, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMEFRAMES, SORT_OPTIONS } from './constants';
import type { SectorViewMode, SortOption } from './constants';
import type { SectorTimeframe } from '@/types/analytics';

interface SectorToolbarProps {
  viewMode: SectorViewMode;
  timeframe: SectorTimeframe;
  sortBy: SortOption;
  onViewModeChange: (mode: SectorViewMode) => void;
  onTimeframeChange: (tf: SectorTimeframe) => void;
  onSortChange: (sort: SortOption) => void;
}

const VIEW_MODES: { mode: SectorViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'treemap', icon: Grid3X3, label: 'Treemap' },
  { mode: 'heatmap', icon: LayoutGrid, label: 'Heatmap' },
  { mode: 'table', icon: TableIcon, label: 'Table' },
];

export function SectorToolbar({
  viewMode,
  timeframe,
  sortBy,
  onViewModeChange,
  onTimeframeChange,
  onSortChange,
}: SectorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      {/* View toggle */}
      <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
        {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              viewMode === mode
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-muted-foreground hover:text-white/70',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Timeframe pills */}
      <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onTimeframeChange(value)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
              timeframe === value
                ? 'bg-brand-blue/20 text-brand-blue shadow-sm'
                : 'text-muted-foreground hover:text-white/70',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
        >
          {SORT_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value} className="bg-brand-slate">
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
