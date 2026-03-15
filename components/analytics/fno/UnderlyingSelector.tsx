'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { IFnOUnderlying } from '@/types/analytics';

interface Props {
  underlyings: IFnOUnderlying[];
  selected: string;
  selectedExpiry: string | null;
  availableExpiries: string[];
  onSelectUnderlying: (symbol: string) => void;
  onSelectExpiry: (expiry: string) => void;
}

const FALLBACK_INDICES = ['NIFTY', 'BANKNIFTY'];

export function UnderlyingSelector({
  underlyings,
  selected,
  selectedExpiry,
  availableExpiries,
  onSelectUnderlying,
  onSelectExpiry,
}: Props) {
  const indices = underlyings.filter((u) => u.type === 'index').map((u) => u.symbol);
  const quickPicks = indices.length > 0 ? indices : FALLBACK_INDICES;
  const stocks = underlyings.filter((u) => u.type === 'stock');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Index quick-pick buttons */}
      {quickPicks.map((symbol) => (
        <button
          key={symbol}
          onClick={() => onSelectUnderlying(symbol)}
          className={cn(
            'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
            selected === symbol
              ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/40'
              : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10',
          )}
        >
          {symbol}
        </button>
      ))}

      {/* Stock dropdown */}
      {stocks.length > 0 && (
        <div className="relative">
          <select
            aria-label="Select stock underlying"
            value={quickPicks.includes(selected) ? '' : selected}
            onChange={(e) => {
              if (e.target.value) onSelectUnderlying(e.target.value);
            }}
            className={cn(
              'appearance-none pl-3 pr-7 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer',
              'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10',
              !quickPicks.includes(selected) && 'bg-brand-violet/20 text-brand-violet border-brand-violet/40',
            )}
          >
            <option value="" className="bg-slate-900">Stocks...</option>
            {stocks.map((s) => (
              <option key={s.symbol} value={s.symbol} className="bg-slate-900">
                {s.symbol}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      )}

      {/* Separator */}
      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Expiry dropdown */}
      {availableExpiries.length > 0 && (
        <div className="relative">
          <select
            aria-label="Select F&O expiry date"
            value={selectedExpiry ?? ''}
            onChange={(e) => { if (e.target.value) onSelectExpiry(e.target.value); }}
            className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 transition-all cursor-pointer"
          >
            {!selectedExpiry && (
              <option value="" disabled className="bg-slate-900">Expiry...</option>
            )}
            {availableExpiries.map((exp) => (
              <option key={exp} value={exp} className="bg-slate-900">
                {new Date(exp + 'T00:00:00').toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      )}
    </div>
  );
}
