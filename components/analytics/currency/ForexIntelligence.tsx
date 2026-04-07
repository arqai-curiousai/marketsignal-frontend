'use client';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Image, RefreshCw, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadCSV, downloadPNG } from '@/src/lib/utils/export';
import dynamic from 'next/dynamic';

import { useForexData, ForexDataProvider } from './ForexDataProvider';
import { ForexCommandPalette, CommandPaletteTrigger } from './ForexCommandPalette';
import {
  FOREX_MODULES,
  FOREX_VALID_MODULE_IDS,
  FOREX_TIMEFRAMES,
  FOREX_DISCLAIMER,
  PAIR_CATEGORY_LABELS,
  type ForexModule,
} from './constants';

/* ── URL helpers ── */

function writeUrlParams(params: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState({}, '', url.toString());
}

/* ── Lazy-loaded canvas panels ── */

const CurrencyConstellationLive = dynamic(
  () => import('./canvas/CurrencyConstellationLive').then(m => ({ default: m.CurrencyConstellationLive })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[420px]" /> },
);

const CanvasTickerStrip = dynamic(
  () => import('./canvas/CanvasTickerStrip').then(m => ({ default: m.CanvasTickerStrip })),
  { ssr: false, loading: () => <div className="h-10 rounded-lg bg-white/[0.02] animate-pulse" /> },
);

const StrengthFlowCanvas = dynamic(
  () => import('./canvas/StrengthFlowCanvas').then(m => ({ default: m.StrengthFlowCanvas })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[200px]" /> },
);

const SessionTimelineCanvas = dynamic(
  () => import('./canvas/SessionTimelineCanvas').then(m => ({ default: m.SessionTimelineCanvas })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[200px]" /> },
);

const CrossRatesHeatmapCanvas = dynamic(
  () => import('./canvas/CrossRatesHeatmapCanvas').then(m => ({ default: m.CrossRatesHeatmapCanvas })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[400px]" /> },
);

const PatternRadarCanvas = dynamic(
  () => import('./canvas/PatternRadarCanvas').then(m => ({ default: m.PatternRadarCanvas })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[320px]" /> },
);

/* ── Lazy-loaded tab content components ── */

const AnalysisView = dynamic(
  () => import('./AnalysisView').then(m => ({ default: m.AnalysisView })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[400px]" /> },
);

const ForexTopMovers = dynamic(
  () => import('./ForexTopMovers').then(m => ({ default: m.ForexTopMovers })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[160px]" /> },
);

const MacroView = dynamic(
  () => import('./MacroView').then(m => ({ default: m.MacroView })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[400px]" /> },
);

const ForexPatternScanner = dynamic(
  () => import('./ForexPatternScanner').then(m => ({ default: m.ForexPatternScanner })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[400px]" /> },
);

const ForexCalculators = dynamic(
  () => import('./ForexCalculators').then(m => ({ default: m.ForexCalculators })),
  { ssr: false, loading: () => <CanvasPlaceholder height="h-[400px]" /> },
);

/* ── Shared placeholder ── */

function CanvasPlaceholder({ height }: { height: string }) {
  return (
    <div className={cn('rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse', height)} />
  );
}

/* ── Panel wrapper with zen aesthetic ── */

function Panel({
  children,
  title,
  className,
  noPad,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden',
        className,
      )}
    >
      {title && (
        <div className="px-4 py-2 border-b border-white/[0.04]">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className={noPad ? '' : 'p-3'}>{children}</div>
    </div>
  );
}

/* ── Module Card ── */

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
          'relative rounded-2xl px-4 py-4 md:px-5 md:py-5 transition-all duration-500 overflow-hidden',
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
        <div className="relative flex items-center justify-between mb-3">
          <div
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-500',
              isActive
                ? 'bg-white/10'
                : 'bg-white/[0.04] group-hover:bg-white/[0.06]',
            )}
          >
            <Icon
              className="h-4 w-4 transition-colors duration-500"
              style={{ color: isActive ? mod.accentFrom : 'rgba(255,255,255,0.3)' }}
            />
          </div>

          {/* Active indicator chip */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase transition-all duration-500',
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
            'text-xs font-semibold transition-colors duration-500 mb-0.5',
            isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70',
          )}
        >
          {mod.label}
        </h3>
        <p
          className={cn(
            'text-[10px] leading-relaxed transition-colors duration-500',
            isActive ? 'text-white/50' : 'text-white/25 group-hover:text-white/35',
          )}
        >
          {mod.tagline}
        </p>

        {/* Bottom progress bar */}
        <div className="mt-3 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
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

/* ── Command Bar ── */

function IntelligenceCommandBar() {
  const {
    selectedPair,
    timeframe,
    setTimeframe,
    overview,
    lastRefresh,
    refresh,
  } = useForexData();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const togglePalette = useCallback(() => setPaletteOpen(o => !o), []);

  const minutesAgo = useMemo(() => {
    return Math.floor((Date.now() - lastRefresh) / 60_000);
  }, [lastRefresh]);

  const selectedSnap = useMemo(
    () => overview?.pairs?.find(p => p.ticker === selectedPair),
    [overview, selectedPair],
  );
  const pct = selectedSnap?.change_pct ?? 0;

  const handleExportCSV = useCallback(() => {
    const pairs = overview?.pairs ?? [];
    const rows = pairs.map(p => ({
      Pair: p.ticker,
      Price: p.price,
      'Change %': p.change_pct,
      High: p.high ?? '',
      Low: p.low ?? '',
      '52W High': p.high_52w ?? '',
      '52W Low': p.low_52w ?? '',
    }));
    downloadCSV(rows, 'forex-intelligence');
  }, [overview]);

  // Global Ctrl+K
  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    },
    [],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGlobalKey]);

  return (
    <>
      <div
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/[0.04] border-b border-white/[0.06] -mx-4 md:-mx-6 px-4 md:px-6 py-2.5"
        style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <CommandPaletteTrigger onClick={togglePalette} />

          {/* Active pair badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <span className="font-semibold text-sm">{selectedPair}</span>
            {selectedSnap && (
              <span
                className={cn(
                  'text-[10px] font-mono tabular-nums',
                  pct >= 0 ? 'text-sky-400' : 'text-orange-400',
                )}
              >
                {selectedSnap.price?.toFixed(selectedSnap.price >= 100 ? 2 : 4)}{' '}
                {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
              </span>
            )}
            <span className="text-[9px] text-muted-foreground/50 uppercase">
              {PAIR_CATEGORY_LABELS[selectedPair] ?? ''}
            </span>
          </div>

          {/* Timeframe pills */}
          <div className="flex gap-0.5">
            {FOREX_TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
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

          <div className="flex-1" />

          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {minutesAgo === 0 ? 'Live' : `${minutesAgo}m ago`}
          </span>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Refresh all data"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <ExportButton
            options={[
              {
                label: 'Export CSV',
                icon: <Download className="h-3.5 w-3.5" />,
                onClick: handleExportCSV,
              },
              {
                label: 'Export PNG',
                icon: <Image className="h-3.5 w-3.5" />,
                onClick: () => {
                  const el = document.getElementById('forex-intelligence-grid');
                  if (el) downloadPNG(el, 'forex-intelligence');
                },
              },
            ]}
          />
        </div>
      </div>

      <ForexCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}

/* ── Tab Content Components ── */

const TAB_ANIM = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

function OverviewTab({ onSelectPair }: { onSelectPair: (pair: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Hero — Constellation + Strength/Session */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Panel noPad className="relative h-[420px] lg:h-[420px]">
          <CurrencyConstellationLive onSelectPair={onSelectPair} />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Currency Strength" noPad className="flex-1 min-h-[200px]">
            <StrengthFlowCanvas />
          </Panel>
          <Panel title="Session Map" noPad className="flex-1 min-h-[200px]">
            <SessionTimelineCanvas />
          </Panel>
        </div>
      </div>

      {/* Intelligence — Heatmap + Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Panel title="Cross-Rates" noPad>
          <CrossRatesHeatmapCanvas onSelectPair={onSelectPair} />
        </Panel>

        <Panel title="Top Movers">
          <Suspense fallback={<CanvasPlaceholder height="h-[300px]" />}>
            <ForexTopMovers
              onSelectPair={onSelectPair}
              initialData={null}
            />
          </Suspense>
        </Panel>
      </div>
    </div>
  );
}

function AnalysisTab() {
  const { selectedPair, timeframe, setTimeframe } = useForexData();
  const [chartOverlays, setChartOverlays] = useState({
    vol: true,
    sma: false,
    bb: false,
    pivots: false,
  });

  return (
    <Panel title={`${selectedPair} Analysis`}>
      <Suspense fallback={<CanvasPlaceholder height="h-[400px]" />}>
        <AnalysisView
          selectedPair={selectedPair}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          chartOverlays={chartOverlays}
          onChartOverlaysChange={setChartOverlays}
        />
      </Suspense>
    </Panel>
  );
}

function PatternsTab({ onSelectPair }: { onSelectPair: (pair: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Pattern Scanner" noPad className="min-h-[380px]">
        <PatternRadarCanvas onSelectPair={onSelectPair} />
      </Panel>

      <Panel title="Scanner Results">
        <Suspense fallback={<CanvasPlaceholder height="h-[380px]" />}>
          <ForexPatternScanner />
        </Suspense>
      </Panel>
    </div>
  );
}

function MacroTab() {
  return (
    <Suspense fallback={<CanvasPlaceholder height="h-[400px]" />}>
      <MacroView />
    </Suspense>
  );
}

function ToolsTab() {
  const { selectedPair } = useForexData();
  return (
    <Panel title="Forex Calculators">
      <Suspense fallback={<CanvasPlaceholder height="h-[400px]" />}>
        <ForexCalculators selectedPair={selectedPair} />
      </Suspense>
    </Panel>
  );
}

/* ── Tabbed Grid Layout ── */

function IntelligenceGrid() {
  const { setSelectedPair } = useForexData();
  const searchParams = useSearchParams();

  // Tab state — URL-synced
  const rawTab = searchParams.get('tab');
  const [activeId, setActiveId] = useState(
    rawTab && FOREX_VALID_MODULE_IDS.has(rawTab) ? rawTab : 'markets',
  );

  const handleModuleChange = useCallback((id: string) => {
    setActiveId(id);
    writeUrlParams({ tab: id === 'markets' ? null : id });
  }, []);

  // Auto-navigate to Analysis when pair is selected from Overview/Patterns
  const handleSelectPair = useCallback(
    (pair: string) => {
      setSelectedPair(pair);
      if (activeId === 'markets' || activeId === 'patterns') {
        setActiveId('analysis');
        writeUrlParams({ tab: 'analysis' });
      }
    },
    [setSelectedPair, activeId],
  );

  // Get active module for accent color line
  const activeMod = FOREX_MODULES.find(m => m.id === activeId);

  return (
    <div id="forex-intelligence-grid" className="space-y-4">
      {/* Persistent: Ticker Strip */}
      <CanvasTickerStrip onSelectPair={handleSelectPair} />

      {/* Module Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {FOREX_MODULES.map((mod, i) => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            isActive={activeId === mod.id}
            index={i}
            onClick={() => handleModuleChange(mod.id)}
          />
        ))}
      </div>

      {/* Active accent line */}
      {activeMod && (
        <div className="h-px w-full overflow-hidden rounded-full">
          <motion.div
            layoutId="forexTabAccent"
            className="h-full w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeMod.accentFrom}40, ${activeMod.accentTo}40, transparent)`,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeId === 'markets' && (
          <motion.div key="markets" {...TAB_ANIM}>
            <OverviewTab onSelectPair={handleSelectPair} />
          </motion.div>
        )}

        {activeId === 'analysis' && (
          <motion.div key="analysis" {...TAB_ANIM}>
            <AnalysisTab />
          </motion.div>
        )}

        {activeId === 'patterns' && (
          <motion.div key="patterns" {...TAB_ANIM}>
            <PatternsTab onSelectPair={handleSelectPair} />
          </motion.div>
        )}

        {activeId === 'macro' && (
          <motion.div key="macro" {...TAB_ANIM}>
            <MacroTab />
          </motion.div>
        )}

        {activeId === 'tools' && (
          <motion.div key="tools" {...TAB_ANIM}>
            <ToolsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Root Export ── */

export function ForexIntelligence() {
  return (
    <ForexDataProvider>
      <div className="space-y-4">
        <IntelligenceCommandBar />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <IntelligenceGrid />
        </motion.div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/50 text-center pt-4">
          {FOREX_DISCLAIMER}
        </p>
      </div>
    </ForexDataProvider>
  );
}
