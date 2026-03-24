'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadCSV, downloadPNG } from '@/src/lib/utils/export';

import { ForexTickerStrip } from './ForexTickerStrip';
import { MarketsView } from './MarketsView';
import { AnalysisView } from './AnalysisView';
import { MacroView } from './MacroView';
import { ForexCalculators } from './ForexCalculators';

import {
  FOREX_MODULES,
  FOREX_VALID_MODULE_IDS,
  FOREX_TIMEFRAMES,
  FOREX_DISCLAIMER,
  NSE_FOREX_PAIRS,
  type ForexModule,
} from './constants';
import { getCurrencyOverview } from '@/src/lib/api/analyticsApi';
import type { ICurrencyOverview } from '@/src/types/analytics';

/* ─── Module Card Component ─────────────────────────────────────────────── */

function ModuleCard({
  mod,
  isActive,
  index,
  onClick,
}: {
  mod: ForexModule;
  isActive: boolean;
  index: number;
  onClick: () => void;
}) {
  const Icon = mod.icon;

  return (
    <motion.button
      onClick={onClick}
      aria-label={`${mod.label} — ${mod.tagline}`}
      aria-current={isActive ? 'true' : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.15 + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group relative text-left rounded-2xl p-[1px] transition-all duration-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive ? 'z-10' : 'z-0',
      )}
    >
      {/* Gradient border */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl transition-opacity duration-500',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
        )}
        style={{
          background: `linear-gradient(135deg, ${mod.accentFrom}30, ${mod.accentTo}10, transparent 60%)`,
        }}
      />

      {/* Outer glow when active */}
      {isActive && (
        <motion.div
          layoutId="forexModuleGlow"
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 40px -8px ${mod.glowColor}, 0 0 80px -16px ${mod.glowColor.replace('0.35', '0.15')}`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Card surface */}
      <div
        className={cn(
          'relative rounded-2xl px-5 py-5 md:px-6 md:py-6 transition-all duration-500 overflow-hidden',
          isActive
            ? 'bg-white/[0.06] backdrop-blur-xl'
            : 'bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm',
        )}
        style={isActive ? { borderColor: mod.borderColor } : undefined}
      >
        {/* Ambient glow blob */}
        <div
          className={cn(
            'absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none',
            isActive ? 'opacity-30' : 'opacity-0 group-hover:opacity-10',
          )}
          style={{
            background: `radial-gradient(circle, ${mod.accentFrom}, transparent 70%)`,
          }}
        />

        {/* Top row: icon + status */}
        <div className="relative flex items-center justify-between mb-4">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500',
              isActive
                ? 'bg-white/10'
                : 'bg-white/[0.04] group-hover:bg-white/[0.06]',
            )}
          >
            <Icon
              className="h-5 w-5 transition-colors duration-500"
              style={{ color: isActive ? mod.accentFrom : 'rgba(255,255,255,0.3)' }}
            />
          </div>

          {/* Active indicator chip */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase transition-all duration-500',
              isActive ? 'opacity-100' : 'opacity-0 translate-x-2',
            )}
            style={
              isActive
                ? {
                    color: mod.accentFrom,
                    background: `${mod.accentFrom}12`,
                  }
                : undefined
            }
          >
            <span
              className="h-1 w-1 rounded-full animate-pulse"
              style={{ backgroundColor: mod.accentFrom }}
            />
            Active
          </div>
        </div>

        {/* Label + tagline */}
        <h3
          className={cn(
            'text-sm font-semibold transition-colors duration-500 mb-1',
            isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70',
          )}
        >
          {mod.label}
        </h3>
        <p
          className={cn(
            'text-[11px] leading-relaxed transition-colors duration-500',
            isActive ? 'text-white/50' : 'text-white/25 group-hover:text-white/35',
          )}
        >
          {mod.tagline}
        </p>

        {/* Bottom progress bar */}
        <div className="mt-4 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${mod.accentFrom}, ${mod.accentTo})` }}
            initial={{ width: '0%' }}
            animate={{ width: isActive ? '100%' : '0%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Command Bar ────────────────────────────────────────────────────────── */

function CommandBar({
  selectedPair,
  onPairChange,
  timeframe,
  onTimeframeChange,
  onExportCSV,
}: {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onExportCSV: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return [...NSE_FOREX_PAIRS];
    const q = search.toLowerCase();
    return NSE_FOREX_PAIRS.filter(p => p.toLowerCase().includes(q));
  }, [search]);

  // Close search dropdown on click outside
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  return (
    <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-white/[0.04] -mx-4 md:-mx-6 px-4 md:px-6 py-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Pair selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSearchOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] transition-colors text-sm"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{selectedPair}</span>
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-white/[0.08] bg-[#1A1F2E] shadow-xl z-50 overflow-hidden">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search pair..."
                className="border-0 border-b border-white/[0.06] rounded-none text-xs bg-transparent focus-visible:ring-0"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto">
                {filtered.map(pair => (
                  <button
                    key={pair}
                    onClick={() => {
                      onPairChange(pair);
                      setSearchOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors',
                      pair === selectedPair ? 'text-sky-400 bg-sky-400/5' : 'text-foreground',
                    )}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeframe pills */}
        <div className="flex gap-0.5">
          {FOREX_TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors',
                timeframe === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]',
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export */}
        <ExportButton
          options={[
            {
              label: 'Export CSV',
              icon: <Download className="h-3.5 w-3.5" />,
              onClick: onExportCSV,
            },
            {
              label: 'Export PNG',
              icon: <Image className="h-3.5 w-3.5" />,
              onClick: () => {
                const el = document.getElementById('forex-dashboard-content');
                if (el) downloadPNG(el, 'forex-dashboard');
              },
            },
          ]}
        />
      </div>
    </div>
  );
}

/* ─── URL Param Helpers ──────────────────────────────────────────────────── */

function writeUrlParams(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState({}, '', url.toString());
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */

export function ForexDashboard() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'markets';
  const [activeId, setActiveId] = useState(
    FOREX_VALID_MODULE_IDS.has(rawTab) ? rawTab : 'markets'
  );

  // Read pair and timeframe from URL with validation
  const rawPair = searchParams.get('pair');
  const rawTf = searchParams.get('tf');
  const [selectedPair, setSelectedPair] = useState(
    rawPair && (NSE_FOREX_PAIRS as readonly string[]).includes(rawPair) ? rawPair : 'USD/INR'
  );
  const [timeframe, setTimeframe] = useState(
    rawTf && (FOREX_TIMEFRAMES as readonly string[]).includes(rawTf) ? rawTf : '1D'
  );
  const [overview, setOverview] = useState<ICurrencyOverview | null>(null);
  const [chartOverlays, setChartOverlays] = useState({ vol: true, sma: false, bb: false, pivots: false });

  // Fetch overview data + 60s refresh (shared by TickerStrip, MarketsView, CSV export)
  const fetchOverview = useCallback(async () => {
    try {
      const res = await getCurrencyOverview();
      if (res.success) setOverview(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 60_000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const handleExportCSV = useCallback(() => {
    const pairs = overview?.pairs ?? [];
    const rows = pairs.map((p: { ticker: string; price: number; change_pct: number; high: number | null; low: number | null; high_52w: number | null; low_52w: number | null }) => ({
      Pair: p.ticker,
      Price: p.price,
      'Change %': p.change_pct,
      High: p.high ?? '',
      Low: p.low ?? '',
      '52W High': p.high_52w ?? '',
      '52W Low': p.low_52w ?? '',
    }));
    downloadCSV(rows, 'forex-export');
  }, [overview]);

  const handleModuleChange = useCallback((id: string) => {
    setActiveId(id);
    writeUrlParams({ tab: id });
  }, []);

  const handlePairChange = useCallback((pair: string) => {
    setSelectedPair(pair);
    writeUrlParams({ pair: pair === 'USD/INR' ? null : pair });
  }, []);

  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);
    writeUrlParams({ tf: tf === '1D' ? null : tf });
  }, []);

  const handleSelectPair = useCallback(
    (pair: string) => {
      handlePairChange(pair);
      // Auto-switch to Analysis when a pair is selected from Markets
      if (activeId === 'markets') {
        handleModuleChange('analysis');
      }
    },
    [activeId, handleModuleChange, handlePairChange]
  );

  return (
    <div className="space-y-6">
      {/* Ticker Strip */}
      <ForexTickerStrip onSelectPair={handleSelectPair} overview={overview} />

      {/* Command Bar */}
      <CommandBar
        selectedPair={selectedPair}
        onPairChange={handlePairChange}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        onExportCSV={handleExportCSV}
      />

      {/* Module Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FOREX_MODULES.map((mod, index) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isActive={activeId === mod.id}
              index={index}
              onClick={() => handleModuleChange(mod.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Active Module Content */}
      <div id="forex-dashboard-content">
        <AnimatePresence mode="wait">
          {activeId === 'markets' && (
            <motion.div
              key="markets"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <MarketsView onSelectPair={handleSelectPair} overview={overview} />
            </motion.div>
          )}
          {activeId === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnalysisView selectedPair={selectedPair} timeframe={timeframe} onTimeframeChange={handleTimeframeChange} chartOverlays={chartOverlays} onChartOverlaysChange={setChartOverlays} />
            </motion.div>
          )}
          {activeId === 'macro' && (
            <motion.div
              key="macro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <MacroView selectedPair={selectedPair} />
            </motion.div>
          )}
          {activeId === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <ForexCalculators selectedPair={selectedPair} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/50 text-center pt-4">
        {FOREX_DISCLAIMER}
      </p>
    </div>
  );
}
