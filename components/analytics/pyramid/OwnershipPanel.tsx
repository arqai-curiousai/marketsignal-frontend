'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IOwnershipSummary } from './constants';
import { OWNERSHIP_COLORS, formatINR } from './constants';

interface OwnershipPanelProps {
  data: IOwnershipSummary;
}

function ChangeArrow({ val }: { val: number | null }) {
  if (val == null || Math.abs(val) < 0.01)
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (val > 0)
    return <ArrowUp className="h-3 w-3 text-emerald-400" />;
  return <ArrowDown className="h-3 w-3 text-red-400" />;
}

export function OwnershipPanel({ data }: OwnershipPanelProps) {
  const latest = data.shareholding[0];

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        Shareholding Pattern
      </h4>

      {latest ? (
        <>
          {/* Horizontal bar (stacked) */}
          <div className="h-4 rounded-full overflow-hidden flex">
            {[
              { key: 'promoter', pct: latest.promoter_pct, color: OWNERSHIP_COLORS.promoter },
              { key: 'fii', pct: latest.fii_pct, color: OWNERSHIP_COLORS.fii },
              { key: 'dii', pct: latest.dii_pct, color: OWNERSHIP_COLORS.dii },
              { key: 'retail', pct: latest.retail_pct, color: OWNERSHIP_COLORS.retail },
              { key: 'others', pct: latest.others_pct, color: OWNERSHIP_COLORS.others },
            ].map((seg) => (
              <div
                key={seg.key}
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                className="h-full transition-all duration-500"
                title={`${seg.key}: ${seg.pct.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Legend with QoQ changes */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              { label: 'Promoter', pct: latest.promoter_pct, change: latest.promoter_change, color: OWNERSHIP_COLORS.promoter },
              { label: 'FII', pct: latest.fii_pct, change: latest.fii_change, color: OWNERSHIP_COLORS.fii },
              { label: 'DII', pct: latest.dii_pct, change: latest.dii_change, color: OWNERSHIP_COLORS.dii },
              { label: 'Retail', pct: latest.retail_pct, change: latest.retail_change, color: OWNERSHIP_COLORS.retail },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {item.pct.toFixed(1)}%
                  </span>
                  <ChangeArrow val={item.change} />
                </div>
              </div>
            ))}
          </div>

          {/* Pledge info */}
          {latest.promoter_pledged_pct > 0 && (
            <div className="flex items-center justify-between py-1 px-2 rounded-md bg-red-500/10">
              <span className="text-[10px] text-red-400">Promoter Pledge</span>
              <span className="text-xs font-medium tabular-nums text-red-400">
                {latest.promoter_pledged_pct.toFixed(1)}%
              </span>
            </div>
          )}

          <p className="text-[9px] text-muted-foreground">
            As of Q ending {latest.quarter_end}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">No shareholding data available.</p>
      )}

      {/* Insider trades */}
      {data.insider_trades.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Recent Insider Trades
            <span
              className={cn(
                'ml-2 px-1.5 py-0.5 rounded text-[9px] font-medium',
                data.insider_summary.sentiment === 'bullish'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : data.insider_summary.sentiment === 'bearish'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-white/10 text-muted-foreground',
              )}
            >
              {data.insider_summary.sentiment}
            </span>
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.insider_trades.slice(0, 5).map((trade, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1 text-[10px]"
              >
                <div className="flex-1 truncate">
                  <span className="text-foreground">{trade.insider_name.slice(0, 25)}</span>
                  <span className="text-muted-foreground ml-1">
                    ({trade.designation || trade.relation})
                  </span>
                </div>
                <span
                  className={cn(
                    'font-medium ml-2',
                    trade.action === 'buy' ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {trade.action.toUpperCase()} {formatINR(trade.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk deals */}
      {data.bulk_deals.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Recent Bulk/Block Deals
          </h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {data.bulk_deals.slice(0, 3).map((deal, i) => (
              <div key={i} className="flex items-center justify-between py-1 text-[10px]">
                <span className="text-foreground truncate flex-1">
                  {deal.client_name.slice(0, 25)}
                </span>
                <span
                  className={cn(
                    'font-medium ml-2',
                    deal.action === 'buy' ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {deal.action.toUpperCase()} {formatINR(deal.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
