'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  IVolatilityAnalysis,
  IRegimeAnalysis,
  IMonteCarloAnalysis,
  IPortfolioOptimization,
  IBacktestAnalysis,
  IRiskScoreResult,
  IScenarioResult,
  IFactorDecomposition,
} from '@/types/simulation';

// ─── Types ───────────────────────────────────────────────────

interface SimulationState {
  volatility: IVolatilityAnalysis | null;
  regime: IRegimeAnalysis | null;
  montecarlo: IMonteCarloAnalysis | null;
  portfolio: IPortfolioOptimization | null;
  backtest: IBacktestAnalysis | null;
  riskScore: IRiskScoreResult | null;
  scenario: IScenarioResult | null;
  factors: IFactorDecomposition | null;
}

type SimTab = keyof SimulationState;

interface SimulationContextValue extends SimulationState {
  setResult: (tab: SimTab, data: unknown) => void;
  clearAll: () => void;
}

const INITIAL_STATE: SimulationState = {
  volatility: null,
  regime: null,
  montecarlo: null,
  portfolio: null,
  backtest: null,
  riskScore: null,
  scenario: null,
  factors: null,
};

// ─── Context ─────────────────────────────────────────────────

const SimulationContext = createContext<SimulationContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);

  const setResult = useCallback((tab: SimTab, data: unknown) => {
    setState((prev) => ({ ...prev, [tab]: data }));
  }, []);

  const clearAll = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo<SimulationContextValue>(
    () => ({ ...state, setResult, clearAll }),
    [state, setResult, clearAll],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useSimulationContext(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulationContext must be used within SimulationProvider');
  }
  return ctx;
}

/**
 * Safe hook that returns null when outside of SimulationProvider.
 * Use this in dashboards that can render before the provider is mounted.
 */
export function useSimulationContextSafe(): SimulationContextValue | null {
  return useContext(SimulationContext);
}
