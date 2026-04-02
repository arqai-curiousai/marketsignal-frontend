'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPresetBasket } from '@/types/simulation';
import type { IInstrument } from '@/types/stock';

interface Props {
  selectedTickers: string[];
  onTickersChange: (tickers: string[]) => void;
  presets?: IPresetBasket[];
  className?: string;
  /** Available instruments (from useInstrumentList). Falls back to empty. */
  instruments?: IInstrument[];
}

const MAX_TICKERS = 15;

// ─── Default presets (used when backend presets unavailable) ─────

const DEFAULT_PRESETS: IPresetBasket[] = [
  {
    id: 'top15',
    label: 'Top 15',
    description: 'Top 15 by market cap',
    tickers: [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
      'BHARTIARTL', 'SBIN', 'ITC', 'LT', 'HCLTECH',
      'BAJFINANCE', 'KOTAKBANK', 'AXISBANK', 'TITAN', 'MARUTI',
    ],
  },
  {
    id: 'defensive',
    label: 'Defensive',
    description: 'Low-beta defensive stocks',
    tickers: [
      'ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM',
      'SUNPHARMA', 'CIPLA', 'DRREDDY', 'POWERGRID', 'NTPC',
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    description: 'High-growth momentum stocks',
    tickers: [
      'BAJFINANCE', 'TITAN', 'TRENT', 'BHARTIARTL', 'ADANIENT',
      'APOLLOHOSP', 'HCLTECH', 'INFY', 'TCS', 'SHRIRAMFIN',
    ],
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Mix of value and growth',
    tickers: [
      'HDFCBANK', 'RELIANCE', 'INFY', 'ITC', 'SBIN',
      'SUNPHARMA', 'LT', 'TITAN', 'BHARTIARTL', 'ICICIBANK',
      'M&M', 'AXISBANK',
    ],
  },
];

// ─── Main Component ─────────────────────────────────────────────

export function TickerSelector({ selectedTickers, onTickersChange, presets, className, instruments = [] }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activePresets = presets && presets.length > 0 ? presets : DEFAULT_PRESETS;

  // Filtered tickers based on search query
  const availableTickers = useMemo(() => instruments.map((i) => i.ticker), [instruments]);

  const filteredTickers = useMemo(() => {
    const q = query.toUpperCase().trim();
    if (!q) return availableTickers.filter((t) => !selectedTickers.includes(t));
    return availableTickers.filter(
      (t) => t.includes(q) && !selectedTickers.includes(t),
    );
  }, [query, selectedTickers, availableTickers]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTicker = useCallback((ticker: string) => {
    if (selectedTickers.length >= MAX_TICKERS) return;
    if (selectedTickers.includes(ticker)) return;
    onTickersChange([...selectedTickers, ticker]);
    setQuery('');
  }, [selectedTickers, onTickersChange]);

  const removeTicker = useCallback((ticker: string) => {
    onTickersChange(selectedTickers.filter((t) => t !== ticker));
  }, [selectedTickers, onTickersChange]);

  const applyPreset = useCallback((preset: IPresetBasket) => {
    onTickersChange(preset.tickers.slice(0, MAX_TICKERS));
    setIsOpen(false);
    setQuery('');
  }, [onTickersChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredTickers.length > 0) {
      addTicker(filteredTickers[0]);
    } else if (e.key === 'Backspace' && query === '' && selectedTickers.length > 0) {
      removeTicker(selectedTickers[selectedTickers.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {activePresets.map((preset) => {
          const isActive = preset.tickers.length === selectedTickers.length &&
            preset.tickers.every((t) => selectedTickers.includes(t));

          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-medium transition-all border',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  : 'text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/[0.10]',
              )}
              onClick={() => applyPreset(preset)}
              title={preset.description}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Search input + selected badges */}
      <div className="relative">
        <div
          className={cn(
            'flex flex-wrap items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors min-h-[36px]',
            'bg-white/[0.03]',
            isOpen ? 'border-indigo-500/30' : 'border-white/[0.06]',
          )}
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className="h-3 w-3 text-white/25 shrink-0" />

          {/* Selected ticker badges */}
          <AnimatePresence>
            {selectedTickers.map((ticker) => (
              <motion.span
                key={ticker}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <span className="text-[9px] font-mono text-white/70">{ticker}</span>
                <button
                  type="button"
                  className="text-white/30 hover:text-white/60 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTicker(ticker);
                  }}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Text input */}
          {selectedTickers.length < MAX_TICKERS && (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedTickers.length === 0 ? 'Search tickers...' : ''}
              className="flex-1 min-w-[60px] bg-transparent text-[10px] font-mono text-white/70 placeholder:text-white/20 outline-none"
            />
          )}

          {/* Count badge */}
          <span className={cn(
            'text-[8px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ml-auto',
            selectedTickers.length >= MAX_TICKERS
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-white/[0.04] text-white/30',
          )}>
            {selectedTickers.length}/{MAX_TICKERS}
          </span>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && filteredTickers.length > 0 && (
            <motion.div
              className={cn(
                'absolute z-50 left-0 right-0 mt-1 rounded-lg border border-white/[0.08]',
                'bg-zinc-900/95 backdrop-blur-md shadow-xl max-h-[200px] overflow-y-auto',
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {filteredTickers.slice(0, 20).map((ticker) => (
                <button
                  key={ticker}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-white/60 hover:bg-white/[0.05] hover:text-white/80 transition-colors"
                  onClick={() => addTicker(ticker)}
                >
                  {ticker}
                </button>
              ))}
              {filteredTickers.length > 20 && (
                <div className="px-3 py-1.5 text-[9px] text-white/20 border-t border-white/[0.04]">
                  +{filteredTickers.length - 20} more...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
