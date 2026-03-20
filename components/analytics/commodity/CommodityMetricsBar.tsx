'use client';

import type { ICommoditySnapshot } from '@/src/types/analytics';

interface Props {
  commodity: ICommoditySnapshot | null;
}

const Metric = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium">{value ?? '—'}</span>
  </div>
);

export function CommodityMetricsBar({ commodity }: Props) {
  if (!commodity) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">Commodity Info</h3>
        <p className="text-xs text-muted-foreground">Select a commodity</p>
      </div>
    );
  }

  const isUp = commodity.change_pct >= 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">{commodity.ticker}</h3>
      <div className="space-y-0">
        <Metric label="USD Price" value={`$${commodity.price_usd.toFixed(2)}`} />
        <Metric
          label="INR Equiv"
          value={
            commodity.price_inr != null
              ? `₹${commodity.price_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : '—'
          }
        />
        <Metric
          label="Change"
          value={
            <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>
              {isUp ? '+' : ''}{commodity.change_pct.toFixed(2)}%
            </span>
          }
        />
        <Metric
          label="52W High"
          value={commodity.high_52w ? `$${commodity.high_52w.toFixed(2)}` : undefined}
        />
        <Metric
          label="52W Low"
          value={commodity.low_52w ? `$${commodity.low_52w.toFixed(2)}` : undefined}
        />
      </div>
    </div>
  );
}
