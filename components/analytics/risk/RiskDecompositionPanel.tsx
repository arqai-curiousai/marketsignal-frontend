'use client';

import React, { useEffect, useState } from 'react';
import { getPortfolioRisk } from '@/lib/api/analyticsApi';
import type { IPortfolioRisk } from '@/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { useExchange } from '@/context/ExchangeContext';

function MetricCard({ label, value, suffix = '', color }: { label: string; value: string; suffix?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color || 'text-foreground'}`}>
        {value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{suffix}</span>
      </p>
    </div>
  );
}

export function RiskDecompositionPanel() {
  const { exchange } = useExchange();
  const [data, setData] = useState<IPortfolioRisk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPortfolioRisk(exchange).then((res) => {
      if (!cancelled && res.success) setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [exchange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
        {data?.error || 'Add at least 2 stocks to your watchlist to see portfolio risk analytics.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-foreground">Portfolio Risk Decomposition</h3>

      {/* Top-level VaR metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="VaR (95%, 1-day)"
          value={(data.var_95_1d * 100).toFixed(2)}
          suffix="%"
          color="text-red-400"
        />
        <MetricCard
          label="CVaR (Expected Shortfall)"
          value={(data.cvar_95_1d * 100).toFixed(2)}
          suffix="%"
          color="text-red-400"
        />
        <MetricCard
          label="Cornish-Fisher VaR"
          value={(data.cornish_fisher_var_95 * 100).toFixed(2)}
          suffix="%"
          color="text-amber-400"
        />
        <MetricCard
          label="Portfolio Vol (ann.)"
          value={(data.portfolio_vol_annual * 100).toFixed(1)}
          suffix="%"
        />
      </div>

      {/* Fat-tail indicators */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Skewness: <span className="text-foreground font-medium">{data.skewness.toFixed(2)}</span></span>
        <span>Excess Kurtosis: <span className="text-foreground font-medium">{data.excess_kurtosis.toFixed(2)}</span></span>
        <span>Observations: <span className="text-foreground font-medium">{data.observation_days}d</span></span>
      </div>

      {/* Component VaR waterfall */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Component VaR Contribution</h4>
        <div className="space-y-2">
          {data.tickers.map((ticker) => {
            const pct = data.component_var_pct[ticker] || 0;
            const isPositive = pct >= 0;
            return (
              <div key={ticker} className="flex items-center gap-3">
                <span className="text-xs w-20 truncate text-muted-foreground">{ticker}</span>
                <div className="flex-1 relative h-3 rounded-full bg-white/5">
                  <div
                    className={`absolute top-0 h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-red-500/60' : 'bg-emerald-500/60'}`}
                    style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}
                  />
                </div>
                <span className="text-xs w-12 text-right font-mono">
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stress Tests */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stress Test Scenarios</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 font-medium text-muted-foreground">Scenario</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Portfolio Impact</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Stressed Vol</th>
              </tr>
            </thead>
            <tbody>
              {data.stress_tests.map((st) => (
                <tr key={st.scenario_id} className="border-b border-white/5">
                  <td className="py-2">
                    <div className="font-medium text-foreground">{st.label}</div>
                    <div className="text-muted-foreground text-[10px]">{st.description}</div>
                  </td>
                  <td className="text-right py-2">
                    <span className={st.portfolio_loss_pct < 0 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                      {st.portfolio_loss_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-2 text-muted-foreground">
                    {st.stressed_daily_vol.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
