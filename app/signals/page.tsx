'use client';

import React, { useState, useCallback, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import {
  Grid3X3,
  Newspaper,
  ArrowRightLeft,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExchange } from '@/context/ExchangeContext';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { DashboardAmbient } from '@/components/shared/DashboardAmbient';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { TabLoadingFallback } from '@/components/shared/DashboardSkeleton';
import dynamic from 'next/dynamic';

/* ─────────────────────────────────────────────────────────────────────────────
 * Lazy-loaded dashboard components
 * ─────────────────────────────────────────────────────────────────────────── */

const PulseTabLoading = () => <TabLoadingFallback accent="emerald" />;

const UnifiedSectorDashboard = dynamic(
  () => import('@/components/analytics/sectors/UnifiedSectorDashboard').then(m => ({ default: m.UnifiedSectorDashboard })),
  { ssr: false, loading: PulseTabLoading },
);

const CorrelationExplorer = dynamic(
  () => import('@/components/analytics/CorrelationExplorer').then(m => ({ default: m.CorrelationExplorer })),
  { ssr: false, loading: PulseTabLoading },
);

const NewsRiver = dynamic(
  () => import('@/components/analytics/news/NewsRiver').then(m => ({ default: m.NewsRiver })),
  { ssr: false, loading: PulseTabLoading },
);


/* ─────────────────────────────────────────────────────────────────────────────
 * Module Configuration
 * ─────────────────────────────────────────────────────────────────────────── */

interface PulseModule {
  id: string;
  label: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accentFrom: string;       // gradient start
  accentTo: string;         // gradient end
  glowColor: string;        // CSS rgba for glow effects
  borderColor: string;      // CSS rgba for border
}

const MODULES: PulseModule[] = [
  {
    id: 'news',
    label: 'News',
    tagline: 'Market Intelligence',
    description: 'AI-curated news feed with sentiment & impact scoring',
    icon: Newspaper,
    accentFrom: '#FDE68A',
    accentTo: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  {
    id: 'correlation',
    label: 'Correlation',
    tagline: 'Cross-Asset Matrix',
    description: 'Dynamic correlations, DCC-GARCH & regime detection',
    icon: ArrowRightLeft,
    accentFrom: '#7DD3FC',
    accentTo: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  {
    id: 'sectors',
    label: 'Sectors',
    tagline: 'Sector Intelligence',
    description: 'Heatmaps, relative strength & sector rotation across global exchanges',
    icon: Grid3X3,
    accentFrom: '#6EE7B7',
    accentTo: '#34D399',
    glowColor: 'rgba(110, 231, 183, 0.35)',
    borderColor: 'rgba(110, 231, 183, 0.2)',
  },
];

const VALID_IDS = new Set(MODULES.map(m => m.id));

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ─────────────────────────────────────────────────────────────────────────── */

export default function PulsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/20" />
        </div>
      }
    >
      <PulseInner />
    </Suspense>
  );
}

function PulseInner() {
  const { selectedExchange } = useExchange();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawTab = searchParams.get('tab') || 'news';
  const initialTab = rawTab === 'pyramid' || rawTab === 'my-portfolio' || rawTab === 'patterns' || rawTab === 'fno' ? 'news' : rawTab;
  const [activeId, setActiveId] = useState(
    VALID_IDS.has(initialTab) ? initialTab : 'news'
  );

  // Sync tab state when URL changes (e.g. browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'news';
    const resolved = urlTab === 'pyramid' || urlTab === 'my-portfolio' || urlTab === 'patterns' || urlTab === 'fno' ? 'news' : urlTab;
    const validTab = VALID_IDS.has(resolved) ? resolved : 'news';
    setActiveId((prev) => (prev !== validTab ? validTab : prev));
  }, [searchParams]);

  const activeModule = useMemo(
    () => MODULES.find(m => m.id === activeId) ?? MODULES[0],
    [activeId]
  );

  const handleModuleChange = useCallback((id: string) => {
    setActiveId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Re-trigger content entrance animation on tab switch
  const contentControls = useAnimation();
  const prevTabRef = useRef(activeId);

  useEffect(() => {
    if (prevTabRef.current !== activeId) {
      prevTabRef.current = activeId;
      contentControls.set({ opacity: 0.6, y: 6 });
      contentControls.start({ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } });
    }
  }, [activeId, contentControls]);

  return (
    <>
      <DashboardAmbient accent="emerald" />
      <div className="relative z-[1] container py-6 md:py-10 px-4 md:px-6 max-w-[1440px] mx-auto">

      {/* ━━━ Header ━━━ */}
      <DashboardHeader
        title="Pulse"
        subtitle="Real-time market intelligence — sectors, correlations & news in one view"
        accent="emerald"
        actions={<MarketStatusBadge market={selectedExchange.toLowerCase()} />}
      />

      {/* ━━━ Module Selector — Three Cards ━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="tablist" aria-label="Pulse modules">
          {MODULES.map((mod, index) => {
            const Icon = mod.icon;
            const isActive = activeId === mod.id;

            return (
              <motion.button
                key={mod.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleModuleChange(mod.id)}
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
                {/* Gradient border — visible when active, faint on hover */}
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
                    layoutId="moduleGlow"
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
                  {/* Ambient gradient blob — top right */}
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
                        isActive
                          ? 'opacity-100'
                          : 'opacity-0 translate-x-2',
                      )}
                      style={isActive ? {
                        color: mod.accentFrom,
                        background: `${mod.accentFrom}12`,
                      } : undefined}
                    >
                      <span
                        className="h-1 w-1 rounded-full animate-pulse"
                        style={{ backgroundColor: mod.accentFrom }}
                      />
                      Active
                    </div>
                  </div>

                  {/* Module title */}
                  <h3
                    className={cn(
                      'text-base font-semibold tracking-tight transition-colors duration-500 mb-1',
                      isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70',
                    )}
                  >
                    {mod.tagline}
                  </h3>

                  {/* Description with clip-reveal on active */}
                  <div className="overflow-hidden">
                    <motion.p
                      className={cn(
                        'text-xs leading-relaxed transition-colors duration-500',
                        isActive
                          ? 'text-white/50'
                          : 'text-white/20 group-hover:text-white/30',
                      )}
                      initial={false}
                      animate={{
                        clipPath: isActive ? 'inset(0% 0 0 0)' : 'inset(0% 0 0 0)',
                        y: isActive ? 0 : 0,
                        opacity: isActive ? 1 : 0.6,
                      }}
                      transition={{ duration: 0.4, ease: [0.77, 0, 0.175, 1] }}
                    >
                      {mod.description}
                    </motion.p>
                  </div>

                  {/* Bottom accent bar */}
                  <div className="mt-5">
                    <div className="h-0.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${mod.accentFrom}, ${mod.accentTo})`,
                        }}
                        initial={false}
                        animate={{
                          width: isActive ? '100%' : '0%',
                          opacity: isActive ? 1 : 0,
                        }}
                        transition={{
                          duration: 0.6,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ━━━ Content Area ━━━ */}
      {/* Uses CSS hidden instead of AnimatePresence to keep tabs mounted and preserve state */}
      <div className="relative">
        {/* Animated color accent line at top of content */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 pointer-events-none"
          animate={{
            background: `linear-gradient(90deg, transparent, ${activeModule.accentFrom}20, ${activeModule.accentTo}20, transparent)`,
            boxShadow: `0 4px 20px -4px ${activeModule.accentFrom}10`,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.div className="pt-2" animate={contentControls}>
          <div className={activeId === 'sectors' ? '' : 'hidden'}>
            <TabErrorBoundary tabName="Sectors">
              <UnifiedSectorDashboard exchange={selectedExchange} />
            </TabErrorBoundary>
          </div>

          <div className={activeId === 'correlation' ? '' : 'hidden'}>
            <TabErrorBoundary tabName="Correlation">
              <CorrelationExplorer exchange={selectedExchange} />
            </TabErrorBoundary>
          </div>

          <div className={activeId === 'news' ? '' : 'hidden'}>
            <TabErrorBoundary tabName="News">
              <NewsRiver exchange={selectedExchange} />
            </TabErrorBoundary>
          </div>

        </motion.div>
      </div>
    </div>
    </>
  );
}
