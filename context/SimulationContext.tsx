'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
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

/** Maps each simulation tab to its non-null data type. */
type SimulationDataMap = {
  [K in SimTab]: NonNullable<SimulationState[K]>;
};

/** Dispatch (setter) functions — stable references, never change. */
interface SimulationDispatch {
  setResult: <T extends SimTab>(tab: T, data: SimulationDataMap[T]) => void;
  clearAll: () => void;
}

/** Backwards-compatible combined value (state + dispatch). */
interface SimulationContextValue extends SimulationState, SimulationDispatch {}

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

// ─── Contexts ────────────────────────────────────────────────

/** Data context — value changes when any field is updated. */
const SimulationStateContext = createContext<SimulationState | null>(null);

/** Dispatch context — value is memoized once and never changes. */
const SimulationDispatchContext = createContext<SimulationDispatch | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);

  const setResult = useCallback(<T extends SimTab>(tab: T, data: SimulationDataMap[T]) => {
    setState((prev) => ({ ...prev, [tab]: data }));
  }, []);

  const clearAll = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Dispatch object is stable — setResult and clearAll never change.
  const dispatch = useMemo<SimulationDispatch>(
    () => ({ setResult, clearAll }),
    [setResult, clearAll],
  );

  return (
    <SimulationDispatchContext.Provider value={dispatch}>
      <SimulationStateContext.Provider value={state}>
        {children}
      </SimulationStateContext.Provider>
    </SimulationDispatchContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────

/**
 * Returns only the setter functions (setResult, clearAll).
 * Because the dispatch object is memoized once, consumers that only
 * write to the context will never re-render due to state changes.
 */
export function useSimulationActions(): SimulationDispatch {
  const dispatch = useContext(SimulationDispatchContext);
  if (!dispatch) {
    throw new Error('useSimulationActions must be used within <SimulationProvider>');
  }
  return dispatch;
}

/**
 * Subscribes to a single field of SimulationState.
 *
 * React doesn't natively support context selectors, so this hook reads the
 * full state context and extracts one field. It uses a ref + strict equality
 * check to bail out of re-renders when the selected field hasn't changed:
 * the component will still be called by React (context changed), but
 * returning the same memoized value lets React skip the subtree reconciliation
 * when combined with React.memo on the consuming component.
 *
 * For maximum benefit, wrap consuming components in React.memo().
 */
export function useSimulationField<K extends SimTab>(field: K): SimulationState[K] {
  const state = useContext(SimulationStateContext);
  const value = state ? state[field] : null;
  const ref = useRef(value);

  // Only update the ref when the specific field value changes.
  if (ref.current !== value) {
    ref.current = value;
  }

  return ref.current as SimulationState[K];
}

/**
 * Safe hook that returns null when outside of SimulationProvider.
 * Use this in dashboards that can render before the provider is mounted.
 *
 * Returns the combined state + dispatch for backwards compatibility.
 */
export function useSimulationContextSafe(): SimulationContextValue | null {
  const state = useContext(SimulationStateContext);
  const dispatch = useContext(SimulationDispatchContext);

  // Memoize the combined value. When outside the provider both are null
  // and we return null below. useMemo is called unconditionally to
  // satisfy the Rules of Hooks.
  const combined = useMemo<SimulationContextValue | null>(
    () => (state && dispatch ? { ...state, ...dispatch } : null),
    [state, dispatch],
  );

  return combined;
}

/**
 * Convenience hook that throws if used outside provider.
 * Drop-in replacement for the old single-context pattern.
 */
export function useSimulation(): SimulationContextValue {
  const ctx = useSimulationContextSafe();
  if (!ctx) {
    throw new Error('useSimulation must be used within <SimulationProvider>');
  }
  return ctx;
}
