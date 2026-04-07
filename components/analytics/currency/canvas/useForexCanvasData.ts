'use client';

import { useMemo } from 'react';
import type {
  ICurrencyOverview,
  ICurrencyStrength,
  IMarketClock,
} from '@/src/types/analytics';
import {
  CURRENCIES,
  CURRENCIES_MOBILE,
  SESSION_COLORS,
  TIER_RADIUS,
  TIER_RADIUS_MOBILE,
  type CurrencyDef,
  type SessionKey,
} from './canvasConstants';
import { ALL_FOREX_PAIRS, PAIR_CATEGORY_LABELS } from '../constants';

/* ��─ Canvas-optimized data structures ── */

export interface CanvasCurrencyNode {
  def: CurrencyDef;
  strength1d: number;
  strength1w: number;
  strength1m: number;
  strength3m: number;
  radius: number;
}

export interface CanvasPairConnection {
  pair: string;
  fromCode: string;
  toCode: string;
  changePct: number;
  price: number;
  session: SessionKey;
  category: string;
}

export interface CanvasSessionState {
  name: string;
  city: string;
  isActive: boolean;
  hoursRemaining: number;
}

export interface ForexCanvasData {
  nodes: CanvasCurrencyNode[];
  connections: CanvasPairConnection[];
  sessions: CanvasSessionState[];
  maxAbsStrength: number;
  maxAbsChange: number;
}

/* ── Session inference from pair ── */

function inferSession(base: string, quote: string): SessionKey {
  const asiaCurrencies = new Set(['JPY', 'AUD', 'NZD', 'SGD', 'HKD', 'CNH', 'INR']);
  const londonCurrencies = new Set(['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'ZAR', 'TRY']);

  if (asiaCurrencies.has(base) || asiaCurrencies.has(quote)) return 'asia';
  if (londonCurrencies.has(base) || londonCurrencies.has(quote)) return 'london';
  return 'newyork';
}

/* ── Hook ── */

export function useForexCanvasData(
  overview: ICurrencyOverview | null,
  strength: ICurrencyStrength | null,
  marketClock: IMarketClock | null,
  isMobile: boolean,
): ForexCanvasData {
  return useMemo(() => {
    const currencyDefs = isMobile ? CURRENCIES_MOBILE : CURRENCIES;
    const tierRadii = isMobile ? TIER_RADIUS_MOBILE : TIER_RADIUS;

    // Build price map
    const priceMap = new Map<string, { price: number; changePct: number }>();
    for (const p of overview?.pairs ?? []) {
      priceMap.set(p.ticker, { price: p.price, changePct: p.change_pct });
    }

    // Build strength map
    const strengthMap = strength?.currencies ?? {};

    // Nodes
    let maxAbsStrength = 0;
    const nodes: CanvasCurrencyNode[] = currencyDefs.map(def => {
      const s = strengthMap[def.code] ?? { '1d': 0, '1w': 0, '1m': 0, '3m': 0 };
      const abs1d = Math.abs(s['1d']);
      if (abs1d > maxAbsStrength) maxAbsStrength = abs1d;
      return {
        def,
        strength1d: s['1d'],
        strength1w: s['1w'],
        strength1m: s['1m'],
        strength3m: s['3m'],
        radius: tierRadii[def.tier],
      };
    });

    // Connections — only pairs where both currencies are in our set
    const codeSet = new Set(currencyDefs.map(c => c.code));
    let maxAbsChange = 0;
    const connections: CanvasPairConnection[] = [];

    for (const pair of ALL_FOREX_PAIRS) {
      const [base, quote] = pair.split('/');
      if (!codeSet.has(base) || !codeSet.has(quote)) continue;
      const data = priceMap.get(pair);
      const changePct = data?.changePct ?? 0;
      const absChange = Math.abs(changePct);
      if (absChange > maxAbsChange) maxAbsChange = absChange;

      connections.push({
        pair,
        fromCode: base,
        toCode: quote,
        changePct,
        price: data?.price ?? 0,
        session: inferSession(base, quote),
        category: PAIR_CATEGORY_LABELS[pair] ?? 'Other',
      });
    }

    // Sessions
    const sessions: CanvasSessionState[] = (marketClock?.sessions ?? []).map(s => ({
      name: s.name,
      city: s.city,
      isActive: s.is_active,
      hoursRemaining: s.hours_remaining,
    }));

    return { nodes, connections, sessions, maxAbsStrength, maxAbsChange };
  }, [overview, strength, marketClock, isMobile]);
}
