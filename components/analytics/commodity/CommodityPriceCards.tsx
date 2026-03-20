'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ICommoditySnapshot } from '@/src/types/analytics';

const COMMODITY_ICONS: Record<string, string> = {
  Gold: '🥇',
  Silver: '🥈',
  'Crude Oil': '🛢️',
  'Natural Gas': '🔥',
  Copper: '🔶',
};

interface Props {
  commodities: ICommoditySnapshot[];
  selectedCommodity: string;
  onSelect: (commodity: string) => void;
}

export function CommodityPriceCards({ commodities, selectedCommodity, onSelect }: Props) {
  if (!commodities.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {commodities.map(c => {
        const isUp = c.change_pct >= 0;
        const isSelected = c.ticker === selectedCommodity;

        return (
          <motion.button
            key={c.ticker}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(c.ticker)}
            className={cn(
              'rounded-lg border px-3 py-3 text-left transition-all',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/40'
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{COMMODITY_ICONS[c.ticker] || '📦'}</span>
              <span className="text-xs font-medium truncate">{c.ticker}</span>
            </div>
            <div className="text-base font-semibold mt-1">
              ${c.price_usd.toFixed(2)}
            </div>
            {c.price_inr != null && (
              <div className="text-[10px] text-muted-foreground">
                ₹{c.price_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            )}
            <div
              className={cn(
                'flex items-center gap-0.5 text-xs mt-1',
                isUp ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {isUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isUp ? '+' : ''}{c.change_pct.toFixed(2)}%
            </div>

            {/* Mini sparkline */}
            {c.sparkline && c.sparkline.length > 1 && (
              <svg
                viewBox={`0 0 ${c.sparkline.length - 1} 20`}
                className="w-full h-3 mt-1"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke={isUp ? '#10b981' : '#ef4444'}
                  strokeWidth="1.5"
                  points={c.sparkline
                    .map((v, i) => {
                      const min = Math.min(...c.sparkline);
                      const max = Math.max(...c.sparkline);
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
  );
}
