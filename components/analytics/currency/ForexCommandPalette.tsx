'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUp, ArrowDown, CornerDownLeft, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForexData } from './ForexDataProvider';
import { ALL_FOREX_PAIRS, PAIR_CATEGORY_LABELS } from './constants';

/* ── Recent pairs (localStorage) ── */

const RECENT_KEY = 'forex-recent-pairs';
const MAX_RECENT = 5;

function getRecentPairs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function addRecentPair(pair: string) {
  const recent = getRecentPairs().filter(p => p !== pair);
  recent.unshift(pair);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

/* ── Fuzzy match ── */

function fuzzyMatch(query: string, pair: string): boolean {
  const q = query.toLowerCase().replace(/[/ ]/g, '');
  const p = pair.toLowerCase().replace(/[/ ]/g, '');
  return p.includes(q);
}

/* ── Palette trigger button ── */

export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] transition-colors text-xs text-muted-foreground"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search pairs...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}

/* ── Main Palette ── */

interface ForexCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function ForexCommandPalette({ open, onClose }: ForexCommandPaletteProps) {
  const { setSelectedPair, overview } = useForexData();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build price map
  const priceMap = useMemo(() => {
    const m = new Map<string, { price: number; changePct: number }>();
    for (const p of overview?.pairs ?? []) {
      m.set(p.ticker, { price: p.price, changePct: p.change_pct });
    }
    return m;
  }, [overview]);

  // Filter pairs
  const results = useMemo(() => {
    if (!query.trim()) {
      const recent = getRecentPairs();
      if (recent.length > 0) return recent;
      return ALL_FOREX_PAIRS.slice(0, 10) as unknown as string[];
    }
    return (ALL_FOREX_PAIRS as readonly string[]).filter(p => fuzzyMatch(query, p));
  }, [query]);

  // Reset index on results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const pair = results[selectedIndex];
        if (pair) {
          setSelectedPair(pair);
          addRecentPair(pair);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIndex, setSelectedPair, onClose],
  );

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Global Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // caller toggles
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const selectPair = useCallback(
    (pair: string) => {
      setSelectedPair(pair);
      addRecentPair(pair);
      onClose();
    },
    [setSelectedPair, onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md"
          >
            <div className="rounded-xl border border-white/[0.1] bg-[#0c0f1a]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search 42 forex pairs..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground/50 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-72 overflow-y-auto scrollbar-thin py-1"
              >
                {!query.trim() && getRecentPairs().length > 0 && (
                  <div className="px-3 py-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                      Recent
                    </span>
                  </div>
                )}

                {results.map((pair, i) => {
                  const data = priceMap.get(pair);
                  const isSelected = i === selectedIndex;
                  const pct = data?.changePct ?? 0;

                  return (
                    <button
                      key={pair}
                      onClick={() => selectPair(pair)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                        isSelected
                          ? 'bg-sky-500/10 text-white'
                          : 'text-white/70 hover:bg-white/[0.04]',
                      )}
                    >
                      <span className="font-semibold w-20">{pair}</span>
                      <span className="text-[10px] text-muted-foreground/50 w-20">
                        {PAIR_CATEGORY_LABELS[pair] ?? ''}
                      </span>
                      {data && (
                        <>
                          <span className="font-mono tabular-nums text-white/60 text-xs">
                            {data.price.toFixed(data.price >= 100 ? 2 : 4)}
                          </span>
                          <span
                            className={cn(
                              'ml-auto font-mono text-[10px] tabular-nums',
                              pct >= 0 ? 'text-sky-400' : 'text-orange-400',
                            )}
                          >
                            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}

                {results.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground/40">
                    No pairs match &quot;{query}&quot;
                  </div>
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[10px] text-muted-foreground/40">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-2.5 w-2.5" />
                  <ArrowDown className="h-2.5 w-2.5" />
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                  select
                </span>
                <span className="ml-auto">
                  42 pairs &middot; 17 currencies
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
