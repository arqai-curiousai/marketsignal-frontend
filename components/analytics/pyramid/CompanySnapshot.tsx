'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { IStockFundamentals } from './constants';
import { formatMarketCap, formatPct, SECTOR_COLORS } from './constants';
import { formatPrice } from '@/lib/exchange/formatting';
import { isValidExchange } from '@/lib/exchange/config';

interface CompanySnapshotProps {
  data: IStockFundamentals;
}

export function CompanySnapshot({ data }: CompanySnapshotProps) {
  return (
    <div className="space-y-2">
      {/* Name + sector badge */}
      <div>
        <h3 className="text-sm font-bold text-foreground">{data.ticker}</h3>
        <p className="text-xs text-muted-foreground">{data.name}</p>
        {data.sector && (
          <span
            className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{
              backgroundColor: `${SECTOR_COLORS[data.sector] || '#94A3B8'}20`,
              color: SECTOR_COLORS[data.sector] || '#94A3B8',
            }}
          >
            {data.sector}
          </span>
        )}
      </div>

      {/* Price + change */}
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold tabular-nums text-foreground">
          {data.last_price != null
            ? formatPrice(data.last_price, isValidExchange(data.exchange) ? data.exchange : 'NSE')
            : '—'}
        </span>
        {data.change_percent != null && (
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              data.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {formatPct(data.change_percent)}
          </span>
        )}
      </div>

      {/* Market cap */}
      <p className="text-xs text-muted-foreground">
        Market Cap: {formatMarketCap(data.market_cap)}
      </p>
    </div>
  );
}
