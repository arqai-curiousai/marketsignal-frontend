'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Beaker,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SimulationProvider } from '@/context/SimulationContext';
import { usePlaygroundHotkeys } from '@/lib/hooks/usePlaygroundHotkeys';
import { SimShortcutHelp } from '@/components/playground/simulations/shared/SimShortcutHelp';
import { SimContentSkeleton } from '@/components/playground/simulations/shared/SimContentSkeleton';
import { CrossSimulationInsights } from '@/components/playground/CrossSimulationInsights';
import {
  VOL_SKELETON,
  REGIME_SKELETON,
  MC_SKELETON,
  PORTFOLIO_SKELETON,
  BACKTEST_SKELETON,
  RISK_SKELETON,
  SIGNAL_SKELETON,
  SCENARIO_SKELETON,
  FACTOR_SKELETON,
} from '@/components/playground/simulations/shared/sim-tokens';

// Lazy-load heavy tab content
const SignalLabContent = dynamic(
  () => import('@/components/playground/SignalLabContent').then((m) => ({ default: m.SignalLabContent })),
  {
    loading: () => <SimContentSkeleton layout={SIGNAL_SKELETON} />,
    ssr: false,
  },
);

const VolatilityDashboard = dynamic(
  () => import('@/components/playground/simulations/volatility/VolatilityDashboard').then((m) => ({ default: m.VolatilityDashboard })),
  {
    loading: () => <SimContentSkeleton layout={VOL_SKELETON} />,
    ssr: false,
  },
);

const RegimeDashboard = dynamic(
  () => import('@/components/playground/simulations/regimes/RegimeDashboard').then((m) => ({ default: m.RegimeDashboard })),
  {
    loading: () => <SimContentSkeleton layout={REGIME_SKELETON} />,
    ssr: false,
  },
);

const MonteCarloDashboard = dynamic(
  () => import('@/components/playground/simulations/montecarlo/MonteCarloDashboard').then((m) => ({ default: m.MonteCarloDashboard })),
  {
    loading: () => <SimContentSkeleton layout={MC_SKELETON} />,
    ssr: false,
  },
);

const PortfolioDashboard = dynamic(
  () => import('@/components/playground/simulations/portfolio/PortfolioDashboard').then((m) => ({ default: m.PortfolioDashboard })),
  {
    loading: () => <SimContentSkeleton layout={PORTFOLIO_SKELETON} />,
    ssr: false,
  },
);

const BacktestDashboard = dynamic(
  () => import('@/components/playground/simulations/backtesting/BacktestDashboard').then((m) => ({ default: m.BacktestDashboard })),
  {
    loading: () => <SimContentSkeleton layout={BACKTEST_SKELETON} />,
    ssr: false,
  },
);

const RiskScoreDashboard = dynamic(
  () => import('@/components/playground/simulations/risk/RiskScoreDashboard').then((m) => ({ default: m.RiskScoreDashboard })),
  {
    loading: () => <SimContentSkeleton layout={RISK_SKELETON} />,
    ssr: false,
  },
);

const ScenarioDashboard = dynamic(
  () => import('@/components/playground/simulations/scenarios/ScenarioDashboard').then((m) => ({ default: m.ScenarioDashboard })),
  {
    loading: () => <SimContentSkeleton layout={SCENARIO_SKELETON} />,
    ssr: false,
  },
);

const FactorDashboard = dynamic(
  () => import('@/components/playground/simulations/factors/FactorDashboard').then((m) => ({ default: m.FactorDashboard })),
  {
    loading: () => <SimContentSkeleton layout={FACTOR_SKELETON} />,
    ssr: false,
  },
);

// ─── Tab definitions ──────────────────────────────────────────────

interface SimTab {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const SIMULATION_TABS: SimTab[] = [
  {
    id: 'signals',
    label: 'AI Signals',
    shortLabel: 'Signals',
    icon: FlaskConical,
    description: 'Multi-layer intelligence pipeline',
    color: 'text-blue-400',
  },
  {
    id: 'volatility',
    label: 'Volatility',
    shortLabel: 'Vol',
    icon: Activity,
    description: 'Range-based estimators, GARCH forecasts, regime detection',
    color: 'text-indigo-400',
  },
  {
    id: 'regimes',
    label: 'Regimes',
    shortLabel: 'Regimes',
    icon: Waves,
    description: 'Hidden Markov Models for market regime detection',
    color: 'text-orange-400',
  },
  {
    id: 'montecarlo',
    label: 'Monte Carlo',
    shortLabel: 'MC',
    icon: Dice5,
    description: 'Regime-conditional path simulation with risk metrics',
    color: 'text-rose-400',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    shortLabel: 'Portfolio',
    icon: PieChart,
    description: 'Mean-variance, risk parity, and hierarchical risk parity optimization',
    color: 'text-amber-400',
  },
  {
    id: 'backtesting',
    label: 'Backtesting',
    shortLabel: 'Backtest',
    icon: BarChart3,
    description: 'Walk-forward validation with CPCV overfitting detection',
    color: 'text-emerald-400',
  },
  {
    id: 'riskscore',
    label: 'Risk Score',
    shortLabel: 'Risk',
    icon: Shield,
    description: 'Portfolio risk in one number — from 1 to 99',
    color: 'text-red-400',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    shortLabel: 'Stress',
    icon: Zap,
    description: 'India-specific stress testing with 8 preset macro scenarios',
    color: 'text-orange-400',
  },
  {
    id: 'factors',
    label: 'Factors',
    shortLabel: 'Factors',
    icon: Diamond,
    description: 'Multi-factor decomposition: Value, Momentum, Quality, Size, Low Vol',
    color: 'text-violet-400',
  },
];

// ─── Main Page ────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [activeSimulation, setActiveSimulation] = useState('volatility');

  const tabIds = useMemo(() => SIMULATION_TABS.map((t) => t.id), []);

  const { showHelp, setShowHelp } = usePlaygroundHotkeys({
    onSwitchTab: setActiveSimulation,
    tabIds,
  });

  return (
    <SimulationProvider>
    <div className="container py-4 px-4 max-w-7xl mx-auto space-y-4">
      {/* Compact header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Beaker className="h-5 w-5 text-indigo-400 shrink-0" />
        <h1 className="text-xl font-semibold text-white">Simulation Lab</h1>
        <Badge
          variant="outline"
          className="border-indigo-500/30 text-indigo-400 text-[10px]"
        >
          9 Simulations
        </Badge>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="text-[10px] text-white/30 hover:text-white/60 px-1.5 py-0.5 rounded border border-white/[0.06] transition-colors"
          title="Keyboard shortcuts (?)"
        >
          ? shortcuts
        </button>
      </motion.div>

      {/* Shortcut help dialog */}
      <SimShortcutHelp open={showHelp} onOpenChange={setShowHelp} />

      {/* Cross-simulation insights strip */}
      <CrossSimulationInsights />

      {/* Simulation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeSimulation} onValueChange={setActiveSimulation} className="w-full">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] h-auto flex-wrap gap-0.5 p-1">
            {SIMULATION_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'flex items-center gap-1.5 text-xs data-[state=active]:bg-white/[0.08]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="signals" className="mt-4">
            <SignalLabContent />
          </TabsContent>

          <TabsContent value="volatility" className="mt-4">
            <VolatilityDashboard />
          </TabsContent>

          <TabsContent value="regimes" className="mt-4">
            <RegimeDashboard />
          </TabsContent>

          <TabsContent value="montecarlo" className="mt-4">
            <MonteCarloDashboard />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4">
            <PortfolioDashboard />
          </TabsContent>

          <TabsContent value="backtesting" className="mt-4">
            <BacktestDashboard />
          </TabsContent>

          <TabsContent value="riskscore" className="mt-4">
            <RiskScoreDashboard />
          </TabsContent>

          <TabsContent value="scenarios" className="mt-4">
            <ScenarioDashboard />
          </TabsContent>

          <TabsContent value="factors" className="mt-4">
            <FactorDashboard />
          </TabsContent>

        </Tabs>
      </motion.div>
    </div>
    </SimulationProvider>
  );
}
