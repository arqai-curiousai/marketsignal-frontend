'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAllInstruments } from '@/lib/hooks/useInstrumentList';
import { EXCHANGES } from '@/lib/exchange/config';
import type { ExchangeCode } from '@/lib/exchange/config';
import type { IInstrument } from '@/types/stock';

/* ── types ─────────────────────────────────────────────────────── */

interface GlobalAssetSearchProps {
  mode: 'single' | 'multi';
  value: string | string[];
  onChange: (value: string | string[]) => void;
  className?: string;
  placeholder?: string;
  maxSelections?: number;
}

interface GroupedResults {
  label: string;
  flag: string;
  items: IInstrument[];
}

/* ── constants ─────────────────────────────────────────────────── */

const EQUITY_EXCHANGES: ExchangeCode[] = ['NSE', 'NASDAQ', 'NYSE', 'LSE', 'HKSE'];
const MAX_VISIBLE = 80;
const DEFAULT_MAX_SELECTIONS = 15;

/* ── helpers ───────────────────────────────────────────────────── */

function getExchangeFlag(exchange: string): string {
  const cfg = EXCHANGES[exchange as ExchangeCode];
  return cfg?.flag ?? '';
}

function getExchangeLabel(exchange: string): string {
  const cfg = EXCHANGES[exchange as ExchangeCode];
  return cfg?.name ?? exchange;
}

/**
 * Group instruments by asset class and sub-group.
 * Equities are sub-grouped by exchange code.
 * Forex are sub-grouped by the `sector` field (e.g. "INR Pairs", "Majors").
 * Commodities get a single group.
 */
function groupInstruments(items: IInstrument[]): GroupedResults[] {
  const groups: GroupedResults[] = [];

  // Equities — one group per exchange
  for (const exCode of EQUITY_EXCHANGES) {
    const exItems = items.filter(
      (i) => i.instrumentType === 'equity' && i.exchange === exCode,
    );
    if (exItems.length > 0) {
      groups.push({
        label: EXCHANGES[exCode].fullName,
        flag: EXCHANGES[exCode].flag,
        items: exItems,
      });
    }
  }

  // Forex — sub-group by sector field
  const fxItems = items.filter((i) => i.instrumentType === 'currency');
  if (fxItems.length > 0) {
    const sectorMap = new Map<string, IInstrument[]>();
    for (const inst of fxItems) {
      const sector = inst.sector ?? 'Other';
      if (!sectorMap.has(sector)) sectorMap.set(sector, []);
      sectorMap.get(sector)!.push(inst);
    }
    for (const [sector, sectorItems] of Array.from(sectorMap.entries())) {
      groups.push({
        label: sector,
        flag: EXCHANGES.FX.flag,
        items: sectorItems,
      });
    }
  }

  // Commodities
  const comItems = items.filter((i) => i.instrumentType === 'commodity');
  if (comItems.length > 0) {
    groups.push({
      label: 'Commodities (MCX)',
      flag: '\uD83C\uDDEE\uD83C\uDDF3',
      items: comItems,
    });
  }

  return groups;
}

/* ── component ─────────────────────────────────────────────────── */

export function GlobalAssetSearch({
  mode,
  value,
  onChange,
  className,
  placeholder,
  maxSelections = DEFAULT_MAX_SELECTIONS,
}: GlobalAssetSearchProps) {
  const { instruments, loading } = useAllInstruments();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize value into a Set for multi-mode lookups
  const selected = useMemo<Set<string>>(() => {
    if (mode === 'single') return new Set(value ? [value as string] : []);
    return new Set(value as string[]);
  }, [mode, value]);

  // ── filter + group ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    let pool = instruments;
    if (q) {
      pool = instruments.filter(
        (inst) =>
          inst.ticker.toUpperCase().includes(q) ||
          (inst.name && inst.name.toUpperCase().includes(q)) ||
          (inst.exchange && inst.exchange.toUpperCase().includes(q)) ||
          (inst.sector && inst.sector.toUpperCase().includes(q)),
      );
    }
    return pool.slice(0, MAX_VISIBLE);
  }, [query, instruments]);

  const groups = useMemo(() => groupInstruments(filtered), [filtered]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  // ── close on outside click ──────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── scroll highlighted item into view ───────────────────────
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  // ── selection logic ─────────────────────────────────────────
  const handleSelect = useCallback(
    (ticker: string) => {
      if (mode === 'single') {
        onChange(ticker);
        setIsOpen(false);
        setQuery('');
      } else {
        const current = new Set(value as string[]);
        if (current.has(ticker)) {
          current.delete(ticker);
        } else {
          if (current.size >= maxSelections) return;
          current.add(ticker);
        }
        onChange(Array.from(current));
        // Keep dropdown open for multi-select
        setQuery('');
        inputRef.current?.focus();
      }
    },
    [mode, value, onChange, maxSelections],
  );

  const handleRemove = useCallback(
    (ticker: string) => {
      if (mode === 'multi') {
        const current = (value as string[]).filter((t) => t !== ticker);
        onChange(current);
      }
    },
    [mode, value, onChange],
  );

  // ── keyboard navigation ─────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[highlightIdx]) {
          handleSelect(flatItems[highlightIdx].ticker);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (
        e.key === 'Backspace' &&
        query === '' &&
        mode === 'multi' &&
        (value as string[]).length > 0
      ) {
        // Remove last selected ticker
        const arr = value as string[];
        handleRemove(arr[arr.length - 1]);
      }
    },
    [flatItems, highlightIdx, handleSelect, handleRemove, query, mode, value],
  );

  // ── display helpers ─────────────────────────────────────────
  const selectedLabel = useMemo(() => {
    if (mode === 'single') {
      const v = value as string;
      if (!v) return '';
      const match = instruments.find((i) => i.ticker === v);
      return match?.name ?? v;
    }
    return '';
  }, [mode, value, instruments]);

  const multiValues = mode === 'multi' ? (value as string[]) : [];

  const defaultPlaceholder =
    mode === 'single'
      ? 'Search ticker, name, or exchange...'
      : `Search instruments (max ${maxSelections})...`;

  // ── build flat index mapping for keyboard highlight ─────────
  const flatIdxMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const g of groups) {
      for (const item of g.items) {
        map.set(item.ticker, idx);
        idx++;
      }
    }
    return map;
  }, [groups]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* ── Trigger ──────────────────────────────────────────── */}
      {mode === 'single' ? (
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors w-full',
            'bg-white/[0.04] text-xs font-mono text-white/80',
            isOpen ? 'border-indigo-500/30' : 'border-white/[0.08] hover:border-white/[0.12]',
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          {value ? (
            <>
              <span className="shrink-0">{getExchangeFlag(instruments.find((i) => i.ticker === value)?.exchange ?? '')}</span>
              <span className="font-semibold">{value as string}</span>
              {selectedLabel !== value && (
                <span className="text-white/35 truncate max-w-[160px]">{selectedLabel}</span>
              )}
            </>
          ) : (
            <span className="text-white/25">{placeholder ?? defaultPlaceholder}</span>
          )}
          <ChevronDown
            className={cn(
              'h-3 w-3 text-white/30 transition-transform ml-auto shrink-0',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      ) : (
        <div
          className={cn(
            'flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors min-h-[36px] cursor-text',
            'bg-white/[0.04] text-xs',
            isOpen ? 'border-indigo-500/30' : 'border-white/[0.08] hover:border-white/[0.12]',
          )}
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          {/* Selected badges */}
          {multiValues.map((ticker) => {
            const inst = instruments.find((i) => i.ticker === ticker);
            return (
              <Badge
                key={ticker}
                variant="secondary"
                className="h-5 px-1.5 gap-1 bg-white/[0.06] border-white/[0.08] text-[10px] font-mono text-white/70 hover:bg-white/[0.1]"
              >
                <span className="text-[9px]">{getExchangeFlag(inst?.exchange ?? '')}</span>
                {ticker}
                <button
                  type="button"
                  className="ml-0.5 hover:text-white/90 text-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(ticker);
                  }}
                  aria-label={`Remove ${ticker}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}

          {/* Inline input for multi-mode */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={multiValues.length === 0 ? (placeholder ?? defaultPlaceholder) : ''}
            aria-label="Search instruments"
            className="flex-1 min-w-[80px] bg-transparent text-[10px] font-mono text-white/70 placeholder:text-white/20 outline-none"
          />

          <ChevronDown
            className={cn(
              'h-3 w-3 text-white/30 transition-transform ml-auto shrink-0',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      )}

      {/* ── Dropdown ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              'absolute z-50 left-0 mt-1 w-full min-w-[320px] rounded-lg border border-white/[0.08]',
              'bg-zinc-900/95 backdrop-blur-md shadow-xl',
            )}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input (single mode only — multi has inline input) */}
            {mode === 'single' && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                <Search className="h-3 w-3 text-white/25 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder ?? defaultPlaceholder}
                  aria-label="Search instruments"
                  className="flex-1 bg-transparent text-[10px] font-mono text-white/70 placeholder:text-white/20 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-white/25 hover:text-white/50"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-[10px] text-white/25">
                  Loading instruments...
                </div>
              ) : groups.length === 0 ? (
                <div className="px-3 py-6 text-center text-[10px] text-white/25">
                  No instruments found
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.label}>
                    {/* Group header */}
                    <div className="sticky top-0 z-10 px-3 py-1.5 bg-zinc-900/98 border-b border-white/[0.04]">
                      <span className="text-[9px] uppercase tracking-wider font-medium text-white/30">
                        {group.flag} {group.label}
                        <span className="ml-1.5 text-white/15">({group.items.length})</span>
                      </span>
                    </div>

                    {/* Group items */}
                    {group.items.map((inst) => {
                      const idx = flatIdxMap.get(inst.ticker) ?? -1;
                      const isSelected = selected.has(inst.ticker);
                      const isHighlighted = idx === highlightIdx;
                      const atLimit =
                        mode === 'multi' && !isSelected && selected.size >= maxSelections;

                      return (
                        <button
                          key={inst.ticker}
                          type="button"
                          data-idx={idx}
                          disabled={atLimit}
                          className={cn(
                            'w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors',
                            isHighlighted && 'bg-white/[0.06]',
                            !isHighlighted && 'hover:bg-white/[0.04]',
                            isSelected && 'bg-indigo-500/10',
                            atLimit && 'opacity-30 cursor-not-allowed',
                          )}
                          onClick={() => handleSelect(inst.ticker)}
                          onMouseEnter={() => setHighlightIdx(idx)}
                        >
                          {/* Flag */}
                          <span className="text-[10px] shrink-0 w-4 text-center">
                            {getExchangeFlag(inst.exchange)}
                          </span>

                          {/* Ticker */}
                          <span
                            className={cn(
                              'text-[10px] font-mono font-semibold w-[72px] shrink-0',
                              isSelected ? 'text-indigo-400' : 'text-white/70',
                            )}
                          >
                            {inst.ticker}
                          </span>

                          {/* Name */}
                          <span className="text-[9px] text-white/35 truncate flex-1">
                            {inst.name}
                          </span>

                          {/* Exchange badge */}
                          <span
                            className={cn(
                              'text-[8px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded shrink-0',
                              'bg-white/[0.04] text-white/25 border border-white/[0.06]',
                            )}
                          >
                            {getExchangeLabel(inst.exchange)}
                          </span>

                          {/* Selected check (multi mode) */}
                          {mode === 'multi' && isSelected && (
                            <span className="text-indigo-400 text-[10px] shrink-0">&#10003;</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-1.5 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[9px] text-white/20 font-mono">
                {mode === 'multi'
                  ? `${selected.size}/${maxSelections} selected`
                  : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </span>
              <span className="text-[9px] text-white/15 font-mono">
                <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[8px]">&uarr;&darr;</kbd>
                {' '}navigate{' '}
                <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[8px]">&#9166;</kbd>
                {' '}select{' '}
                <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[8px]">esc</kbd>
                {' '}close
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
