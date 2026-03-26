'use client';

import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { S } from '@/components/playground/pyramid/tokens';
import { TickerSelector } from '@/components/playground/simulations/portfolio/TickerSelector';
import type { IPresetBasket } from '@/types/simulation';

interface Props {
  /** Selected tickers */
  tickers: string[];
  /** Ticker change handler */
  onTickersChange: (tickers: string[]) => void;
  /** Preset baskets */
  presets?: IPresetBasket[];
  /** Exchange label */
  exchange?: string;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Whether currently refreshing */
  refreshing?: boolean;
  /** CSV export handler */
  onExportCSV?: () => void;
  /** PNG export handler */
  onExportPNG?: () => void;
  /** Additional children (badges, toggles) */
  children?: React.ReactNode;
  className?: string;
}

export function SimPortfolioToolbar({
  tickers,
  onTickersChange,
  presets,
  exchange = 'NSE',
  onRefresh,
  refreshing,
  onExportCSV,
  onExportPNG,
  children,
  className,
}: Props) {
  return (
    <div className={cn('space-y-3', className)}>
      <TickerSelector
        selectedTickers={tickers}
        onTickersChange={onTickersChange}
        presets={presets}
      />
      <div className={cn('flex flex-wrap items-center gap-3', S.card, 'px-4 py-2.5')}>
        {/* Exchange badge */}
        <span className="text-[10px] uppercase tracking-wider font-medium text-white/35 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.04]">
          {exchange}
        </span>

        {/* Ticker count */}
        <span className="text-[10px] text-white/30 font-mono">
          {tickers.length} ticker{tickers.length !== 1 ? 's' : ''}
        </span>

        {/* Custom children */}
        {children}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0 text-white/40 hover:text-white/70"
            aria-label="Refresh data"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          </Button>
        )}

        {(onExportCSV || onExportPNG) && (
          <div className="flex items-center gap-1">
            {onExportCSV && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportCSV}
                className="h-8 px-2 text-[10px] text-white/40 hover:text-white/70"
                aria-label="Export as CSV"
              >
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
            )}
            {onExportPNG && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportPNG}
                className="h-8 px-2 text-[10px] text-white/40 hover:text-white/70"
                aria-label="Export as PNG"
              >
                <Download className="h-3 w-3 mr-1" />
                PNG
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
