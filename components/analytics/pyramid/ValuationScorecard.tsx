'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { IKeyStatistics, ISectorMedians } from './constants';
import { formatRatio, valuationColor } from './constants';

interface ValuationScorecardProps {
  stats: IKeyStatistics;
  medians: ISectorMedians;
}

function MetricRow({
  label,
  value,
  median,
}: {
  label: string;
  value: number | null;
  median: number | null;
}) {
  const ratio = value != null && median != null && median > 0 ? value / median : null;
  const style = ratio != null ? valuationColor(ratio) : null;

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tabular-nums text-foreground">
          {formatRatio(value)}
        </span>
        {style && (
          <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', style.bg, style.text)}>
            {style.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function ValuationScorecard({ stats, medians }: ValuationScorecardProps) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
        Valuation
      </h4>
      <div className="space-y-0.5">
        <MetricRow label="P/E" value={stats.pe_ratio} median={medians.pe_ratio} />
        <MetricRow label="P/B" value={stats.price_to_book} median={medians.price_to_book} />
        <MetricRow label="EV/EBITDA" value={stats.ev_to_ebitda} median={medians.ev_to_ebitda} />
        <MetricRow label="PEG" value={stats.peg_ratio} median={null} />
      </div>

      {/* Profitability */}
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 mt-3">
        Profitability
      </h4>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between py-1">
          <span className="text-[10px] text-muted-foreground">ROE</span>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {stats.return_on_equity != null
              ? `${(stats.return_on_equity * 100).toFixed(1)}%`
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-[10px] text-muted-foreground">Profit Margin</span>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {stats.profit_margin != null
              ? `${(stats.profit_margin * 100).toFixed(1)}%`
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-[10px] text-muted-foreground">Op. Margin</span>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {stats.operating_margin != null
              ? `${(stats.operating_margin * 100).toFixed(1)}%`
              : '—'}
          </span>
        </div>
      </div>

      {/* Dividend */}
      {stats.dividend_yield != null && stats.dividend_yield > 0 && (
        <>
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 mt-3">
            Dividend
          </h4>
          <div className="flex items-center justify-between py-1">
            <span className="text-[10px] text-muted-foreground">Yield</span>
            <span className="text-xs font-medium tabular-nums text-emerald-400">
              {(stats.dividend_yield * 100).toFixed(2)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
