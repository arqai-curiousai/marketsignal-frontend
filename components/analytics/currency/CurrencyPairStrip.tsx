'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ICurrencyPairSnapshot } from '@/src/types/analytics';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'major', label: 'Major' },
  { id: 'inr', label: 'INR' },
  { id: 'cross', label: 'Cross' },
  { id: 'exotic', label: 'Exotic' },
] as const;

const CATEGORY_PAIRS: Record<string, string[]> = {
  major: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD'],
  inr: ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR', 'AED/INR'],
  cross: ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'NZD/JPY', 'EUR/AUD', 'GBP/AUD', 'EUR/CHF', 'CHF/JPY', 'CAD/JPY'],
  exotic: ['USD/SGD', 'USD/HKD', 'USD/ZAR', 'USD/MXN', 'USD/TRY', 'USD/CNH'],
};

function formatPrice(pair: string, price: number): string {
  const isINR = pair.endsWith('/INR');
  const isJPY = pair.includes('JPY') && !pair.includes('/JPY');
  if (isINR) return `₹${price.toFixed(2)}`;
  if (isJPY || price > 100) return price.toFixed(2);
  return price.toFixed(4);
}

interface Props {
  pairs: ICurrencyPairSnapshot[];
  selectedPair: string;
  onSelect: (pair: string) => void;
}

export function CurrencyPairStrip({ pairs, selectedPair, onSelect }: Props) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredPairs = useMemo(() => {
    let result = pairs;
    if (category !== 'all') {
      const allowed = new Set(CATEGORY_PAIRS[category] ?? []);
      result = result.filter(p => allowed.has(p.ticker));
    }
    if (search) {
      const q = search.toUpperCase();
      result = result.filter(p => p.ticker.includes(q));
    }
    return result;
  }, [pairs, category, search]);

  if (!pairs.length) return null;

  return (
    <div className="space-y-2">
      {/* Category tabs + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors',
                category === cat.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-6 w-28 pl-6 pr-2 text-[10px] rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Pair strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {filteredPairs.map(pair => {
          const isUp = pair.change_pct >= 0;
          const isSelected = pair.ticker === selectedPair;

          return (
            <motion.button
              key={pair.ticker}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(pair.ticker)}
              className={cn(
                'flex-shrink-0 rounded-lg border px-4 py-2.5 text-left transition-all min-w-[140px]',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {pair.ticker}
              </div>
              <div className="text-base font-semibold mt-0.5">
                {formatPrice(pair.ticker, pair.price)}
              </div>
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs mt-0.5',
                  isUp ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {isUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isUp ? '+' : ''}{pair.change_pct.toFixed(2)}%
              </div>

              {/* Mini sparkline */}
              {pair.sparkline && pair.sparkline.length > 1 && (
                <svg
                  viewBox={`0 0 ${pair.sparkline.length - 1} 20`}
                  className="w-full h-4 mt-1"
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke={isUp ? '#10b981' : '#ef4444'}
                    strokeWidth="1.5"
                    points={pair.sparkline
                      .map((v, i) => {
                        const min = Math.min(...pair.sparkline);
                        const max = Math.max(...pair.sparkline);
                        const range = max - min || 1;
                        const y = 20 - ((v - min) / range) * 18;
                        return `${i},${y}`;
                      })
                      .join(' ')}
                  />
                </svg>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
