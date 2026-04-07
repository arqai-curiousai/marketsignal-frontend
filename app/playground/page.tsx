'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Activity,
  BarChart3,
  PieChart,
  Waves,
  Dice5,
  Shield,
  Zap,
  Diamond,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SimulationProvider } from '@/context/SimulationContext';
import { usePlaygroundHotkeys } from '@/lib/hooks/usePlaygroundHotkeys';
import { SimShortcutHelp } from '@/components/playground/simulations/shared/SimShortcutHelp';
import { DataFreshnessStrip } from '@/components/playground/simulations/shared/DataFreshnessStrip';
import { CrossSimNeuralCanvas } from '@/components/playground/CrossSimNeuralCanvas';
import { DashboardAmbient } from '@/components/shared/DashboardAmbient';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { TabLoadingFallback } from '@/components/shared/DashboardSkeleton';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Simple loading skeleton for lazy-loaded tabs
const SimTabLoading = () => <TabLoadingFallback accent="violet" />;

// Lazy-load heavy tab content
const SignalLabContent = dynamic(
  () => import('@/components/playground/SignalLabContent').then((m) => ({ default: m.SignalLabContent })),
  { loading: SimTabLoading, ssr: false },
);

const VolatilityDashboard = dynamic(
  () => import('@/components/playground/simulations/volatility/VolatilityDashboard').then((m) => ({ default: m.VolatilityDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const RegimeDashboard = dynamic(
  () => import('@/components/playground/simulations/regimes/RegimeDashboard').then((m) => ({ default: m.RegimeDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const MonteCarloDashboard = dynamic(
  () => import('@/components/playground/simulations/montecarlo/MonteCarloDashboard').then((m) => ({ default: m.MonteCarloDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const PortfolioDashboard = dynamic(
  () => import('@/components/playground/simulations/portfolio/PortfolioDashboard').then((m) => ({ default: m.PortfolioDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const BacktestDashboard = dynamic(
  () => import('@/components/playground/simulations/backtesting/BacktestDashboard').then((m) => ({ default: m.BacktestDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const RiskScoreDashboard = dynamic(
  () => import('@/components/playground/simulations/risk/RiskScoreDashboard').then((m) => ({ default: m.RiskScoreDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const ScenarioDashboard = dynamic(
  () => import('@/components/playground/simulations/scenarios/ScenarioDashboard').then((m) => ({ default: m.ScenarioDashboard })),
  { loading: SimTabLoading, ssr: false },
);

const FactorDashboard = dynamic(
  () => import('@/components/playground/simulations/factors/FactorDashboard').then((m) => ({ default: m.FactorDashboard })),
  { loading: SimTabLoading, ssr: false },
);

// ─── Tab definitions ──────────────────────────────────────────────

interface SimTab {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  color: string;
  glowColor: string;
  group: 'analysis' | 'projection' | 'risk';
}

const SIMULATION_TABS: SimTab[] = [
  {
    id: 'signals',
    label: 'AI Patterns',
    shortLabel: 'Patterns',
    icon: FlaskConical,
    description: 'AI-powered pattern detection across price, volume, and volatility',
    color: 'text-blue-400',
    glowColor: 'rgba(96,165,250,0.3)',
    group: 'analysis',
  },
  {
    id: 'volatility',
    label: 'Volatility',
    shortLabel: 'Vol',
    icon: Activity,
    description: 'How wildly could this stock move? Five risk models, one storm gauge',
    color: 'text-indigo-400',
    glowColor: 'rgba(129,140,248,0.3)',
    group: 'analysis',
  },
  {
    id: 'regimes',
    label: 'Regimes',
    shortLabel: 'Regimes',
    icon: Waves,
    description: 'Is the market in rally mode, drift mode, or crash mode right now?',
    color: 'text-orange-400',
    glowColor: 'rgba(251,146,60,0.3)',
    group: 'analysis',
  },
  {
    id: 'montecarlo',
    label: 'Monte Carlo',
    shortLabel: 'MC',
    icon: Dice5,
    description: 'Simulate thousands of possible futures for any stock price',
    color: 'text-rose-400',
    glowColor: 'rgba(251,113,133,0.3)',
    group: 'projection',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    shortLabel: 'Portfolio',
    icon: PieChart,
    description: 'Find the ideal stock mix that balances your risk and return',
    color: 'text-amber-400',
    glowColor: 'rgba(251,191,36,0.3)',
    group: 'projection',
  },
  {
    id: 'backtesting',
    label: 'Backtesting',
    shortLabel: 'Backtest',
    icon: BarChart3,
    description: 'Test any strategy against real market history before risking money',
    color: 'text-emerald-400',
    glowColor: 'rgba(52,211,153,0.3)',
    group: 'projection',
  },
  {
    id: 'riskscore',
    label: 'Risk Score',
    shortLabel: 'Risk',
    icon: Shield,
    description: 'Your personal risk score from 1 to 99 — and what to do about it',
    color: 'text-red-400',
    glowColor: 'rgba(248,113,113,0.3)',
    group: 'risk',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    shortLabel: 'Stress',
    icon: Zap,
    description: 'What happens to your money if the market crashes tomorrow?',
    color: 'text-orange-400',
    glowColor: 'rgba(251,146,60,0.3)',
    group: 'risk',
  },
  {
    id: 'factors',
    label: 'Factors',
    shortLabel: 'Factors',
    icon: Diamond,
    description: 'Which hidden forces are actually driving your stock returns?',
    color: 'text-violet-400',
    glowColor: 'rgba(167,139,250,0.3)',
    group: 'risk',
  },
];

const TAB_CONTENT: Record<string, React.ComponentType> = {
  signals: SignalLabContent,
  volatility: VolatilityDashboard,
  regimes: RegimeDashboard,
  montecarlo: MonteCarloDashboard,
  portfolio: PortfolioDashboard,
  backtesting: BacktestDashboard,
  riskscore: RiskScoreDashboard,
  scenarios: ScenarioDashboard,
  factors: FactorDashboard,
};

// ─── Main Page ────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [activeSimulation, setActiveSimulation] = useState('volatility');

  const tabIds = useMemo(() => SIMULATION_TABS.map((t) => t.id), []);

  const { showHelp, setShowHelp } = usePlaygroundHotkeys({
    onSwitchTab: setActiveSimulation,
    tabIds,
  });

  const activeTab = useMemo(
    () => SIMULATION_TABS.find((t) => t.id === activeSimulation) ?? SIMULATION_TABS[1],
    [activeSimulation],
  );

  const ActiveContent = TAB_CONTENT[activeSimulation];

  return (
    <SimulationProvider>
      <DashboardAmbient accent="violet" />
      <div className="relative z-[1] container py-4 md:py-8 px-4 max-w-7xl mx-auto space-y-5">

        {/* ━━━ Premium Header (D2) ━━━ */}
        <DashboardHeader
          title="Simulation Lab"
          subtitle="9 quantitative engines — stress-test, optimize & forecast"
          accent="violet"
          actions={
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-violet-500/30 text-violet-400 text-[10px]"
              >
                9 Simulations
              </Badge>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="text-[10px] text-white/30 hover:text-white/60 px-1.5 py-0.5 rounded border border-white/[0.06] transition-colors"
                title="Keyboard shortcuts (?)"
              >
                ? shortcuts
              </button>
            </div>
          }
        />

        {/* Shortcut help dialog */}
        <SimShortcutHelp open={showHelp} onOpenChange={setShowHelp} />

        {/* ━━━ Glass insights strip (D3) ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT_EXPO }}
          className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3 space-y-2"
        >
          <DataFreshnessStrip />
          <div className="border-t border-white/[0.04] pt-2">
            <CrossSimNeuralCanvas activeTab={activeSimulation} />
          </div>
        </motion.div>

        {/* ━━━ Navigation Strip (D1) ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT_EXPO }}
        >
          <div
            className="relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-1.5 overflow-x-auto"
            style={{
              maskImage: 'linear-gradient(to right, black 2%, black 98%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, black 2%, black 98%, transparent)',
            }}
            role="tablist"
            aria-label="Simulation modules"
          >
            <div className="flex items-center gap-0.5 min-w-max">
              {SIMULATION_TABS.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeSimulation === tab.id;
                // Show group separator before first item of a new group
                const prevTab = index > 0 ? SIMULATION_TABS[index - 1] : null;
                const showSeparator = prevTab && prevTab.group !== tab.group;

                return (
                  <React.Fragment key={tab.id}>
                    {showSeparator && (
                      <div className="w-px h-5 bg-white/[0.06] mx-1 shrink-0" />
                    )}
                    <button
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveSimulation(tab.id)}
                      className={cn(
                        'relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 shrink-0',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                        isActive
                          ? 'text-white'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]',
                      )}
                    >
                      {/* Sliding active background */}
                      {isActive && (
                        <motion.div
                          layoutId="simActiveTab"
                          className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.08]"
                          style={{
                            boxShadow: `0 0 20px -4px ${tab.glowColor}`,
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className={cn('relative z-[1] h-3.5 w-3.5 transition-colors duration-300', isActive ? tab.color : '')} />
                      <span className="relative z-[1] hidden sm:inline">{tab.label}</span>
                      <span className="relative z-[1] sm:hidden">{tab.shortLabel}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ━━━ Active Description Bar (D5) ━━━ */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-1 w-1 rounded-full bg-violet-400/60 shrink-0" />
          <AnimatePresence mode="wait">
            <motion.p
              key={activeSimulation}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="text-xs text-white/40"
            >
              {activeTab.description}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ━━━ Tab Content with entrance animation (D4) ━━━ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSimulation}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            {ActiveContent && <ActiveContent />}
          </motion.div>
        </AnimatePresence>
      </div>
    </SimulationProvider>
  );
}
