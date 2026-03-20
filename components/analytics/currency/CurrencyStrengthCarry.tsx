'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyStrength, getCurrencyCarry } from '@/src/lib/api/analyticsApi';
import type { ICurrencyStrength, ICurrencyCarry } from '@/src/types/analytics';

type Timeframe = '1d' | '1w' | '1m' | '3m';

const TF_LABELS: { id: Timeframe; label: string }[] = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
];

const CURRENCY_COLORS: Record<string, string> = {
  USD: 'bg-blue-500',
  EUR: 'bg-indigo-500',
  GBP: 'bg-violet-500',
  JPY: 'bg-rose-500',
  AED: 'bg-teal-500',
  INR: 'bg-amber-500',
};

function StrengthBar({ currency, value }: { currency: string; value: number }) {
  const positive = value >= 0;
  const width = Math.min(Math.abs(value), 100);
  const barColor = CURRENCY_COLORS[currency] || 'bg-muted';

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs font-medium w-8">{currency}</span>
      <div className="flex-1 h-4 relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
        {/* Bar */}
        <div
          className={cn('absolute top-0.5 bottom-0.5 rounded-sm transition-all', barColor)}
          style={{
            left: positive ? '50%' : `${50 - width / 2}%`,
            width: `${width / 2}%`,
          }}
        />
      </div>
      <span className={cn(
        'text-xs font-mono w-12 text-right',
        positive ? 'text-emerald-400' : 'text-red-400'
      )}>
        {positive ? '+' : ''}{value.toFixed(0)}
      </span>
    </div>
  );
}

export function CurrencyStrengthCarry() {
  const [strength, setStrength] = useState<ICurrencyStrength | null>(null);
  const [carry, setCarry] = useState<ICurrencyCarry | null>(null);
  const [loading, setLoading] = useState(true);
  const [tf, setTf] = useState<Timeframe>('1d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([getCurrencyStrength(), getCurrencyCarry()]);
      if (sRes.success) setStrength(sRes.data);
      if (cRes.success) setCarry(cRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !strength) {
    return <div className="space-y-3"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Currency Strength Meter */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Currency Strength</h3>
          <div className="flex gap-0.5">
            {TF_LABELS.map(t => (
              <button
                key={t.id}
                onClick={() => setTf(t.id)}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded-full font-medium transition-colors',
                  tf === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {strength?.currencies ? (
          <div>
            {Object.entries(strength.currencies)
              .sort(([, a], [, b]) => (b[tf] || 0) - (a[tf] || 0))
              .map(([currency, values]) => (
                <StrengthBar key={currency} currency={currency} value={values[tf] || 0} />
              ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No strength data available</p>
        )}

        {/* Multi-timeframe heatmap */}
        {strength?.currencies && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">Multi-Timeframe Grid</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left py-1 text-muted-foreground" />
                    {TF_LABELS.map(t => (
                      <th key={t.id} className="text-center py-1 text-muted-foreground font-medium">{t.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(strength.currencies).map(([ccy, vals]) => (
                    <tr key={ccy}>
                      <td className="py-0.5 font-medium">{ccy}</td>
                      {TF_LABELS.map(t => {
                        const val = vals[t.id] || 0;
                        const intensity = Math.min(Math.abs(val) / 100, 1);
                        const bg = val > 0
                          ? `rgba(16, 185, 129, ${intensity * 0.4})`
                          : val < 0
                            ? `rgba(239, 68, 68, ${intensity * 0.4})`
                            : 'transparent';
                        return (
                          <td key={t.id} className="text-center py-0.5">
                            <span
                              className="inline-block w-10 rounded py-0.5 font-mono"
                              style={{ backgroundColor: bg }}
                            >
                              {val > 0 ? '+' : ''}{val.toFixed(0)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Carry Trade Analytics */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Carry Trade Analytics</h3>
        {carry?.pairs ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-1.5 text-muted-foreground font-medium">Pair</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Rate Diff</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Fwd Prem</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Carry/Risk</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Breakeven</th>
                </tr>
              </thead>
              <tbody>
                {carry.pairs.map(p => (
                  <tr key={p.pair} className="border-b border-border/20">
                    <td className="py-1.5 font-medium">{p.pair}</td>
                    <td className={cn(
                      'text-right font-mono',
                      p.differential_pct > 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {p.differential_pct > 0 ? '+' : ''}{p.differential_pct.toFixed(2)}%
                    </td>
                    <td className="text-right font-mono">
                      {p.forward_premium_pct.toFixed(2)}%
                    </td>
                    <td className={cn(
                      'text-right font-mono',
                      p.carry_risk_ratio > 0.5 ? 'text-emerald-400' : 'text-muted-foreground'
                    )}>
                      {p.carry_risk_ratio.toFixed(2)}
                    </td>
                    <td className="text-right font-mono text-muted-foreground">
                      {p.breakeven_depreciation_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No carry data available</p>
        )}

        <p className="text-[10px] text-muted-foreground mt-3">
          Carry/Risk &gt; 0.5 is attractive. Breakeven = annual INR depreciation that offsets carry.
        </p>
      </div>

      {/* Rate Reference */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">Policy Rates Reference</h3>
        <div className="grid grid-cols-3 gap-2">
          {carry?.pairs?.map(p => (
            <div key={p.base_currency} className="text-center">
              <span className="text-[10px] text-muted-foreground block">{p.base_currency}</span>
              <span className="text-xs font-mono font-semibold">{p.base_rate.toFixed(2)}%</span>
            </div>
          ))}
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block">INR</span>
            <span className="text-xs font-mono font-semibold">{carry?.pairs?.[0]?.inr_rate?.toFixed(2) ?? '6.50'}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
