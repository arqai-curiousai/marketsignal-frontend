'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { type ExchangeCode, type ExchangeConfig, EXCHANGES, isValidExchange } from '@/lib/exchange/config';

interface ExchangeContextValue {
  selectedExchange: ExchangeCode;
  exchangeConfig: ExchangeConfig;
  setExchange: (code: ExchangeCode) => void;
}

const ExchangeContext = createContext<ExchangeContextValue | null>(null);

const STORAGE_KEY = 'ms_exchange';

function getInitialExchange(): ExchangeCode {
  if (typeof window === 'undefined') return 'NSE';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidExchange(stored)) return stored;
  } catch {
    // localStorage unavailable
  }
  return 'NSE';
}

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeCode>('NSE');

  useEffect(() => {
    setSelectedExchange(getInitialExchange());
  }, []);

  const setExchange = useCallback((code: ExchangeCode) => {
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
