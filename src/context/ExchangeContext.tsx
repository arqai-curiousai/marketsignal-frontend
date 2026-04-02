'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { type ExchangeCode, type ExchangeConfig, EXCHANGES, isValidExchange, ACTIVE_EXCHANGES, updateMarketHours } from '@/lib/exchange/config';
import { getMarketStatus } from '@/src/lib/api/signalApi';

interface ExchangeContextValue {
  selectedExchange: ExchangeCode;
  exchangeConfig: ExchangeConfig;
  setExchange: (code: ExchangeCode) => void;
}

const ExchangeContext = createContext<ExchangeContextValue | null>(null);

const STORAGE_KEY = 'ms_exchange';

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeCode>('NSE');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidExchange(stored) && ACTIVE_EXCHANGES.has(stored)) {
        setSelectedExchange(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Hydrate exchange configs with live market hours from the backend
  useEffect(() => {
    let cancelled = false;
    getMarketStatus().then((result) => {
      if (cancelled || !result.success || !result.data?.exchanges) return;
      updateMarketHours(result.data.exchanges);
    });
    return () => { cancelled = true; };
  }, []);

  const setExchange = useCallback((code: ExchangeCode) => {
    if (!ACTIVE_EXCHANGES.has(code)) return;
    setSelectedExchange(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const value = useMemo<ExchangeContextValue>(() => ({
    selectedExchange,
    exchangeConfig: EXCHANGES[selectedExchange],
    setExchange,
  }), [selectedExchange, setExchange]);

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  );
}

export function useExchange(): ExchangeContextValue {
  const ctx = useContext(ExchangeContext);
  if (!ctx) {
    throw new Error('useExchange must be used within an ExchangeProvider');
  }
  return ctx;
}
