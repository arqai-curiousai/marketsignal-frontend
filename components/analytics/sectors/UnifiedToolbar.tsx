'use client';

import React from 'react';
import { Grid3X3, LayoutGrid, Table as TableIcon, Zap, Triangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMEFRAMES, SORT_OPTIONS } from './constants';
import type { SectorViewMode, SortOption } from './constants';
import type { SectorTimeframe } from '@/types/analytics';
import type { PyramidColorMode } from '../pyramid/constants';
import { COLOR_MODES } from '../pyramid/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UnifiedToolbarProps {
  viewMode: SectorViewMode;
  timeframe: SectorTimeframe;
  sortBy: SortOption;
  colorMode: PyramidColorMode;
  onViewModeChange: (mode: SectorViewMode) => void;
  onTimeframeChange: (tf: SectorTimeframe) => void;
  onSortChange: (sort: SortOption) => void;
  onColorModeChange: (cm: PyramidColorMode) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const VIEW_MODES: { mode: SectorViewMode; icon: React.ElementType; label: string; short: string }[] = [
  { mode: 'treemap', icon: Grid3X3, label: 'Treemap', short: 'TM' },
  { mode: 'heatmap', icon: LayoutGrid, label: 'Heatmap', short: 'HM' },
  { mode: 'table', icon: TableIcon, label: 'Table', short: 'Tbl' },
  { mode: 'flow', icon: Zap, label: 'Flow', short: 'Fl' },
  { mode: 'pyramid', icon: Triangle, label: 'Pyramid', short: 'Pyr' },
];

export function UnifiedToolbar({
  viewMode,
  timeframe,
  sortBy,
  colorMode,
  onViewModeChange,
  onTimeframeChange,
  onSortChange,
  onColorModeChange,
  onRefresh,
  refreshing,
}: UnifiedToolbarProps) {
  const isPyramid = viewMode === 'pyramid';

  return (
    <div className="flex flex-wrap items-end gap-3 py-2">
      {/* View toggle */}
      <div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 px-0.5">View</div>
        <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {VIEW_MODES.map(({ mode, icon: Icon, label, short }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              aria-label={label}
              aria-pressed={viewMode === mode}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 sm:py-1.5 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none',
                viewMode === mode
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-white/70',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden text-[10px]">{short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe pills */}
      <div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 px-0.5">Period</div>
        <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {TIMEFRAMES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onTimeframeChange(value)}
              aria-label={`${label} timeframe`}
              aria-pressed={timeframe === value}
              className={cn(
                'rounded-md px-2.5 py-2 sm:py-1.5 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none',
                timeframe === value
                  ? 'bg-brand-blue/20 text-brand-blue shadow-sm'
                  : 'text-muted-foreground hover:text-white/70',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional: Color mode (pyramid) or Sort (others) */}
      <div className="ml-auto">
        {isPyramid ? (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 px-0.5">Color</div>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              {COLOR_MODES.map((cm) => (
                <button
                  key={cm.value}
                  onClick={() => onColorModeChange(cm.value)}
                  aria-label={`${cm.label} color mode`}
                  aria-pressed={colorMode === cm.value}
                  className={cn(
                    'px-3 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-all focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none',
                    colorMode === cm.value
                      ? 'bg-white/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]',
                  )}
                >
                  {cm.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 px-0.5">Sort by</div>
            <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
              <SelectTrigger className="w-[130px] h-8 border-white/10 bg-white/[0.03] text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-brand-slate border-white/10">
                {SORT_OPTIONS.map(({ label, value }) => (
                  <SelectItem key={value} value={value} className="text-xs text-white">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh data"
          className={cn(
            'self-end rounded-lg border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition-all hover:text-white/70 focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      )}
    </div>
  );
}
