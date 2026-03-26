'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getMarketStatus } from '@/lib/api/signalApi';

type MarketType = 'forex' | 'nse' | 'commodity';

interface UseMarketAwarePollingOptions {
  /** Function to call on each poll tick. */
  fetchFn: () => Promise<void> | void;
  /** Which market's hours to check. */
  marketType: MarketType;
  /** Polling interval when market is open (ms). Default: 60_000 */
  activeIntervalMs?: number;
  /** Polling interval when market is closed (ms). Default: 300_000 */
  inactiveIntervalMs?: number;
  /** Set false to pause polling entirely. Default: true */
  enabled?: boolean;
}

/**
 * Polls `fetchFn` at a rate determined by whether the relevant market is open.
 *
 * - Checks market status on mount and every 5 minutes.
 * - Uses `activeIntervalMs` when market is open, `inactiveIntervalMs` when closed.
 * - Does NOT call `fetchFn` on mount — the consumer should handle initial fetch.
 */
export function useMarketAwarePolling({
  fetchFn,
  marketType,
  activeIntervalMs = 60_000,
  inactiveIntervalMs = 300_000,
  enabled = true,
}: UseMarketAwarePollingOptions) {
  const isOpenRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const checkMarketStatus = useCallback(async () => {
    try {
      const res = await getMarketStatus();
      if (res.success) {
        const status = res.data[marketType];
        isOpenRef.current = status?.is_open ?? true;
      }
    } catch {
      // On failure, assume open to keep polling at active rate
      isOpenRef.current = true;
    }
  }, [marketType]);

  useEffect(() => {
    if (!enabled) return;

    // Check market status immediately and every 5 minutes
    checkMarketStatus();
    const statusInterval = setInterval(checkMarketStatus, 300_000);

    // Adaptive polling: check which interval to use on each tick
    let timer: ReturnType<typeof setTimeout>;

    const scheduleTick = () => {
      const interval = isOpenRef.current ? activeIntervalMs : inactiveIntervalMs;
      timer = setTimeout(async () => {
        try {
          await fetchFnRef.current();
        } catch {
          // Swallow error — polling must continue regardless
        } finally {
          scheduleTick();
        }
      }, interval);
    };

    scheduleTick();

    return () => {
      clearInterval(statusInterval);
      clearTimeout(timer);
    };
  }, [enabled, activeIntervalMs, inactiveIntervalMs, checkMarketStatus]);
}
