'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExchange } from '@/context/ExchangeContext';
import { getInstruments } from '@/lib/api/signalApi';
import type { IInstrument } from '@/types/stock';
import { NIFTY50_TICKERS } from '@/components/playground/pyramid/constants';

interface Props {
  value: string;
  onChange: (ticker: string) => void;
  className?: string;
}

export function TickerCombobox({ value, onChange, className }: Props) {
  const { exchangeConfig } = useExchange();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [instruments, setInstruments] = useState<IInstrument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExchange = useRef(exchangeConfig.code);

  // Fetch instruments for current exchange
  const fetchInstruments = useCallback(async () => {
    const code = exchangeConfig.code.toLowerCase() as Parameters<typeof getInstruments>[0];
    const result = await getInstruments(code);
    if (result.success) {
      setInstruments(result.data);
    } else {
      // Fallback: create bare instruments from NIFTY50_TICKERS
      setInstruments(
        NIFTY50_TICKERS.map((t) => ({
          ticker: t,
          name: t,
          instrumentType: 'equity' as IInstrument['instrumentType'],
          exchange: 'NSE',
          currency: 'INR',
        })),
      );
    }
    setLoaded(true);
  }, [exchangeConfig.code]);

  useEffect(() => {
    if (!loaded || lastExchange.current !== exchangeConfig.code) {
      lastExchange.current = exchangeConfig.code;
      setLoaded(false);
      fetchInstruments();
    }
  }, [exchangeConfig.code, loaded, fetchInstruments]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered instruments
  const filtered = useMemo(() => {
    const q = query.toUpperCase().trim();
    if (!q) return instruments.slice(0, 50);
    return instruments
      .filter(
        (inst) =>
          inst.ticker.toUpperCase().includes(q) ||
          (inst.name && inst.name.toUpperCase().includes(q)),
      )
      .slice(0, 50);
  }, [query, instruments]);

  const selectedName = useMemo(() => {
    const match = instruments.find((i) => i.ticker === value);
    return match?.name ?? value;
  }, [instruments, value]);

  const handleSelect = (ticker: string) => {
    onChange(ticker);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].ticker);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Trigger / display */}
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
          'bg-white/[0.04] text-xs font-mono text-white/80',
          isOpen ? 'border-indigo-500/30' : 'border-white/[0.08] hover:border-white/[0.12]',
        )}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <span className="font-semibold">{value}</span>
        {selectedName !== value && (
          <span className="text-white/35 truncate max-w-[120px]">{selectedName}</span>
        )}
        <ChevronDown
          className={cn(
            'h-3 w-3 text-white/30 transition-transform ml-auto',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              'absolute z-50 left-0 mt-1 w-[280px] rounded-lg border border-white/[0.08]',
              'bg-zinc-900/95 backdrop-blur-md shadow-xl',
            )}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
              <Search className="h-3 w-3 text-white/25 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search ticker or name..."
                aria-label="Search tickers"
                className="flex-1 bg-transparent text-[10px] font-mono text-white/70 placeholder:text-white/20 outline-none"
              />
            </div>

            {/* Results */}
            <div className="max-h-[200px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-[10px] text-white/25">
                  No tickers found
                </div>
              ) : (
                filtered.map((inst) => (
                  <button
                    key={inst.ticker}
                    type="button"
                    className={cn(
                      'w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors',
                      'hover:bg-white/[0.05]',
                      inst.ticker === value && 'bg-indigo-500/10',
                    )}
                    onClick={() => handleSelect(inst.ticker)}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-mono font-semibold w-[80px] shrink-0',
                        inst.ticker === value ? 'text-indigo-400' : 'text-white/70',
                      )}
                    >
                      {inst.ticker}
                    </span>
                    <span className="text-[9px] text-white/35 truncate">{inst.name}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
