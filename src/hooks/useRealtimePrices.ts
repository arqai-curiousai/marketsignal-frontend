'use client';

/**
 * React hook for real-time price streaming via WebSocket.
 *
 * Usage:
 *   const { prices, connectionState, isConnected } = useRealtimePrices(['forex', 'commodity']);
 *
 * `prices` is a Map<symbol, IRealtimePrice> that updates on every WS tick.
 * Falls back gracefully — if WS is unavailable the map is simply empty and
 * existing REST-fetched data remains on screen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PriceWSClient } from '@/src/lib/api/wsClient';
import type {
  InstrumentCategory,
  IRealtimePrice,
  WSConnectionState,
} from '@/types/websocket';

interface UseRealtimePricesResult {
  /** Latest prices keyed by symbol (e.g. "FX:USDINR"). */
  prices: Record<string, IRealtimePrice>;
  /** Current WebSocket connection state. */
  connectionState: WSConnectionState;
  /** Convenience boolean — true when WS is connected. */
  isConnected: boolean;
}

export function useRealtimePrices(
  types: InstrumentCategory[],
): UseRealtimePricesResult {
  const [prices, setPrices] = useState<Record<string, IRealtimePrice>>({});
  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected');
  const clientRef = useRef<PriceWSClient | null>(null);
  // Serialise types array to detect changes
  const typesKey = types.sort().join(',');

  const handlePrice = useCallback((tick: IRealtimePrice) => {
    setPrices((prev) => ({ ...prev, [tick.symbol]: tick }));
  }, []);

  const handleState = useCallback((state: WSConnectionState) => {
    setConnectionState(state);
  }, []);

  useEffect(() => {
    if (types.length === 0) return;

    const client = new PriceWSClient();
    clientRef.current = client;
    client.listen(handlePrice, handleState);
    client.connect(types);

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesKey, handlePrice, handleState]);

  return {
    prices,
    connectionState,
    isConnected: connectionState === 'connected',
  };
}
