'use client';

import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { S } from '@/components/playground/pyramid/tokens';

interface Props {
  /** Current ticker */
  ticker: string;
  /** All available tickers */
  tickers?: string[];
  /** Ticker change handler */
  onTickerChange: (ticker: string) => void;
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

export function SimToolbar({
  ticker,
  tickers = [],
  onTickerChange,
  exchange = 'NSE',
  onRefresh,
  refreshing,
  onExportCSV,
  onExportPNG,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        S.card,
        'px-4 py-2.5',
        className,
      )}
    >
      {/* Ticker selector */}
      <select
        value={ticker}
        onChange={(e) => onTickerChange(e.target.value)}
        className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      >
        {tickers.map((t) => (
          <option key={t} value={t} className="bg-slate-900 text-white">
            {t}
          </option>
        ))}
      </select>

      {/* Exchange badge */}
      <span className="text-[10px] uppercase tracking-wider font-medium text-white/35 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.04]">
        {exchange}
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
            >
              <Download className="h-3 w-3 mr-1" />
              PNG
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
