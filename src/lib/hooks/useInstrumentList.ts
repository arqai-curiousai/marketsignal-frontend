'use client';

import { useState, useEffect, useRef } from 'react';
import { getInstruments, getAllInstruments } from '@/lib/api/signalApi';
import type { IInstrument } from '@/types/stock';
import type { ExchangeCode } from '@/lib/exchange/config';

/** Map ExchangeCode to the API's instrument type param. */
const EXCHANGE_TO_TYPE: Record<string, string> = {
  NSE: 'nse',
  NASDAQ: 'nasdaq',
  NYSE: 'nyse',
  LSE: 'lse',
  HKSE: 'hkse',
  FX: 'currency',
};

// Module-level cache: exchange -> instruments (survives re-renders)
const cache: Record<string, IInstrument[]> = {};
let allCache: IInstrument[] | null = null;

/**
 * Fetch instruments for a specific exchange. Cached per exchange.
 */
export function useInstrumentList(exchange: ExchangeCode | string) {
  const [instruments, setInstruments] = useState<IInstrument[]>(cache[exchange] ?? []);
  const [loading, setLoading] = useState(!cache[exchange]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cache[exchange]) {
      setInstruments(cache[exchange]);
      setLoading(false);
      setError(null);
      return;
    }

    const type = EXCHANGE_TO_TYPE[exchange];
    if (!type) {
      setInstruments([]);
      setLoading(false);
      setError(`Unknown exchange: ${exchange}`);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    getInstruments(type as Parameters<typeof getInstruments>[0], controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.success) {
          cache[exchange] = result.data;
          setInstruments(result.data);
        } else {
          setError('Failed to load instruments');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Network error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [exchange]);

  return { instruments, loading, error };
}

/**
 * Fetch ALL instruments across ALL exchanges in one call.
 * Ideal for global search components. Cached after first load.
 */
export function useAllInstruments() {
  const [instruments, setInstruments] = useState<IInstrument[]>(allCache ?? []);
  const [loading, setLoading] = useState(!allCache);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (allCache) {
      setInstruments(allCache);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    getAllInstruments(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.success) {
          allCache = result.data;
          setInstruments(result.data);
        } else {
          setError('Failed to load instruments');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Network error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { instruments, loading, error };
}
