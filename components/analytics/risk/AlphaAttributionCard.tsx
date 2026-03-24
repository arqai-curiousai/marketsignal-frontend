'use client';

import React, { useEffect, useState } from 'react';
import { getAlphaAttribution } from '@/lib/api/analyticsApi';
import type { IAlphaAttribution } from '@/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  ticker: string;
  exchange?: string;
}

function Metric({ label, value, suffix = '', tip }: { label: string; value: string; suffix?: string; tip?: string }) {
  return (
    <div className="space-y-0.5" title={tip}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}<span className="text-[10px] font-normal text-muted-foreground">{suffix}</span></p>
    </div>
  );
}

export function AlphaAttributionCard({ ticker, exchange = 'NSE' }: Props) {
  const [data, setData] = useState<IAlphaAttribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAlphaAttribution(ticker, exchange).then((res) => {
      if (!cancelled && res.success) setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [ticker, exchange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <Skeleton className="h-5 w-44" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-muted-foreground">
        Attribution data unavailable for {ticker}
      </div>
    );
  }

  const alphaColor = data.jensens_alpha >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Performance Attribution</h3>
        <span className="text-xs text-muted-foreground">{data.period_days}d period</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Metric
          label="Jensen's Alpha"
          value={`${data.jensens_alpha >= 0 ? '+' : ''}${(data.jensens_alpha * 100).toFixed(2)}`}
          suffix="%"
          tip="Excess return over CAPM-predicted return"
        />
        <Metric
          label="Info Ratio"
          value={data.information_ratio.toFixed(2)}
          tip="Active return per unit of tracking error"
        />
        <Metric
          label="Sharpe Ratio"
          value={data.sharpe_ratio.toFixed(2)}
          tip="Excess return per unit of total risk"
        />
        <Metric
          label="Treynor Ratio"
          value={(data.treynor_ratio * 100).toFixed(2)}
          suffix="%"
          tip="Excess return per unit of systematic risk (beta)"
        />
        <Metric
          label="M²"
          value={`${data.m_squared >= 0 ? '+' : ''}${(data.m_squared * 100).toFixed(2)}`}
          suffix="%"
          tip="Risk-adjusted performance vs benchmark"
        />
        <Metric
          label="Tracking Error"
          value={(data.tracking_error * 100).toFixed(2)}
          suffix="%"
          tip="Volatility of active returns"
        />
      </div>

      {/* Return comparison bar */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Stock Return (ann.)</span>
          <span className={data.annualized_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {(data.annualized_return * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Benchmark Return (ann.)</span>
          <span className={data.benchmark_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {(data.benchmark_return * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Active Return</span>
          <span className={alphaColor}>
            {((data.annualized_return - data.benchmark_return) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
